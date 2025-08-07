'use client'

import { useState, useEffect } from 'react'
import { Sensor, SensorTipo, Ubicacion, CreateSensorDto, UpdateSensorDto } from '@/types/sensor'
import { sensorService, ubicacionService } from '@/lib/services/sensorService'
import { SensorCard } from '@/components/ui/sensor-card'
import { SensorForm } from '@/components/ui/sensor-form'
import { SensorWizard } from '@/components/ui/sensor-wizard'
import { ESP32Wizard } from '@/components/ui/esp32-wizard'
import { ESP32AutoConfig } from '@/components/ui/esp32-auto-config'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SelectAdvanced'
import { 
  Plus, 
  Search, 
  Radio, 
  Thermometer, 
  Droplets, 
  Gauge, 
  Loader2,
  AlertCircle,
  Activity,
  Wifi,
  Cpu,
  Zap
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useServerUser } from '@/context/ServerUserContext'

export default function SensoresPage() {
  // const user = useServerUser() // Comentado temporalmente hasta que se use
  const [sensores, setSensores] = useState<Sensor[]>([])
  const [filteredSensores, setFilteredSensores] = useState<Sensor[]>([])
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTipo, setSelectedTipo] = useState<string>('')
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [showESP32Wizard, setShowESP32Wizard] = useState(false)
  const [showESP32AutoConfig, setShowESP32AutoConfig] = useState(false)
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null)
  const [error, setError] = useState<string>('')
  const { addToast } = useToast()

  // Cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const [sensoresData, ubicacionesData] = await Promise.all([
        sensorService.obtenerSensores(),
        ubicacionService.obtenerUbicaciones()
      ])
      
      setSensores(sensoresData || [])
      setFilteredSensores(sensoresData || [])
      setUbicaciones(ubicacionesData || [])
    } catch (err) {
      setError('Error al cargar los datos')
      console.error('Error loading data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtrar sensores
  useEffect(() => {
    let filtered = sensores

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(sensor =>
        sensor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sensor.ubicacion?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por tipo
    if (selectedTipo) {
      filtered = filtered.filter(sensor => sensor.tipo === selectedTipo)
    }

    // Filtrar por ubicación
    if (selectedUbicacion) {
      filtered = filtered.filter(sensor => sensor.ubicacionId === parseInt(selectedUbicacion))
    }

    setFilteredSensores(filtered)
  }, [searchTerm, selectedTipo, selectedUbicacion, sensores])

  // Manejar creación/edición de sensor
  const handleSubmit = async (data: CreateSensorDto | UpdateSensorDto) => {
    try {
      setIsSubmitting(true)
      setError('')

      if (editingSensor) {
        await sensorService.actualizarSensor(editingSensor.id, data as UpdateSensorDto)
        addToast({
          type: "success",
          title: "Sensor actualizado",
          message: "El sensor se ha actualizado correctamente",
        })
      } else {
        await sensorService.registrarSensor(data as CreateSensorDto)
        addToast({
          type: "success",
          title: "Sensor creado",
          message: "El sensor se ha creado correctamente",
        })
      }

      setShowForm(false)
      setEditingSensor(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el sensor')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar eliminación de sensor
  const handleDelete = async (sensorId: number) => {
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
      await loadData()
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudo eliminar el sensor",
      })
    }
  }

  // Manejar simulación de lectura
  // const handleSimulateReading = async (sensorId?: number) => {
  //   try {
  //     await sensorService.simularLectura(sensorId)
  //     addToast({
  //       type: "success",
  //       title: "Lectura simulada",
  //       message: "Se ha generado una lectura de prueba",
  //     })
  //   } catch {
  //     addToast({
  //       type: "error",
  //       title: "Error",
  //       message: "No se pudo simular la lectura",
  //     })
  //   }
  // }

  // Manejar edición
  const handleEdit = (sensor: Sensor) => {
    setEditingSensor(sensor)
    setShowForm(true)
  }

  // Manejar creación
  const handleCreate = () => {
    setEditingSensor(null)
    setShowForm(true)
  }



  // Estadísticas
  const stats = {
    total: sensores.length,
    activos: sensores.filter(s => s.activo).length,
    porTipo: {
      [SensorTipo.TEMPERATURA]: sensores.filter(s => s.tipo === SensorTipo.TEMPERATURA).length,
      [SensorTipo.HUMEDAD]: sensores.filter(s => s.tipo === SensorTipo.HUMEDAD).length,
      [SensorTipo.PRESION]: sensores.filter(s => s.tipo === SensorTipo.PRESION).length,
      [SensorTipo.PESO]: sensores.filter(s => s.tipo === SensorTipo.PESO).length,
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sensores</h1>
          <p className="text-gray-600">Gestiona los sensores de tu empresa</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowESP32AutoConfig(true)} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="w-4 h-4" />
            Configuración Automática ESP32
          </Button>
          <Button 
            onClick={() => setShowESP32Wizard(true)} 
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Cpu className="w-4 h-4" />
            ESP32 Manual
          </Button>
          <Button 
            onClick={() => setShowWizard(true)} 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Wifi className="w-4 h-4" />
            Sensor Individual
          </Button>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Sensor
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Sensores</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Sensores Activos</p>
                <p className="text-2xl font-bold">{stats.activos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Temperatura</p>
                <p className="text-2xl font-bold">{stats.porTipo[SensorTipo.TEMPERATURA]}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Humedad</p>
                <p className="text-2xl font-bold">{stats.porTipo[SensorTipo.HUMEDAD]}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Presión/Peso</p>
                <p className="text-2xl font-bold">
                  {stats.porTipo[SensorTipo.PRESION] + stats.porTipo[SensorTipo.PESO]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar sensores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <Select value={selectedTipo} onValueChange={setSelectedTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los tipos</SelectItem>
                <SelectItem value={SensorTipo.TEMPERATURA}>Temperatura</SelectItem>
                <SelectItem value={SensorTipo.HUMEDAD}>Humedad</SelectItem>
                <SelectItem value={SensorTipo.PRESION}>Presión</SelectItem>
                <SelectItem value={SensorTipo.PESO}>Peso</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedUbicacion} onValueChange={setSelectedUbicacion}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las ubicaciones</SelectItem>
                {ubicaciones.map((ubicacion) => (
                  <SelectItem key={ubicacion.id} value={ubicacion.id.toString()}>
                    {ubicacion.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de sensores */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Cargando sensores...</span>
        </div>
      ) : filteredSensores.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Radio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || selectedTipo || selectedUbicacion ? 'No se encontraron sensores' : 'No hay sensores'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedTipo || selectedUbicacion 
                ? 'Intenta con otros filtros de búsqueda'
                : 'Crea tu primer sensor para comenzar'
              }
            </p>
            {!searchTerm && !selectedTipo && !selectedUbicacion && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Sensor
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSensores.map((sensor) => (
            <SensorCard
              key={sensor.id}
              sensor={sensor}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewDetails={(sensor) => {
                // Aquí podrías navegar a una página de detalles del sensor
                console.log('Ver detalles del sensor:', sensor)
              }}
            />
          ))}
        </div>
      )}

      {/* Modal de formulario */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSensor ? 'Editar Sensor' : 'Nuevo Sensor'}
            </DialogTitle>
          </DialogHeader>
          <SensorForm
            sensor={editingSensor}
            ubicaciones={ubicaciones}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false)
              setEditingSensor(null)
            }}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de wizard MQTT */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Sensor Individual con MQTT</DialogTitle>
          </DialogHeader>
          <SensorWizard
            ubicaciones={ubicaciones}
            onComplete={() => {
              setShowWizard(false)
              loadData() // Recargar datos
              addToast({
                title: 'Sensor creado exitosamente',
                message: 'El sensor se ha configurado con MQTT',
                type: 'success'
              })
            }}
            onCancel={() => setShowWizard(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de wizard ESP32 */}
      <Dialog open={showESP32Wizard} onOpenChange={setShowESP32Wizard}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar ESP32 con Múltiples Sensores</DialogTitle>
          </DialogHeader>
          <ESP32Wizard
            ubicaciones={ubicaciones}
            onComplete={(result) => {
              setShowESP32Wizard(false)
              loadData() // Recargar datos
              addToast({
                title: 'ESP32 configurado exitosamente',
                message: `Sensores creados y configurados exitosamente`,
                type: 'success'
              })
            }}
            onCancel={() => setShowESP32Wizard(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de configuración automática ESP32 */}
      <Dialog open={showESP32AutoConfig} onOpenChange={setShowESP32AutoConfig}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuración Automática ESP32</DialogTitle>
          </DialogHeader>
          <ESP32AutoConfig
            ubicaciones={ubicaciones}
            onComplete={() => {
              setShowESP32AutoConfig(false)
              loadData() // Recargar datos
              addToast({
                title: 'Configuración generada exitosamente',
                message: 'Tu ESP32 se configurará automáticamente',
                type: 'success'
              })
            }}
            onCancel={() => setShowESP32AutoConfig(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 