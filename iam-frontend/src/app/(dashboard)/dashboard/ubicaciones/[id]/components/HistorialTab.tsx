'use client'

import { useState, useEffect, useCallback } from 'react'
import { Ubicacion, Sensor, SensorLectura, SensorTipo, SensorFilters } from '@/types/sensor'
import { sensorService } from '@/lib/services/sensorService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import  Button  from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  History, 
  BarChart3, 
  Download, 
  Filter,
  Thermometer,
  Droplets,
  Gauge,
  Scale,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface HistorialTabProps {
  ubicacion: Ubicacion
}

export function HistorialTab({ ubicacion }: HistorialTabProps) {
  const [sensores, setSensores] = useState<Sensor[]>([])
  const [lecturas, setLecturas] = useState<SensorLectura[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtros, setFiltros] = useState<SensorFilters>({
    limite: 100
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSensor, setSelectedSensor] = useState<number | undefined>()
  const { addToast } = useToast()

  const loadSensores = useCallback(async () => {
    try {
      const data = await sensorService.obtenerSensores(ubicacion.id)
      setSensores(data)
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudieron cargar los sensores",
      })
    }
  }, [ubicacion.id, addToast])

  const loadLecturas = useCallback(async () => {
    try {
      setIsLoading(true)
      // Forzar a filtrar por esta ubicación para coherencia de historial local
      const data = await sensorService.obtenerLecturas({ ...filtros })
      // Filtrar por ubicación en cliente para asegurar coherencia
      setLecturas(Array.isArray(data) ? data.filter(l => l.ubicacionId === ubicacion.id) : [])
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudieron cargar las lecturas",
      })
    } finally {
      setIsLoading(false)
    }
  }, [filtros, addToast, ubicacion.id])

  useEffect(() => {
    loadSensores()
  }, [loadSensores])

  useEffect(() => {
    loadLecturas()
  }, [loadLecturas])



  const handleFilterChange = (key: keyof SensorFilters, value: string | number | undefined) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleClearFilters = () => {
    setFiltros({
      limite: 100
    })
    setSelectedSensor(undefined)
  }

  const handleExportData = () => {
    const csvContent = generateCSV()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `lecturas_${ubicacion.nombre}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateCSV = () => {
    const headers = ['ID', 'Sensor', 'Tipo', 'Valor', 'Unidad', 'Fecha', 'Ubicación']
    const rows = lecturas.map(lectura => [
      lectura.id,
      lectura.sensor?.nombre || `Sensor ${lectura.sensorId}`,
      getSensorTypeLabel(lectura.tipo),
      lectura.valor,
      lectura.unidad,
      new Date(lectura.fecha).toLocaleString('es-ES'),
      ubicacion.nombre
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
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
        return <BarChart3 className="w-4 h-4" />
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

  const formatValue = (lectura: SensorLectura) => {
    const valor = lectura.valor.toFixed(2)
    const unidad = lectura.unidad || 'N/A'
    return `${valor} ${unidad}`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const filteredLecturas = selectedSensor 
    ? lecturas.filter(lectura => lectura.sensorId === selectedSensor)
    : lecturas

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Historial de Lecturas</h2>
          <p className="text-gray-600 mt-1">
            Historial de lecturas y eventos de los sensores de {ubicacion.nombre}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Button
            variant="outline"
            onClick={loadLecturas}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          <Button
            onClick={handleExportData}
            className="bg-[#8E94F2] text-white hover:bg-[#7278e0]"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Sensor</label>
                <select
                  value={selectedSensor || ''}
                  onChange={(e) => setSelectedSensor(e.target.value ? Number(e.target.value) : undefined)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
                >
                  <option value="">Todos los sensores</option>
                  {sensores.map(sensor => (
                    <option key={sensor.id} value={sensor.id}>
                      {sensor.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Tipo de Sensor</label>
                <select
                  value={filtros.tipo || ''}
                  onChange={(e) => handleFilterChange('tipo', e.target.value || undefined)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
                >
                  <option value="">Todos los tipos</option>
                  <option value={SensorTipo.TEMPERATURA}>Temperatura</option>
                  <option value={SensorTipo.HUMEDAD}>Humedad</option>
                  <option value={SensorTipo.PRESION}>Presión</option>
                  <option value={SensorTipo.PESO}>Peso</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Desde</label>
                <Input
                  type="datetime-local"
                  value={filtros.desde || ''}
                  onChange={(e) => handleFilterChange('desde', e.target.value || undefined)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Hasta</label>
                <Input
                  type="datetime-local"
                  value={filtros.hasta || ''}
                  onChange={(e) => handleFilterChange('hasta', e.target.value || undefined)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {filteredLecturas.length} lecturas encontradas
              </div>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="text-sm"
              >
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de lecturas */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Skeleton className="h-5 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={`hist-skel-${i}`} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredLecturas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay lecturas disponibles
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedSensor || filtros.tipo || filtros.desde || filtros.hasta
                ? 'No se encontraron lecturas con los filtros aplicados'
                : 'No hay lecturas registradas para esta ubicación'
              }
            </p>
            {(selectedSensor || filtros.tipo || filtros.desde || filtros.hasta) && (
              <Button
                onClick={handleClearFilters}
                className="bg-[#8E94F2] text-white hover:bg-[#7278e0]"
              >
                Limpiar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#8E94F2]" />
              Historial de Lecturas
              <span className="text-sm font-normal text-gray-500">
                ({filteredLecturas.length} registros)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLecturas.map((lectura) => (
                <div key={lectura.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getSensorColor(lectura.tipo)}`}>
                      {getSensorIcon(lectura.tipo)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {lectura.sensor?.nombre || `Sensor ${lectura.sensorId}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getSensorTypeLabel(lectura.tipo)} • ID: #{lectura.id}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-lg text-gray-900">
                      {formatValue(lectura)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDateTime(lectura.fecha)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 