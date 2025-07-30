'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { useServerUser } from '@/context/ServerUserContext'
import io, { Socket } from 'socket.io-client'
import { 
  ImportacionTrabajo, 
  ImportacionOpciones, 
  ImportacionResultado, 
  ImportacionEstado,
  TipoImportacion 
} from '@/types/importacion'



interface UseImportacionUnifiedReturn {
  state: ImportacionEstado
  importar: (file: File, tipo: TipoImportacion, opciones?: ImportacionOpciones) => Promise<ImportacionResultado>
  cancelarTrabajo: (trabajoId: string) => Promise<void>
  clearState: () => void
  clearError: () => void
  clearSuccess: () => void
  subscribeToTrabajo: (trabajoId: string) => void
  unsubscribeFromTrabajo: (trabajoId: string) => void
  descargarPlantilla: (tipo: TipoImportacion) => Promise<void>
  descargarReporteErrores: (trabajoId: string) => Promise<void>
}

export function useImportacionUnified(): UseImportacionUnifiedReturn {
  const [state, setState] = useState<ImportacionEstado>({
    isImporting: false,
    currentTrabajo: null,
    error: null,
    success: null,
    modo: null,
    isConnected: false,
    trabajos: [],
    estadisticas: {
      total: 0,
      completados: 0,
      conError: 0,
      enProgreso: 0,
      porcentajeExito: 0
    }
  })

  const [socket, setSocket] = useState<Socket | null>(null)
  const webSocketConnected = useRef(false)
  const currentTrabajoId = useRef<string | null>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const { validateAuth } = useAuth()
  const user = useServerUser()

  // Función para desconectar WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (socket) {
      console.log('🔌 Desconectando WebSocket...')
      socket.disconnect()
      setSocket(null)
      setState(prev => ({ ...prev, isConnected: false }))
      webSocketConnected.current = false
    }
  }, [socket])

  // Limpiar polling al desmontar
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
      disconnectWebSocket()
    }
  }, [disconnectWebSocket])

  // Función para conectar WebSocket solo cuando sea necesario
  const connectWebSocket = useCallback(async (): Promise<boolean> => {
    if (state.isConnected && socket) {
      return true
    }

    try {
      console.log('🔌 Conectando WebSocket para archivo grande...')
      
      // Validar autenticación
      const isValid = await validateAuth()
      if (!isValid) {
        throw new Error('No autorizado')
      }

      // Crear nueva conexión Socket.IO
      const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}/importacion`, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        autoConnect: false,
        reconnection: false,
        timeout: 10000,
        forceNew: true
      })

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          newSocket.disconnect()
          resolve(false)
        }, 10000)

        newSocket.on('connect', () => {
          clearTimeout(timeout)
          console.log('✅ WebSocket conectado para seguimiento en tiempo real')
          setSocket(newSocket)
          setState(prev => ({ ...prev, isConnected: true }))
          webSocketConnected.current = true
          resolve(true)
        })

        newSocket.on('disconnect', () => {
          console.log('❌ WebSocket desconectado')
          setSocket(null)
          setState(prev => ({ ...prev, isConnected: false }))
          webSocketConnected.current = false
        })

        newSocket.on('connect_error', (error) => {
          clearTimeout(timeout)
          console.error('❌ Error de conexión WebSocket:', error)
          setSocket(null)
          setState(prev => ({ ...prev, isConnected: false }))
          webSocketConnected.current = false
          resolve(false)
        })

        // Conectar manualmente
        newSocket.connect()
      })
    } catch (error) {
      console.error('❌ Error al conectar WebSocket:', error)
      return false
    }
  }, [state.isConnected, socket, validateAuth])

  // Escuchar eventos WebSocket
  useEffect(() => {
    if (!socket || !webSocketConnected.current) return

    const handleProgresoActualizado = (data: unknown) => {
      console.log('📊 Progreso actualizado via WebSocket:', data)
      const progressData = data as {
        trabajoId: string
        progreso?: number
        registrosProcesados?: number
        registrosExitosos?: number
        registrosConError?: number
        totalRegistros?: number
        mensaje?: string
        estado?: 'pendiente' | 'procesando' | 'completado' | 'error' | 'cancelado'
      }
      
      if (progressData.trabajoId === currentTrabajoId.current) {
        setState(prev => ({
          ...prev,
          currentTrabajo: prev.currentTrabajo ? {
            ...prev.currentTrabajo,
            progreso: progressData.progreso || 0,
            registrosProcesados: progressData.registrosProcesados || 0,
            registrosExitosos: progressData.registrosExitosos || 0,
            registrosConError: progressData.registrosConError || 0,
            totalRegistros: progressData.totalRegistros || 0,
            mensaje: progressData.mensaje,
            estado: progressData.estado || 'procesando'
          } : null
        }))
      }
    }

    const handleTrabajoCompletado = (data: unknown) => {
      console.log('✅ Trabajo completado via WebSocket:', data)
      const completionData = data as { trabajoId: string }
      
      if (completionData.trabajoId === currentTrabajoId.current) {
        setState(prev => ({
          ...prev,
          isImporting: false,
          currentTrabajo: null,
          success: 'Importación completada exitosamente'
        }))
        toast.success('Importación completada exitosamente')
        stopPolling()
        disconnectWebSocket()
      }
    }

    const handleTrabajoError = (data: unknown) => {
      console.log('❌ Error en trabajo via WebSocket:', data)
      const errorData = data as { trabajoId: string; mensaje?: string }
      
      if (errorData.trabajoId === currentTrabajoId.current) {
        setState(prev => ({
          ...prev,
          isImporting: false,
          currentTrabajo: null,
          error: errorData.mensaje || 'Error en la importación'
        }))
        toast.error(errorData.mensaje || 'Error en la importación')
        stopPolling()
        disconnectWebSocket()
      }
    }

    socket.on('progreso:actualizado', handleProgresoActualizado)
    socket.on('trabajo:completado', handleTrabajoCompletado)
    socket.on('trabajo:error', handleTrabajoError)

    return () => {
      socket.off('progreso:actualizado', handleProgresoActualizado)
      socket.off('trabajo:completado', handleTrabajoCompletado)
      socket.off('trabajo:error', handleTrabajoError)
    }
  }, [socket, webSocketConnected.current, currentTrabajoId, toast, disconnectWebSocket])

  // Función para determinar el modo de importación basado en el tamaño del archivo
  const determinarModo = useCallback((file: File, tipo: string): 'http' | 'websocket' => {
    const fileSizeMB = file.size / (1024 * 1024)
    
    // Archivos pequeños (< 1MB) usan importación rápida
    if (fileSizeMB < 1) {
      console.log(`📁 Archivo pequeño (${fileSizeMB.toFixed(2)}MB) - Usando importación rápida`)
      return 'http'
    }
    
    // Archivos grandes (≥ 1MB) usan WebSocket
    console.log(`📁 Archivo grande (${fileSizeMB.toFixed(2)}MB) - Usando WebSocket`)
    return 'websocket'
  }, [])

  // Función para importación HTTP (usando importación rápida para archivos pequeños)
  const importarHTTP = useCallback(async (file: File, tipo: string, opciones?: ImportacionOpciones) => {
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('tipo', tipo)
    
    // Agregar opciones si existen
    if (opciones) {
      Object.keys(opciones).forEach(key => {
        const value = opciones[key as keyof ImportacionOpciones]
        if (value !== undefined) {
          formData.append(key, String(value))
        }
      })
    }

    // Usar API route del frontend que hace proxy al backend
    const response = await fetch('/api/importacion/rapida', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || result.message || 'Error en importación rápida')
    }

    // NO mostrar alerts automáticos - el componente manejará la UI
    return result
  }, [])

  // Función para importación WebSocket (usando el endpoint unificado existente)
  const importarWebSocket = useCallback(async (file: File, tipo: string, opciones?: ImportacionOpciones) => {
    // Asegurar conexión WebSocket solo para archivos grandes
    console.log('🔌 Conectando WebSocket para archivo grande...')
    const connected = await connectWebSocket()
    if (!connected) {
      throw new Error('No se pudo conectar WebSocket para seguimiento')
    }
    
    webSocketConnected.current = true
    console.log('✅ WebSocket conectado para seguimiento en tiempo real')

    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('tipo', tipo)

    // Agregar opciones si existen
    if (opciones) {
      Object.keys(opciones).forEach(key => {
        const value = opciones[key as keyof ImportacionOpciones]
        if (value !== undefined) {
          formData.append(key, String(value))
        }
      })
    }

    // Usar API route del frontend que hace proxy al backend
    const response = await fetch('/api/importacion/unificada', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Error en importación WebSocket')
    }

    return await response.json()
  }, [connectWebSocket])

  // Función para iniciar polling como respaldo
  const startPolling = useCallback((trabajoId: string) => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
    }

    currentTrabajoId.current = trabajoId

    pollingInterval.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/importacion/trabajos/${trabajoId}/estado`, {
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          const trabajo = data.trabajo

          setState(prev => ({
            ...prev,
            currentTrabajo: trabajo
          }))

          if (trabajo.estado === 'completado' || trabajo.estado === 'error') {
            stopPolling()
            setState(prev => ({
              ...prev,
              isImporting: false,
              currentTrabajo: null,
              success: trabajo.estado === 'completado' ? 'Importación completada' : null,
              error: trabajo.estado === 'error' ? trabajo.mensaje || 'Error en la importación' : null
            }))

            // NO mostrar alerts automáticos - el componente manejará la UI
          }
        }
      } catch (error) {
        console.error('Error en polling:', error)
      }
    }, 2000) // Polling cada 2 segundos
  }, [])

  // Función para detener polling
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      pollingInterval.current = null
    }
    currentTrabajoId.current = null
  }, [])

  // Función principal de importación
  const importar = useCallback(async (file: File, tipo: string, opciones?: any) => {
    setState(prev => ({ ...prev, isImporting: true, error: null, success: null }))

    try {
      const modo = determinarModo(file, tipo)
      setState(prev => ({ ...prev, modo }))

      console.log(`🚀 Iniciando importación - Modo: ${modo}, Archivo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

      let result: any

      if (modo === 'http') {
        // Importación HTTP (con progreso simulado)
        console.log('⚡ Usando importación HTTP rápida')
        
        // Crear trabajo simulado para mostrar progreso
        const trabajoSimulado = {
          id: `http-${Date.now()}`,
          estado: 'procesando' as const,
          progreso: 0,
          registrosProcesados: 0,
          registrosExitosos: 0,
          registrosConError: 0,
          totalRegistros: 0,
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString(),
          tipo: tipo,
          empresaId: 0,
          usuarioId: 0,
          archivoOriginal: file.name,
          errores: [],
          opciones: opciones || {},
          modo: 'http' as const
        }
        
        setState(prev => ({
          ...prev,
          currentTrabajo: trabajoSimulado
        }))
        
        // Simular progreso más realista
        const simularProgreso = () => {
          let progreso = 0
          const totalSteps = 10 // Dividir en 10 pasos
          const stepTime = 300 // 300ms por paso
          
          const interval = setInterval(() => {
            progreso += 10 // Incremento fijo de 10%
            
            if (progreso >= 90) {
              progreso = 90
              clearInterval(interval)
            }
            
            setState(prev => ({
              ...prev,
              currentTrabajo: prev.currentTrabajo ? {
                ...prev.currentTrabajo,
                progreso: Math.min(progreso, 90),
                registrosProcesados: Math.floor((progreso / 100) * 50), // Simular registros procesados
                totalRegistros: 50 // Valor estimado
              } : null
            }))
          }, stepTime)
          
          return interval
        }
        
        const progresoInterval = simularProgreso()
        
        // Realizar importación
        result = await importarHTTP(file, tipo, opciones)
        
        // Completar progreso con datos reales
        clearInterval(progresoInterval)
        
        // Extraer datos del resultado
        const registrosProcesados = result.registrosProcesados || result.data?.registrosProcesados || 0
        const registrosExitosos = result.registrosExitosos || result.data?.registrosExitosos || 0
        const registrosConError = result.registrosConError || result.data?.registrosConError || 0
        const errores = result.errores || result.data?.errores || []
        const correcciones = result.correcciones || result.data?.correcciones || []
        
        setState(prev => ({
          ...prev,
          isImporting: false,
          success: 'Importación completada exitosamente',
          currentTrabajo: prev.currentTrabajo ? {
            ...prev.currentTrabajo,
            estado: 'completado',
            progreso: 100,
            registrosProcesados,
            registrosExitosos,
            registrosConError,
            totalRegistros: registrosProcesados,
            errores
          } : null
        }))
        
        // Asegurar que el resultado tenga todos los datos necesarios
        result.registrosProcesados = registrosProcesados
        result.registrosExitosos = registrosExitosos
        result.registrosConError = registrosConError
        result.errores = errores
        result.correcciones = correcciones
        
        // NO mostrar alerts automáticos - el componente manejará la UI
        
        // Limpiar estado del WebSocket para archivos HTTP
        disconnectWebSocket()
      } else {
        // Importación WebSocket (con seguimiento)
        console.log('🔌 Usando importación WebSocket con seguimiento')
        result = await importarWebSocket(file, tipo, opciones)
        
        if (result.trabajoId) {
          // Iniciar seguimiento del trabajo
          setState(prev => ({
            ...prev,
            currentTrabajo: {
              id: result.trabajoId,
              estado: 'pendiente',
              progreso: 0,
              registrosProcesados: 0,
              registrosExitosos: 0,
              registrosConError: 0,
              totalRegistros: 0,
              fechaCreacion: new Date().toISOString(),
              fechaActualizacion: new Date().toISOString(),
              tipo: tipo,
              empresaId: 0,
              usuarioId: 0,
              archivoOriginal: file.name,
              errores: [],
              opciones: opciones || {},
              modo: 'websocket'
            }
          }))
          
          // Iniciar polling como respaldo
          startPolling(result.trabajoId)
        }
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.error('❌ Error en importación:', errorMessage)
      
      setState(prev => ({
        ...prev,
        isImporting: false,
        error: errorMessage
      }))
      toast.error(errorMessage)
      throw error
    }
  }, [determinarModo, importarHTTP, importarWebSocket, startPolling, disconnectWebSocket, toast])

  // Función para cancelar trabajo
  const cancelarTrabajo = useCallback(async (trabajoId: string) => {
    try {
      const response = await fetch(`/api/importacion/trabajos/${trabajoId}/cancelar`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        setState(prev => ({
          ...prev,
          isImporting: false,
          currentTrabajo: prev.currentTrabajo ? {
            ...prev.currentTrabajo,
            estado: 'cancelado'
          } : null
        }))
        stopPolling()
        disconnectWebSocket()
        toast.success('Importación cancelada')
      }
    } catch (error) {
      console.error('Error cancelando trabajo:', error)
      toast.error('Error al cancelar la importación')
    }
  }, [stopPolling, disconnectWebSocket, toast])

  // Función para limpiar estado
  const clearState = useCallback(() => {
    setState(prev => ({
      ...prev,
      isImporting: false,
      currentTrabajo: null,
      error: null,
      success: null,
      modo: null
    }))
    stopPolling()
    disconnectWebSocket()
  }, [stopPolling, disconnectWebSocket])

  // Función para limpiar error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Función para limpiar éxito
  const clearSuccess = useCallback(() => {
    setState(prev => ({ ...prev, success: null }))
  }, [])

  // Función para suscribirse a un trabajo
  const subscribeToTrabajo = useCallback((trabajoId: string) => {
    if (socket && webSocketConnected.current) {
      socket.emit('subscribe:trabajos', { trabajoId })
      console.log(`🔔 Suscrito al trabajo: ${trabajoId}`)
    }
  }, [socket])

  // Función para desuscribirse de un trabajo
  const unsubscribeFromTrabajo = useCallback((trabajoId: string) => {
    if (socket && webSocketConnected.current) {
      socket.emit('unsubscribe:trabajos', { trabajoId })
      console.log(`🔕 Desuscrito del trabajo: ${trabajoId}`)
    }
  }, [socket])

  // Función para descargar plantilla
  const descargarPlantilla = useCallback(async (tipo: string) => {
    try {
      const response = await fetch(`/api/importacion/plantillas/${tipo}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `plantilla-${tipo}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Plantilla descargada exitosamente')
      }
    } catch (error) {
      console.error('Error descargando plantilla:', error)
      toast.error('Error al descargar la plantilla')
    }
  }, [toast])

  // Función para descargar reporte de errores
  const descargarReporteErrores = useCallback(async (trabajoId: string) => {
    try {
      const response = await fetch(`/api/importacion/trabajos/${trabajoId}/reporte-errores`, {
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte-errores-${trabajoId}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Reporte de errores descargado')
      }
    } catch (error) {
      console.error('Error descargando reporte:', error)
      toast.error('Error al descargar el reporte')
    }
  }, [toast])

  return {
    state,
    importar,
    cancelarTrabajo,
    clearState,
    clearError,
    clearSuccess,
    subscribeToTrabajo,
    unsubscribeFromTrabajo,
    descargarPlantilla,
    descargarReporteErrores
  }
} 