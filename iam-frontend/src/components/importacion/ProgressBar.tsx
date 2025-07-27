'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  XCircle,
  FileText,
  TrendingUp
} from 'lucide-react'
import { TrabajoImportacion } from '@/lib/api/importacion'

interface ProgressBarProps {
  trabajo: TrabajoImportacion
}

const estadoConfig = {
  pendiente: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    text: 'Pendiente'
  },
  procesando: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    text: 'Procesando'
  },
  completado: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    text: 'Completado'
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    text: 'Error'
  },
  cancelado: {
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    text: 'Cancelado'
  }
}

export default function ProgressBar({ trabajo }: ProgressBarProps) {
  const config = estadoConfig[trabajo.estado] || estadoConfig.pendiente
  const IconComponent = config.icon

  const progreso = useMemo(() => {
    if (trabajo.estado === 'completado') return 100
    if (trabajo.estado === 'error' || trabajo.estado === 'cancelado') return 0
    
    // Calcular progreso basado en registros procesados
    if (trabajo.totalRegistros && trabajo.registrosProcesados) {
      return Math.round((trabajo.registrosProcesados / trabajo.totalRegistros) * 100)
    }
    
    // Progreso estimado basado en el estado
    if (trabajo.estado === 'procesando') {
      return Math.min(90, Math.random() * 50 + 30) // Entre 30-80%
    }
    
    return 10
  }, [trabajo])

  const tiempoEstimado = useMemo(() => {
    if (trabajo.estado === 'completado' || trabajo.estado === 'error') {
      return null
    }
    
    // Estimación simple basada en registros restantes
    if (trabajo.totalRegistros && trabajo.registrosProcesados) {
      const restantes = trabajo.totalRegistros - trabajo.registrosProcesados
      const tiempoPorRegistro = 0.1 // segundos por registro (estimación)
      const segundos = Math.round(restantes * tiempoPorRegistro)
      
      if (segundos < 60) return `${segundos}s`
      if (segundos < 3600) return `${Math.round(segundos / 60)}m`
      return `${Math.round(segundos / 3600)}h`
    }
    
    return 'Estimando...'
  }, [trabajo])

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'cancelado':
        return 'bg-gray-500'
      case 'procesando':
        return 'bg-blue-500'
      default:
        return 'bg-yellow-500'
    }
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header con estado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <IconComponent className={`w-5 h-5 ${config.color} ${trabajo.estado === 'procesando' ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  Importando {trabajo.tipo}
                </h4>
                <p className="text-sm text-gray-600">
                  {trabajo.archivo}
                </p>
              </div>
            </div>
            <Badge className={`${config.bgColor} ${config.color}`}>
              {config.text}
            </Badge>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progreso</span>
              <span className="font-medium text-gray-900">{progreso}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ease-out ${getEstadoColor(trabajo.estado)}`}
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Total:</span>
              <span className="font-medium">{trabajo.totalRegistros || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Procesados:</span>
              <span className="font-medium">{trabajo.registrosProcesados || 0}</span>
            </div>
          </div>

          {/* Tiempo estimado */}
          {tiempoEstimado && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Tiempo restante: {tiempoEstimado}</span>
            </div>
          )}

          {/* Mensaje de estado */}
          {trabajo.mensaje && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {trabajo.mensaje}
            </div>
          )}

          {/* Errores si los hay */}
          {trabajo.errores && trabajo.errores.length > 0 && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <div className="font-medium mb-1">Errores encontrados:</div>
              <ul className="space-y-1">
                {trabajo.errores.slice(0, 3).map((error, index) => (
                  <li key={index} className="text-xs">• {error}</li>
                ))}
                {trabajo.errores.length > 3 && (
                  <li className="text-xs">• ... y {trabajo.errores.length - 3} errores más</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 