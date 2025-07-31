'use client'

import { useServerStatusContext } from '@/context/ServerStatusContext'
import { AlertTriangle, CheckCircle, Clock, WifiOff } from 'lucide-react'

export default function ServerStatusBar() {
  const { status, responseTime, isWarmingUp } = useServerStatusContext()

  // Solo mostrar cuando hay problemas o cold start
  if (status === 'online' && !isWarmingUp) {
    return null
  }

  const getStatusInfo = () => {
    switch (status) {
      case 'cold-start':
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Servidor iniciando...',
          color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          iconColor: 'text-yellow-600'
        }
      case 'offline':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Servidor no disponible',
          color: 'bg-red-50 border-red-200 text-red-800',
          iconColor: 'text-red-600'
        }
      case 'error':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          text: 'Error de conexión',
          color: 'bg-red-50 border-red-200 text-red-800',
          iconColor: 'text-red-600'
        }
      default:
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Servidor funcionando',
          color: 'bg-green-50 border-green-200 text-green-800',
          iconColor: 'text-green-600'
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-3 rounded-lg border ${statusInfo.color} shadow-lg transition-all duration-300`}>
      <div className="flex items-center space-x-2">
        <div className={statusInfo.iconColor}>
          {statusInfo.icon}
        </div>
        <span className="text-sm font-medium">
          {statusInfo.text}
        </span>
        {responseTime && (
          <span className="text-xs opacity-75">
            ({responseTime}ms)
          </span>
        )}
      </div>
    </div>
  )
} 