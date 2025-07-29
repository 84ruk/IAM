'use client'

import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { 
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle
} from 'lucide-react'

interface ProgressBarProps {
  progreso: number
  estado: string
  showPercentage?: boolean
  showStatus?: boolean
  className?: string
}

export default function ProgressBar({ 
  progreso, 
  estado, 
  showPercentage = true, 
  showStatus = true,
  className = ''
}: ProgressBarProps) {
  const getStatusInfo = () => {
    // Normalizar el estado a minúsculas para comparación
    const estadoNormalizado = estado.toLowerCase()
    
    switch (estadoNormalizado) {
      case 'completado':
      case 'completed':
        return {
          icon: CheckCircle,
          text: 'Completado',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          barColor: 'bg-green-500'
        }
      case 'error':
      case 'errores':
        return {
          icon: XCircle,
          text: 'Error',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          barColor: 'bg-red-500'
        }
      case 'procesando':
      case 'en_proceso':
      case 'processing':
        return {
          icon: Loader2,
          text: 'Procesando',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200',
          barColor: 'bg-blue-500'
        }
      case 'pendiente':
      case 'pending':
        return {
          icon: Clock,
          text: 'Pendiente',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          barColor: 'bg-yellow-500'
        }
      case 'cancelado':
      case 'cancelled':
        return {
          icon: XCircle,
          text: 'Cancelado',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          barColor: 'bg-gray-500'
        }
      default:
        return {
          icon: AlertTriangle,
          text: 'Iniciando...',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-200',
          barColor: 'bg-orange-500'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const IconComponent = statusInfo.icon

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Información de estado */}
      {showStatus && (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
          <div className="flex items-center gap-2">
            <IconComponent className={`w-4 h-4 ${statusInfo.color} ${estado.toLowerCase() === 'procesando' ? 'animate-spin' : ''}`} />
            <span className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
          
          {showPercentage && (
            <span className={`text-sm font-bold ${statusInfo.color}`}>
              {Math.round(progreso)}%
            </span>
          )}
        </div>
      )}

      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-3 rounded-full transition-all duration-500 ease-out ${statusInfo.barColor}`}
          style={{ 
            width: `${Math.min(100, Math.max(0, progreso))}%`,
            transition: 'width 0.5s ease-out'
          }}
        />
      </div>

      {/* Información adicional */}
      {progreso > 0 && progreso < 100 && (
        <div className="text-xs text-gray-500 text-center">
          {estado.toLowerCase() === 'procesando' ? 'Procesando registros...' : 'Preparando importación...'}
        </div>
      )}
    </div>
  )
} 