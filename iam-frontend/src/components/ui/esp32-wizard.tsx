'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SelectAdvanced'
import { Textarea } from '@/components/ui/Textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Code, 
  Download,
  Loader2
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { SensorTipo, Ubicacion } from '@/types/sensor'
import { Checkbox } from './Checkbox'

interface ESP32WizardProps {
  ubicaciones: Ubicacion[]
  onComplete: (result: { device: ESP32Config; sensors: unknown[] }) => void
  onCancel: () => void
}

interface SensorConfig {
  nombre: string
  tipo: SensorTipo
  ubicacionId: number
  descripcion: string
  modelo: string
  fabricante: string
  configuracion: Record<string, unknown>
  mqttConfig: {
    username: string
    password: string
    topic: string
  }
  enabled: boolean
}

interface ESP32Config {
  deviceName: string
  wifiSSID: string
  wifiPassword: string
  sensors: SensorConfig[]
  mqttConfig: {
    username: string
    password: string
    topic: string
  }
}

const SENSOR_OPTIONS = [
  {
    type: SensorTipo.TEMPERATURA,
    name: 'DHT22 - Temperatura',
    icon: '🌡️',
    description: 'Sensor de temperatura ambiente',
    model: 'DHT22',
    fabricante: 'Adafruit',
    config: {
      unidad: '°C',
      rango_min: -40,
      rango_max: 80,
      precision: 0.1,
      intervalo_lectura: 30
    }
  },
  {
    type: SensorTipo.HUMEDAD,
    name: 'DHT22 - Humedad',
    icon: '💧',
    description: 'Sensor de humedad relativa',
    model: 'DHT22',
    fabricante: 'Adafruit',
    config: {
      unidad: '%',
      rango_min: 0,
      rango_max: 100,
      precision: 0.1,
      intervalo_lectura: 30
    }
  },
  {
    type: SensorTipo.PESO,
    name: 'HX711 + Celda de Carga 50Kg',
    icon: '⚖️',
    description: 'Sensor de peso con celda de carga',
    model: 'HX711 + Celda 50Kg',
    fabricante: 'Generic',
    config: {
      unidad: 'kg',
      rango_min: 0,
      rango_max: 50,
      precision: 0.01,
      intervalo_lectura: 60
    }
  }
]

// const PIN_CONFIGURATIONS = {
//   DHT22: {
//     data: 4,
//     vcc: 3.3,
//     gnd: 'GND'
//   },
//   HX711: {
//     dout: 16,
//     sck: 17,
//     vcc: 3.3,
//     gnd: 'GND'
//   },
//   MFRC522: {
//     sda: 5,
//     sck: 18,
//     mosi: 23,
//     miso: 19,
//     rst: 22,
//     vcc: 3.3,
//     gnd: 'GND'
//   }
// }

