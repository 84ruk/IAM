'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useServerUser } from './ServerUserContext'

interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => void
  disconnect: () => void
  reconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const user = useServerUser()
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const isMountedRef = useRef(false)

  // Verificar si WebSocket es necesario para la ruta actual
  const isWebSocketNeeded = useCallback(() => {
    if (typeof window === 'undefined') return false
    
    const currentPath = window.location.pathname
    // Solo conectar en rutas específicas de importación
    return currentPath.includes('/importacion') || 
           currentPath.includes('/dashboard/importacion') ||
           currentPath.includes('/dashboard/importacion-avanzada') ||
           currentPath.includes('/dashboard/trabajos')
  }, [])

  // Función para conectar WebSocket
  const connect = useCallback(() => {
    if (!isMountedRef.current) {
      return
    }

    if (isConnecting || isConnected) {
      return
    }

    // ✅ Verificar que el usuario esté autenticado y tenga empresaId
    if (!user || !user.empresaId) {
      console.log('WebSocket: Usuario no autenticado o sin empresa, no conectando');
      return
    }

    // ✅ Verificar que estemos en una ruta que necesite WebSocket
    if (!isWebSocketNeeded()) {
      console.log('WebSocket: No necesario para esta ruta, no conectando');
      return
    }

    try {
      setIsConnecting(true)
      
      const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      
      // Configuración mejorada con autenticación estándar
      const newSocket = io(`${socketUrl}/importacion`, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        withCredentials: true, // Enviar cookies automáticamente (igual que el resto del código)
      })

      // Configurar eventos del socket
      newSocket.on('connect', () => {
        console.log('WebSocket: Conectado exitosamente');
        setIsConnected(true)
        setIsConnecting(false)
        reconnectAttemptsRef.current = 0
      })

      newSocket.on('disconnect', (reason) => {
        console.log('WebSocket: Desconectado:', reason);
        setIsConnected(false)
        setIsConnecting(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket: Error de conexión:', error);
        setIsConnected(false)
        setIsConnecting(false)
      })

      newSocket.on('connection:error', (data) => {
        console.error('WebSocket: Error de autenticación:', data);
        setIsConnected(false)
        setIsConnecting(false)
        // No intentar reconectar si hay error de autenticación
        newSocket.disconnect()
      })

      setSocket(newSocket)
    } catch (error) {
      console.error('WebSocket: Error al crear conexión:', error);
      setIsConnecting(false)
    }
  }, [user, isConnecting, isConnected, isWebSocketNeeded])

  // Función para desconectar WebSocket
  const disconnect = useCallback(() => {
    if (socket) {
      console.log('WebSocket: Desconectando manualmente');
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
      setIsConnecting(false)
      reconnectAttemptsRef.current = 0
    }
  }, [socket])

  // Función para reconectar WebSocket
  const reconnect = useCallback(() => {
    console.log('WebSocket: Intentando reconectar');
    disconnect()
    setTimeout(() => {
      connect()
    }, 1000)
  }, [disconnect, connect])

  // Efecto para manejar la conexión automática - DESHABILITADO TEMPORALMENTE
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
    }

    // DESHABILITADO: No conectar automáticamente para evitar reconexiones infinitas
    // const needsWebSocket = isWebSocketNeeded()
    // const userAuthenticated = user && user.empresaId

    // Solo conectar si es necesario y el usuario está autenticado
    // if (userAuthenticated && needsWebSocket && !isConnected && !isConnecting) {
    //   console.log('WebSocket: Iniciando conexión automática');
    //   connect()
    // }

    // Desconectar si ya no es necesario
    // if ((!userAuthenticated || !needsWebSocket) && isConnected) {
    //   console.log('WebSocket: Desconectando - usuario no autenticado o ruta no necesita WebSocket');
    //   disconnect()
    // }

    return () => {
      // Cleanup al desmontar
      if (socket) {
        console.log('WebSocket: Cleanup al desmontar');
        socket.disconnect()
      }
    }
  }, [user, isConnected, isConnecting, isWebSocketNeeded, connect, disconnect, socket])

  // Efecto para limpiar al desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (socket) {
        socket.disconnect()
      }
    }
  }, [socket])

  const contextValue: WebSocketContextType = {
    socket,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    reconnect
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket debe ser usado dentro de WebSocketProvider')
  }
  return context
} 