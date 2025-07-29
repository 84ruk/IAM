'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import Button from '@/components/ui/Button'
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Database,
  Zap,
  Timer,
  TrendingUp,
  AlertTriangle,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react'

interface TrabajoImportacion {
  id: string
  tipo: string
  estado: string
  progreso: number
  totalRegistros: number
  registrosProcesados: number
  registrosExitosos: number
  registrosConError: number
  archivoOriginal: string
  fechaCreacion: string
  fechaActualizacion: string
  mensaje?: string
}

interface AdvancedImportLoaderProps {
  trabajo: TrabajoImportacion
  onCancel?: () => void
  onPause?: () => void
  onResume?: () => void
  onRetry?: () => void
  className?: string
}

interface Etapa {
  id: string
  nombre: string
  descripcion: string
  progreso: number
  estado: 'pendiente' | 'procesando' | 'completado' | 'error'
  tiempoEstimado?: number
  tiempoTranscurrido?: number
}

export default function AdvancedImportLoader({
  trabajo,
  onCancel,
  onPause,
  onResume,
  onRetry,
  className = ''
}: AdvancedImportLoaderProps) {
  const [tiempoInicio] = useState<Date>(new Date(trabajo.fechaCreacion))
  const [tiempoActual, setTiempoActual] = useState<Date>(new Date())
  const [velocidadPromedio, setVelocidadPromedio] = useState<number>(0)
  const [tiempoEstimado, setTiempoEstimado] = useState<number>(0)
  const [etapas, setEtapas] = useState<Etapa[]>([])

  // Calcular estadísticas en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setTiempoActual(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Calcular velocidad y tiempo estimado
  useEffect(() => {
    if (trabajo.registrosProcesados > 0) {
      const tiempoTranscurrido = (tiempoActual.getTime() - tiempoInicio.getTime()) / 1000
      const velocidad = trabajo.registrosProcesados / tiempoTranscurrido
      setVelocidadPromedio(velocidad)

      const registrosRestantes = trabajo.totalRegistros - trabajo.registrosProcesados
      const tiempoEstimado = registrosRestantes / velocidad
      setTiempoEstimado(tiempoEstimado)
    }
  }, [trabajo.registrosProcesados, trabajo.totalRegistros, tiempoActual, tiempoInicio])

  // Definir etapas del proceso
  useEffect(() => {
    const etapasBase: Etapa[] = [
      {
        id: 'validacion',
        nombre: 'Validación de archivo',
        descripcion: 'Verificando formato y estructura del archivo',
        progreso: trabajo.progreso >= 10 ? 100 : Math.min(trabajo.progreso * 10, 100),
        estado: trabajo.progreso >= 10 ? 'completado' : trabajo.progreso > 0 ? 'procesando' : 'pendiente'
      },
      {
        id: 'lectura',
        nombre: 'Lectura de datos',
        descripcion: 'Procesando registros del archivo',
        progreso: trabajo.progreso >= 30 ? 100 : Math.max(0, (trabajo.progreso - 10) * 5),
        estado: trabajo.progreso >= 30 ? 'completado' : trabajo.progreso > 10 ? 'procesando' : 'pendiente'
      },
      {
        id: 'validacion_datos',
        nombre: 'Validación de datos',
        descripcion: 'Verificando integridad y formato de los datos',
        progreso: trabajo.progreso >= 60 ? 100 : Math.max(0, (trabajo.progreso - 30) * 3.33),
        estado: trabajo.progreso >= 60 ? 'completado' : trabajo.progreso > 30 ? 'procesando' : 'pendiente'
      },
      {
        id: 'insercion',
        nombre: 'Inserción en base de datos',
        descripcion: 'Guardando registros validados',
        progreso: trabajo.progreso >= 90 ? 100 : Math.max(0, (trabajo.progreso - 60) * 3.33),
        estado: trabajo.progreso >= 90 ? 'completado' : trabajo.progreso > 60 ? 'procesando' : 'pendiente'
      },
      {
        id: 'finalizacion',
        nombre: 'Finalización',
        descripcion: 'Completando proceso y generando reportes',
        progreso: trabajo.progreso >= 100 ? 100 : Math.max(0, (trabajo.progreso - 90) * 10),
        estado: trabajo.progreso >= 100 ? 'completado' : trabajo.progreso > 90 ? 'procesando' : 'pendiente'
      }
    ]

    setEtapas(etapasBase)
  }, [trabajo.progreso])

  // Formatear tiempo
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  // Formatear velocidad
  const formatSpeed = (recordsPerSecond: number): string => {
    if (recordsPerSecond < 1) return `${(recordsPerSecond * 60).toFixed(1)} reg/min`
    return `${recordsPerSecond.toFixed(1)} reg/s`
  }

  // Obtener configuración del estado
  const getEstadoConfig = () => {
    switch (trabajo.estado) {
      case 'completado':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          text: 'Completado'
        }
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          text: 'Error'
        }
      case 'procesando':
        return {
          icon: Loader2,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          text: 'Procesando'
        }
      case 'pendiente':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          text: 'Pendiente'
        }
      default:
        return {
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          text: 'Desconocido'
        }
    }
  }

  const estadoConfig = getEstadoConfig()
  const IconComponent = estadoConfig.icon

  // Calcular tiempo transcurrido
  const tiempoTranscurrido = useMemo(() => {
    return (tiempoActual.getTime() - tiempoInicio.getTime()) / 1000
  }, [tiempoActual, tiempoInicio])

  return (
    <Card className={`border-l-4 border-l-blue-500 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${estadoConfig.bgColor}`}>
              <IconComponent className={`w-6 h-6 ${estadoConfig.color} ${trabajo.estado === 'procesando' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <CardTitle className="text-lg">
                Importando {trabajo.tipo}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {trabajo.archivoOriginal}
              </p>
            </div>
          </div>
          <Badge className={`${estadoConfig.bgColor} ${estadoConfig.color}`}>
            {estadoConfig.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progreso principal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progreso general</span>
            <span className="font-medium text-gray-900">{trabajo.progreso.toFixed(1)}%</span>
          </div>
          <Progress value={trabajo.progreso} className="h-3" />
        </div>

        {/* Estadísticas en tiempo real */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
              <Database className="w-4 h-4" />
              <span className="text-xs font-medium">Procesados</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {trabajo.registrosProcesados.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              de {trabajo.totalRegistros.toLocaleString()}
            </div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Exitosos</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {trabajo.registrosExitosos.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {trabajo.totalRegistros > 0 ? `${((trabajo.registrosExitosos / trabajo.totalRegistros) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>

          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Errores</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {trabajo.registrosConError.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {trabajo.totalRegistros > 0 ? `${((trabajo.registrosConError / trabajo.totalRegistros) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium">Velocidad</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatSpeed(velocidadPromedio)}
            </div>
            <div className="text-xs text-gray-500">
              promedio
            </div>
          </div>
        </div>

        {/* Tiempo y estimaciones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Timer className="w-4 h-4 text-gray-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                Tiempo transcurrido
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(tiempoTranscurrido)}
              </div>
            </div>
          </div>

          {tiempoEstimado > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Tiempo estimado
                </div>
                <div className="text-xs text-gray-500">
                  {formatTime(tiempoEstimado)} restantes
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                Eficiencia
              </div>
              <div className="text-xs text-gray-500">
                {trabajo.totalRegistros > 0 ? `${((trabajo.registrosExitosos / trabajo.totalRegistros) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>
          </div>
        </div>

        {/* Etapas del proceso */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Etapas del proceso</h4>
          <div className="space-y-2">
            {etapas.map((etapa) => (
              <div key={etapa.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  etapa.estado === 'completado' ? 'bg-green-500' :
                  etapa.estado === 'procesando' ? 'bg-blue-500 animate-pulse' :
                  etapa.estado === 'error' ? 'bg-red-500' : 'bg-gray-300'
                }`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {etapa.nombre}
                  </div>
                  <div className="text-xs text-gray-500">
                    {etapa.descripcion}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {etapa.progreso.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mensaje de estado */}
        {trabajo.mensaje && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {trabajo.mensaje}
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-2 pt-4 border-t">
          {trabajo.estado === 'procesando' && (
            <>
              {onPause && (
                <Button variant="outline" size="sm" onClick={onPause}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
              )}
              {onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </>
          )}

          {trabajo.estado === 'pendiente' && onResume && (
            <Button variant="outline" size="sm" onClick={onResume}>
              <Play className="w-4 h-4 mr-2" />
              Reanudar
            </Button>
          )}

          {trabajo.estado === 'error' && onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 