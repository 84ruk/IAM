'use client'

import { useState, useEffect } from 'react'
import { Sensor, SensorTipo, CreateSensorDto, UpdateSensorDto, Ubicacion } from '@/types/sensor'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SelectAdvanced'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, X } from 'lucide-react'

interface SensorFormProps {
  sensor?: Sensor | null
  ubicaciones: Ubicacion[]
  onSubmit: (data: CreateSensorDto | UpdateSensorDto) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function SensorForm({ 
  sensor, 
  ubicaciones, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: SensorFormProps) {
  const [formData, setFormData] = useState<CreateSensorDto>({
    nombre: '',
    tipo: SensorTipo.TEMPERATURA,
    ubicacionId: 0,
    configuracion: {}
  })
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (sensor) {
      setFormData({
        nombre: sensor.nombre,
        tipo: sensor.tipo,
        ubicacionId: sensor.ubicacionId,
        configuracion: sensor.configuracion || {}
      })
    }
  }, [sensor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.nombre.trim()) {
      setError('El nombre del sensor es requerido')
      return
    }

    if (!formData.ubicacionId) {
      setError('Debe seleccionar una ubicación')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el sensor')
    }
  }

  const handleInputChange = (field: keyof CreateSensorDto, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {sensor ? 'Editar Sensor' : 'Crear Nuevo Sensor'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Sensor *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              placeholder="Ej: Sensor de Temperatura Principal"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Sensor *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => handleInputChange('tipo', value as SensorTipo)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SensorTipo.TEMPERATURA}>Temperatura</SelectItem>
                <SelectItem value={SensorTipo.HUMEDAD}>Humedad</SelectItem>
                <SelectItem value={SensorTipo.PRESION}>Presión</SelectItem>
                <SelectItem value={SensorTipo.PESO}>Peso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ubicacion">Ubicación *</Label>
            <Select
              value={formData.ubicacionId.toString()}
              onValueChange={(value) => handleInputChange('ubicacionId', parseInt(value))}
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
            <Label htmlFor="configuracion">Configuración del Sensor</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unidad" className="text-sm">Unidad de Medida</Label>
                <Input
                  id="unidad"
                  value={String(formData.configuracion?.unidad || '')}
                  onChange={(e) => {
                    const newConfig = { ...formData.configuracion, unidad: e.target.value }
                    setFormData(prev => ({ ...prev, configuracion: newConfig }))
                  }}
                  placeholder="°C, %, kg, Pa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precision" className="text-sm">Precisión</Label>
                <Input
                  id="precision"
                  type="number"
                  step="0.01"
                  value={String(formData.configuracion?.precision || '')}
                  onChange={(e) => {
                    const newConfig = { ...formData.configuracion, precision: parseFloat(e.target.value) }
                    setFormData(prev => ({ ...prev, configuracion: newConfig }))
                  }}
                  placeholder="0.1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rango_min" className="text-sm">Rango Mínimo</Label>
                <Input
                  id="rango_min"
                  type="number"
                  value={String(formData.configuracion?.rango_min || '')}
                  onChange={(e) => {
                    const newConfig = { ...formData.configuracion, rango_min: parseFloat(e.target.value) }
                    setFormData(prev => ({ ...prev, configuracion: newConfig }))
                  }}
                  placeholder="-20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rango_max" className="text-sm">Rango Máximo</Label>
                <Input
                  id="rango_max"
                  type="number"
                  value={String(formData.configuracion?.rango_max || '')}
                  onChange={(e) => {
                    const newConfig = { ...formData.configuracion, rango_max: parseFloat(e.target.value) }
                    setFormData(prev => ({ ...prev, configuracion: newConfig }))
                  }}
                  placeholder="50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="intervalo" className="text-sm">Intervalo de Lectura (segundos)</Label>
              <Input
                id="intervalo"
                type="number"
                                  value={String(formData.configuracion?.intervalo_lectura || '')}
                onChange={(e) => {
                  const newConfig = { ...formData.configuracion, intervalo_lectura: parseInt(e.target.value) }
                  setFormData(prev => ({ ...prev, configuracion: newConfig }))
                }}
                placeholder="30"
              />
            </div>
            <p className="text-xs text-gray-500">
              Configuración específica del sensor. Los valores se aplicarán automáticamente según el tipo seleccionado.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {sensor ? 'Actualizar' : 'Crear'} Sensor
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 