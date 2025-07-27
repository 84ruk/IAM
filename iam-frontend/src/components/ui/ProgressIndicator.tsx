'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/Badge'
import { 
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  XCircle
} from 'lucide-react'

interface ProgressIndicatorProps {
  progress: number
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled'
  message?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    barColor: 'bg-yellow-500',
    text: 'Pendiente'
  },
  processing: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    barColor: 'bg-blue-500',
    text: 'Procesando'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    barColor: 'bg-green-500',
    text: 'Completado'
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    barColor: 'bg-red-500',
    text: 'Error'
  },
  cancelled: {
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    barColor: 'bg-gray-500',
    text: 'Cancelado'
  }
}

const sizeConfig = {
  sm: {
    barHeight: 'h-1',
    textSize: 'text-xs',
    iconSize: 'w-3 h-3'
  },
  md: {
    barHeight: 'h-2',
    textSize: 'text-sm',
    iconSize: 'w-4 h-4'
  },
  lg: {
    barHeight: 'h-3',
    textSize: 'text-base',
    iconSize: 'w-5 h-5'
  }
}

export default function ProgressIndicator({ 
  progress, 
  status, 
  message, 
  showPercentage = true,
  size = 'md',
  className = ''
}: ProgressIndicatorProps) {
  const config = statusConfig[status]
  const sizeStyles = sizeConfig[size]
  const IconComponent = config.icon

  const clampedProgress = useMemo(() => {
    return Math.max(0, Math.min(100, progress))
  }, [progress])

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header con estado y porcentaje */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded ${config.bgColor}`}>
            <IconComponent 
              className={`${config.color} ${sizeStyles.iconSize} ${status === 'processing' ? 'animate-spin' : ''}`} 
            />
          </div>
          <Badge className={`${config.bgColor} ${config.color} ${sizeStyles.textSize}`}>
            {config.text}
          </Badge>
        </div>
        
        {showPercentage && (
          <span className={`font-medium text-gray-900 ${sizeStyles.textSize}`}>
            {clampedProgress}%
          </span>
        )}
      </div>

      {/* Barra de progreso */}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeStyles.barHeight}`}>
        <div 
          className={`h-full transition-all duration-500 ease-out ${config.barColor}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      {/* Mensaje */}
      {message && (
        <p className={`text-gray-600 ${sizeStyles.textSize}`}>
          {message}
        </p>
      )}
    </div>
  )
}

// Variantes específicas
export function CompactProgressIndicator({ progress, status, message }: Omit<ProgressIndicatorProps, 'size'>) {
  return (
    <ProgressIndicator
      progress={progress}
      status={status}
      message={message}
      size="sm"
      showPercentage={false}
    />
  )
}

export function LargeProgressIndicator({ progress, status, message }: Omit<ProgressIndicatorProps, 'size'>) {
  return (
    <ProgressIndicator
      progress={progress}
      status={status}
      message={message}
      size="lg"
    />
  )
} 