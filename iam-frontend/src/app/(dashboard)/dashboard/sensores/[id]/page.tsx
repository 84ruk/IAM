"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { sensorService } from '@/lib/services/sensorService'
import { SensorLectura } from '@/types/sensor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { ArrowLeft, Activity, Bell, Settings } from 'lucide-react'
import { useSensoresWebSocket } from '@/hooks/useSensoresWebSocket'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { ConfiguracionAlertas } from '@/components/sensores/ConfiguracionAlertas'
import { ConfiguracionTab } from '@/components/sensores/ConfiguracionTab'
  
// Tipo para lecturas en tiempo real que incluya el estado
type LecturaTiempoReal = SensorLectura & {
  estado: 'NORMAL' | 'ALERTA' | 'CRITICO'
}

// Tipo para lecturas históricas que pueda tener estado opcional
type LecturaHistorica = SensorLectura & {
  estado?: 'NORMAL' | 'ALERTA' | 'CRITICO'
}

// Tipos extendidos de sensor para el nuevo sistema de alertas
interface UmbralesSensor {
  min?: number
  max?: number
}

interface Sensor {
  id: number
  nombre: string
  tipo: 'TEMPERATURA' | 'HUMEDAD' | 'PESO' | 'PRESION'
  ubicacionId: number
  ubicacion?: {
    nombre: string
  }
  activo: boolean
  umbrales?: UmbralesSensor
  empresaId: number
  configuracion?: Record<string, unknown> | undefined
}

// Función para mapear la configuración general a la estructura de umbrales
type UmbralesMap = {
  humedadMin?: number;
  humedadMax?: number;
  temperaturaMin?: number;
  temperaturaMax?: number;
  pesoMin?: number;
  pesoMax?: number;
  presionMin?: number;
  presionMax?: number;
  intervaloVerificacionMinutos?: number;
};
function mapConfigToUmbrales(sensor: Sensor | null): Partial<UmbralesMap> | undefined {
  if (!sensor?.configuracion) return undefined;
  const c = sensor.configuracion as Record<string, unknown>;
  switch (sensor.tipo) {
    case 'HUMEDAD':
      return {
        humedadMin: typeof c.rango_min === 'number' ? c.rango_min : typeof (c.umbrales as Record<string, unknown> | undefined)?.humedadMin === 'number' ? (c.umbrales as Record<string, unknown>).humedadMin as number : undefined,
        humedadMax: typeof c.rango_max === 'number' ? c.rango_max : typeof (c.umbrales as Record<string, unknown> | undefined)?.humedadMax === 'number' ? (c.umbrales as Record<string, unknown>).humedadMax as number : undefined,
        intervaloVerificacionMinutos: typeof c.intervalo_lectura === 'number' ? Math.round((c.intervalo_lectura as number) / 60000) : undefined,
      };
    case 'TEMPERATURA':
      return {
        temperaturaMin: typeof c.rango_min === 'number' ? c.rango_min : typeof (c.umbrales as Record<string, unknown> | undefined)?.temperaturaMin === 'number' ? (c.umbrales as Record<string, unknown>).temperaturaMin as number : undefined,
        temperaturaMax: typeof c.rango_max === 'number' ? c.rango_max : typeof (c.umbrales as Record<string, unknown> | undefined)?.temperaturaMax === 'number' ? (c.umbrales as Record<string, unknown>).temperaturaMax as number : undefined,
        intervaloVerificacionMinutos: typeof c.intervalo_lectura === 'number' ? Math.round((c.intervalo_lectura as number) / 60000) : undefined,
      };
    case 'PESO':
      return {
        pesoMin: typeof c.rango_min === 'number' ? c.rango_min : typeof (c.umbrales as Record<string, unknown> | undefined)?.pesoMin === 'number' ? (c.umbrales as Record<string, unknown>).pesoMin as number : undefined,
        pesoMax: typeof c.rango_max === 'number' ? c.rango_max : typeof (c.umbrales as Record<string, unknown> | undefined)?.pesoMax === 'number' ? (c.umbrales as Record<string, unknown>).pesoMax as number : undefined,
        intervaloVerificacionMinutos: typeof c.intervalo_lectura === 'number' ? Math.round((c.intervalo_lectura as number) / 60000) : undefined,
      };
    case 'PRESION':
      return {
        presionMin: typeof c.rango_min === 'number' ? c.rango_min : typeof (c.umbrales as Record<string, unknown> | undefined)?.presionMin === 'number' ? (c.umbrales as Record<string, unknown>).presionMin as number : undefined,
        presionMax: typeof c.rango_max === 'number' ? c.rango_max : typeof (c.umbrales as Record<string, unknown> | undefined)?.presionMax === 'number' ? (c.umbrales as Record<string, unknown>).presionMax as number : undefined,
        intervaloVerificacionMinutos: typeof c.intervalo_lectura === 'number' ? Math.round((c.intervalo_lectura as number) / 60000) : undefined,
      };
    default:
      return undefined;
  }
}

