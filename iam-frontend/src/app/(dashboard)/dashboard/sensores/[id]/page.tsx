"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { sensorService } from '@/lib/services/sensorService'
import { Sensor, SensorLectura } from '@/types/sensor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { ArrowLeft, Activity } from 'lucide-react'
import { useSensoresWebSocket } from '@/hooks/useSensoresWebSocket'
import { Skeleton } from '@/components/ui/Skeleton'

// Tipo para lecturas en tiempo real que incluya el estado
type LecturaTiempoReal = SensorLectura & {
  estado: 'NORMAL' | 'ALERTA' | 'CRITICO'
}

// Tipo para lecturas históricas que pueda tener estado opcional
type LecturaHistorica = SensorLectura & {
  estado?: 'NORMAL' | 'ALERTA' | 'CRITICO'
}

export default function SensorDetallePage() {
  const params = useParams<{ id: string }>()
  const sensorId = Number(params?.id)

  const [sensor, setSensor] = useState<Sensor | null>(null)
  const [lecturas, setLecturas] = useState<LecturaHistorica[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { connect, subscribeToSensor, sensorReadings, isConnected, latestAlert } = useSensoresWebSocket()

  useEffect(() => {
    (async () => {
      try {
        const s = await sensorService.obtenerSensor(sensorId)
        setSensor(s)
        // lecturas históricas del sensor
        const historicas = await sensorService.obtenerLecturas({ limite: 100, tipo: s.tipo, sensorId })
        setLecturas(historicas)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [sensorId])

  useEffect(() => {
    (async () => {
      const ok = await connect()
      if (ok) subscribeToSensor(sensorId)
    })()
  }, [connect, subscribeToSensor, sensorId])

  const lecturasTiempoReal = useMemo(() => {
    const list = sensorReadings.filter(r => r.sensorId === sensorId)
    if (!list.length) return [] as LecturaTiempoReal[]
    return list.map((r, idx) => ({
      ...r,
      id: r.id ?? Number(`${r.sensorId}${idx}`),
      fecha: r.fecha instanceof Date ? r.fecha.toISOString() : new Date(r.fecha).toISOString(),
      empresaId: sensor?.empresaId || 0,
      estado: r.estado
    })) as LecturaTiempoReal[]
  }, [sensorReadings, sensorId, sensor?.empresaId])

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-7 w-48" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => history.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
            <h1 className="text-2xl font-bold text-gray-900">Detalle del Sensor</h1>
        </div>
        {sensor && (
          <Badge className={sensor.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
            {sensor.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        )}
        </div>

        {sensor && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">{sensor.nombre}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            {/* Selector de sensor de misma ubicación eliminado por solicitud */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tipo</p>
                <p className="font-medium">{sensor.tipo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ubicación</p>
                <p className="font-medium">{sensor.ubicacion?.nombre || sensor.ubicacionId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ID</p>
                <p className="font-medium">{sensor.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Activity className={`w-4 h-4 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
              {isConnected ? 'Conectado a tiempo real' : 'Desconectado'}
            </div>
              {latestAlert && latestAlert.sensorId === sensorId && (
                <div className="rounded-xl p-3 bg-orange-50 text-orange-700 text-sm flex items-center justify-between">
                  <span className="font-medium">{latestAlert.severidad || 'ALERTA'}</span>
                  <span className="truncate mx-3">{latestAlert.mensaje || 'Condición fuera de umbral'}</span>
                  <span>{latestAlert.fecha ? new Date(latestAlert.fecha).toLocaleTimeString() : ''}</span>
                </div>
              )}

            {/* Última lectura resumida */}
            {(() => {
              const ultimaLectura = lecturasTiempoReal[0] || lecturas[0]
              if (!ultimaLectura) return null
              
              return (
                <div className="rounded-xl p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <p className="text-sm text-blue-600 mb-2 font-medium">Última lectura</p>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-blue-900">
                      {ultimaLectura.valor} {ultimaLectura.unidad}
                    </div>
                    <div className="text-sm text-blue-600">
                      {new Date(ultimaLectura.fecha).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge 
                      variant={ultimaLectura.estado === 'NORMAL' ? 'secondary' : 'default'}
                      className={ultimaLectura.estado === 'NORMAL' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                    >
                      {ultimaLectura.estado || 'NORMAL'}
                    </Badge>
                  </div>
                </div>
              )
            })()}

              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    Lecturas en Tiempo Real
                  </h2>
                  <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                    {lecturasTiempoReal.length} lecturas
                  </Badge>
                </div>
                
                {lecturasTiempoReal.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                      <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm">Esperando lecturas en tiempo real...</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Las lecturas aparecerán aquí automáticamente</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lecturasTiempoReal.slice(0, 20).map((l, idx) => (
                      <div key={l.id ?? `${l.sensorId}-${l.fecha}-${idx}`} className="rounded-xl p-4 text-sm bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-gray-900 text-lg">{l.valor} {l.unidad}</div>
                          <Badge 
                            variant={l.estado === 'NORMAL' ? 'secondary' : 'default'}
                            className={l.estado === 'NORMAL' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                          >
                            {l.estado}
                          </Badge>
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(l.fecha).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-600" />
                    Histórico de Lecturas
                  </h2>
                  <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50">
                    {lecturas.length} lecturas
                  </Badge>
                </div>
                
                {lecturas.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                      <span className="inline-block w-3 h-3 bg-gray-400 rounded-full animate-pulse" />
                      <span className="text-sm">Sin lecturas históricas para este sensor</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Las lecturas históricas aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lecturas.slice(0, 20).map((l, idx) => (
                      <div key={l.id ?? `${l.sensorId}-${l.fecha}-${idx}`} className="rounded-xl p-4 text-sm bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-gray-900 text-lg">{l.valor} {l.unidad}</div>
                          <Badge 
                            variant={l.estado === 'NORMAL' ? 'secondary' : 'default'}
                            className={l.estado === 'NORMAL' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                          >
                            {l.estado || 'NORMAL'}
                          </Badge>
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(l.fecha).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


