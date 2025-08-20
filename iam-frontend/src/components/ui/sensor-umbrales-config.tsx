'use client'

import { useState, useEffect } from 'react'
import { Sensor, SensorTipo, UmbralesSensor, SeveridadAlerta, CanalNotificacion } from '@/types/sensor'
import { umbralesService } from '@/lib/services/umbralesService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/switch'
import Button from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SelectAdvanced'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { 
  Thermometer, 
  Droplets, 
  Gauge, 
  Scale, 
  Bell, 
  Mail, 
  MessageSquare, 
  Wifi,
  Save,
  X,
  AlertTriangle,
  Settings,
  Loader2
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface SensorUmbralesConfigProps {
  sensores: Sensor[]
  onComplete: () => void
  onCancel: () => void
}

export function SensorUmbralesConfig({ 
  sensores, 
  onComplete, 
  onCancel 
}: SensorUmbralesConfigProps) {
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null)
  const [umbrales, setUmbrales] = useState<UmbralesSensor | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { addToast } = useToast()

  const loadUmbrales = async (sensorId: number) => {
    try {
      setIsLoading(true)
      const umbralesData = await umbralesService.obtenerUmbralesSensor(sensorId)
      
      if (umbralesData) {
        setUmbrales(umbralesData)
      } else {
        // Crear umbrales por defecto
        const umbralesDefault: UmbralesSensor = {
          sensorId,
          empresaId: selectedSensor!.empresaId,
          tipo: selectedSensor!.tipo,
          umbralMin: getUmbralDefault(selectedSensor!.tipo, 'min'),
          umbralMax: getUmbralDefault(selectedSensor!.tipo, 'max'),
          alertasActivadas: true,
          severidad: SeveridadAlerta.MEDIA,
          mensajeAlerta: `Alerta de ${selectedSensor!.tipo.toLowerCase()}`,
          intervaloVerificacion: 5,
          canalesNotificacion: [CanalNotificacion.EMAIL, CanalNotificacion.WEBSOCKET],
          destinatarios: []
        }
        setUmbrales(umbralesDefault)
      }
    } catch {
      addToast({
        title: 'Error',
        message: 'No se pudieron cargar los umbrales del sensor',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar umbrales del sensor seleccionado
  useEffect(() => {
    if (selectedSensor) {
      loadUmbrales(selectedSensor.id)
    }
  }, [selectedSensor])

  const getUmbralDefault = (tipo: SensorTipo, extremo: 'min' | 'max'): number => {
    const defaults = {
      [SensorTipo.TEMPERATURA]: { min: 15, max: 30 },
      [SensorTipo.HUMEDAD]: { min: 40, max: 70 },
      [SensorTipo.PRESION]: { min: 1000, max: 1100 },
      [SensorTipo.PESO]: { min: 0, max: 1000 }
    }
    return defaults[tipo][extremo]
  }

  const handleSave = async () => {
    if (!umbrales || !selectedSensor) return

    try {
      setIsSaving(true)
      await umbralesService.guardarUmbralesSensor(umbrales)
      
      addToast({
        title: 'Éxito',
        message: 'Umbrales guardados correctamente',
        type: 'success'
      })
      
      onComplete()
    } catch {
      addToast({
        title: 'Error',
        message: 'No se pudieron guardar los umbrales',
        type: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getIconForTipo = (tipo: SensorTipo) => {
    switch (tipo) {
      case SensorTipo.TEMPERATURA: return <Thermometer className="w-4 h-4" />
      case SensorTipo.HUMEDAD: return <Droplets className="w-4 h-4" />
      case SensorTipo.PRESION: return <Gauge className="w-4 h-4" />
      case SensorTipo.PESO: return <Scale className="w-4 h-4" />
      default: return <Settings className="w-4 h-4" />
    }
  }

  if (sensores.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay sensores disponibles</h3>
        <p className="text-gray-600 mb-4">Primero debes crear sensores para poder configurar sus umbrales</p>
        <Button onClick={onCancel} variant="outline">
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selección de sensor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Seleccionar Sensor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSensor?.id?.toString() || ''} onValueChange={(value) => {
            const sensor = sensores.find(s => s.id.toString() === value)
            setSelectedSensor(sensor || null)
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un sensor para configurar" />
            </SelectTrigger>
            <SelectContent>
              {sensores.map((sensor) => (
                <SelectItem key={sensor.id} value={sensor.id.toString()}>
                  <div className="flex items-center gap-2">
                    {getIconForTipo(sensor.tipo)}
                    <span>{sensor.nombre}</span>
                    <Badge variant="outline">{sensor.tipo}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedSensor && umbrales && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getIconForTipo(selectedSensor.tipo)}
              Configuración de Umbrales - {selectedSensor.nombre}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Cargando umbrales...</span>
              </div>
            ) : (
              <>
                {/* Umbrales básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="umbralMin">Umbral Mínimo</Label>
                    <Input
                      id="umbralMin"
                      type="number"
                      value={umbrales.umbralMin}
                      onChange={(e) => setUmbrales(prev => prev ? {
                        ...prev,
                        umbralMin: parseFloat(e.target.value) || 0
                      } : null)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="umbralMax">Umbral Máximo</Label>
                    <Input
                      id="umbralMax"
                      type="number"
                      value={umbrales.umbralMax}
                      onChange={(e) => setUmbrales(prev => prev ? {
                        ...prev,
                        umbralMax: parseFloat(e.target.value) || 0
                      } : null)}
                      placeholder="100"
                    />
                  </div>
                </div>

                {/* Configuración de alertas */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="alertasActivadas"
                      checked={umbrales.alertasActivadas}
                      onCheckedChange={(checked) => setUmbrales(prev => prev ? {
                        ...prev,
                        alertasActivadas: checked
                      } : null)}
                    />
                    <Label htmlFor="alertasActivadas">Alertas Activadas</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severidad">Severidad</Label>
                    <Select value={umbrales.severidad} onValueChange={(value) => setUmbrales(prev => prev ? {
                      ...prev,
                      severidad: value as SeveridadAlerta
                    } : null)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SeveridadAlerta.BAJA}>Baja</SelectItem>
                        <SelectItem value={SeveridadAlerta.MEDIA}>Media</SelectItem>
                        <SelectItem value={SeveridadAlerta.ALTA}>Alta</SelectItem>
                        <SelectItem value={SeveridadAlerta.CRITICA}>Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensajeAlerta">Mensaje de Alerta</Label>
                    <Textarea
                      id="mensajeAlerta"
                      value={umbrales.mensajeAlerta || ''}
                      onChange={(e) => setUmbrales(prev => prev ? {
                        ...prev,
                        mensajeAlerta: e.target.value
                      } : null)}
                      placeholder="Mensaje que se mostrará cuando se active la alerta"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="intervaloVerificacion">Intervalo de Verificación (minutos)</Label>
                    <Input
                      id="intervaloVerificacion"
                      type="number"
                      value={umbrales.intervaloVerificacion}
                      onChange={(e) => setUmbrales(prev => prev ? {
                        ...prev,
                        intervaloVerificacion: parseInt(e.target.value) || 5
                      } : null)}
                      placeholder="5"
                      min="1"
                      max="60"
                    />
                  </div>
                </div>

                {/* Canales de notificación */}
                <div className="space-y-4">
                  <Label>Canales de Notificación</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notificacionEmail"
                        checked={umbrales.canalesNotificacion.includes(CanalNotificacion.EMAIL)}
                        onCheckedChange={(checked) => setUmbrales(prev => prev ? {
                          ...prev,
                          canalesNotificacion: checked 
                            ? [...prev.canalesNotificacion, CanalNotificacion.EMAIL]
                            : prev.canalesNotificacion.filter(c => c !== CanalNotificacion.EMAIL)
                        } : null)}
                      />
                      <Label htmlFor="notificacionEmail" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notificacionSMS"
                        checked={umbrales.canalesNotificacion.includes(CanalNotificacion.SMS)}
                        onCheckedChange={(checked) => setUmbrales(prev => prev ? {
                          ...prev,
                          canalesNotificacion: checked 
                            ? [...prev.canalesNotificacion, CanalNotificacion.SMS]
                            : prev.canalesNotificacion.filter(c => c !== CanalNotificacion.SMS)
                        } : null)}
                      />
                      <Label htmlFor="notificacionSMS" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        SMS
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notificacionWebSocket"
                        checked={umbrales.canalesNotificacion.includes(CanalNotificacion.WEBSOCKET)}
                        onCheckedChange={(checked) => setUmbrales(prev => prev ? {
                          ...prev,
                          canalesNotificacion: checked 
                            ? [...prev.canalesNotificacion, CanalNotificacion.WEBSOCKET]
                            : prev.canalesNotificacion.filter(c => c !== CanalNotificacion.WEBSOCKET)
                        } : null)}
                      />
                      <Label htmlFor="notificacionWebSocket" className="flex items-center gap-2">
                        <Wifi className="w-4 h-4" />
                        WebSocket
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Destinatarios */}
                <div className="space-y-2">
                  <Label htmlFor="destinatarios">Destinatarios (emails separados por comas)</Label>
                  <Input
                    id="destinatarios"
                    value={umbrales.destinatarios.join(', ')}
                    onChange={(e) => setUmbrales(prev => prev ? {
                      ...prev,
                      destinatarios: e.target.value.split(',').map(email => email.trim()).filter(email => email)
                    } : null)}
                    placeholder="email1@ejemplo.com, email2@ejemplo.com"
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Guardar Umbrales
                  </Button>
                  <Button
                    onClick={onCancel}
                    variant="outline"
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
