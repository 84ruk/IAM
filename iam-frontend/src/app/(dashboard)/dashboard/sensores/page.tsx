'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sensor, SensorTipo, Ubicacion, CreateSensorDto, UpdateSensorDto } from '@/types/sensor'
import { sensorService, ubicacionService } from '@/lib/services/sensorService'
import { SensorCard } from '@/components/ui/sensor-card'
import { SensorForm } from '@/components/ui/sensor-form'
import { SensorWizard } from '@/components/ui/sensor-wizard'
import { ESP32Wizard } from '@/components/ui/esp32-wizard'
import { ESP32AutoConfig } from '@/components/ui/esp32-auto-config'
import { ESP32LecturasPeriodicasConfig } from '@/components/ui/esp32-lecturas-periodicas-config'
import { SensorUmbralesConfig } from '@/components/ui/sensor-umbrales-config'
import { SensoresTiempoReal } from '@/components/ui/sensores-tiempo-real'
import { SensorCardSkeleton, SensorGridSkeleton, SensorStatsSkeleton } from '@/components/ui/sensor-skeleton'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SelectAdvanced'
import { Skeleton } from '@/components/ui/Skeleton'
import { 
  Plus, 
  Search, 
  MapPin, 
  Radio, 
  Thermometer, 
  Droplets, 
  Gauge, 
  AlertCircle,
  Activity,
  Wifi,
  Cpu,
  Zap
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function SensoresPage() {
  const router = useRouter()
  const [sensores, setSensores] = useState<Sensor[]>([])
  const [filteredSensores, setFilteredSensores] = useState<Sensor[]>([])
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTipo, setSelectedTipo] = useState<string>('')
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('')
  const [estadoFilter, setEstadoFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos')
  const [showForm, setShowForm] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [showESP32Wizard, setShowESP32Wizard] = useState(false)
  const [showESP32AutoConfig, setShowESP32AutoConfig] = useState(false)
  const [showESP32LecturasPeriodicas, setShowESP32LecturasPeriodicas] = useState(false)
  const [showUmbralesConfig, setShowUmbralesConfig] = useState(false)
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null)
  const [error, setError] = useState<string>('')
  const { addToast } = useToast()

    // Función para determinar si una card debe mostrar pulse
  const shouldPulse = (value: number) => value > 0

  console.log('🔍 Estado actual del componente:', { 
    isLoading, 
    sensoresLength: sensores.length, 
    filteredLength: filteredSensores.length,
    ubicacionesLength: ubicaciones.length 
  })

  // Cargar datos
  const loadData = async () => {
    try {
      console.log('🔄 Iniciando carga de datos...')
      setIsLoading(true)
      setError('')
      
      console.log('📡 Llamando a sensorService.obtenerSensores()...')
      let sensoresData: Sensor[] = []
      try {
        sensoresData = await sensorService.obtenerSensores()
        console.log('✅ sensorService.obtenerSensores() completado:', sensoresData)
      } catch (error) {
        console.error('❌ Error en sensorService.obtenerSensores():', error)
        sensoresData = []
      }
      
      console.log('📡 Llamando a ubicacionService.obtenerUbicaciones()...')
      let ubicacionesData: Ubicacion[] = []
      try {
        ubicacionesData = await ubicacionService.obtenerUbicaciones()
        console.log('✅ ubicacionService.obtenerUbicaciones() completado:', ubicacionesData)
      } catch (error) {
        console.error('❌ Error en ubicacionService.obtenerUbicaciones():', error)
        ubicacionesData = []
      }
      
      console.log('📊 Datos recibidos:', { 
        sensores: sensoresData?.length || 0, 
        ubicaciones: ubicacionesData?.length || 0,
        sensoresData: sensoresData,
        ubicacionesData: ubicacionesData
      })
      
      setSensores(sensoresData || [])
      setUbicaciones(ubicacionesData || [])
      setFilteredSensores(sensoresData || [])
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error)
      setError('Error cargando datos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtrar sensores
  useEffect(() => {
    // Solo ejecutar el filtrado si no estamos cargando y hay sensores
    if (isLoading || sensores.length === 0) {
      console.log('🔍 Filtrado omitido - isLoading:', isLoading, 'sensores.length:', sensores.length)
      return
    }
    
    console.log('🔍 useEffect de filtrado ejecutándose:', { 
      sensoresLength: sensores.length, 
      searchTerm, 
      selectedTipo, 
      selectedUbicacion, 
      estadoFilter 
    })
    
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

    // Filtrar por estado
    if (estadoFilter !== 'todos') {
      const activos = estadoFilter === 'activos'
      filtered = filtered.filter(sensor => sensor.activo === activos)
    }

    console.log('🔍 Filtrado completado:', { 
      originalLength: sensores.length, 
      filteredLength: filtered.length 
    })
    
    setFilteredSensores(filtered)
  }, [searchTerm, selectedTipo, selectedUbicacion, estadoFilter, sensores, isLoading])

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

  const handleConfigurarUmbrales = (sensor: Sensor) => {
    // setSelectedSensorForUmbrales(sensor) // This variable was removed
    setShowUmbralesConfig(true)
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
    <div className="min-h-screen">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sensores</h1>
          <p className="text-gray-600">Gestiona los sensores de tu empresa</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowUmbralesConfig(true)} 
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
            disabled={!sensores.length}
          >
            <AlertCircle className="w-4 h-4" />
            Configurar Umbrales
          </Button>
          <Button 
            onClick={() => setShowESP32LecturasPeriodicas(true)} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="w-4 h-4" />
            ESP32 Lecturas Periódicas
          </Button>
          <Button 
            onClick={() => setShowESP32AutoConfig(true)} 
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700" disabled
            title="Modo legacy (deshabilitado)"
          >
            <Cpu className="w-4 h-4" />
            ESP32 MQTT (Legacy)
          </Button>
          <Button 
            onClick={() => {}}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700" disabled
            title="Crear sensor individual (deshabilitado)"
          >
            <Wifi className="w-4 h-4" />
            Sensor Individual
          </Button>
          <Button onClick={() => {}} className="flex items-center gap-2" disabled title="Nuevo sensor (deshabilitado)">
            <Plus className="w-4 h-4" />
            Nuevo Sensor
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      {isLoading ? (
        <SensorStatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className={`hover:shadow-md transition-all duration-300 hover:scale-105 ${shouldPulse(stats.total) ? 'sensor-card-pulse' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${shouldPulse(stats.total) ? 'bg-blue-100' : 'bg-blue-50'}`}>
                  <Radio className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Sensores</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`hover:shadow-md transition-all duration-300 hover:scale-105 ${shouldPulse(stats.activos) ? 'sensor-card-pulse' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${shouldPulse(stats.activos) ? 'bg-green-100' : 'bg-green-50'}`}>
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sensores Activos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`hover:shadow-md transition-all duration-300 hover:scale-105 ${shouldPulse(stats.porTipo[SensorTipo.TEMPERATURA]) ? 'sensor-card-pulse' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${shouldPulse(stats.porTipo[SensorTipo.TEMPERATURA]) ? 'bg-red-100' : 'bg-red-50'}`}>
                  <Thermometer className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Temperatura</p>
                  <p className="text-2xl font-bold text-red-600">{stats.porTipo[SensorTipo.TEMPERATURA]}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`hover:shadow-md transition-all duration-300 hover:scale-105 ${shouldPulse(stats.porTipo[SensorTipo.HUMEDAD]) ? 'sensor-card-pulse' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${shouldPulse(stats.porTipo[SensorTipo.HUMEDAD]) ? 'bg-blue-100' : 'bg-blue-50'}`}>
                  <Droplets className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Humedad</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.porTipo[SensorTipo.HUMEDAD]}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`hover:shadow-md transition-all duration-300 hover:scale-105 ${shouldPulse(stats.porTipo[SensorTipo.PRESION] + stats.porTipo[SensorTipo.PESO]) ? 'sensor-card-pulse' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${shouldPulse(stats.porTipo[SensorTipo.PRESION] + stats.porTipo[SensorTipo.PESO]) ? 'bg-purple-100' : 'bg-purple-50'}`}>
                  <Gauge className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Presión/Peso</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.porTipo[SensorTipo.PRESION] + stats.porTipo[SensorTipo.PESO]}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

            <Select value={estadoFilter} onValueChange={(v) => setEstadoFilter(v as 'todos' | 'activos' | 'inactivos')}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="inactivos">Inactivos</SelectItem>
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
        <div className="space-y-6">
          {/* Skeleton para estadísticas */}
          <SensorStatsSkeleton />
          
          {/* Skeleton para filtros */}
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full bg-gray-200" />
                <Skeleton className="h-10 w-full bg-gray-200" />
                <Skeleton className="h-10 w-full bg-gray-200" />
                <Skeleton className="h-10 w-full bg-gray-200" />
              </div>
            </CardContent>
          </Card>
          
          {/* Skeleton para tarjetas de sensores */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32 bg-gray-200" />
              <Skeleton className="h-8 w-24 bg-gray-200" />
            </div>
            <SensorGridSkeleton count={6} />
          </div>
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
              onViewDetails={() => router.push(`/dashboard/sensores/${sensor.id}`)}
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

      {/* Modal de ESP32 Lecturas Periódicas */}
      {showESP32LecturasPeriodicas && (
        <ESP32LecturasPeriodicasConfig
          ubicaciones={ubicaciones}
          onComplete={() => {
            setShowESP32LecturasPeriodicas(false)
            loadData()
            addToast({
              title: 'Código generado exitosamente',
              message: 'Tu código Arduino y configuración están listos',
              type: 'success'
            })
          }}
          onCancel={() => setShowESP32LecturasPeriodicas(false)}
        />
      )}

      {/* Modal de configuración de umbrales */}
      <Dialog open={showUmbralesConfig} onOpenChange={setShowUmbralesConfig}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuración de Umbrales y Alertas</DialogTitle>
          </DialogHeader>
          <SensorUmbralesConfig
            sensores={sensores}
            onComplete={() => {
              setShowUmbralesConfig(false)
              // setSelectedSensorForUmbrales(null) // This variable was removed
              addToast({
                title: 'Umbrales configurados exitosamente',
                message: 'La configuración de alertas se ha guardado',
                type: 'success'
              })
            }}
            onCancel={() => {
              setShowUmbralesConfig(false)
              // setSelectedSensorForUmbrales(null) // This variable was removed
            }}
          />
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
} 