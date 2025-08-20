'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Sensor } from '@/types/sensor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { SensorGridSkeleton } from '@/components/ui/sensor-skeleton'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useSensoresWebSocket } from '@/hooks/useSensoresWebSocket'
import { useToast } from '@/components/ui/Toast'
import { 
  Wifi, 
  WifiOff, 
  Thermometer, 
  Droplets, 
  Scale, 
  Gauge, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface SensoresTiempoRealProps {
  ubicacionId?: number
  sensores?: Sensor[]
  className?: string
}

interface SensorReading {
  id: number
  tipo: string
  valor: number
  unidad: string
  fecha: Date
  estado: 'NORMAL' | 'ALERTA' | 'CRITICO'
  sensorId: number
  ubicacionId: number
}

const getSensorIcon = (tipo: string) => {
  switch (tipo.toUpperCase()) {
    case 'TEMPERATURA':
      return <Thermometer className="h-5 w-5" />
    case 'HUMEDAD':
      return <Droplets className="h-5 w-5" />
    case 'PESO':
      return <Scale className="h-5 w-5" />
    case 'PRESION':
      return <Gauge className="h-5 w-5" />
    default:
      return <Thermometer className="h-5 w-5" />
  }
}

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case 'NORMAL':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'ALERTA':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'CRITICO':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <CheckCircle className="h-4 w-4 text-green-500" />
  }
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'NORMAL':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'ALERTA':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'CRITICO':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-green-100 text-green-800 border-green-200'
  }
}

export function SensoresTiempoReal({ ubicacionId, className }: SensoresTiempoRealProps) {
  const { addToast } = useToast()
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date())
  const [lecturasAgrupadas, setLecturasAgrupadas] = useState<Map<string, SensorReading>>(new Map())

  const {
    isConnected,
    isConnecting,
    sensorReadings,
    sensorState,
    connect,
    subscribeToLocation,
  } = useSensoresWebSocket()

  // Conectar WebSocket al montar el componente
  useEffect(() => {
    let isMounted = true;

    const initWebSocket = async () => {
      if (!isMounted) return;
      
      if (ubicacionId) {
        // Si hay ubicación específica, suscribirse a ella
        const success = await connect(ubicacionId)
        if (success && isMounted) {
          subscribeToLocation(ubicacionId)
          addToast({
            type: 'success',
            title: 'Conectado',
            message: 'WebSocket conectado para lecturas en tiempo real',
          })
        } else if (isMounted) {
          addToast({
            type: 'error',
            title: 'Error de conexión',
            message: 'No se pudo conectar al WebSocket',
          })
        }
      } else {
        // Si no hay ubicación específica, conectar para todos los sensores
        const success = await connect()
        if (success && isMounted) {
          addToast({
            type: 'success',
            title: 'Conectado',
            message: 'WebSocket conectado para lecturas en tiempo real',
          })
        } else if (isMounted) {
          addToast({
            type: 'error',
            title: 'Error de conexión',
            message: 'No se pudo conectar al WebSocket',
          })
        }
      }
    }

    // Solo conectar si no está ya conectado
    if (!isConnected && !isConnecting) {
      initWebSocket()
    }

    return () => {
      isMounted = false;
      // Solo desconectar si este componente fue el que inició la conexión
      // El hook principal maneja la desconexión automáticamente
    }
  }, [ubicacionId, connect, subscribeToLocation, isConnected, isConnecting, addToast]) // Incluir todas las dependencias necesarias

  // Agrupar lecturas por tipo de sensor
  useEffect(() => {
    const agrupadas = new Map<string, SensorReading>()
    
    sensorReadings
      .filter(lectura => !ubicacionId || lectura.ubicacionId === ubicacionId)
      .forEach(lectura => {
        const key = `${lectura.tipo}_${lectura.sensorId}`
        agrupadas.set(key, lectura)
      })

    setLecturasAgrupadas(agrupadas)
    setUltimaActualizacion(new Date())
  }, [sensorReadings, ubicacionId])

  const handleRefresh = useCallback(async () => {
    if (isConnected) {
      if (ubicacionId) {
        subscribeToLocation(ubicacionId)
      }
      setUltimaActualizacion(new Date())
      addToast({
        type: 'success',
        title: 'Actualizado',
        message: 'Suscripción renovada',
      })
    } else {
      const success = await connect(ubicacionId)
      if (success) {
        if (ubicacionId) {
          subscribeToLocation(ubicacionId)
        }
        addToast({
          type: 'success',
          title: 'Reconectado',
          message: 'WebSocket reconectado exitosamente',
        })
      }
    }
  }, [isConnected, ubicacionId, subscribeToLocation, connect, addToast])

  const formatFecha = (fecha: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(fecha))
  }

  const formatValor = (valor: number, unidad: string) => {
    return `${valor.toFixed(2)} ${unidad}`
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                {ubicacionId ? 'Sensores en Tiempo Real' : 'Lecturas en Tiempo Real'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {ubicacionId 
                  ? 'Lecturas en vivo de los sensores de la ubicación'
                  : 'Lecturas en vivo de todos los sensores de la empresa'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Estado de conexión */}
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'Conectado' : isConnecting ? 'Conectando...' : 'Desconectado'}
                </span>
              </div>

              {/* Botón de actualizar */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isConnecting}
              >
                <RefreshCw className={`h-4 w-4 ${isConnecting ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {lecturasAgrupadas.size === 0 ? (
            <div className="space-y-4">
              {/* Estado/acciones */}
              <div className="flex items-center justify-between">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-gray-200 rounded-md animate-pulse" />
                </div>
              </div>
              {/* Tarjetas skeleton */}
              <SensorGridSkeleton count={6} />
              {/* Pie */}
              <div className="flex items-center justify-end">
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isConnecting}>
                  Reconectar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Lecturas de sensores */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(lecturasAgrupadas.values()).map((lectura) => (
                  <Card key={lectura.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getSensorIcon(lectura.tipo)}
                          <span className="font-medium capitalize">
                            {lectura.tipo.toLowerCase()}
                          </span>
                        </div>
                        {getEstadoIcon(lectura.estado)}
                      </div>
                      
                      <div className="text-2xl font-bold text-primary mb-2">
                        {formatValor(lectura.valor, lectura.unidad)}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={getEstadoColor(lectura.estado)}
                        >
                          {lectura.estado}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFecha(lectura.fecha)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Resumen de estado */}
              {sensorState && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Resumen</p>
                        <p className="text-xs text-muted-foreground">
                          {sensorState.totalLecturas} lecturas procesadas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Última actualización
                        </p>
                        <p className="text-sm font-medium">
                          {formatFecha(ultimaActualizacion)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
