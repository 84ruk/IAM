'use client'

import { Sensor, SensorTipo } from '@/types/sensor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Edit, Trash2, Activity, Thermometer, Droplets, Gauge, Weight, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { useState, useMemo } from 'react'
import { sensorService } from '@/lib/services/sensorService'
import { useToast } from '@/components/ui/Toast'

interface SensorCardProps {
  sensor: Sensor
  onEdit?: (sensor: Sensor) => void
  onDelete?: (sensorId: number) => void
  onViewDetails?: (sensor: Sensor) => void
}

const getSensorIcon = (tipo: SensorTipo) => {
  switch (tipo) {
    case SensorTipo.TEMPERATURA:
      return <Thermometer className="w-5 h-5" />
    case SensorTipo.HUMEDAD:
      return <Droplets className="w-5 h-5" />
    case SensorTipo.PRESION:
      return <Gauge className="w-5 h-5" />
    case SensorTipo.PESO:
      return <Weight className="w-5 h-5" />
    default:
      return <Activity className="w-5 h-5" />
  }
}

const getSensorColor = (tipo: SensorTipo) => {
  switch (tipo) {
    case SensorTipo.TEMPERATURA:
      return 'bg-red-100 text-red-800 border-red-200'
    case SensorTipo.HUMEDAD:
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case SensorTipo.PRESION:
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case SensorTipo.PESO:
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getSensorIconColor = (tipo: SensorTipo) => {
  switch (tipo) {
    case SensorTipo.TEMPERATURA:
      return 'text-red-500'
    case SensorTipo.HUMEDAD:
      return 'text-blue-500'
    case SensorTipo.PRESION:
      return 'text-purple-500'
    case SensorTipo.PESO:
      return 'text-green-500'
    default:
      return 'text-gray-500'
  }
}

export function SensorCard({ sensor, onEdit, onDelete, onViewDetails }: SensorCardProps) {
  const [openAlertConfig, setOpenAlertConfig] = useState(false)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  // Campos simples por tipo
  const [minValue, setMinValue] = useState<number | ''>(() => {
    const cfg = (sensor.configuracion as Record<string, unknown>) || {}
    switch (sensor.tipo) {
      case SensorTipo.TEMPERATURA: return (cfg.temperaturaMin as number) ?? ''
      case SensorTipo.HUMEDAD: return (cfg.humedadMin as number) ?? ''
      case SensorTipo.PESO: return (cfg.pesoMin as number) ?? ''
      case SensorTipo.PRESION: return (cfg.presionMin as number) ?? ''
      default: return ''
    }
  })

  const [maxValue, setMaxValue] = useState<number | ''>(() => {
    const cfg = (sensor.configuracion as Record<string, unknown>) || {}
    switch (sensor.tipo) {
      case SensorTipo.TEMPERATURA: return (cfg.temperaturaMax as number) ?? ''
      case SensorTipo.HUMEDAD: return (cfg.humedadMax as number) ?? ''
      case SensorTipo.PESO: return (cfg.pesoMax as number) ?? ''
      case SensorTipo.PRESION: return (cfg.presionMax as number) ?? ''
      default: return ''
    }
  })

  const [smsEnabled, setSmsEnabled] = useState<boolean>(() => {
    const cfg = (sensor.configuracion as Record<string, unknown>) || {}
    return Boolean(cfg.notificacionSMS)
  })

  const [emailEnabled, setEmailEnabled] = useState<boolean>(() => {
    const cfg = (sensor.configuracion as Record<string, unknown>) || {}
    return Boolean(cfg.notificacionEmail)
  })

  const [phone, setPhone] = useState<string>(() => {
    const cfg = (sensor.configuracion as Record<string, unknown>) || {}
    const arr = (cfg.destinatariosSMS as string[]) || []
    return arr[0] || ''
  })

  const [email, setEmail] = useState<string>(() => {
    const cfg = (sensor.configuracion as Record<string, unknown>) || {}
    const arr = (cfg.destinatariosEmail as string[]) || []
    return arr[0] || ''
  })

  const labels = useMemo(() => {
    switch (sensor.tipo) {
      case SensorTipo.TEMPERATURA: return { min: 'Temperatura mínima (°C)', max: 'Temperatura máxima (°C)' }
      case SensorTipo.HUMEDAD: return { min: 'Humedad mínima (%)', max: 'Humedad máxima (%)' }
      case SensorTipo.PESO: return { min: 'Peso mínimo', max: 'Peso máximo' }
      case SensorTipo.PRESION: return { min: 'Presión mínima', max: 'Presión máxima' }
      default: return { min: 'Mínimo', max: 'Máximo' }
    }
  }, [sensor.tipo])

  const handleSaveAlertConfig = async () => {
    try {
      setSaving(true)
      const cfg = (sensor.configuracion as Record<string, unknown>) || {}
      // Preparar payload por tipo
      const payload: Record<string, string | number | boolean> = { 
        ...cfg, 
        notificacionSMS: smsEnabled,
        notificacionEmail: emailEnabled
      }
      if (phone.trim()) payload.destinatariosSMS = phone.trim()
      if (email.trim()) payload.destinatariosEmail = email.trim()
      switch (sensor.tipo) {
        case SensorTipo.TEMPERATURA:
          if (minValue !== '') payload.temperaturaMin = Number(minValue)
          if (maxValue !== '') payload.temperaturaMax = Number(maxValue)
          break
        case SensorTipo.HUMEDAD:
          if (minValue !== '') payload.humedadMin = Number(minValue)
          if (maxValue !== '') payload.humedadMax = Number(maxValue)
          break
        case SensorTipo.PESO:
          if (minValue !== '') payload.pesoMin = Number(minValue)
          if (maxValue !== '') payload.pesoMax = Number(maxValue)
          break
        case SensorTipo.PRESION:
          if (minValue !== '') payload.presionMin = Number(minValue)
          if (maxValue !== '') payload.presionMax = Number(maxValue)
          break
      }

      await sensorService.actualizarSensor(sensor.id, { configuracion: payload })
      addToast({ type: 'success', title: 'Guardado', message: 'Alertas actualizadas' })
      setOpenAlertConfig(false)
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo guardar la configuración' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="group sensor-hover-lift hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 bg-gradient-to-br from-white to-gray-50/30">
      <CardHeader className="pb-3 relative">
        {/* Indicador de estado con pulse */}
        <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${sensor.activo ? 'bg-green-500' : 'bg-gray-400'}`}>
          {sensor.activo && (
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 sensor-status-pulse"></div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${sensor.activo ? 'from-blue-50 to-blue-100' : 'from-gray-50 to-gray-100'} group-hover:scale-110 transition-transform duration-300 ${sensor.activo ? 'sensor-card-pulse' : ''}`}>
              <div className={getSensorIconColor(sensor.tipo)}>
                {getSensorIcon(sensor.tipo)}
              </div>
            </div>
            <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
              {sensor.nombre}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={sensor.activo ? "default" : "secondary"}
              className={`${sensor.activo ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"} transition-all duration-300 group-hover:scale-105 ${sensor.activo ? 'sensor-card-pulse' : ''}`}
            >
              {sensor.activo ? 'Activo' : 'Inactivo'}
            </Badge>
            {smsEnabled && (
              <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 group-hover:bg-orange-100 transition-colors duration-300">
                SMS
              </Badge>
            )}
            {emailEnabled && (
              <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 group-hover:bg-blue-100 transition-colors duration-300">
                Email
              </Badge>
            )}
          </div>
        </div>
        <Badge className={`${getSensorColor(sensor.tipo)} transition-all duration-300 group-hover:scale-105`}>
          {sensor.tipo}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <p><strong>Ubicación:</strong> {sensor.ubicacion?.nombre || 'Sin ubicación'}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <p><strong>ID:</strong> {sensor.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <p><strong>Creado:</strong> {new Date(sensor.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewDetails(sensor)}
              className="flex-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300 group-hover:scale-105"
            >
              <Activity className="w-4 h-4 mr-1" />
              Ver Detalles
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setOpenAlertConfig(true)}
            className="flex-1 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all duration-300 group-hover:scale-105"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Alertas
          </Button>
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEdit(sensor)}
              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300 group-hover:scale-105"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete(sensor.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-300 group-hover:scale-105"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>

      {/* Dialogo configuración mejorada de alertas */}
      <Dialog open={openAlertConfig} onOpenChange={setOpenAlertConfig}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              Configuración de Alertas
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              Configura los umbrales y notificaciones para el sensor <strong>{sensor.nombre}</strong>
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Sección de Umbrales */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Umbrales de Alerta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{labels.min}</label>
                  <Input
                    type="number"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{labels.max}</label>
                  <Input
                    type="number"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full"
                    placeholder="100"
                  />
                </div>
              </div>
            </div>

            {/* Sección de Notificaciones */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Canales de Notificación
              </h3>
              
              {/* SMS */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <input 
                    id={`sms_${sensor.id}`} 
                    type="checkbox" 
                    checked={smsEnabled} 
                    onChange={(e) => setSmsEnabled(e.target.checked)}
                    className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor={`sms_${sensor.id}`} className="text-sm font-medium text-gray-700">
                    Notificaciones por SMS
                  </label>
                </div>
                {smsEnabled && (
                  <div className="ml-7">
                    <label className="block text-sm text-gray-600 mb-1">Número de teléfono</label>
                    <Input
                      placeholder="+52 55 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input 
                    id={`email_${sensor.id}`} 
                    type="checkbox" 
                    checked={emailEnabled} 
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`email_${sensor.id}`} className="text-sm font-medium text-gray-700">
                    Notificaciones por Email
                  </label>
                </div>
                {emailEnabled && (
                  <div className="ml-7">
                    <label className="block text-sm text-gray-600 mb-1">Dirección de email</label>
                    <Input
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setOpenAlertConfig(false)} 
                disabled={saving}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveAlertConfig} 
                disabled={saving} 
                className="bg-[#8E94F2] text-white hover:bg-[#7278e0] px-6"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  'Guardar Configuración'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 