'use client'

import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Bell
} from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  autoClose?: boolean
  duration?: number
}

interface ImportacionNotificationsProps {
  notifications: Notification[]
  onClose: (id: string) => void
  maxNotifications?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

const notificationConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconBgColor: 'bg-green-100'
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconBgColor: 'bg-red-100'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconBgColor: 'bg-yellow-100'
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconBgColor: 'bg-blue-100'
  }
}

export default function ImportacionNotifications({ 
  notifications, 
  onClose, 
  maxNotifications = 5,
  position = 'top-right'
}: ImportacionNotificationsProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      default:
        return 'top-4 right-4'
    }
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    
    if (seconds < 60) return 'Ahora'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h`
  }

  const visibleNotifications = notifications.slice(0, maxNotifications)

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className={`fixed z-50 ${getPositionClasses()} space-y-2`}>
      {visibleNotifications.map((notification) => {
        const config = notificationConfig[notification.type]
        const IconComponent = config.icon

        return (
          <div
            key={notification.id}
            className={`
              max-w-sm w-full p-4 rounded-lg border shadow-lg
              ${config.bgColor} ${config.borderColor}
              transform transition-all duration-300 ease-in-out
              hover:scale-105
            `}
          >
            <div className="flex items-start gap-3">
              {/* Icono */}
              <div className={`p-2 rounded-full ${config.iconBgColor}`}>
                <IconComponent className={`w-4 h-4 ${config.color}`} />
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {notification.title}
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      {notification.message}
                    </p>
                  </div>
                  
                  {/* Botón cerrar */}
                  <button
                    onClick={() => onClose(notification.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {formatTime(notification.timestamp)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Indicador de más notificaciones */}
      {notifications.length > maxNotifications && (
        <div className="text-center">
          <Badge variant="secondary" className="text-xs">
            <Bell className="w-3 h-3 mr-1" />
            +{notifications.length - maxNotifications} más
          </Badge>
        </div>
      )}
    </div>
  )
} 