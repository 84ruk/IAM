'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { ImportacionTrabajo } from '@/types/importacion'
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  Wifi,
  Brain,
  Zap,
  FileText,
  Package,
  ShoppingCart,
  Activity,
  Clock,
  Square,
  Timer,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

interface ImportacionProgressProps {
  trabajo: ImportacionTrabajo
  onCancel?: (trabajoId: string) => void
  onDownloadReport?: (trabajoId: string) => void
}

export default function ImportacionProgress({ 
  trabajo, 
  onCancel, 
  onDownloadReport 
}: ImportacionProgressProps) {
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0)
  const [velocidad, setVelocidad] = useState(0)
  const [tiempoEstimado, setTiempoEstimado] = useState(0)

  // Calcular tiempo transcurrido y velocidad
  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = new Date().getTime()
      const inicio = new Date(trabajo.fechaCreacion).getTime()
      const transcurrido = Math.floor((ahora - inicio) / 1000)
      setTiempoTranscurrido(transcurrido)

      // Calcular velocidad (registros por segundo)
      if (transcurrido > 0 && trabajo.registrosProcesados > 0) {
        const velocidadActual = trabajo.registrosProcesados / transcurrido
        setVelocidad(velocidadActual)

        // Calcular tiempo estimado restante
        const registrosRestantes = trabajo.totalRegistros - trabajo.registrosProcesados
        if (velocidadActual > 0) {
          setTiempoEstimado(Math.ceil(registrosRestantes / velocidadActual))
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [trabajo.fechaCreacion, trabajo.registrosProcesados, trabajo.totalRegistros])

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'cancelado': return 'bg-gray-100 text-gray-800'
      case 'procesando': return 'bg-blue-100 text-blue-800'
      case 'pendiente': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado': return <CheckCircle className="w-4 h-4" />
      case 'error': return <XCircle className="w-4 h-4" />
      case 'cancelado': return <Square className="w-4 h-4" />
      case 'procesando': return <Loader2 className="w-4 h-4 animate-spin" />
      case 'pendiente': return <Clock className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'productos': return <Package className="w-4 h-4" />
      case 'proveedores': return <ShoppingCart className="w-4 h-4" />
      case 'movimientos': return <Activity className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getModoIcon = (modo?: string) => {
    switch (modo) {
      case 'websocket': return <Wifi className="w-4 h-4" />
      case 'http': return <Zap className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  // const formatFileSize = (bytes: number) => {
  //   if (bytes === 0) return '0 Bytes'
  //   const k = 1024
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB']
  //   const i = Math.floor(Math.log(bytes) / Math.log(k))
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  // }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const isCompleted = trabajo.estado === 'completado'
  const hasErrors = trabajo.estado === 'error' || trabajo.registrosConError > 0
  const canCancel = trabajo.estado === 'pendiente' || trabajo.estado === 'procesando'
  const isProcessing = trabajo.estado === 'procesando'

  return (
    <Card className="w-full border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getTipoIcon(trabajo.tipo)}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-800">
                {trabajo.archivoOriginal}
              </CardTitle>
              <p className="text-sm text-gray-600 capitalize mt-1">
                {trabajo.tipo} • {formatTime(trabajo.fechaCreacion)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {trabajo.modo && (
              <Badge variant="outline" className="flex items-center gap-1 bg-white border-blue-200 text-blue-700">
                {getModoIcon(trabajo.modo)}
                {trabajo.modo.toUpperCase()}
              </Badge>
            )}
            <Badge className={`flex items-center gap-1 px-3 py-1 font-medium ${getEstadoColor(trabajo.estado)}`}>
              {getEstadoIcon(trabajo.estado)}
              <span className="capitalize">{trabajo.estado}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Barra de progreso principal */}
        <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Progreso general</span>
            <span className="text-sm font-bold text-blue-600">{trabajo.progreso}%</span>
          </div>
          <div className="relative">
            <Progress value={trabajo.progreso} className="h-4 bg-blue-100" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-sm">
                {trabajo.progreso}%
              </span>
            </div>
          </div>
        </div>

        {/* Barra de progreso detallada */}
        {isProcessing && trabajo.totalRegistros > 0 && (
          <div className="space-y-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Registros procesados</span>
              <span className="text-sm font-bold text-green-600">
                {trabajo.registrosProcesados} / {trabajo.totalRegistros}
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={(trabajo.registrosProcesados / trabajo.totalRegistros) * 100} 
                className="h-3 bg-green-100"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white drop-shadow-sm">
                  {Math.round((trabajo.registrosProcesados / trabajo.totalRegistros) * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Métricas de rendimiento */}
        {isProcessing && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="p-1 bg-blue-100 rounded-full">
                  <Timer className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-sm font-bold text-blue-700">
                  {formatDuration(tiempoTranscurrido)}
                </span>
              </div>
              <div className="text-xs text-blue-600 font-medium">Tiempo transcurrido</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm border border-green-200">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="p-1 bg-green-100 rounded-full">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm font-bold text-green-700">
                  {velocidad.toFixed(1)}
                </span>
              </div>
              <div className="text-xs text-green-600 font-medium">Registros/seg</div>
            </div>
            {tiempoEstimado > 0 && (
              <div className="text-center p-3 bg-white rounded-lg shadow-sm border border-orange-200">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="p-1 bg-orange-100 rounded-full">
                    <Clock className="w-3 h-3 text-orange-600" />
                  </div>
                  <span className="text-sm font-bold text-orange-700">
                    {formatDuration(tiempoEstimado)}
                  </span>
                </div>
                <div className="text-xs text-orange-600 font-medium">Tiempo estimado</div>
              </div>
            )}
            <div className="text-center p-3 bg-white rounded-lg shadow-sm border border-purple-200">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="p-1 bg-purple-100 rounded-full">
                  <Activity className="w-3 h-3 text-purple-600" />
                </div>
                <span className="text-sm font-bold text-purple-700">
                  {trabajo.progreso}%
                </span>
              </div>
              <div className="text-xs text-purple-600 font-medium">Completado</div>
            </div>
          </div>
        )}

        {/* Estadísticas de registros */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {trabajo.registrosProcesados}
            </div>
            <div className="text-xs text-gray-600">Procesados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {trabajo.registrosExitosos}
            </div>
            <div className="text-xs text-gray-600">Exitosos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {trabajo.registrosConError}
            </div>
            <div className="text-xs text-gray-600">Con Error</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {trabajo.totalRegistros}
            </div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>

        {/* Mensaje de estado */}
        {trabajo.mensaje && (
          <div className={`p-3 rounded-lg text-sm ${
            hasErrors ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {trabajo.mensaje}
          </div>
        )}

        {/* Errores detallados */}
        {hasErrors && trabajo.errores && trabajo.errores.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <h4 className="font-medium text-red-700">Errores encontrados:</h4>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {trabajo.errores.slice(0, 5).map((error, index) => (
                <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {typeof error === 'object' && error !== null && 'mensaje' in error 
                    ? String((error as { mensaje: string }).mensaje) 
                    : String(error)}
                </div>
              ))}
              {trabajo.errores.length > 5 && (
                <div className="text-xs text-gray-500">
                  ... y {trabajo.errores.length - 5} errores más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-gray-500">
            ID: {trabajo.id}
          </div>
          <div className="flex items-center gap-2">
            {canCancel && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(trabajo.id)}
                className="flex items-center gap-1"
              >
                <Square className="w-3 h-3" />
                Cancelar
              </Button>
            )}
            
            {isCompleted && hasErrors && onDownloadReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadReport(trabajo.id)}
                className="flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                Descargar Reporte
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 