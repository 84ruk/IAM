'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useLazyWebSocket } from './useLazyWebSocket'

interface ImportacionWebSocketEvent {
  event: string
  trabajoId?: string
  data?: any
}

interface UseImportacionWebSocketOptions {
  onTrabajoCreado?: (trabajoId: string) => void
  onProgresoActualizado?: (trabajoId: string, progreso: number, estadisticas: any) => void
  onTrabajoCompletado?: (trabajoId: string, resultado: any) => void
  onError?: (trabajoId: string, error: string) => void
  onValidacionError?: (trabajoId: string, errores: any[]) => void
  onEstadisticasActualizadas?: (estadisticas: any) => void
}

export function useImportacionWebSocket(options: UseImportacionWebSocketOptions = {}) {
  const { 
    socket, 
    isConnected, 
    connect,
    disconnect
  } = useLazyWebSocket()
  
  const subscriptions = useRef<Set<string>>(new Set())

  // Suscribirse a un trabajo específico
  const subscribeToTrabajo = useCallback((trabajoId: string) => {
    if (!socket || !isConnected) {
      return
    }

    if (subscriptions.current.has(trabajoId)) {
      return
    }

    socket.emit('subscribe:trabajos', { trabajoId })
    subscriptions.current.add(trabajoId)
  }, [socket, isConnected])

  // Suscribirse a todos los trabajos de importación
  const subscribeToAllTrabajos = useCallback(() => {
    if (!socket || !isConnected) {
      return
    }

    socket.emit('subscribe:trabajos', {})
  }, [socket, isConnected])

  // Desuscribirse de un trabajo específico
  const unsubscribeFromTrabajo = useCallback((trabajoId: string) => {
    if (!socket || !isConnected) {
      return
    }

    if (subscriptions.current.has(trabajoId)) {
      socket.emit('unsubscribe:trabajos', { trabajoId })
      subscriptions.current.delete(trabajoId)
    }
  }, [socket, isConnected])

  // Desuscribirse de todos los trabajos
  const unsubscribeFromAllTrabajos = useCallback(() => {
    if (!socket || !isConnected) {
      return
    }

    socket.emit('unsubscribe:trabajos', {})
    subscriptions.current.clear()
  }, [socket, isConnected])

  // Manejar eventos de importación
  const handleImportacionEvent = useCallback((event: ImportacionWebSocketEvent) => {
    switch (event.event) {
      case 'trabajo:creado':
        if (event.trabajoId && options.onTrabajoCreado) {
          options.onTrabajoCreado(event.trabajoId)
        }
        break

      case 'progreso:actualizado':
        if (event.trabajoId && event.data && options.onProgresoActualizado) {
          const { progreso, estadisticas } = event.data
          options.onProgresoActualizado(event.trabajoId, progreso, estadisticas)
        }
        break

      case 'trabajo:completado':
        if (event.trabajoId && event.data && options.onTrabajoCompletado) {
          options.onTrabajoCompletado(event.trabajoId, event.data)
        }
        break

      case 'trabajo:error':
        if (event.trabajoId && event.data && options.onError) {
          options.onError(event.trabajoId, event.data.error || 'Error desconocido')
        }
        break

      case 'error:validacion':
        if (event.trabajoId && event.data && options.onValidacionError) {
          options.onValidacionError(event.trabajoId, event.data.errores || [])
        }
        break

      case 'estadisticas:actualizadas':
        if (event.data && options.onEstadisticasActualizadas) {
          options.onEstadisticasActualizadas(event.data.estadisticas)
        }
        break
    }
  }, [options])

  // Configurar listeners de eventos
  useEffect(() => {
    if (!socket) return

    // Eventos de importación
    socket.on('trabajo:creado', (data) => {
      handleImportacionEvent({
        event: 'trabajo:creado',
        trabajoId: data.trabajo?.id,
        data: data.trabajo
      })
    })

    socket.on('progreso:actualizado', (data) => {
      handleImportacionEvent({
        event: 'progreso:actualizado',
        trabajoId: data.trabajoId,
        data: {
          progreso: data.progreso,
          estadisticas: data.estadisticas
        }
      })
    })

    socket.on('trabajo:completado', (data) => {
      handleImportacionEvent({
        event: 'trabajo:completado',
        trabajoId: data.trabajo?.id,
        data: data.trabajo
      })
    })

    socket.on('trabajo:error', (data) => {
      handleImportacionEvent({
        event: 'trabajo:error',
        trabajoId: data.trabajo?.id,
        data: data.trabajo
      })
    })

    socket.on('error:validacion', (data) => {
      handleImportacionEvent({
        event: 'error:validacion',
        trabajoId: data.trabajoId,
        data: data
      })
    })

    socket.on('estadisticas:actualizadas', (data) => {
      handleImportacionEvent({
        event: 'estadisticas:actualizadas',
        data: data
      })
    })

    // Limpiar listeners al desmontar
    return () => {
      socket.off('trabajo:creado')
      socket.off('progreso:actualizado')
      socket.off('trabajo:completado')
      socket.off('trabajo:error')
      socket.off('error:validacion')
      socket.off('estadisticas:actualizadas')
    }
  }, [socket, handleImportacionEvent])

  // Conectar automáticamente al montar
  useEffect(() => {
    if (!isConnected) {
      connect()
    }
  }, [connect, isConnected])

  return {
    socket,
    isConnected,
    subscribeToTrabajo,
    subscribeToAllTrabajos,
    unsubscribeFromTrabajo,
    unsubscribeFromAllTrabajos,
    connect,
    disconnect
  }
} 