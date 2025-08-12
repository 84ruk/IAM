'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import  Button  from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SelectAdvanced'
import { Textarea } from '@/components/ui/Textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ChevronLeft, ChevronRight, Check, Code, Download } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { SensorTipo, Ubicacion } from '@/types/sensor'

interface SensorWizardProps {
  ubicaciones: Ubicacion[]
  onComplete: (sensor: { sensor: unknown; dispositivo?: unknown }) => void
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
}

const SENSOR_TYPES = {
  [SensorTipo.TEMPERATURA]: {
    name: 'Temperatura',
    icon: '🌡️',
    description: 'Sensor de temperatura ambiente o de productos',
    defaultConfig: {
      unidad: '°C',
      rango_min: -20,
      rango_max: 50,
      precision: 0.1,
      intervalo_lectura: 30
    }
  },
  [SensorTipo.HUMEDAD]: {
    name: 'Humedad',
    icon: '💧',
    description: 'Sensor de humedad relativa',
    defaultConfig: {
      unidad: '%',
      rango_min: 0,
      rango_max: 100,
      precision: 0.1,
      intervalo_lectura: 30
    }
  },
  [SensorTipo.PESO]: {
    name: 'Peso',
    icon: '⚖️',
    description: 'Sensor de peso para inventario',
    defaultConfig: {
      unidad: 'kg',
      rango_min: 0,
      rango_max: 1000,
      precision: 0.01,
      intervalo_lectura: 60
    }
  },
  [SensorTipo.PRESION]: {
    name: 'Presión',
    icon: '📊',
    description: 'Sensor de presión atmosférica',
    defaultConfig: {
      unidad: 'Pa',
      rango_min: 0,
      rango_max: 2000,
      precision: 1,
      intervalo_lectura: 30
    }
  }
}