export function ESP32Wizard({ ubicaciones, onComplete, onCancel }: ESP32WizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [config, setConfig] = useState<ESP32Config>({
    deviceName: 'ESP32_Sensor_Array',
    wifiSSID: '',
    wifiPassword: '',
    sensors: [],
    mqttConfig: {
      username: '',
      password: '',
      topic: ''
    }
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const { addToast } = useToast()

  const totalSteps = 5

  const handleConfigChange = (field: keyof ESP32Config, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMqttConfigChange = (field: keyof ESP32Config['mqttConfig'], value: string) => {
    setConfig(prev => ({
      ...prev,
      mqttConfig: {
        ...prev.mqttConfig,
        [field]: value
      }
    }))
  }

  const handleSensorToggle = (sensorType: SensorTipo, enabled: boolean) => {
    const sensorOption = SENSOR_OPTIONS.find(s => s.type === sensorType)
    if (!sensorOption) return

    setConfig(prev => {
      const existingSensorIndex = prev.sensors.findIndex(s => s.tipo === sensorType)
      
      if (enabled && existingSensorIndex === -1) {
        // Agregar nuevo sensor
        const newSensor: SensorConfig = {
          nombre: `${sensorOption.name}_${Date.now()}`,
          tipo: sensorType,
          ubicacionId: ubicaciones[0]?.id || 0,
          descripcion: sensorOption.description,
          modelo: sensorOption.model,
          fabricante: sensorOption.fabricante,
          configuracion: sensorOption.config,
          mqttConfig: {
            username: '',
            password: '',
            topic: ''
          },
          enabled: true
        }
        return {
          ...prev,
          sensors: [...prev.sensors, newSensor]
        }
      } else if (!enabled && existingSensorIndex !== -1) {
        // Remover sensor
        const newSensors = prev.sensors.filter(s => s.tipo !== sensorType)
        return {
          ...prev,
          sensors: newSensors
        }
      }
      
      return prev
    })
  }

  const handleSensorConfigChange = (sensorType: SensorTipo, field: keyof SensorConfig, value: string | number | boolean | Record<string, unknown>) => {
    setConfig(prev => ({
      ...prev,
      sensors: prev.sensors.map(sensor => 
        sensor.tipo === sensorType 
          ? { ...sensor, [field]: value }
          : sensor
      )
    }))
  }

  const generateMqttCredentials = () => {
    const username = `esp32_${config.deviceName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
    const password = `pass_${Math.random().toString(36).substring(2, 15)}`
    const topic = `empresa/esp32/${username}/data`

    setConfig(prev => ({
      ...prev,
      mqttConfig: {
        username,
        password,
        topic
      }
    }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Crear todos los sensores
      const sensorPromises = config.sensors.map(sensor => 
        fetch('/api/mqtt-sensor/sensores/registrar-con-dispositivo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            sensor: {
              nombre: sensor.nombre,
              tipo: sensor.tipo,
              ubicacionId: sensor.ubicacionId,
              descripcion: sensor.descripcion,
              modelo: sensor.modelo,
              fabricante: sensor.fabricante,
              configuracion: sensor.configuracion
            },
            dispositivo: {
              username: config.mqttConfig.username,
              password: config.mqttConfig.password
            }
          })
        })
      )

      const results = await Promise.all(sensorPromises)
      const sensorsCreated = await Promise.all(results.map(r => r.json()))

      addToast({
        title: 'ESP32 configurado exitosamente',
        message: `${config.sensors.length} sensores creados y configurados`,
        type: 'success'
      })

      onComplete({
        device: config,
        sensors: sensorsCreated
      })
    } catch (err) {
      setError('Error configurando ESP32: ' + (err instanceof Error ? err.message : 'Error desconocido'))
      addToast({
        title: 'Error',
        message: 'No se pudo configurar el ESP32',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Configuración del Dispositivo ESP32</h3>
        <p className="text-gray-600">Información básica del dispositivo</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="deviceName">Nombre del Dispositivo *</Label>
          <Input
            id="deviceName"
            value={config.deviceName}
            onChange={(e) => handleConfigChange('deviceName', e.target.value)}
            placeholder="ESP32_Sensor_Array"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wifiSSID">SSID WiFi *</Label>
            <Input
              id="wifiSSID"
              value={config.wifiSSID}
              onChange={(e) => handleConfigChange('wifiSSID', e.target.value)}
              placeholder="Tu_WiFi_SSID"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wifiPassword">Contraseña WiFi *</Label>
            <Input
              id="wifiPassword"
              type="password"
              value={config.wifiPassword}
              onChange={(e) => handleConfigChange('wifiPassword', e.target.value)}
              placeholder="Tu_WiFi_Password"
              required
            />
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Nota:</strong> Esta información se incluirá en el código generado para el ESP32.
            Asegúrate de que las credenciales WiFi sean correctas.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Selección de Sensores</h3>
        <p className="text-gray-600">Elige los sensores que conectarás al ESP32</p>
      </div>

      <div className="space-y-4">
        {SENSOR_OPTIONS.map((sensorOption) => {
          const isEnabled = config.sensors.some(s => s.tipo === sensorOption.type)
          
          return (
            <Card key={sensorOption.type} className={`${isEnabled ? 'border-blue-500 bg-blue-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleSensorToggle(sensorOption.type, checked as boolean)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{sensorOption.icon}</span>
                        <h4 className="font-semibold">{sensorOption.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{sensorOption.description}</p>
                      <p className="text-xs text-gray-500">
                        Modelo: {sensorOption.model} | Fabricante: {sensorOption.fabricante}
                      </p>
                    </div>
                  </div>
                  
                  {isEnabled && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">Configurado</div>
                      <div className="text-xs text-gray-500">
                        Pin: {sensorOption.type === 'PESO' ? '16/17' : '4'}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Alert>
        <AlertDescription>
          <strong>Configuración de Pines:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• DHT22: Pin 4 (Datos), 3.3V (VCC), GND</li>
            <li>• HX711: Pin 16 (DOUT), Pin 17 (SCK), 3.3V (VCC), GND</li>
            <li>• MFRC522: Pin 5 (SDA), Pin 18 (SCK), Pin 23 (MOSI), Pin 19 (MISO), Pin 22 (RST), 3.3V (VCC), GND</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Configuración de Sensores</h3>
        <p className="text-gray-600">Personaliza la configuración de cada sensor</p>
      </div>

      <div className="space-y-4">
        {config.sensors.map((sensor, index) => {
          const sensorOption = SENSOR_OPTIONS.find(s => s.type === sensor.tipo)
          
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{sensorOption?.icon}</span>
                  {sensorOption?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`sensor-${index}-name`}>Nombre del Sensor</Label>
                    <Input
                      id={`sensor-${index}-name`}
                      value={sensor.nombre}
                      onChange={(e) => handleSensorConfigChange(sensor.tipo, 'nombre', e.target.value)}
                      placeholder="Sensor de Temperatura"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`sensor-${index}-ubicacion`}>Ubicación</Label>
                    <Select
                      value={sensor.ubicacionId.toString()}
                      onValueChange={(value) => handleSensorConfigChange(sensor.tipo, 'ubicacionId', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ubicación" />
                      </SelectTrigger>
                      <SelectContent>
                        {ubicaciones.map((ubicacion) => (
                          <SelectItem key={ubicacion.id} value={ubicacion.id.toString()}>
                            {ubicacion.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`sensor-${index}-descripcion`}>Descripción</Label>
                  <Textarea
                    id={`sensor-${index}-descripcion`}
                    value={sensor.descripcion}
                    onChange={(e) => handleSensorConfigChange(sensor.tipo, 'descripcion', e.target.value)}
                    placeholder="Descripción del sensor y su ubicación"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`sensor-${index}-unidad`}>Unidad</Label>
                    <Input
                      id={`sensor-${index}-unidad`}
                      value={String((sensor.configuracion as Record<string, unknown>)?.unidad || '')}
                      onChange={(e) => {
                        const newConfig = { ...sensor.configuracion, unidad: e.target.value }
                        handleSensorConfigChange(sensor.tipo, 'configuracion', newConfig)
                      }}
                      placeholder="°C, %, kg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`sensor-${index}-min`}>Rango Mínimo</Label>
                    <Input
                      id={`sensor-${index}-min`}
                      type="number"
                      value={String((sensor.configuracion as Record<string, unknown>)?.rango_min || '')}
                      onChange={(e) => {
                        const newConfig = { ...sensor.configuracion, rango_min: parseFloat(e.target.value) }
                        handleSensorConfigChange(sensor.tipo, 'configuracion', newConfig)
                      }}
                      placeholder="-40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`sensor-${index}-max`}>Rango Máximo</Label>
                    <Input
                      id={`sensor-${index}-max`}
                      type="number"
                      value={String((sensor.configuracion as Record<string, unknown>)?.rango_max || '')}
                      onChange={(e) => {
                        const newConfig = { ...sensor.configuracion, rango_max: parseFloat(e.target.value) }
                        handleSensorConfigChange(sensor.tipo, 'configuracion', newConfig)
                      }}
                      placeholder="80"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Configuración MQTT</h3>
        <p className="text-gray-600">Credenciales para conectar el ESP32 al broker MQTT</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Credenciales MQTT</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateMqttCredentials}
          >
            <Code className="w-4 h-4 mr-2" />
            Generar Automáticamente
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mqtt-username">Usuario MQTT</Label>
            <Input
              id="mqtt-username"
              value={config.mqttConfig.username}
              onChange={(e) => handleMqttConfigChange('username', e.target.value)}
              placeholder="esp32_user"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mqtt-password">Contraseña MQTT</Label>
            <Input
              id="mqtt-password"
              type="password"
              value={config.mqttConfig.password}
              onChange={(e) => handleMqttConfigChange('password', e.target.value)}
              placeholder="Contraseña segura"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mqtt-topic">Tópico MQTT</Label>
          <Input
            id="mqtt-topic"
            value={config.mqttConfig.topic}
                          onChange={(e) => handleMqttConfigChange('topic', e.target.value)}
            placeholder="empresa/esp32/sensor_array/data"
          />
          <p className="text-xs text-gray-500">
            Tópico donde el ESP32 enviará los datos de todos los sensores
          </p>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Importante:</strong> Guarda estas credenciales de forma segura. 
            Necesitarás configurarlas en el código del ESP32 para que se conecte al broker MQTT.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Resumen y Código</h3>
        <p className="text-gray-600">Revisa la configuración y obtén el código para tu ESP32</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resumen del Dispositivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Dispositivo:</strong> {config.deviceName}</div>
              <div><strong>WiFi:</strong> {config.wifiSSID}</div>
              <div><strong>Sensores:</strong> {config.sensors.length}</div>
              <div><strong>Usuario MQTT:</strong> {config.mqttConfig.username}</div>
              <div><strong>Tópico:</strong> {config.mqttConfig.topic}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sensores Configurados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {config.sensors.map((sensor, index) => {
                const sensorOption = SENSOR_OPTIONS.find(s => s.type === sensor.tipo)
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{sensorOption?.icon}</span>
                      <div>
                        <div className="font-medium">{sensor.nombre}</div>
                        <div className="text-xs text-gray-500">{sensorOption?.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Pin</div>
                      <div className="font-mono text-sm">
                        {sensor.tipo === 'PESO' ? '16/17' : '4'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Código ESP32 (Arduino)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <pre className="text-xs">
{`// Código generado automáticamente para ${config.deviceName}
// Sensores: ${config.sensors.map(s => s.nombre).join(', ')}

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Configuración WiFi
const char* ssid = "${config.wifiSSID}";
const char* password = "${config.wifiPassword}";

// Configuración MQTT
const char* mqtt_server = "h02f10fd.ala.us-east-1.emqxsl.com";
const int mqtt_port = 8883;
const char* mqtt_username = "${config.mqttConfig.username}";
const char* mqtt_password = "${config.mqttConfig.password}";
const char* mqtt_topic = "${config.mqttConfig.topic}";

// Variables globales
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;
const long interval = 30000;

void setup() {
  Serial.begin(115200);
  setupWiFi();
  client.setServer(mqtt_server, mqtt_port);
  Serial.println("ESP32 configurado");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  if (millis() - lastMsg > interval) {
    lastMsg = millis();
    publishSensorData();
  }
}

// Implementar funciones WiFi, MQTT y lectura de sensores
// según los sensores configurados`}
              </pre>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const code = `// Código generado automáticamente para ${config.deviceName}
// Sensores: ${config.sensors.map(s => s.nombre).join(', ')}

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Configuración WiFi
const char* ssid = "${config.wifiSSID}";
const char* password = "${config.wifiPassword}";

// Configuración MQTT
const char* mqtt_server = "h02f10fd.ala.us-east-1.emqxsl.com";
const int mqtt_port = 8883;
const char* mqtt_username = "${config.mqttConfig.username}";
const char* mqtt_password = "${config.mqttConfig.password}";
const char* mqtt_topic = "${config.mqttConfig.topic}";

// Variables globales
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;
const long interval = 30000;

void setup() {
  Serial.begin(115200);
  setupWiFi();
  client.setServer(mqtt_server, mqtt_port);
  Serial.println("ESP32 configurado");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  if (millis() - lastMsg > interval) {
    lastMsg = millis();
    publishSensorData();
  }
}

// Implementar funciones WiFi, MQTT y lectura de sensores
// según los sensores configurados`;

                  navigator.clipboard.writeText(code).then(() => {
                    addToast({
                      title: 'Código copiado',
                      message: 'El código se ha copiado al portapapeles',
                      type: 'success'
                    });
                  }).catch(() => {
                    addToast({
                      title: 'Error',
                      message: 'No se pudo copiar el código',
                      type: 'error'
                    });
                  });
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Copiar Código
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const code = `// Código generado automáticamente para ${config.deviceName}
// Sensores: ${config.sensors.map(s => s.nombre).join(', ')}

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Configuración WiFi
const char* ssid = "${config.wifiSSID}";
const char* password = "${config.wifiPassword}";

// Configuración MQTT
const char* mqtt_server = "h02f10fd.ala.us-east-1.emqxsl.com";
const int mqtt_port = 8883;
const char* mqtt_username = "${config.mqttConfig.username}";
const char* mqtt_password = "${config.mqttConfig.password}";
const char* mqtt_topic = "${config.mqttConfig.topic}";

// Variables globales
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;
const long interval = 30000;

void setup() {
  Serial.begin(115200);
  setupWiFi();
  client.setServer(mqtt_server, mqtt_port);
  Serial.println("ESP32 configurado");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  if (millis() - lastMsg > interval) {
    lastMsg = millis();
    publishSensorData();
  }
}

// Implementar funciones WiFi, MQTT y lectura de sensores
// según los sensores configurados`;

                  const blob = new Blob([code], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${config.deviceName.replace(/\s+/g, '_')}_ESP32.ino`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  
                  addToast({
                    title: 'Código descargado',
                    message: 'El archivo .ino se ha descargado',
                    type: 'success'
                  });
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar .ino
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      case 5: return renderStep5()
      default: return renderStep1()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Paso {currentStep} de {totalSteps}</span>
          <span className="text-sm text-gray-500">
            {currentStep === 1 && 'Dispositivo'}
            {currentStep === 2 && 'Sensores'}
            {currentStep === 3 && 'Configuración'}
            {currentStep === 4 && 'MQTT'}
            {currentStep === 5 && 'Resumen'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : prevStep}
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? 'Cancelar' : 'Anterior'}
        </Button>

        {currentStep < totalSteps ? (
          <Button onClick={nextStep} disabled={isLoading}>
            Siguiente
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleComplete} 
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Configurar ESP32
          </Button>
        )}
      </div>
    </div>
  )
} 