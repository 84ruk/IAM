'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/useAuth'
import { useServerUser } from '@/context/ServerUserContext'

interface UseLazyWebSocketReturn {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  connect: (signal?: AbortSignal) => Promise<boolean>
  disconnect: () => void
  reconnect: () => Promise<boolean>
}

const maxConnectionAttempts = 3
const connectionTimeout = 10000

export function useLazyWebSocket(): UseLazyWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  const { validateAuth } = useAuth()
  const user = useServerUser()
  const connectionAttempts = useRef(0)
  const abortController = useRef<AbortController | null>(null)

  // Limpiar conexión al desmontar
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [socket])

  const connect = useCallback(async (signal?: AbortSignal): Promise<boolean> => {
    // Si ya está conectado, no hacer nada
    if (isConnected && socket) {
      return true
    }

    // Si ya está conectando, esperar
    if (isConnecting) {
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (isConnected) {
            resolve(true)
          } else if (!isConnecting) {
            resolve(false)
          } else {
            setTimeout(checkConnection, 100)
          }
        }
        checkConnection()
      })
    }

    // Validar autenticación
    if (!user || !user.empresaId) {
      setConnectionError('Usuario no autenticado o sin empresa asignada')
      return false
    }

    setIsConnecting(true)
    setConnectionError(null)
    connectionAttempts.current = 0

    // Crear nuevo AbortController si no se proporciona uno
    if (!signal) {
      abortController.current = new AbortController()
      signal = abortController.current.signal
    }

    try {
      const success = await attemptConnection(signal)
      setIsConnecting(false)
      return success
    } catch (error) {
      setIsConnecting(false)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setConnectionError(errorMessage)
      return false
    }
  }, [isConnected, isConnecting, socket, user])

  const attemptConnection = async (signal: AbortSignal): Promise<boolean> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    
    for (let attempt = 1; attempt <= maxConnectionAttempts; attempt++) {
      if (signal.aborted) {
        throw new Error('Conexión cancelada')
      }

      connectionAttempts.current = attempt

      // Verificar autenticación antes de intentar conectar
      if (!user || !user.empresaId) {
        setConnectionError('Usuario no autenticado')
        return false
      }

      try {
        // Crear nueva instancia de Socket.IO
        const newSocket = io(`${baseUrl}/importacion`, {
          withCredentials: true,
          transports: ['websocket', 'polling'],
          autoConnect: false,
          reconnection: false,
          timeout: connectionTimeout,
          forceNew: true
        })

        // Configurar event listeners
        newSocket.on('connect', () => {
          setIsConnected(true)
          setConnectionError(null)
          connectionAttempts.current = 0
          setSocket(newSocket)
        })

        newSocket.on('disconnect', (reason) => {
          setIsConnected(false)
          setSocket(null)
        })

        newSocket.on('connect_error', (error) => {
          setConnectionError(`Error de conexión: ${error.message}`)
          setIsConnected(false)
        })

        newSocket.on('error', (error) => {
          setConnectionError(`Error: ${error}`)
          setIsConnected(false)
        })

        // Eventos específicos de importación
        newSocket.on('connection:established', (data) => {
          setIsConnected(true)
          setConnectionError(null)
        })

        newSocket.on('connection:error', (data) => {
          setConnectionError(data.message || 'Error de conexión')
          setIsConnected(false)
        })

        // Conectar manualmente
        newSocket.connect()

        // Esperar a que se conecte o falle
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout de conexión'))
          }, connectionTimeout)

          newSocket.once('connect', () => {
            clearTimeout(timeout)
            resolve()
          })

          newSocket.once('connection:established', () => {
            clearTimeout(timeout)
            resolve()
          })

          newSocket.once('connect_error', (error) => {
            clearTimeout(timeout)
            reject(new Error(error.message))
          })

          newSocket.once('connection:error', (data) => {
            clearTimeout(timeout)
            reject(new Error(data.message || 'Error de conexión'))
          })

          if (signal.aborted) {
            clearTimeout(timeout)
            reject(new Error('Conexión cancelada'))
          }
        })

        return true

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        
        if (attempt === maxConnectionAttempts) {
          throw new Error(`Error de conexión después de ${maxConnectionAttempts} intentos: ${errorMessage}`)
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }

    return false
  }

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
      setIsConnecting(false)
      setConnectionError(null)
    }
    
    if (abortController.current) {
      abortController.current.abort()
      abortController.current = null
    }
  }, [socket])

  const reconnect = useCallback(async (): Promise<boolean> => {
    disconnect()
    return await connect()
  }, [disconnect, connect])

  return {
    socket,
    isConnected,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    reconnect
  }
} 