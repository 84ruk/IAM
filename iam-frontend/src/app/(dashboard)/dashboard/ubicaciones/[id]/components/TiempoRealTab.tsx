'use client'

import { useState, useEffect } from 'react'
import { Ubicacion, Sensor, SensorLectura, SensorTipo } from '@/types/sensor'
import { sensorService } from '@/lib/services/sensorService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import  Button  from '@/components/ui/Button'
import { Activity, Thermometer, Droplets, Gauge, Scale, RefreshCw, Play, Pause } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface TiempoRealTabProps {
  ubicacion: Ubicacion
}

export function TiempoRealTab({ ubicacion }: TiempoRealTabProps) {
  const [sensores, setSensores] = useState<Sensor[]>([])
  const [lecturas, setLecturas] = useState<SensorLectura[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const { addToast } = useToast()

  useEffect(() => {
    loadSensores()
    loadLecturas()
  }, [ubicacion.id])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isLive) {
      interval = setInterval(() => {
        loadLecturas()
        setLastUpdate(new Date())
      }, 5000) // Actualizar cada 5 segundos
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isLive, ubicacion.id])

  const loadSensores = async () => {
    try {
      const data = await sensorService.obtenerSensores(ubicacion.id)
      setSensores(data.filter(sensor => sensor.activo))
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudieron cargar los sensores",
      })
    }
  }

  const loadLecturas = async () => {
    try {
      const data = await sensorService.obtenerLecturas({
        limite: 50 // Obtener las últimas 50 lecturas
      })
      setLecturas(data)
      setIsLoading(false)
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudieron cargar las lecturas",
      })
    }
  }

  const handleRefresh = () => {
    loadLecturas()
    setLastUpdate(new Date())
  }

  const handleSimulateReading = async () => {
    try {
      await sensorService.simularLectura()
      addToast({
        type: "success",
        title: "Lectura simulada",
        message: "Se ha generado una nueva lectura simulada",
      })
      loadLecturas()
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "No se pudo simular la lectura",
      })
    }
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
        return <Scale className="w-5 h-5" />
      default:
        return <Activity className="w-5 h-5" />
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getLatestReading = (sensorId: number) => {
    return lecturas
      .filter(lectura => lectura.sensorId === sensorId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Monitoreo en Tiempo Real</h2>
            <p className="text-gray-600 mt-1">
              Visualización en tiempo real de los sensores de {ubicacion.nombre}
            </p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8E94F2] mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando datos en tiempo real...</p>
        </div>
      </div>
    )
  }

  if (sensores.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Monitoreo en Tiempo Real</h2>
            <p className="text-gray-600 mt-1">
              Visualización en tiempo real de los sensores de {ubicacion.nombre}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay sensores activos
            </h3>
            <p className="text-gray-600 mb-4">
              Agrega sensores activos para comenzar el monitoreo en tiempo real
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Monitoreo en Tiempo Real</h2>
          <p className="text-gray-600 mt-1">
            Visualización en tiempo real de los sensores de {ubicacion.nombre}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          <Button
            variant={isLive ? "default" : "outline"}
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 ${isLive ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isLive ? 'En Vivo' : 'Activar'}
          </Button>
          <Button
            onClick={handleSimulateReading}
            className="bg-[#8E94F2] text-white hover:bg-[#7278e0]"
          >
            <Activity className="w-4 h-4 mr-2" />
            Simular Lectura
          </Button>
        </div>
      </div>

      {/* Estado de conexión */}
      {isLive && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-700 text-sm font-medium">
            Conectado en tiempo real - Actualizando automáticamente
          </span>
        </div>
      )}

      {/* Sensores en tiempo real */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sensores.map((sensor) => {
          const latestReading = getLatestReading(sensor.id)
          
          return (
            <Card key={sensor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getSensorColor(sensor.tipo)}`}>
                    {getSensorIcon(sensor.tipo)}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {latestReading ? formatTime(latestReading.fecha) : 'Sin datos'}
                    </div>
                    <div className="text-xs text-gray-400">
                      ID: #{sensor.id}
                    </div>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">{sensor.nombre}</h3>
                <p className="text-sm text-gray-600 mb-4">{getSensorTypeLabel(sensor.tipo)}</p>
                
                {latestReading ? (
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {formatValue(latestReading)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Última lectura
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center">
                      Sensor activo • Lecturas recibidas
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-400 text-lg font-medium">
                      Sin lecturas
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Esperando datos del sensor
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Historial de lecturas recientes */}
      {lecturas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#8E94F2]" />
              Lecturas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {lecturas.slice(0, 10).map((lectura) => (
                <div key={lectura.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getSensorColor(lectura.tipo)}`}>
                      {getSensorIcon(lectura.tipo)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {lectura.sensor?.nombre || `Sensor ${lectura.sensorId}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getSensorTypeLabel(lectura.tipo)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatValue(lectura)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(lectura.fecha)}
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