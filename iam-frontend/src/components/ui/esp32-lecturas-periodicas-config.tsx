'use client'

import { useState, useEffect } from 'react'
import { ESP32Configuracion, Ubicacion } from '@/types/sensor'
import { sensorService } from '@/lib/services/sensorService'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SelectAdvanced'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Zap,
  FileText,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useServerUser } from '@/context/ServerUserContext'

interface ESP32LecturasPeriodicasConfigProps {
  ubicaciones: Ubicacion[]
  onComplete?: () => void
  onCancel?: () => void
}

const SENSOR_OPTIONS = [
  {
    type: 'TEMPERATURA',
    name: 'Temperatura (DHT22)',
    description: 'Sensor de temperatura y humedad',
    icon: '🌡️',
    pin: 4,
    pin2: 0,
    unidad: '°C',
    umbralMin: 15,
    umbralMax: 35,
    intervalo: 30
  },
  {
    type: 'HUMEDAD',
    name: 'Humedad (DHT22)',
    description: 'Sensor de humedad relativa',
    icon: '💧',
    pin: 4,
    pin2: 0,
    unidad: '%',
    umbralMin: 30,
    umbralMax: 80,
    intervalo: 30
  },
  {
    type: 'PESO',
    name: 'Peso (HX711)',
    description: 'Sensor de peso con celda de carga',
    icon: '⚖️',
    pin: 16,
    pin2: 17,
    unidad: 'kg',
    umbralMin: 0,
    umbralMax: 1000,
    intervalo: 60
  },
  {
    type: 'PRESION',
    name: 'Presión (BMP280)',
    description: 'Sensor de presión atmosférica',
    icon: '🌪️',
    pin: 21,
    pin2: 22,
    unidad: 'hPa',
    umbralMin: 900,
    umbralMax: 1100,
    intervalo: 30
  }
]

