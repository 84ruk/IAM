'use client'

import { useState, useEffect, useCallback } from 'react'
import { Ubicacion, Sensor, UpdateSensorDto, SensorTipo } from '@/types/sensor'
import { sensorService } from '@/lib/services/sensorService'
import { Card, CardContent } from '@/components/ui/Card'
import { SensorGridSkeleton } from '@/components/ui/sensor-skeleton'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { 
  Plus, 
  Radio, 
  Trash2, 
  Thermometer,
  Droplets,
  Gauge,
  Scale,
  Zap,
  Info,
  AlertTriangle
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { SensorCard } from '@/components/ui/sensor-card'
import { useRouter } from 'next/navigation'

interface SensoresTabProps {
  ubicacion: Ubicacion
}

interface ConfiguracionPredefinida {
  tipo: string;
  unidad: string;
  rango: {
    min: number;
    max: number;
  };
  intervalo: number;
  umbral_alerta: number;
  umbral_critico: number;
}

export function SensoresTab({ ubicacion }: SensoresTabProps) {
  const router = useRouter()
  const [sensores, setSensores] = useState<Sensor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMultipleModal, setShowMultipleModal] = useState(false)
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // const [configuraciones, setConfiguraciones] = useState<ConfiguracionPredefinida[]>([])
  const [configuracionActual, setConfiguracionActual] = useState<ConfiguracionPredefinida | null>(null)
  
  // Formulario simple
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: SensorTipo.TEMPERATURA,
    descripcion: ''
  })

  // Formulario múltiple
  const [multipleSensores, setMultipleSensores] = useState([
    { nombre: '', tipo: SensorTipo.TEMPERATURA, descripcion: '' }
  ])

  const { addToast } = useToast()

  const loadSensores = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await sensorService.obtenerSensores(ubicacion.id)
      setSensores(data)
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudieron cargar los sensores",
      })
    } finally {
      setIsLoading(false)
    }
  }, [ubicacion.id, addToast])

  const loadConfiguraciones = useCallback(async () => {
    try {
      const data = await sensorService.obtenerConfiguraciones()
      // setConfiguraciones(data) // Comentado temporalmente
    } catch {
      // Manejar error silenciosamente
    }
  }, [])

  useEffect(() => {
    loadSensores()
    loadConfiguraciones()
  }, [ubicacion.id, loadSensores, loadConfiguraciones])

  const handleAddSensorSimple = async () => {
    try {
      setIsSubmitting(true)
      
      await sensorService.registrarSensorSimple({
        nombre: formData.nombre,
        tipo: formData.tipo,
        ubicacionId: ubicacion.id
      })
      
      addToast({
        type: "success",
        title: "Sensor agregado",
        message: "El sensor se ha agregado correctamente con configuración automática",
      })
      
      setShowAddModal(false)
      resetForm()
      loadSensores()
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudo agregar el sensor",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddSensorRapido = async () => {
    try {
      setIsSubmitting(true)
      
      await sensorService.registrarSensorRapido({
        nombre: formData.nombre,
        tipo: formData.tipo,
        ubicacionId: ubicacion.id,
        descripcion: formData.descripcion || undefined
      })
      
      addToast({
        type: "success",
        title: "Sensor agregado",
        message: "El sensor se ha agregado correctamente con descripción",
      })
      
      setShowAddModal(false)
      resetForm()
      loadSensores()
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudo agregar el sensor",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddMultipleSensores = async () => {
    try {
      setIsSubmitting(true)
      
      const sensoresFiltrados = multipleSensores.filter(s => s.nombre.trim() !== '')
      
      if (sensoresFiltrados.length === 0) {
        addToast({
          type: "error",
          title: "Error",
          message: "Debe agregar al menos un sensor",
        })
        return
      }

      await sensorService.registrarSensoresMultiples({
        sensores: sensoresFiltrados.map(s => ({
          nombre: s.nombre,
          tipo: s.tipo,
          ubicacionId: ubicacion.id,
          descripcion: s.descripcion || undefined
        }))
      })
      
      addToast({
        type: "success",
        title: "Sensores agregados",
        message: `${sensoresFiltrados.length} sensores se han agregado correctamente`,
      })
      
      setShowMultipleModal(false)
      resetMultipleForm()
      loadSensores()
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudieron agregar los sensores",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSensor = (sensor: Sensor) => {
    setEditingSensor(sensor)
    setFormData({
      nombre: sensor.nombre,
      tipo: sensor.tipo,
      descripcion: ''
    })
    setShowEditModal(true)
  }

  const handleUpdateSensor = async () => {
    if (!editingSensor) return

    try {
      setIsSubmitting(true)
      const updateData: UpdateSensorDto = {
        nombre: formData.nombre,
        tipo: formData.tipo
      }
      
      await sensorService.actualizarSensor(editingSensor.id, updateData)
      
      addToast({
        type: "success",
        title: "Sensor actualizado",
        message: "El sensor se ha actualizado correctamente",
      })
      
      setShowEditModal(false)
      setEditingSensor(null)
      resetForm()
      loadSensores()
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudo actualizar el sensor",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleSensorStatus = async (sensor: Sensor) => {
    try {
      await sensorService.actualizarSensor(sensor.id, { activo: !sensor.activo })
      
      addToast({
        type: "success",
        title: "Estado actualizado",
        message: `El sensor se ha ${sensor.activo ? 'desactivado' : 'activado'} correctamente`,
      })
      
      loadSensores()
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudo cambiar el estado del sensor",
      })
    }
  }

  const handleDeleteSensor = async (sensorId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este sensor?')) {
      return
    }

    try {
      await sensorService.eliminarSensor(sensorId)
      addToast({
        type: "success",
        title: "Sensor eliminado",
        message: "El sensor se ha eliminado correctamente",
      })
      loadSensores()
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudo eliminar el sensor",
      })
    }
  }

  const handleSimulateReading = async () => {
    try {
      await sensorService.simularLectura()
      addToast({
        type: "success",
        title: "Lectura simulada",
        message: "Se ha generado una lectura simulada para el sensor",
      })
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudo simular la lectura",
      })
    }
  }

  const handleTipoChange = async (tipo: SensorTipo) => {
    setFormData({ ...formData, tipo })
    
    try {
      const config = await sensorService.getConfiguracionPorDefecto(tipo)
      setConfiguracionActual(config)
    } catch {
      console.warn('No se pudo cargar la configuración del tipo:', tipo)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: SensorTipo.TEMPERATURA,
      descripcion: ''
    })
    setConfiguracionActual(null)
  }

  const resetMultipleForm = () => {
    setMultipleSensores([
      { nombre: '', tipo: SensorTipo.TEMPERATURA, descripcion: '' }
    ])
  }

  const addSensorToMultiple = () => {
    setMultipleSensores([...multipleSensores, { nombre: '', tipo: SensorTipo.TEMPERATURA, descripcion: '' }])
  }

  const removeSensorFromMultiple = (index: number) => {
    if (multipleSensores.length > 1) {
      setMultipleSensores(multipleSensores.filter((_, i) => i !== index))
    }
  }

  const updateMultipleSensor = (index: number, field: string, value: string | number | SensorTipo) => {
    const updated = [...multipleSensores]
    updated[index] = { ...updated[index], [field]: value }
    setMultipleSensores(updated)
  }

  const getSensorIcon = (tipo: SensorTipo) => {
    switch (tipo) {
      case SensorTipo.TEMPERATURA:
        return <Thermometer className="w-4 h-4" />
      case SensorTipo.HUMEDAD:
        return <Droplets className="w-4 h-4" />
      case SensorTipo.PRESION:
        return <Gauge className="w-4 h-4" />
      case SensorTipo.PESO:
        return <Scale className="w-4 h-4" />
      default:
        return <Radio className="w-4 h-4" />
    }
  }

  const getSensorColor = (tipo: SensorTipo) => {
    switch (tipo) {
      case SensorTipo.TEMPERATURA:
        return 'text-red-600 bg-red-100'
      case SensorTipo.HUMEDAD:
        return 'text-blue-600 bg-blue-100'
      case SensorTipo.PRESION:
        return 'text-purple-600 bg-purple-100'
      case SensorTipo.PESO:
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getSensorTypeLabel = (tipo: SensorTipo) => {
    switch (tipo) {
      case SensorTipo.TEMPERATURA:
        return 'Temperatura'
      case SensorTipo.HUMEDAD:
        return 'Humedad'
      case SensorTipo.PRESION:
        return 'Presión'
      case SensorTipo.PESO:
        return 'Peso'
      default:
        return tipo
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sensores de {ubicacion.nombre}</h2>
          <p className="text-gray-600 mt-1">
            Gestiona los sensores instalados en esta ubicación
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowMultipleModal(true)}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            Múltiples
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-[#8E94F2] text-white hover:bg-[#7278e0]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Sensor
          </Button>
        </div>
      </div>

      {/* Lista de Sensores */}
      {isLoading ? (
        <SensorGridSkeleton count={6} />
      ) : sensores.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Radio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay sensores configurados
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza agregando sensores para monitorear esta ubicación
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setShowMultipleModal(true)}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Agregar Múltiples
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-[#8E94F2] text-white hover:bg-[#7278e0]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Sensor
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sensores.map((sensor) => (
            <SensorCard
              key={sensor.id}
              sensor={sensor}
              onViewDetails={(s) => router.push(`/dashboard/sensores/${s.id}`)}
              onEdit={(s) => handleEditSensor(s)}
              onDelete={(id) => handleDeleteSensor(id)}
            />
          ))}
        </div>
      )}

      {/* Modal para Agregar Sensor Simple/Rápido */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Sensor</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Nombre del Sensor</label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Sensor de temperatura 1"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Tipo de Sensor</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => handleTipoChange(e.target.value as SensorTipo)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
                >
                  <option value={SensorTipo.TEMPERATURA}>Temperatura</option>
                  <option value={SensorTipo.HUMEDAD}>Humedad</option>
                  <option value={SensorTipo.PRESION}>Presión</option>
                  <option value={SensorTipo.PESO}>Peso</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Descripción (Opcional)</label>
              <Input
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del sensor"
                className="mt-1"
              />
            </div>

            {/* Configuración automática */}
            {configuracionActual && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Configuración Automática</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Unidad:</span>
                    <p className="text-blue-600">{configuracionActual.unidad}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Rango:</span>
                    <p className="text-blue-600">{configuracionActual.rango.min} - {configuracionActual.rango.max}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Intervalo:</span>
                    <p className="text-blue-600">{configuracionActual.intervalo}s</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Alerta:</span>
                    <p className="text-blue-600">{configuracionActual.umbral_alerta}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddSensorSimple}
              disabled={isSubmitting || !formData.nombre.trim()}
              className="bg-[#8E94F2] text-white hover:bg-[#7278e0]"
            >
              {isSubmitting ? 'Agregando...' : 'Agregar Simple'}
            </Button>
            <Button
              onClick={handleAddSensorRapido}
              disabled={isSubmitting || !formData.nombre.trim()}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isSubmitting ? 'Agregando...' : 'Agregar con Descripción'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Múltiples Sensores */}
      <Dialog open={showMultipleModal} onOpenChange={setShowMultipleModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              Agregar Múltiples Sensores
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-900">Configuración Automática</span>
              </div>
              <p className="text-sm text-green-700">
                Todos los sensores se crearán con configuraciones optimizadas automáticamente.
                Solo necesitas especificar nombre, tipo y descripción opcional.
              </p>
            </div>

            {multipleSensores.map((sensor, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Sensor {index + 1}</h4>
                  {multipleSensores.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSensorFromMultiple(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nombre</label>
                    <Input
                      value={sensor.nombre}
                      onChange={(e) => updateMultipleSensor(index, 'nombre', e.target.value)}
                      placeholder="Nombre del sensor"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipo</label>
                    <select
                      value={sensor.tipo}
                      onChange={(e) => updateMultipleSensor(index, 'tipo', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
                    >
                      <option value={SensorTipo.TEMPERATURA}>Temperatura</option>
                      <option value={SensorTipo.HUMEDAD}>Humedad</option>
                      <option value={SensorTipo.PRESION}>Presión</option>
                      <option value={SensorTipo.PESO}>Peso</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Descripción (Opcional)</label>
                    <Input
                      value={sensor.descripcion}
                      onChange={(e) => updateMultipleSensor(index, 'descripcion', e.target.value)}
                      placeholder="Descripción"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              onClick={addSensorToMultiple}
              variant="outline"
              className="w-full border-dashed border-gray-300 text-gray-600 hover:text-gray-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Otro Sensor
            </Button>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowMultipleModal(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddMultipleSensores}
              disabled={isSubmitting}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isSubmitting ? 'Agregando...' : `Agregar ${multipleSensores.filter(s => s.nombre.trim() !== '').length} Sensores`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Sensor */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Sensor</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Nombre del Sensor</label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Sensor de temperatura 1"
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Tipo de Sensor</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as SensorTipo })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
              >
                <option value={SensorTipo.TEMPERATURA}>Temperatura</option>
                <option value={SensorTipo.HUMEDAD}>Humedad</option>
                <option value={SensorTipo.PRESION}>Presión</option>
                <option value={SensorTipo.PESO}>Peso</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateSensor}
              disabled={isSubmitting || !formData.nombre.trim()}
              className="bg-[#8E94F2] text-white hover:bg-[#7278e0]"
            >
              {isSubmitting ? 'Actualizando...' : 'Actualizar Sensor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 