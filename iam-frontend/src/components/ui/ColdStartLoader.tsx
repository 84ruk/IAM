'use client'

import React, { useState, useEffect } from 'react'
import { 
  Server, 
  Zap, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ColdStartLoaderProps {
  status: 'checking' | 'online' | 'cold-start' | 'offline' | 'error'
  responseTime?: number | null
  retryCount?: number
  isWarmingUp?: boolean
  onRetry?: () => void
  onWarmUp?: () => void
  className?: string
  showDetails?: boolean
}

export default function ColdStartLoader({
  status,
  responseTime,
  retryCount = 0,
  isWarmingUp = false,
  onRetry,
  onWarmUp,
  className = '',
  showDetails = true
}: ColdStartLoaderProps) {
  const [dots, setDots] = useState('')
  const [progress, setProgress] = useState(0)

  // Animación de puntos
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Animación de progreso para cold start
  useEffect(() => {
    if (status === 'cold-start' || isWarmingUp) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 200)
      return () => clearInterval(interval)
    } else {
      setProgress(0)
    }
  }, [status, isWarmingUp])

  const getStatusConfig = () => {
    switch (status) {
      case 'checking':
        return {
          icon: <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />,
          title: 'Verificando servidor',
          message: 'Comprobando disponibilidad del servicio',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      case 'online':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          title: 'Servidor en línea',
          message: 'Todo funcionando correctamente',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'cold-start':
        return {
          icon: <Zap className="w-6 h-6 text-orange-500" />,
          title: 'Despertando servidor',
          message: 'El servidor se está iniciando, esto puede tomar unos segundos',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        }
      case 'offline':
        return {
          icon: <WifiOff className="w-6 h-6 text-red-500" />,
          title: 'Servidor no disponible',
          message: 'No se puede conectar al servidor',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 'error':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
          title: 'Error de conexión',
          message: 'Ocurrió un error al conectar con el servidor',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      default:
        return {
          icon: <Server className="w-6 h-6 text-gray-500" />,
          title: 'Estado desconocido',
          message: 'No se pudo determinar el estado del servidor',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all duration-300',
      config.bgColor,
      config.borderColor,
      className
    )}>
      {/* Icono y título */}
      <div className="flex flex-col items-center gap-4 mb-4">
        <div className="relative">
          {config.icon}
          {(status === 'cold-start' || isWarmingUp) && (
            <div className="absolute -top-1 -right-1">
              <Activity className="w-3 h-3 text-orange-500 animate-pulse" />
            </div>
          )}
        </div>
        
        <div className="text-center">
          <h3 className={cn('text-lg font-semibold mb-1', config.color)}>
            {config.title}
          </h3>
          <p className="text-sm text-gray-600 max-w-sm">
            {config.message}
            {status === 'checking' && dots}
          </p>
        </div>
      </div>

      {/* Barra de progreso para cold start */}
      {(status === 'cold-start' || isWarmingUp) && (
        <div className="w-full max-w-xs mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Iniciando servidor</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Detalles adicionales */}
      {showDetails && (
        <div className="space-y-2 text-xs text-gray-500">
          {responseTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Tiempo de respuesta: {responseTime}ms</span>
            </div>
          )}
          
          {retryCount > 0 && (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3 h-3" />
              <span>Reintentos: {retryCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2 mt-4">
        {(status === 'offline' || status === 'error') && onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        )}
        
        {status === 'cold-start' && onWarmUp && (
          <button
            onClick={onWarmUp}
            disabled={isWarmingUp}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {isWarmingUp ? 'Calentando...' : 'Acelerar'}
          </button>
        )}
      </div>

      {/* Mensaje de ayuda */}
      {(status === 'cold-start' || status === 'offline') && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-xs text-blue-700">
            💡 <strong>Consejo:</strong> Los servidores en la nube pueden tardar unos segundos en &quot;despertar&quot; después de estar inactivos. 
            Esto es normal y mejora la experiencia una vez que el servidor esté activo.
          </p>
        </div>
      )}
    </div>
  )
}

// Variante compacta para usar en headers o barras de estado
export function CompactServerStatus({ status, className }: { status: string, className?: string }) {
  const getCompactIcon = () => {
    switch (status) {
      case 'online': return <Wifi className="w-4 h-4 text-green-500" />
      case 'cold-start': return <Zap className="w-4 h-4 text-orange-500 animate-pulse" />
      case 'offline': return <WifiOff className="w-4 h-4 text-red-500" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {getCompactIcon()}
      <span className="text-xs font-medium capitalize">{status}</span>
    </div>
  )
} 