export function ESP32LecturasPeriodicasConfig({ ubicaciones, onComplete, onCancel }: ESP32LecturasPeriodicasConfigProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [configFile, setConfigFile] = useState<string>('')
  const [codigoArduino, setCodigoArduino] = useState<string>('')
  const [error, setError] = useState<string>('')
  const { addToast } = useToast()
  const user = useServerUser()

  const [config, setConfig] = useState<ESP32Configuracion>({
    deviceId: `esp32_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    deviceName: '',
    ubicacionId: 0,
    empresaId: user?.empresaId || 0,
    wifi: {
      ssid: '',
      password: ''
    },
    api: {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      token: '',
      endpoint: '/sensores/lecturas-multiples'
    },
    sensores: SENSOR_OPTIONS.map(option => ({
      tipo: option.type,
      nombre: option.name,
      pin: option.pin,
      pin2: option.pin2,
      enabled: false,
      umbralMin: option.umbralMin,
      umbralMax: option.umbralMax,
      unidad: option.unidad,
      intervalo: option.intervalo * 1000
    })),
    intervalo: 30000,
    timestamp: new Date().toISOString()
  })

  // Generar token automáticamente
  useEffect(() => {
    const generateToken = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let token = ''
      for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return token
    }
    setConfig(prev => ({
      ...prev,
      api: { ...prev.api, token: generateToken() }
    }))
  }, [])

  // Actualizar empresaId cuando el usuario cambie
  useEffect(() => {
    if (user?.empresaId) {
      setConfig(prev => ({
        ...prev,
        empresaId: user.empresaId as number
      }))
    }
  }, [user?.empresaId])

  const handleInputChange = (field: string, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleWifiChange = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      wifi: {
        ...prev.wifi,
        [field]: value
      }
    }))
  }

  const handleSensorToggle = (sensorType: string, enabled: boolean) => {
    const sensorOption = SENSOR_OPTIONS.find(s => s.type === sensorType)
    if (!sensorOption) return

    setConfig(prev => {
      const existingSensorIndex = prev.sensores.findIndex(s => s.tipo === sensorType)
      
      if (enabled) {
        // Habilitar sensor
        if (existingSensorIndex >= 0) {
          // Actualizar sensor existente
          const updatedSensores = [...prev.sensores]
          updatedSensores[existingSensorIndex] = {
            ...updatedSensores[existingSensorIndex],
            enabled: true
          }
          return {
            ...prev,
            sensores: updatedSensores
          }
        } else {
          // Agregar nuevo sensor
          return {
            ...prev,
            sensores: [
              ...prev.sensores,
              {
                tipo: sensorType,
                nombre: sensorOption.name,
                pin: sensorOption.pin,
                pin2: sensorOption.pin2,
                enabled: true,
                umbralMin: sensorOption.umbralMin,
                umbralMax: sensorOption.umbralMax,
                unidad: sensorOption.unidad,
                intervalo: sensorOption.intervalo * 1000
              }
            ]
          }
        }
      } else {
        // Deshabilitar sensor
        if (existingSensorIndex >= 0) {
          // Actualizar sensor existente
          const updatedSensores = [...prev.sensores]
          updatedSensores[existingSensorIndex] = {
            ...updatedSensores[existingSensorIndex],
            enabled: false
          }
          return {
            ...prev,
            sensores: updatedSensores
          }
        }
      }
      
      return prev
    })
  }

  const handleSensorConfigChange = (sensorType: string, field: string, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      sensores: prev.sensores.map(sensor => 
        sensor.tipo === sensorType 
          ? { ...sensor, [field]: value }
          : sensor
      )
    }))
  }

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return config.deviceName.length > 0 && config.ubicacionId > 0
      case 2:
        return config.wifi.ssid.length > 0 && config.wifi.password.length > 0
      case 3:
        return config.sensores.some(sensor => sensor.enabled)
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
      setError('')
    } else {
      setError('Por favor completa todos los campos requeridos')
    }
  }

  const handleBack = () => {
    setStep(step - 1)
    setError('')
  }

  const handleGenerateConfig = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Filtrar solo los sensores habilitados
      const configToSend = {
        ...config,
        sensores: config.sensores.filter(sensor => sensor.enabled)
      }

      const response = await sensorService.generarCodigoArduino(configToSend)
      
      if (response.success) {
        setConfigFile(response.configFile)
        setCodigoArduino(response.codigoArduino)
        addToast({
          type: 'success',
          title: 'Código Generado',
          message: 'El código Arduino y la configuración se han generado correctamente'
        })
        setStep(5)
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError('Error generando el código Arduino')
      console.error('Error generating Arduino code:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadConfig = () => {
    const blob = new Blob([configFile], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `esp32-config-${config.deviceId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadArduino = () => {
    const blob = new Blob([codigoArduino], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `esp32-${config.deviceId}.ino`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(configFile)
    addToast({
      type: 'success',
      title: 'Copiado',
      message: 'Configuración copiada al portapapeles'
    })
  }

  const handleCopyArduino = () => {
    navigator.clipboard.writeText(codigoArduino)
    addToast({
      type: 'success',
      title: 'Copiado',
      message: 'Código Arduino copiado al portapapeles'
    })
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Información del Dispositivo</h3>
        <p className="text-gray-600 mb-6">Configura la información básica del ESP32</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="deviceName">Nombre del Dispositivo</Label>
          <Input
            id="deviceName"
            value={config.deviceName}
            onChange={(e) => handleInputChange('deviceName', e.target.value)}
            placeholder="Ej: ESP32 Almacén Principal"
          />
        </div>

        <div>
          <Label htmlFor="ubicacion">Ubicación</Label>
          <Select value={config.ubicacionId.toString()} onValueChange={(value) => handleInputChange('ubicacionId', parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una ubicación" />
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

        <div>
          <Label htmlFor="intervalo">Intervalo de Lectura (segundos)</Label>
          <Input
            id="intervalo"
            type="number"
            value={config.intervalo / 1000}
            onChange={(e) => handleInputChange('intervalo', parseInt(e.target.value) * 1000)}
            min="10"
            max="300"
          />
          <p className="text-sm text-gray-500 mt-1">Tiempo entre lecturas de sensores</p>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Configuración WiFi</h3>
        <p className="text-gray-600 mb-6">Configura la conexión WiFi del ESP32</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="ssid">SSID de la Red WiFi</Label>
          <Input
            id="ssid"
            value={config.wifi.ssid}
            onChange={(e) => handleWifiChange('ssid', e.target.value)}
            placeholder="Nombre de tu red WiFi"
          />
        </div>

        <div>
          <Label htmlFor="password">Contraseña WiFi</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={config.wifi.password}
              onChange={(e) => handleWifiChange('password', e.target.value)}
              placeholder="Contraseña de tu red WiFi"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            El ESP32 se conectará automáticamente a esta red WiFi para enviar datos al servidor.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Configuración de Sensores</h3>
        <p className="text-gray-600 mb-6">Selecciona los sensores que vas a conectar al ESP32</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SENSOR_OPTIONS.map((sensor) => {
          const sensorConfig = config.sensores.find(s => s.tipo === sensor.type)
          return (
            <Card key={sensor.type} className={`cursor-pointer transition-colors ${
              sensorConfig?.enabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sensor.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{sensor.name}</div>
                      <div className="text-xs text-gray-500">{sensor.description}</div>
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
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Umbral Mín</Label>
                        <Input
                          type="number"
                          value={sensorConfig.umbralMin}
                          onChange={(e) => handleSensorConfigChange(sensor.type, 'umbralMin', parseFloat(e.target.value))}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Umbral Máx</Label>
                        <Input
                          type="number"
                          value={sensorConfig.umbralMax}
                          onChange={(e) => handleSensorConfigChange(sensor.type, 'umbralMax', parseFloat(e.target.value))}
                          className="text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Intervalo (seg)</Label>
                      <Input
                        type="number"
                        value={sensorConfig.intervalo / 1000}
                        onChange={(e) => handleSensorConfigChange(sensor.type, 'intervalo', parseInt(e.target.value) * 1000)}
                        className="text-xs"
                        min="10"
                        max="300"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!config.sensores.some(sensor => sensor.enabled) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selecciona al menos un sensor para continuar.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Resumen de Configuración</h3>
        <p className="text-gray-600 mb-6">Revisa la configuración antes de generar el archivo</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información del Dispositivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Nombre:</span>
              <span className="font-medium">{config.deviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID:</span>
              <span className="font-mono text-sm">{config.deviceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ubicación:</span>
              <span>{ubicaciones.find(u => u.id === config.ubicacionId)?.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Intervalo:</span>
              <span>{config.intervalo / 1000} segundos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuración WiFi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">SSID:</span>
              <span>{config.wifi.ssid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">API URL:</span>
              <span className="font-mono text-sm">{config.api.baseUrl}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sensores Configurados ({config.sensores.filter(s => s.enabled).length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {config.sensores.filter(sensor => sensor.enabled).map((sensor) => (
                <div key={sensor.tipo} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span>{SENSOR_OPTIONS.find(s => s.type === sensor.tipo)?.icon}</span>
                    <span className="font-medium">{sensor.nombre}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {sensor.umbralMin}-{sensor.umbralMax} {sensor.unidad}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Configuración Generada</h3>
        <p className="text-gray-600 mb-6">Tu configuración está lista para usar</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Archivos Generados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Información de Configuración */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Información del Dispositivo</Label>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Device ID:</strong> {config.deviceId}</p>
                  <p><strong>API URL:</strong> {config.api.baseUrl}</p>
                  <p><strong>Endpoint:</strong> {config.api.endpoint}</p>
                  <p><strong>Token:</strong> {config.api.token.substring(0, 20)}...</p>
                </div>
              </div>

              {/* Código Arduino */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Código Arduino</Label>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadArduino} size="sm" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Descargar .ino
                  </Button>
                  <Button onClick={handleCopyArduino} size="sm" variant="outline" className="flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Vista previa de configuración */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Vista Previa - Configuración</Label>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  {showQR ? 'Ocultar' : 'Mostrar'} QR
                </button>
              </div>
              <pre className="text-xs overflow-auto max-h-40">
                {JSON.stringify(JSON.parse(configFile), null, 2)}
              </pre>
            </div>

            {/* Vista previa del código Arduino */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="text-sm font-medium mb-2 block">Vista Previa - Código Arduino</Label>
              <pre className="text-xs overflow-auto max-h-40 bg-gray-100 p-2 rounded">
                {codigoArduino.substring(0, 500)}...
              </pre>
              <p className="text-xs text-gray-500 mt-1">
                Mostrando los primeros 500 caracteres. Descarga el archivo completo para ver todo el código.
              </p>
            </div>
          </CardContent>
        </Card>

                          <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Próximos pasos:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Descarga el código Arduino (.ino) y súbelo al ESP32 usando Arduino IDE</li>
                        <li>El ESP32 se conectará automáticamente al backend usando la URL configurada</li>
                        <li>La configuración se descargará automáticamente desde el servidor</li>
                        <li>Los datos se enviarán cada {config.intervalo / 1000} segundos</li>
                        <li>Monitorea las lecturas en el dashboard en tiempo real</li>
                      </ol>
                      <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                        <strong>💡 Ventaja:</strong> No necesitas archivos JSON. La configuración se obtiene automáticamente desde el backend.
                      </div>
                    </AlertDescription>
                  </Alert>
      </div>
    </div>
  )

  const renderStep = () => {
    switch (step) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      case 5: return renderStep5()
      default: return renderStep1()
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel?.()}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Configuración ESP32 - Lecturas Periódicas
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Paso {step} de 5</span>
            <span className="text-sm text-gray-500">
              {step === 1 && 'Información del Dispositivo'}
              {step === 2 && 'Configuración WiFi'}
              {step === 3 && 'Configuración de Sensores'}
              {step === 4 && 'Resumen'}
              {step === 5 && 'Completado'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t mt-4">
          <div>
            {step > 1 && step < 5 && (
              <Button onClick={handleBack} variant="outline">
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {step < 4 && (
              <Button onClick={handleNext} disabled={!validateStep(step)}>
                Siguiente
              </Button>
            )}
            
            {step === 4 && (
              <Button onClick={handleGenerateConfig} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Generar Configuración
                  </>
                )}
              </Button>
            )}
            
            {step === 5 && (
              <Button onClick={onComplete}>
                Completar
              </Button>
            )}
            
            <Button onClick={onCancel} variant="outline">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
