'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useWebSocket } from '@/context/WebSocketContext'

interface UseSmartWebSocketOptions {
  autoConnect?: boolean
  connectOnMount?: boolean
  lazyConnect?: boolean
}

interface UseSmartWebSocketReturn {
  socket: any
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  needsWebSocket: boolean
  connect: () => Promise<boolean>
  disconnect: () => void
  ensureConnection: () => Promise<boolean>
  isReady: boolean
}

export function useSmartWebSocket(options: UseSmartWebSocketOptions = {}): UseSmartWebSocketReturn {
  const {
    autoConnect = false,
    connectOnMount = false,
    lazyConnect = true
  } = options

  const { socket, isConnected, isConnecting, connect: baseConnect, disconnect: baseDisconnect } = useWebSocket()
  
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [needsWebSocket, setNeedsWebSocket] = useState(false)
  const connectionAttemptsRef = useRef(0)
  const maxConnectionAttempts = 3
  const mountedRef = useRef(false)

  // Detectar si WebSocket es necesario para la ruta actual
  const detectWebSocketNeed = useCallback(() => {
    if (typeof window === 'undefined') return false
    
    const currentPath = window.location.pathname
    const importacionPaths = [
      '/dashboard/importacion',
      '/dashboard/importacion-avanzada',
      '/dashboard/trabajos',
      '/importacion'
    ]
    
    return importacionPaths.some(path => currentPath.includes(path))
  }, [])

  // Función para conectar WebSocket
  const connect = useCallback(async (): Promise<boolean> => {
    if (!mountedRef.current) return false
    
    // Verificar si realmente necesitamos WebSocket
    const shouldConnect = detectWebSocketNeed()
    if (!shouldConnect) {
      console.log('🔍 WebSocket no necesario para esta ruta')
      setNeedsWebSocket(false)
      return false
    }

    setNeedsWebSocket(true)
    setConnectionError(null)

    // Si ya está conectado, no hacer nada
    if (isConnected) {
      console.log('✅ WebSocket ya conectado')
      return true
    }

    // Si está intentando conectar, esperar
    if (isConnecting) {
      console.log('⏳ WebSocket ya intentando conectar')
      return false
    }
    
    // Limitar intentos de conexión
    if (connectionAttemptsRef.current >= maxConnectionAttempts) {
      const errorMsg = 'Máximo de intentos de conexión alcanzado'
      console.error('❌', errorMsg)
      setConnectionError(errorMsg)
      return false
    }
    
    try {
      connectionAttemptsRef.current++
      console.log(`🔌 Intentando conectar WebSocket (intento ${connectionAttemptsRef.current}/${maxConnectionAttempts})`)
      
      baseConnect()
      
      // Esperar hasta 5 segundos para la conexión
      let attempts = 0
      while (!isConnected && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }

      if (isConnected) {
        console.log('✅ WebSocket conectado exitosamente')
        connectionAttemptsRef.current = 0
      return true
      } else {
        throw new Error('Timeout al conectar WebSocket')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al conectar'
      console.error('❌ Error conectando WebSocket:', errorMsg)
      setConnectionError(errorMsg)
      return false
    }
  }, [isConnected, isConnecting, baseConnect, detectWebSocketNeed])

  // Función para desconectar WebSocket
  const disconnect = useCallback(() => {
    if (isConnected) {
      console.log('🔌 Desconectando WebSocket')
      baseDisconnect()
    }
    setConnectionError(null)
    connectionAttemptsRef.current = 0
  }, [isConnected, baseDisconnect])

  // Función para asegurar conexión (para uso en importaciones)
  const ensureConnection = useCallback(async (): Promise<boolean> => {
    if (isConnected) return true
    
    return await connect()
  }, [isConnected, connect])

  // Efecto para detectar cambios en la necesidad de WebSocket
  useEffect(() => {
    const shouldNeedWebSocket = detectWebSocketNeed()
    
    if (shouldNeedWebSocket !== needsWebSocket) {
      setNeedsWebSocket(shouldNeedWebSocket)
      
      // Si ya no necesitamos WebSocket y está conectado, desconectar
      if (!shouldNeedWebSocket && isConnected) {
        console.log('⏸️ Desconectando WebSocket - ya no necesario')
        disconnect()
      }
    }
  }, [detectWebSocketNeed, needsWebSocket, isConnected, disconnect])

  // Efecto para conexión automática (solo si está habilitado)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
    }

    if (autoConnect && needsWebSocket && !isConnected && !isConnecting) {
      console.log('🚀 Conexión automática de WebSocket')
      connect()
    }
  }, [autoConnect, needsWebSocket, isConnected, isConnecting, connect])

  // Efecto para conexión al montar (solo si está habilitado)
  useEffect(() => {
    if (connectOnMount && needsWebSocket && !isConnected && !isConnecting) {
      console.log('🚀 Conexión al montar WebSocket')
      connect()
    }
  }, [connectOnMount, needsWebSocket, isConnected, isConnecting, connect])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (isConnected) {
        disconnect()
      }
    }
  }, [isConnected, disconnect])
  
  return {
    socket,
    isConnected,
    isConnecting,
    connectionError,
    needsWebSocket,
    connect,
    disconnect,
    ensureConnection,
    isReady: mountedRef.current
  }
} 