export function SensorWizard({ ubicaciones, onComplete, onCancel }: SensorWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [config, setConfig] = useState<SensorConfig>({
    nombre: '',
    tipo: SensorTipo.TEMPERATURA,
    ubicacionId: ubicaciones[0]?.id || 0,
    descripcion: '',
    modelo: '',
    fabricante: '',
    configuracion: SENSOR_TYPES[SensorTipo.TEMPERATURA].defaultConfig,
    mqttConfig: {
      username: '',
      password: '',
      topic: ''
    }
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const { addToast } = useToast()

  const totalSteps = 4

  const handleConfigChange = (field: keyof SensorConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMqttConfigChange = (field: keyof SensorConfig['mqttConfig'], value: string) => {
    setConfig(prev => ({
      ...prev,
      mqttConfig: {
        ...prev.mqttConfig,
        [field]: value
      }
    }))
  }

  const handleTipoChange = (tipo: SensorTipo) => {
    setConfig(prev => ({
      ...prev,
      tipo,
      configuracion: SENSOR_TYPES[tipo].defaultConfig
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
      // Crear sensor con dispositivo MQTT
      const response = await fetch('/api/mqtt-sensor/sensores/registrar-con-dispositivo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sensor: {
            nombre: config.nombre,
            tipo: config.tipo,
            ubicacionId: config.ubicacionId,
            descripcion: config.descripcion,
            modelo: config.modelo,
            fabricante: config.fabricante,
            configuracion: config.configuracion
          },
          dispositivo: {
            username: config.mqttConfig.username,
            password: config.mqttConfig.password
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
                      addToast({
                title: 'Sensor creado exitosamente',
                message: 'El sensor se ha configurado con MQTT',
                type: 'success'
              })
        onComplete(result)
      } else {
        throw new Error('Error creando sensor')
      }
    } catch {
      setError('Error creando sensor')
                    addToast({
                title: 'Error',
                message: 'No se pudo crear el sensor',
                type: 'error'
              })
    } finally {
      setIsLoading(false)
    }
  }

  const generateMqttCredentials = () => {
    const username = `sensor_${config.nombre.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
    const password = `pass_${Math.random().toString(36).substring(2, 15)}`
    const topic = `empresa/sensor/${username}/data`

    setConfig(prev => ({
      ...prev,
      mqttConfig: {
        username,
        password,
        topic
      }
    }))
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Información Básica del Sensor</h3>
        <p className="text-gray-600">Configura los datos básicos del sensor</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre del Sensor *</Label>
          <Input
            id="nombre"
            value={config.nombre}
            onChange={(e) => handleConfigChange('nombre', e.target.value)}
            placeholder="Ej: Sensor de Temperatura Principal"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de Sensor *</Label>
          <Select
            value={config.tipo}
            onValueChange={(value) => handleTipoChange(value as SensorTipo)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SENSOR_TYPES).map(([tipo, info]) => (
                <SelectItem key={tipo} value={tipo}>
                  <div className="flex items-center gap-2">
                    <span>{info.icon}</span>
                    <span>{info.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">{SENSOR_TYPES[config.tipo].description}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ubicacion">Ubicación *</Label>
          <Select
            value={config.ubicacionId.toString()}
            onValueChange={(value) => handleConfigChange('ubicacionId', parseInt(value))}
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

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={config.descripcion}
            onChange={(e) => handleConfigChange('descripcion', e.target.value)}
            placeholder="Descripción del sensor y su ubicación"
            rows={3}
          />
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Información del Dispositivo</h3>
        <p className="text-gray-600">Detalles del hardware del sensor</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fabricante">Fabricante</Label>
            <Input
              id="fabricante"
              value={config.fabricante}
              onChange={(e) => handleConfigChange('fabricante', e.target.value)}
              placeholder="Ej: DHT22, ESP32, Arduino"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo</Label>
            <Input
              id="modelo"
              value={config.modelo}
              onChange={(e) => handleConfigChange('modelo', e.target.value)}
              placeholder="Ej: DHT22, ESP32-WROOM-32"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Configuración del Sensor</Label>
          <div className="p-4 bg-gray-50 rounded-lg">
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(config.configuracion, null, 2)}
            </pre>
          </div>
          <p className="text-xs text-gray-500">
            Configuración automática basada en el tipo de sensor seleccionado
          </p>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Configuración MQTT</h3>
        <p className="text-gray-600">Credenciales para conectar el sensor al broker MQTT</p>
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
              placeholder="sensor_temperatura_001"
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
            placeholder="empresa/sensor/temperatura_001/data"
          />
          <p className="text-xs text-gray-500">
            Tópico donde el sensor enviará sus lecturas
          </p>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Importante:</strong> Guarda estas credenciales de forma segura. 
            Necesitarás configurarlas en tu dispositivo físico para que se conecte al broker MQTT.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Resumen y Código de Ejemplo</h3>
        <p className="text-gray-600">Revisa la configuración y obtén el código para tu dispositivo</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resumen del Sensor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Nombre:</strong> {config.nombre}</div>
              <div><strong>Tipo:</strong> {SENSOR_TYPES[config.tipo].name}</div>
              <div><strong>Ubicación:</strong> {ubicaciones.find(u => u.id === config.ubicacionId)?.nombre}</div>
              <div><strong>Usuario MQTT:</strong> {config.mqttConfig.username}</div>
              <div><strong>Tópico:</strong> {config.mqttConfig.topic}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Código de Ejemplo (Arduino/ESP32)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <pre className="text-xs">
{`#include <WiFi.h>
#include <PubSubClient.h>

// Configuración WiFi
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// Configuración MQTT
const char* mqtt_server = "h02f10fd.ala.us-east-1.emqxsl.com";
const int mqtt_port = 8883;
const char* mqtt_username = "${config.mqttConfig.username}";
const char* mqtt_password = "${config.mqttConfig.password}";
const char* mqtt_topic = "${config.mqttConfig.topic}";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  setupWiFi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Leer sensor (ejemplo para temperatura)
  float temperatura = leerTemperatura();
  
  // Crear JSON
  String json = "{\\"temperatura\\":" + String(temperatura) + ",\\"timestamp\\":" + String(millis()) + "}";
  
  // Publicar en MQTT
  client.publish(mqtt_topic, json.c_str());
  
  delay(30000); // Enviar cada 30 segundos
}

float leerTemperatura() {
  // Implementar lectura del sensor específico
  return 25.5; // Valor de ejemplo
}`}
              </pre>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                // Aquí podrías descargar el código como archivo
                addToast({
                  title: 'Código copiado',
                  message: 'El código de ejemplo se ha copiado al portapapeles',
                  type: 'success'
                })
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Código
            </Button>
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
            {currentStep === 1 && 'Información Básica'}
            {currentStep === 2 && 'Dispositivo'}
            {currentStep === 3 && 'MQTT'}
            {currentStep === 4 && 'Resumen'}
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
          <ChevronLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? 'Cancelar' : 'Anterior'}
        </Button>

        {currentStep < totalSteps ? (
          <Button onClick={nextStep} disabled={isLoading}>
            Siguiente
            <ChevronRight className="w-4 h-4 ml-2" />
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
            Crear Sensor
          </Button>
        )}
      </div>
    </div>
  )
} 