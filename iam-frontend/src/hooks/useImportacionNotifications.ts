'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  autoClose?: boolean
  duration?: number
}

interface UseImportacionNotificationsReturn {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
  clearByType: (type: Notification['type']) => void
  // Helpers específicos
  addSuccess: (title: string, message: string, options?: Partial<Notification>) => void
  addError: (title: string, message: string, options?: Partial<Notification>) => void
  addWarning: (title: string, message: string, options?: Partial<Notification>) => void
  addInfo: (title: string, message: string, options?: Partial<Notification>) => void
}

export function useImportacionNotifications(): UseImportacionNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      timeoutsRef.current.clear()
    }
  }, [])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const timestamp = new Date()
    
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp,
      autoClose: notification.autoClose ?? true,
      duration: notification.duration ?? 5000
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-close si está habilitado
    if (newNotification.autoClose && newNotification.duration) {
      const timeout = setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
      
      timeoutsRef.current.set(id, timeout)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    // Limpiar timeout si existe
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }

    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    // Limpiar todos los timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    timeoutsRef.current.clear()
    
    setNotifications([])
  }, [])

  const clearByType = useCallback((type: Notification['type']) => {
    const notificationsToRemove = notifications.filter(n => n.type === type)
    
    // Limpiar timeouts de las notificaciones que se van a eliminar
    notificationsToRemove.forEach(notification => {
      const timeout = timeoutsRef.current.get(notification.id)
      if (timeout) {
        clearTimeout(timeout)
        timeoutsRef.current.delete(notification.id)
      }
    })

    setNotifications(prev => prev.filter(notification => notification.type !== type))
  }, [notifications])

  // Helpers para tipos específicos de notificaciones
  const addSuccess = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'success',
      title,
      message,
      ...options
    })
  }, [addNotification])

  const addError = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'error',
      title,
      message,
      autoClose: false, // Los errores no se cierran automáticamente
      ...options
    })
  }, [addNotification])

  const addWarning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'warning',
      title,
      message,
      ...options
    })
  }, [addNotification])

  const addInfo = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'info',
      title,
      message,
      ...options
    })
  }, [addNotification])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    clearByType,
    // Helpers específicos
    addSuccess,
    addError,
    addWarning,
    addInfo
  }
} 