'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/Badge';
import { 
  QrCode, 
  CheckCircle, 
  Loader2,
  Zap,
  Settings,
  Download
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Ubicacion } from '@/types/sensor';

interface ESP32AutoConfigProps {
  ubicaciones: Ubicacion[];
  onComplete: () => void;
  onCancel: () => void;
}

interface SensorConfig {
  tipo: string;
  nombre: string;
  pin: number;
  enabled: boolean;
}

interface ESP32Config {
  deviceName: string;
  wifiSSID: string;
  wifiPassword: string;
  ubicacionId: number;
  sensores: SensorConfig[];
}

const SENSOR_OPTIONS = [
  { type: 'TEMPERATURA', name: 'Temperatura (DHT22)', icon: '🌡️', pin: 4 },
  { type: 'HUMEDAD', name: 'Humedad (DHT22)', icon: '💧', pin: 5 },
  { type: 'PESO', name: 'Peso (HX711)', icon: '⚖️', pin: 16 },
  { type: 'PRESION', name: 'Presión (BMP280)', icon: '🌪️', pin: 21 },
];

export function ESP32AutoConfig({ ubicaciones, onComplete, onCancel }: ESP32AutoConfigProps) {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ESP32Config>({
    deviceName: '',
    wifiSSID: '',
    wifiPassword: '',
    ubicacionId: ubicaciones[0]?.id || 1, // Usar 1 en lugar de 0 como fallback
    sensores: [
      { tipo: 'TEMPERATURA', nombre: 'Sensor Temperatura', pin: 4, enabled: true },
      { tipo: 'HUMEDAD', nombre: 'Sensor Humedad', pin: 5, enabled: true },
      { tipo: 'PESO', nombre: 'Sensor Peso', pin: 16, enabled: false },
      { tipo: 'PRESION', nombre: 'Sensor Presión', pin: 21, enabled: false },
    ]
  });

  // Actualizar ubicacionId cuando las ubicaciones se cargan
  useEffect(() => {
    if (ubicaciones.length > 0 && config.ubicacionId <= 0) {
      setConfig(prev => ({
        ...prev,
        ubicacionId: ubicaciones[0].id
      }));
    }
  }, [ubicaciones, config.ubicacionId]);

  const [resultado, setResultado] = useState<{
    success: boolean;
    message: string;
    configUrl?: string;
    qrCode?: string;
    credentials?: {
      mqttUsername: string;
      mqttPassword: string;
      mqttTopic: string;
    };
    instrucciones?: string[];
  } | null>(null);

  const handleConfigChange = (field: keyof ESP32Config, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSensorToggle = (sensorType: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      sensores: prev.sensores.map(sensor => 
        sensor.tipo === sensorType 
          ? { ...sensor, enabled }
          : sensor
      )
    }));
  };

  const handleSensorConfigChange = (sensorType: string, field: keyof SensorConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      sensores: prev.sensores.map(sensor => 
        sensor.tipo === sensorType 
          ? { ...sensor, [field]: value }
          : sensor
      )
    }));
  };

  const generarConfiguracion = async () => {
    // Validar que las ubicaciones estén cargadas
    if (ubicaciones.length === 0) {
      addToast({
        title: 'Error',
        message: 'No hay ubicaciones disponibles. Por favor, crea al menos una ubicación primero.',
        type: 'error'
      });
      return;
    }

    // Validaciones más específicas
    if (!config.deviceName.trim()) {
      addToast({
        title: 'Error',
        message: 'El nombre del dispositivo es requerido',
        type: 'error'
      });
      return;
    }

    if (!config.wifiSSID.trim()) {
      addToast({
        title: 'Error',
        message: 'El SSID de WiFi es requerido',
        type: 'error'
      });
      return;
    }

    if (!config.wifiPassword.trim()) {
      addToast({
        title: 'Error',
        message: 'La contraseña de WiFi es requerida',
        type: 'error'
      });
      return;
    }

    if (!config.ubicacionId || config.ubicacionId <= 0) {
      addToast({
        title: 'Error',
        message: 'Debes seleccionar una ubicación válida',
        type: 'error'
      });
      return;
    }

    if (config.sensores.filter(s => s.enabled).length === 0) {
      addToast({
        title: 'Error',
        message: 'Debes seleccionar al menos un sensor',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 [DEBUG] Frontend Component - Ubicaciones disponibles:', ubicaciones);
      console.log('🔍 [DEBUG] Frontend Component - Sending config:', JSON.stringify(config, null, 2));
      
      const response = await fetch('/api/mqtt-sensor/esp32/configuracion-automatica', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Usar cookies HTTP-only en lugar de token Bearer
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        setResultado(data);
        addToast({
          title: 'Configuración generada',
          message: 'La configuración automática se ha generado exitosamente',
          type: 'success'
        });
      } else {
        addToast({
          title: 'Error',
          message: data.message || 'Error generando configuración',
          type: 'error'
        });
      }
          } catch {
        addToast({
          title: 'Error',
          message: 'Error de conexión',
          type: 'error'
        });
      } finally {
      setIsLoading(false);
    }
  };

  const copiarConfigUrl = () => {
    if (resultado?.configUrl) {
      navigator.clipboard.writeText(resultado.configUrl);
      addToast({
        title: 'URL copiada',
        message: 'La URL de configuración se ha copiado al portapapeles',
        type: 'success'
      });
    }
  };

  const descargarQR = () => {
    if (resultado?.qrCode) {
      // Por ahora solo copiamos la URL
      navigator.clipboard.writeText(resultado.qrCode);
      addToast({
        title: 'QR copiado',
        message: 'La URL del QR se ha copiado al portapapeles',
        type: 'success'
      });
    }
  };

  if (resultado) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Configuración Generada Exitosamente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>¡Perfecto!</strong> Tu ESP32 se configurará automáticamente siguiendo estos pasos:
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {resultado.instrucciones?.map((instruccion: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">
                    {index + 1}
                  </Badge>
                  <p className="text-sm">{instruccion}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    Código QR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <QrCode className="w-16 h-16 mx-auto text-gray-400" />
                    <p className="text-xs text-gray-500 mt-2">QR Code para configuración</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={descargarQR}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar QR
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Credenciales MQTT
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs">
                    <div><strong>Usuario:</strong> {resultado.credentials?.mqttUsername}</div>
                    <div><strong>Contraseña:</strong> {resultado.credentials?.mqttPassword}</div>
                    <div><strong>Tópico:</strong> {resultado.credentials?.mqttTopic}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={copiarConfigUrl}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Copiar URL Config
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button onClick={onComplete} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Completar
              </Button>
              <Button variant="outline" onClick={() => setResultado(null)}>
                Generar Nueva Config
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Configuración Automática ESP32
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              <strong>Configuración Automática:</strong> El ESP32 se configurará automáticamente 
              sin necesidad de subir código. Solo necesitas conectar el ESP32 y escanear un QR.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">Nombre del Dispositivo</Label>
              <Input
                id="deviceName"
                value={config.deviceName}
                onChange={(e) => handleConfigChange('deviceName', e.target.value)}
                placeholder="ESP32 Principal"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wifiSSID">SSID WiFi</Label>
                <Input
                  id="wifiSSID"
                  value={config.wifiSSID}
                  onChange={(e) => handleConfigChange('wifiSSID', e.target.value)}
                  placeholder="MiWiFi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wifiPassword">Contraseña WiFi</Label>
                <Input
                  id="wifiPassword"
                  type="password"
                  value={config.wifiPassword}
                  onChange={(e) => handleConfigChange('wifiPassword', e.target.value)}
                  placeholder="Contraseña WiFi"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <select
                id="ubicacion"
                value={config.ubicacionId}
                onChange={(e) => handleConfigChange('ubicacionId', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={ubicaciones.length === 0}
              >
                {ubicaciones.length === 0 ? (
                  <option value={0}>Cargando ubicaciones...</option>
                ) : (
                  ubicaciones.map(ubicacion => (
                    <option key={ubicacion.id} value={ubicacion.id}>
                      {ubicacion.nombre}
                    </option>
                  ))
                )}
              </select>
              {ubicaciones.length === 0 && (
                <p className="text-sm text-yellow-600 mt-1">
                  ⚠️ No se encontraron ubicaciones. Asegúrate de tener al menos una ubicación creada.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Sensores a Configurar</Label>
            <div className="space-y-3">
              {config.sensores.map((sensor, index) => {
                const sensorOption = SENSOR_OPTIONS.find(s => s.type === sensor.tipo);
                return (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`sensor-${index}`}
                            checked={sensor.enabled}
                            onChange={(e) => handleSensorToggle(sensor.tipo, e.target.checked)}
                            className="w-4 h-4"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{sensorOption?.icon}</span>
                              <Label htmlFor={`sensor-${index}`} className="font-medium">
                                {sensorOption?.name}
                              </Label>
                            </div>
                            <div className="text-xs text-gray-500">
                              Pin: {sensorOption?.pin}
                            </div>
                          </div>
                        </div>
                      </div>

                      {sensor.enabled && (
                        <div className="mt-3 space-y-2">
                          <div className="space-y-1">
                            <Label htmlFor={`sensor-${index}-nombre`} className="text-xs">
                              Nombre del Sensor
                            </Label>
                            <Input
                              id={`sensor-${index}-nombre`}
                              value={sensor.nombre}
                              onChange={(e) => handleSensorConfigChange(sensor.tipo, 'nombre', e.target.value)}
                              placeholder={`Nombre para ${sensorOption?.name}`}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Información sobre configuración de pines */}
            <Alert>
              <AlertDescription>
                <strong>📋 Configuración de Pines:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• <strong>DHT22 (Temperatura):</strong> Pin 4 (Datos), 3.3V (VCC), GND</li>
                  <li>• <strong>DHT22 (Humedad):</strong> Pin 5 (Datos), 3.3V (VCC), GND</li>
                  <li>• <strong>HX711 (Peso):</strong> Pin 16 (DOUT), Pin 17 (SCK), 3.3V (VCC), GND</li>
                  <li>• <strong>BMP280 (Presión):</strong> Pin 21 (SDA), Pin 22 (SCL), 3.3V (VCC), GND</li>
                </ul>
                <p className="mt-2 text-xs text-gray-600">
                  💡 <strong>Nota:</strong> Cada sensor debe usar pines únicos para evitar conflictos.
                </p>
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={generarConfiguracion} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Generar Configuración Automática
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 