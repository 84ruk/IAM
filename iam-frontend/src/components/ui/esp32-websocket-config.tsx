'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  Copy, 
  Download, 
  Wifi, 
  Cpu, 
  Settings, 
  Code, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Globe,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface ESP32Config {
  wifiSSID: string;
  wifiPassword: string;
  deviceId: string;
  empresaId: number;
  deviceType: string;
  backendUrl: string;
  readingInterval: number;
  pingInterval: number;
  enableSSL: boolean;
  enableAutoReconnect: boolean;
  enableDebug: boolean;
  customPort?: number;
}

interface SensorConfig {
  id: string;
  name: string;
  type: 'TEMPERATURA' | 'HUMEDAD' | 'PESO' | 'PRESION' | 'CUSTOM';
  unit: string;
  minValue: number;
  maxValue: number;
  enabled: boolean;
}

export type ESP32WebSocketConfigProps = {
  initialConfig?: Partial<ESP32Config>;
  hideBackendUrl?: boolean;
  hideEmpresaId?: boolean;
};

export default function ESP32WebSocketConfig(props: ESP32WebSocketConfigProps = {}) {
  const { initialConfig, hideBackendUrl = false, hideEmpresaId = false } = props;
  const [config, setConfig] = useState<ESP32Config>({
    wifiSSID: '',
    wifiPassword: '',
    deviceId: 'ESP32_001',
    empresaId: 1,
    deviceType: 'ESP32',
    backendUrl: 'iam-backend-baruk.fly.dev',
    readingInterval: 30,
    pingInterval: 30,
    enableSSL: true,
    enableAutoReconnect: true,
    enableDebug: true,
    customPort: undefined,
  });

  // Aplicar configuración inicial si viene por props
  useEffect(() => {
    if (initialConfig) {
      setConfig((prev) => ({ ...prev, ...initialConfig } as ESP32Config));
    }
  }, [initialConfig]);

  const [sensors, setSensors] = useState<SensorConfig[]>([
    {
      id: '1',
      name: 'Sensor Temperatura',
      type: 'TEMPERATURA',
      unit: '°C',
      minValue: -20,
      maxValue: 50,
      enabled: true
    },
    {
      id: '2',
      name: 'Sensor Humedad',
      type: 'HUMEDAD',
      unit: '%',
      minValue: 0,
      maxValue: 100,
      enabled: true
    }
  ]);

  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState('config');

  // Generar código Arduino basado en la configuración
  const generateArduinoCode = useCallback(() => {
    const code = `#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURACIÓN WIFI =====
const char* ssid = "${config.wifiSSID}";
const char* password = "${config.wifiPassword}";

// ===== CONFIGURACIÓN WEBSOCKET =====
const char* websocketServer = "${config.backendUrl}";
const int websocketPort = ${config.enableSSL ? '443' : '80'};
const char* websocketPath = "/iot";

// ===== CONFIGURACIÓN DEL DISPOSITIVO =====
const char* deviceId = "${config.deviceId}";
const int empresaId = ${config.empresaId};
const char* deviceType = "${config.deviceType}";

// ===== CONFIGURACIÓN DE INTERVALOS =====
const unsigned long readingInterval = ${config.readingInterval * 1000}; // ${config.readingInterval} segundos
const unsigned long pingInterval = ${config.pingInterval * 1000}; // ${config.pingInterval} segundos

// ===== INSTANCIAS =====
WebSocketsClient webSocket;

// ===== VARIABLES DE SENSORES =====
${sensors.filter(s => s.enabled).map(sensor => `
// ${sensor.name}
float ${sensor.name.toLowerCase().replace(/\s+/g, '_')} = 0.0;`).join('')}

// ===== VARIABLES DE CONTROL =====
unsigned long lastReading = 0;
unsigned long lastPing = 0;
bool isConnected = false;

void setup() {
  Serial.begin(115200);
  ${config.enableDebug ? `
  Serial.println("=== CONFIGURACIÓN ESP32 ===");
  Serial.printf("Device ID: %s\\n", deviceId);
  Serial.printf("Empresa ID: %d\\n", empresaId);
  Serial.printf("Backend: %s\\n", websocketServer);
  Serial.printf("SSL: ${config.enableSSL ? 'Habilitado' : 'Deshabilitado'}\\n");
  Serial.printf("Intervalo lecturas: %d segundos\\n", config.readingInterval);
  Serial.printf("Intervalo ping: %d segundos\\n", config.pingInterval);
  Serial.println("==========================");` : ''}
  
  // Conectar WiFi
  conectarWiFi();
  
  // Configurar WebSocket
  configurarWebSocket();
}

void loop() {
  webSocket.loop();
  
  // Enviar lecturas periódicas
  if (millis() - lastReading > readingInterval) {
    enviarLecturas();
    lastReading = millis();
  }
  
  // Mantener conexión activa con ping
  if (millis() - lastPing > pingInterval) {
    if (isConnected) {
      webSocket.sendTXT("ping");
      ${config.enableDebug ? 'Serial.println("Ping enviado");' : ''}
    }
    lastPing = millis();
  }
  
  // Reconexión automática si está habilitada
  ${config.enableAutoReconnect ? `
  if (!isConnected && WiFi.status() == WL_CONNECTED) {
    static unsigned long lastReconnectAttempt = 0;
    if (millis() - lastReconnectAttempt > 10000) { // Intentar cada 10 segundos
      configurarWebSocket();
      lastReconnectAttempt = millis();
    }
  }` : ''}
}

void conectarWiFi() {
  WiFi.begin(ssid, password);
  Serial.println("Conectando a WiFi...");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void configurarWebSocket() {
  ${config.enableSSL ? 
    'webSocket.beginSSL(websocketServer, websocketPort, websocketPath);' : 
    'webSocket.begin(websocketServer, websocketPort, websocketPath);'
  }
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  // Configurar headers personalizados
  String headers = "x-device-id: " + String(deviceId) + "\\r\\n";
  headers += "x-empresa-id: " + String(empresaId) + "\\r\\n";
  headers += "x-device-type: " + String(deviceType);
  webSocket.setExtraHeaders(headers.c_str());
  
  Serial.println("WebSocket configurado");
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("Desconectado del WebSocket");
      isConnected = false;
      break;
      
    case WStype_CONNECTED:
      Serial.println("Conectado al WebSocket IoT!");
      Serial.printf("URL: %s\\n", payload);
      isConnected = true;
      
      // Enviar mensaje de conexión exitosa
      webSocket.sendTXT("ping");
      break;
      
    case WStype_TEXT:
      procesarMensaje((char*)payload);
      break;
      
    case WStype_ERROR:
      Serial.println("Error en WebSocket");
      isConnected = false;
      break;
      
    case WStype_PING:
      Serial.println("Ping recibido");
      break;
      
    case WStype_PONG:
      Serial.println("Pong recibido");
      break;
  }
}

void procesarMensaje(String mensaje) {
  ${config.enableDebug ? `
  Serial.print("Mensaje recibido: ");
  Serial.println(mensaje);` : ''}
  
  // Aquí puedes procesar mensajes del servidor
  // Por ejemplo, comandos para cambiar configuración
  
  // Parsear JSON si es necesario
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, mensaje);
  
  if (!error) {
    // Procesar comando si existe
    if (doc.containsKey("comando")) {
      String comando = doc["comando"];
      String valor = doc["valor"];
      
      Serial.printf("Comando recibido: %s = %s\\n", comando.c_str(), valor.c_str());
      
      // Aquí puedes implementar la lógica para cada comando
      if (comando == "intervalo") {
        int nuevoIntervalo = valor.toInt();
        if (nuevoIntervalo > 0) {
          // Cambiar intervalo de lecturas
        }
      }
    }
  }
}

void enviarLecturas() {
  if (!isConnected) return;
  
  ${sensors.filter(s => s.enabled).map(sensor => `
  // Enviar ${sensor.name}
  ${sensor.name.toLowerCase().replace(/\s+/g, '_')} = simularLectura(${sensor.minValue}, ${sensor.maxValue});
  
  StaticJsonDocument<200> doc${sensor.id};
  doc${sensor.id}["tipo"] = "${sensor.type}";
  doc${sensor.id}["valor"] = ${sensor.name.toLowerCase().replace(/\s+/g, '_')};
  doc${sensor.id}["unidad"] = "${sensor.unit}";
  doc${sensor.id}["timestamp"] = millis();
  
  String jsonString${sensor.id};
  serializeJson(doc${sensor.id}, jsonString${sensor.id});
  
  webSocket.sendTXT(jsonString${sensor.id});
  ${config.enableDebug ? `Serial.printf("${sensor.name} enviado: %.2f${sensor.unit}\\n", ${sensor.name.toLowerCase().replace(/\s+/g, '_')});` : ''}
  
  delay(100);`).join('')}
}

float simularLectura(float min, float max) {
  // Simular lecturas de sensores (reemplazar con sensores reales)
  return random(min * 100, max * 100) / 100.0;
}

// Función para enviar comando específico
void enviarComando(String comando, String valor) {
  if (!isConnected) return;
  
  StaticJsonDocument<200> doc;
  doc["comando"] = comando;
  doc["valor"] = valor;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  webSocket.sendTXT(jsonString);
  Serial.printf("Comando enviado: %s = %s\\n", comando.c_str(), valor.c_str());
}

// Función para obtener estado del dispositivo
void obtenerEstado() {
  if (!isConnected) return;
  webSocket.sendTXT("obtener-estado");
}

// Función para reconectar manualmente
void reconectar() {
  Serial.println("Reconectando...");
  webSocket.disconnect();
  delay(1000);
  configurarWebSocket();
}`;

    setGeneratedCode(code);
  }, [config, sensors]);

  // Copiar código al portapapeles
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      toast.success('Código copiado al portapapeles');
    } catch {
      toast.error('Error al copiar código');
    }
  };

  // Descargar código como archivo .ino
  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.deviceId}.ino`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Código descargado');
  };

  // Agregar nuevo sensor
  const addSensor = () => {
    const newSensor: SensorConfig = {
      id: Date.now().toString(),
      name: `Sensor ${sensors.length + 1}`,
      type: 'TEMPERATURA',
      unit: '°C',
      minValue: 0,
      maxValue: 100,
      enabled: true
    };
    setSensors([...sensors, newSensor]);
  };

  // Eliminar sensor
  const removeSensor = (id: string) => {
    setSensors(sensors.filter(s => s.id !== id));
  };

  // Actualizar sensor
  const updateSensor = (id: string, updates: Partial<SensorConfig>) => {
    setSensors(sensors.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // Generar código cuando cambie la configuración
  useEffect(() => {
    if (config.wifiSSID && config.wifiPassword) {
      generateArduinoCode();
    }
  }, [config, sensors, generateArduinoCode]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Configuración ESP32 WebSocket
          </CardTitle>
          <p className="text-muted-foreground">
            Configura tu ESP32 para conectarse por WebSocket y envía datos en tiempo real
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="config" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuración
              </TabsTrigger>
              <TabsTrigger value="sensors" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Sensores
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Código Arduino
              </TabsTrigger>
            </TabsList>

            {/* Tab de Configuración */}
            <TabsContent value="config" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Configuración WiFi */}
                <div className="space-y-2">
                  <Label htmlFor="wifiSSID" className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    SSID WiFi
                  </Label>
                  <Input
                    id="wifiSSID"
                    value={config.wifiSSID}
                    onChange={(e) => setConfig({ ...config, wifiSSID: e.target.value })}
                    placeholder="Nombre de tu red WiFi"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wifiPassword">Contraseña WiFi</Label>
                  <Input
                    id="wifiPassword"
                    type="password"
                    value={config.wifiPassword}
                    onChange={(e) => setConfig({ ...config, wifiPassword: e.target.value })}
                    placeholder="Contraseña de tu WiFi"
                  />
                </div>

                {/* Configuración del Dispositivo */}
                <div className="space-y-2">
                  <Label htmlFor="deviceId">ID del Dispositivo</Label>
                  <Input
                    id="deviceId"
                    value={config.deviceId}
                    onChange={(e) => setConfig({ ...config, deviceId: e.target.value })}
                    placeholder="ESP32_001"
                  />
                </div>

                {!hideEmpresaId && (
                  <div className="space-y-2">
                    <Label htmlFor="empresaId">ID de Empresa</Label>
                    <Input
                      id="empresaId"
                      type="number"
                      value={config.empresaId}
                      onChange={(e) => setConfig({ ...config, empresaId: parseInt(e.target.value) || 1 })}
                      placeholder="1"
                    />
                  </div>
                )}

                {/* Configuración del Backend */}
                {!hideBackendUrl && (
                  <div className="space-y-2">
                    <Label htmlFor="backendUrl" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      URL del Backend
                    </Label>
                    <Input
                      id="backendUrl"
                      value={config.backendUrl}
                      onChange={(e) => setConfig({ ...config, backendUrl: e.target.value })}
                      placeholder="tu-backend.fly.dev"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="deviceType">Tipo de Dispositivo</Label>
                  <Input
                    id="deviceType"
                    value={config.deviceType}
                    onChange={(e) => setConfig({ ...config, deviceType: e.target.value })}
                    placeholder="ESP32"
                  />
                </div>

                {/* Configuración de Intervalos */}
                <div className="space-y-2">
                  <Label htmlFor="readingInterval">Intervalo de Lecturas (seg)</Label>
                  <Input
                    id="readingInterval"
                    type="number"
                    value={config.readingInterval}
                    onChange={(e) => setConfig({ ...config, readingInterval: parseInt(e.target.value) || 30 })}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pingInterval">Intervalo de Ping (seg)</Label>
                  <Input
                    id="pingInterval"
                    type="number"
                    value={config.pingInterval}
                    onChange={(e) => setConfig({ ...config, pingInterval: parseInt(e.target.value) || 30 })}
                    placeholder="30"
                  />
                </div>
              </div>

              {/* Opciones Avanzadas */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Opciones Avanzadas</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableSSL"
                      checked={config.enableSSL}
                      onCheckedChange={(checked) => setConfig({ ...config, enableSSL: checked })}
                    />
                    <Label htmlFor="enableSSL" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Habilitar SSL
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableAutoReconnect"
                      checked={config.enableAutoReconnect}
                      onCheckedChange={(checked) => setConfig({ ...config, enableAutoReconnect: checked })}
                    />
                    <Label htmlFor="enableAutoReconnect">Reconexión Automática</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableDebug"
                      checked={config.enableDebug}
                      onCheckedChange={(checked) => setConfig({ ...config, enableDebug: checked })}
                    />
                    <Label htmlFor="enableDebug">Modo Debug</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab de Sensores */}
            <TabsContent value="sensors" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Configuración de Sensores</h4>
                <Button onClick={addSensor} size="sm">
                  Agregar Sensor
                </Button>
              </div>

              <div className="space-y-4">
                {sensors.map((sensor) => (
                  <Card key={sensor.id}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={sensor.enabled}
                            onCheckedChange={(checked) => updateSensor(sensor.id, { enabled: checked })}
                          />
                          <Input
                            value={sensor.name}
                            onChange={(e) => updateSensor(sensor.id, { name: e.target.value })}
                            placeholder="Nombre del sensor"
                            className="w-32"
                          />
                        </div>

                        <select
                          value={sensor.type}
                          onChange={(e) => updateSensor(sensor.id, { type: e.target.value as SensorConfig['type'] })}
                          className="px-3 py-2 border rounded-md"
                        >
                          <option value="TEMPERATURA">Temperatura</option>
                          <option value="HUMEDAD">Humedad</option>
                          <option value="PESO">Peso</option>
                          <option value="PRESION">Presión</option>
                          <option value="CUSTOM">Personalizado</option>
                        </select>

                        <Input
                          value={sensor.unit}
                          onChange={(e) => updateSensor(sensor.id, { unit: e.target.value })}
                          placeholder="°C"
                          className="w-20"
                        />

                        <Input
                          type="number"
                          value={sensor.minValue}
                          onChange={(e) => updateSensor(sensor.id, { minValue: parseFloat(e.target.value) || 0 })}
                          placeholder="Min"
                          className="w-20"
                        />

                        <Input
                          type="number"
                          value={sensor.maxValue}
                          onChange={(e) => updateSensor(sensor.id, { maxValue: parseFloat(e.target.value) || 100 })}
                          placeholder="Max"
                          className="w-20"
                        />

                        <Button
                          onClick={() => removeSensor(sensor.id)}
                          variant="destructive"
                          size="sm"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tab de Código Arduino */}
            <TabsContent value="code" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Código Arduino Generado</h4>
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button onClick={downloadCode} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </div>

              {config.wifiSSID && config.wifiPassword ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Configuración Completa</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      El código Arduino se ha generado automáticamente con tu configuración.
                    </p>
                  </div>

                  <div className="relative">
                    <Textarea
                      value={generatedCode}
                      readOnly
                      className="font-mono text-sm h-96"
                      placeholder="El código Arduino aparecerá aquí..."
                    />
                    <Badge className="absolute top-2 right-2">
                      {generatedCode.split('\n').length} líneas
                    </Badge>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-800 mb-2">Instrucciones de Uso:</h5>
                    <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                      <li>Copia o descarga el código generado</li>
                      <li>Abre Arduino IDE y crea un nuevo sketch</li>
                      <li>Pega el código en el sketch</li>
                      <li>Instala las librerías requeridas: WiFi, WebSocketsClient, ArduinoJson</li>
                      <li>Selecciona tu placa ESP32</li>
                      <li>Sube el código a tu ESP32</li>
                      <li>Monitorea el Serial Monitor para ver la conexión</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Configuración Incompleta</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    Completa la configuración WiFi en la pestaña &quot;Configuración&quot; para generar el código Arduino.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
