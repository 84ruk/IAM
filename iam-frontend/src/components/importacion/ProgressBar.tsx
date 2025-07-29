'use client'

import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { 
  CheckCircle,
  XCircle,
  Clock,
  Loader2
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
    switch (estado) {
      case 'COMPLETADO':
        return {
          icon: CheckCircle,
          text: 'Completado',
          color: 'text-green-600',
          bgColor: 'bg-green-500',
          barColor: 'bg-green-500'
        }
      case 'ERROR':
        return {
          icon: XCircle,
          text: 'Error',
          color: 'text-red-600',
          bgColor: 'bg-red-500',
          barColor: 'bg-red-500'
        }
      case 'EN_PROCESO':
        return {
          icon: Loader2,
          text: 'En Proceso',
          color: 'text-blue-600',
          bgColor: 'bg-blue-500',
          barColor: 'bg-blue-500'
        }
      case 'PENDIENTE':
        return {
          icon: Clock,
          text: 'Pendiente',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-500',
          barColor: 'bg-yellow-500'
        }
      default:
        return {
          icon: Clock,
          text: 'Desconocido',
          color: 'text-gray-600',
          bgColor: 'bg-gray-500',
          barColor: 'bg-gray-500'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const IconComponent = statusInfo.icon

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${statusInfo.barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, progreso))}%` }}
        />
      </div>

      {/* Información de progreso */}
      <div className="flex items-center justify-between text-sm">
        {showStatus && (
          <div className="flex items-center gap-2">
            <IconComponent className={`w-4 h-4 ${statusInfo.color} ${estado === 'EN_PROCESO' ? 'animate-spin' : ''}`} />
            <Badge className={`${statusInfo.bgColor} text-white`}>
              {statusInfo.text}
            </Badge>
          </div>
        )}
        
        {showPercentage && (
          <span className="text-gray-600 font-medium">
            {Math.round(progreso)}%
          </span>
        )}
      </div>
    </div>
  )
} 