'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/Badge';
// import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  Wifi, 
  Download, 
  QrCode, 
  CheckCircle, 
  Clock,
  Smartphone,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ESP32AutoConfigEnhancedProps {
  ubicaciones: Array<{ id: number; nombre: string }>;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface ESP32Config {
  deviceName: string;
  wifiSSID: string;
  wifiPassword: string;
  ubicacionId: number;
  sensores: SensorConfig[];
}

interface SensorConfig {
  tipo: string;
  nombre: string;
  pin: number;
  enabled: boolean;
}

const SENSOR_OPTIONS = [
  { type: 'TEMPERATURA', name: 'Temperatura (DHT22)', icon: '🌡️', pin: 4, description: 'Sensor de temperatura ambiente' },
  { type: 'HUMEDAD', name: 'Humedad (DHT22)', icon: '💧', pin: 4, description: 'Sensor de humedad relativa' },
  { type: 'PESO', name: 'Peso (HX711)', icon: '⚖️', pin: 2, description: 'Celda de carga para medición de peso' },
  { type: 'PRESION', name: 'Presión (BMP280)', icon: '🌪️', pin: 21, description: 'Sensor de presión atmosférica' },
];

export function ESP32AutoConfigEnhanced({ ubicaciones, onComplete, onCancel }: ESP32AutoConfigEnhancedProps) {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'config' | 'generating' | 'result'>('config');
  
  const [config, setConfig] = useState<ESP32Config>({
    deviceName: '',
    wifiSSID: '',
    wifiPassword: '',
    ubicacionId: ubicaciones[0]?.id || 0,
    sensores: [
      { tipo: 'TEMPERATURA', nombre: 'Sensor Temperatura', pin: 4, enabled: true },
      { tipo: 'HUMEDAD', nombre: 'Sensor Humedad', pin: 4, enabled: true },
      { tipo: 'PESO', nombre: 'Sensor Peso', pin: 2, enabled: false },
      { tipo: 'PRESION', nombre: 'Sensor Presión', pin: 21, enabled: false },
    ]
  });

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
    if (!config.deviceName || !config.wifiSSID || !config.wifiPassword) {
      addToast({
        title: 'Error',
        message: 'Por favor completa todos los campos requeridos',
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
    setStep('generating');

    try {
      console.log('🔍 [DEBUG] Frontend Component - Sending config:', JSON.stringify(config, null, 2));
      const response = await fetch('/api/mqtt-sensor/esp32/configuracion-automatica', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        setResultado(data);
        setStep('result');
        addToast({
          title: 'Configuración generada',
          message: 'La configuración automática se ha generado exitosamente',
          type: 'success'
        });
      } else {
        setStep('config');
        addToast({
          title: 'Error',
          message: data.message || 'Error generando configuración',
          type: 'error'
        });
      }
    } catch {
      setStep('config');
      addToast({
        title: 'Error',
        message: 'Error de conexión',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast({
        title: 'Copiado',
        message: `${label} copiado al portapapeles`,
        type: 'success'
      });
    });
  };

  const downloadCodeBase = async () => {
    try {
      const response = await fetch('/api/mqtt-sensor/esp32/codigo-base', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'esp32-base-code.ino';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        addToast({
          title: 'Descargado',
          message: 'Código base ESP32 descargado exitosamente',
          type: 'success'
        });
      }
    } catch {
      addToast({
        title: 'Error',
        message: 'Error descargando código base',
        type: 'error'
      });
    }
  };

  if (step === 'generating') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Generando Configuración Automática
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-lg font-medium">Generando configuración...</p>
                <p className="text-sm text-gray-500">Esto puede tomar unos segundos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'result' && resultado) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Configuración Generada Exitosamente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                La configuración automática se ha generado correctamente. 
                Sigue las instrucciones para configurar tu ESP32.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Código QR */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <QrCode className="w-4 h-4" />
                    Código QR de Configuración
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resultado.qrCode && resultado.qrCode.startsWith('data:image') ? (
                    <div className="flex justify-center">
                      <Image 
                        src={resultado.qrCode} 
                        alt="QR Code" 
                        width={200}
                        height={200}
                        className="border-2 border-gray-200 rounded-lg"
                        style={{ maxWidth: '200px', maxHeight: '200px' }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <QrCode className="w-16 h-16 mx-auto mb-2 opacity-50" />
                      <p>QR Code no disponible</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 text-center">
                    Escanea este código QR desde el portal del ESP32
                  </p>
                </CardContent>
              </Card>

              {/* Credenciales MQTT */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Wifi className="w-4 h-4" />
                    Credenciales MQTT
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resultado.credentials && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-500">Usuario MQTT</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={resultado.credentials.mqttUsername} 
                            readOnly 
                            className="text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(resultado.credentials!.mqttUsername, 'Usuario MQTT')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-500">Contraseña MQTT</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={resultado.credentials.mqttPassword} 
                            readOnly 
                            type="password"
                            className="text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(resultado.credentials!.mqttPassword, 'Contraseña MQTT')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-500">Tópico MQTT</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={resultado.credentials.mqttTopic} 
                            readOnly 
                            className="text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(resultado.credentials!.mqttTopic, 'Tópico MQTT')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Instrucciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Smartphone className="w-4 h-4" />
                  Instrucciones de Configuración
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Tiempo estimado: 2-3 minutos</span>
                  </div>
                  
                  <div className="space-y-3">
                    {resultado.instrucciones?.map((instruccion, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">
                          {index + 1}
                        </Badge>
                        <p className="text-sm">{instruccion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acciones */}
            <div className="flex gap-3">
              <Button onClick={downloadCodeBase} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Descargar Código Base
              </Button>
              <Button onClick={() => setStep('config')} variant="outline">
                Nueva Configuración
              </Button>
              {onComplete && (
                <Button onClick={onComplete}>
                  Completar
                </Button>
              )}
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
                <div className="relative">
                  <Input
                    id="wifiPassword"
                    type={showPassword ? "text" : "password"}
                    value={config.wifiPassword}
                    onChange={(e) => handleConfigChange('wifiPassword', e.target.value)}
                    placeholder="Contraseña WiFi"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <select
                id="ubicacion"
                value={config.ubicacionId}
                onChange={(e) => handleConfigChange('ubicacionId', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ubicaciones.map((ubicacion) => (
                  <option key={ubicacion.id} value={ubicacion.id}>
                    {ubicacion.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 my-4" />

          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Sensores a Configurar</Label>
              <p className="text-sm text-gray-500 mt-1">
                Selecciona los sensores que vas a conectar al ESP32
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SENSOR_OPTIONS.map((sensor) => {
                const sensorConfig = config.sensores.find(s => s.tipo === sensor.type);
                return (
                  <Card key={sensor.type} className={`cursor-pointer transition-colors ${
                    sensorConfig?.enabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{sensor.icon}</span>
                          <div>
                            <div className="font-medium text-sm">{sensor.name}</div>
                            <div className="text-xs text-gray-500">{sensor.description}</div>
                            <div className="text-xs text-gray-400">Pin: GPIO {sensor.pin}</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={sensorConfig?.enabled || false}
                          onChange={(e) => handleSensorToggle(sensor.type, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      {sensorConfig?.enabled && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Input
                            value={sensorConfig.nombre}
                            onChange={(e) => handleSensorConfigChange(sensor.type, 'nombre', e.target.value)}
                            placeholder="Nombre del sensor"
                            className="text-sm"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button onClick={onCancel} variant="outline">
                Cancelar
              </Button>
            )}
            <Button 
              onClick={generarConfiguracion} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generar Configuración Automática
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 