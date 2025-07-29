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
  onProgresoActualizado?: (trabajoId: string, progreso: number, estadisticas: EstadisticasProgreso) => void
  onTrabajoCompletado?: (trabajoId: string, resultado: ResultadoImportacion) => void
  onError?: (trabajoId: string, error: string) => void
  onValidacionError?: (trabajoId: string, errores: ErrorValidacion[]) => void
  onEstadisticasActualizadas?: (estadisticas: EstadisticasProgreso) => void
  // Nuevos eventos opcionales para compatibilidad
  onMensajeUsuario?: (trabajoId: string, mensaje: MensajeUsuario) => void
  onResumenProcesamiento?: (trabajoId: string, resumen: ResumenProcesamiento) => void
  onDuplicadosEncontrados?: (trabajoId: string, duplicados: number, total: number) => void
  onRecomendaciones?: (trabajoId: string, recomendaciones: string[]) => void
}

// Interfaces específicas para tipos de datos
interface EstadisticasProgreso {
  total: number
  procesados: number
  exitosos: number
  errores: number
  duplicados: number
  progreso: number
}

interface ErrorValidacion {
  fila: number
  columna: string
  valor: string
  mensaje: string
  tipo: 'validacion' | 'duplicado' | 'referencia' | 'sistema'
}

interface MensajeUsuario {
  tipo: 'success' | 'warning' | 'error' | 'info'
  titulo: string
  mensaje: string
  detalles?: string[]
  timestamp?: string
}

interface ResumenProcesamiento {
  duplicadosEncontrados: number
  erroresValidacion: number
  erroresSistema: number
  registrosOmitidos: number
  recomendaciones: string[]
}

interface ResultadoImportacion {
  trabajoId: string
  estado: string
  estadisticas: EstadisticasProgreso
  errores: ErrorValidacion[]
  tiempoProcesamiento: number
  archivoResultado?: string
  mensajesUsuario?: MensajeUsuario[]
  resumenProcesamiento?: ResumenProcesamiento
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

      // Nuevos eventos opcionales para compatibilidad
      case 'MENSAJE_USUARIO':
        if (event.trabajoId && event.data && options.onMensajeUsuario) {
          options.onMensajeUsuario(event.trabajoId, event.data)
        }
        break

      case 'RESUMEN_PROCESAMIENTO':
        if (event.trabajoId && event.data && options.onResumenProcesamiento) {
          options.onResumenProcesamiento(event.trabajoId, event.data)
        }
        break

      case 'DUPLICADOS_ENCONTRADOS':
        if (event.trabajoId && event.data && options.onDuplicadosEncontrados) {
          const { duplicados, total } = event.data
          options.onDuplicadosEncontrados(event.trabajoId, duplicados, total)
        }
        break

      case 'RECOMENDACIONES':
        if (event.trabajoId && event.data && options.onRecomendaciones) {
          options.onRecomendaciones(event.trabajoId, event.data.recomendaciones || [])
        }
        break
    }
  }, [options])

  // Configurar listeners de eventos
  useEffect(() => {
    if (!socket) return

    // Eventos de importación existentes
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

    // Nuevos eventos opcionales para compatibilidad
    socket.on('MENSAJE_USUARIO', (data) => {
      handleImportacionEvent({
        event: 'MENSAJE_USUARIO',
        trabajoId: data.trabajoId,
        data: data.data
      })
    })

    socket.on('RESUMEN_PROCESAMIENTO', (data) => {
      handleImportacionEvent({
        event: 'RESUMEN_PROCESAMIENTO',
        trabajoId: data.trabajoId,
        data: data.data
      })
    })

    socket.on('DUPLICADOS_ENCONTRADOS', (data) => {
      handleImportacionEvent({
        event: 'DUPLICADOS_ENCONTRADOS',
        trabajoId: data.trabajoId,
        data: data.data
      })
    })

    socket.on('RECOMENDACIONES', (data) => {
      handleImportacionEvent({
        event: 'RECOMENDACIONES',
        trabajoId: data.trabajoId,
        data: data.data
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
      // Limpiar nuevos eventos
      socket.off('MENSAJE_USUARIO')
      socket.off('RESUMEN_PROCESAMIENTO')
      socket.off('DUPLICADOS_ENCONTRADOS')
      socket.off('RECOMENDACIONES')
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