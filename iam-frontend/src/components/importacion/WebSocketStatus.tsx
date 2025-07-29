'use client'

import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { 
  Wifi, 
  WifiOff, 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useLazyWebSocket } from '@/hooks/useLazyWebSocket'

interface WebSocketStatusProps {
  showDetails?: boolean
  className?: string
}

export default function WebSocketStatus({ showDetails = false, className = '' }: WebSocketStatusProps) {
  const { isConnected, isConnecting, connectionError } = useLazyWebSocket()

  const getStatusInfo = () => {
    if (isConnecting) {
      return {
        icon: Loader2,
        text: 'Conectando...',
        color: 'bg-yellow-100 text-yellow-800',
        iconColor: 'text-yellow-600',
        spinning: true
      }
    }

    if (isConnected) {
      return {
        icon: CheckCircle,
        text: 'Conectado',
        color: 'bg-green-100 text-green-800',
        iconColor: 'text-green-600',
        spinning: false
      }
    }

    if (connectionError) {
      return {
        icon: AlertCircle,
        text: 'Error de conexión',
        color: 'bg-red-100 text-red-800',
        iconColor: 'text-red-600',
        spinning: false
      }
    }

    return {
      icon: WifiOff,
      text: 'Desconectado',
      color: 'bg-gray-100 text-gray-800',
      iconColor: 'text-gray-600',
      spinning: false
    }
  }

  const statusInfo = getStatusInfo()
  const IconComponent = statusInfo.icon

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge className={statusInfo.color}>
        <IconComponent 
          className={`w-3 h-3 mr-1 ${statusInfo.iconColor} ${statusInfo.spinning ? 'animate-spin' : ''}`} 
        />
        {statusInfo.text}
      </Badge>
      
      {showDetails && connectionError && (
        <span className="text-xs text-red-600 max-w-xs truncate" title={connectionError}>
          {connectionError}
        </span>
      )}
    </div>
  )
} 