export default function SensorDetallePage() {
  const params = useParams<{ id: string }>()
  const sensorId = Number(params?.id)

  const [sensor, setSensor] = useState<Sensor | null>(null)
  const [lecturas, setLecturas] = useState<LecturaHistorica[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState('overview')
  const { connect, subscribeToSensor, sensorReadings, isConnected, isConnecting, latestAlert } = useSensoresWebSocket()

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
    if (sensorId && isConnected) {
      subscribeToSensor(sensorId)
    }
  }, [sensorId, isConnected, subscribeToSensor])

  useEffect(() => {
    if (sensorId && !isConnected && !isConnecting) {
      connect().then((ok) => {
        if (ok) {
          subscribeToSensor(sensorId)
        }
      })
    }
  }, [sensorId, isConnected, isConnecting, connect, subscribeToSensor])

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

  // Las configuraciones ahora son manejadas por el sistema de alertas avanzadas

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
      <div className="p-2 sm:p-3 md:p-6 max-w-7xl mx-auto space-y-3 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => history.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Detalle del Sensor</h1>
          </div>
          {sensor && (
            <Badge className={sensor.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
              {sensor.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          )}
        </div>

        {sensor && (
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-6 w-full">
            <Card className="min-w-0 max-w-full xl:col-span-1">
              <CardHeader>
                <CardTitle className="text-gray-900 text-base sm:text-lg">{sensor.nombre}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Tipo</p>
                    <p className="font-medium text-sm sm:text-base">{sensor.tipo}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Ubicación</p>
                    <p className="font-medium text-sm sm:text-base">{sensor.ubicacion?.nombre || sensor.ubicacionId}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">ID</p>
                    <p className="font-medium text-sm sm:text-base">{sensor.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Activity className={`w-4 h-4 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
                  {isConnected ? 'Conectado a tiempo real' : 'Desconectado'}
                </div>
                {latestAlert && latestAlert.sensorId === sensorId && (
                  <div className="rounded-xl p-2 sm:p-3 bg-orange-50 text-orange-700 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
                    <span className="font-medium">{latestAlert.severidad || 'ALERTA'}</span>
                    <span className="truncate mx-1 sm:mx-3">{latestAlert.mensaje || 'Condición fuera de umbral'}</span>
                    <span>{latestAlert.fecha ? new Date(latestAlert.fecha).toLocaleTimeString() : ''}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4 md:gap-6 min-w-0 xl:col-span-2">
              {/* Tabs sticky en móvil */}
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md pt-1 pb-1 md:static md:bg-transparent md:backdrop-blur-none">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="flex flex-nowrap gap-1 sm:gap-2 w-full bg-white rounded-lg shadow-sm p-1 mb-2 overflow-x-auto scrollbar-thin">
                    <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 min-w-[90px] sm:min-w-[110px] px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-semibold rounded-md focus-visible:ring-2 focus-visible:ring-blue-400">
                      <Activity className="h-4 w-4" />
                      <span className="truncate">Resumen</span>
                    </TabsTrigger>
                    <TabsTrigger value="configuracion" className="flex items-center gap-1 sm:gap-2 min-w-[90px] sm:min-w-[110px] px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-semibold rounded-md focus-visible:ring-2 focus-visible:ring-blue-400">
                      <Settings className="h-4 w-4" />
                      <span className="truncate">Configuración</span>
                    </TabsTrigger>
                    <TabsTrigger value="alertas" className="flex items-center gap-1 sm:gap-2 min-w-[90px] sm:min-w-[110px] px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-semibold rounded-md focus-visible:ring-2 focus-visible:ring-blue-400">
                      <Bell className="h-4 w-4" />
                      <span className="truncate">Alertas</span>
                    </TabsTrigger>
                  </TabsList>
                  {/* Pestaña: Resumen */}
                  <TabsContent value="overview" className="space-y-3 sm:space-y-6">
                    {/* Última lectura resumida */}
                    {(() => {
                      const ultimaLectura = lecturasTiempoReal[0] || lecturas[0]
                      if (!ultimaLectura) return null
                      return (
                        <Card>
                          <CardContent className="p-3 sm:p-6">
                            <div className="rounded-xl p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                              <p className="text-xs sm:text-sm text-blue-600 mb-1 sm:mb-2 font-medium">Última lectura</p>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
                                <div className="text-xl sm:text-2xl font-bold text-blue-900">
                                  {ultimaLectura.valor} {ultimaLectura.unidad}
                                </div>
                                <div className="text-xs sm:text-sm text-blue-600">
                                  {new Date(ultimaLectura.fecha).toLocaleString()}
                                </div>
                              </div>
                              <div className="mt-1 sm:mt-2">
                                <Badge 
                                  variant={ultimaLectura.estado === 'NORMAL' ? 'secondary' : 'default'}
                                  className={ultimaLectura.estado === 'NORMAL' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                                >
                                  {ultimaLectura.estado || 'NORMAL'}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })()}
                    {/* Lecturas en Tiempo Real */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <Activity className="w-4 h-4 text-green-600" />
                          Lecturas en Tiempo Real
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 sm:space-y-3">
                          {lecturasTiempoReal.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
                              <div className="inline-flex items-center gap-2 text-gray-500">
                                <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-xs sm:text-sm">Esperando lecturas en tiempo real...</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-1 sm:mt-2">Las lecturas aparecerán aquí automáticamente</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 min-w-[220px]">
                                {lecturasTiempoReal.slice(0, 20).map((l, idx) => (
                                  <div key={l.id ?? `${l.sensorId}-${l.fecha}-${idx}`} className="rounded-xl p-3 sm:p-4 text-xs sm:text-sm bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-[180px] sm:min-w-[220px]">
                                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                                      <div className="font-semibold text-gray-900 text-base sm:text-lg">{l.valor} {l.unidad}</div>
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
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    {/* Histórico de Lecturas */}
                    <Card>
                      <CardContent>
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-base sm:text-lg">
                              <Activity className="w-4 h-4 text-gray-600" />
                              Histórico de Lecturas
                            </h2>
                            <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50">
                              {lecturas.length} lecturas
                            </Badge>
                          </div>
                          {lecturas.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
                              <div className="inline-flex items-center gap-2 text-gray-500">
                                <span className="inline-block w-3 h-3 bg-gray-400 rounded-full animate-pulse" />
                                <span className="text-xs sm:text-sm">Sin lecturas históricas para este sensor</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-1 sm:mt-2">Las lecturas históricas aparecerán aquí</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 min-w-[180px] sm:min-w-[220px]">
                                {lecturas.slice(0, 20).map((l, idx) => (
                                  <div key={l.id ?? `${l.sensorId}-${l.fecha}-${idx}`} className="rounded-xl p-3 sm:p-4 text-xs sm:text-sm bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-[140px] sm:min-w-[180px]">
                                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                                      <div className="font-semibold text-gray-900 text-base sm:text-lg">{l.valor} {l.unidad}</div>
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
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  {/* Pestaña: Configuración */}
                  <TabsContent value="configuracion" className="space-y-3 sm:space-y-6">
                    {sensor && (
                      <ConfiguracionTab value={activeTab} configuracion={sensor.configuracion} />
                    )}
                  </TabsContent>
                  {/* Pestaña: Alertas */}
                  <TabsContent value="alertas" className="space-y-3 sm:space-y-6">
                    <ConfiguracionAlertas sensorId={sensor?.id ?? 0} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


