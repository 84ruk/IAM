'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useServerUser } from '@/context/ServerUserContext'

interface SensorReading {
  id: number
  tipo: string
  valor: number
  unidad: string
  fecha: Date
  estado: 'NORMAL' | 'ALERTA' | 'CRITICO'
  sensorId: number
  ubicacionId: number
}

interface SensorState {
  totalLecturas: number
  ubicacionId: number
  lecturas: SensorReading[]
}

interface UseSensoresWebSocketReturn {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  sensorReadings: SensorReading[]
  sensorState: SensorState | null
  alerts: Array<{ sensorId?: number; tipo: string; severidad?: string; mensaje?: string; fecha?: string }>
  latestAlert: { sensorId?: number; tipo: string; severidad?: string; mensaje?: string; fecha?: string } | null
  connect: (ubicacionId?: number) => Promise<boolean>
  disconnect: () => void
  subscribeToLocation: (ubicacionId: number) => void
  subscribeToSensor: (sensorId: number) => void
}

export function useSensoresWebSocket(): UseSensoresWebSocketReturn {
  const user = useServerUser()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([])
  const [sensorState, setSensorState] = useState<SensorState | null>(null)
  const [alerts, setAlerts] = useState<Array<{ sensorId?: number; tipo: string; severidad?: string; mensaje?: string; fecha?: string }>>([])
  const [latestAlert, setLatestAlert] = useState<{ sensorId?: number; tipo: string; severidad?: string; mensaje?: string; fecha?: string } | null>(null)
  
  const socketRef = useRef<Socket | null>(null)
  const connectionAttemptsRef = useRef(0)
  const currentSensorIdRef = useRef<number | null>(null)
  const seenIdsRef = useRef<Set<string | number>>(new Set())
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  const connect = useCallback((ubicacionId?: number): Promise<boolean> => {
    // Evitar múltiples conexiones simultáneas
    if (isConnecting || isConnected || socketRef.current) {
      console.log('⚠️ WebSocket ya está conectando, conectado o existe una conexión activa')
      return Promise.resolve(isConnected)
    }

    try {
      setIsConnecting(true)
      connectionAttemptsRef.current++

      const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      // Extraer JWT de cookie explícitamente para el handshake auth
      const jwtCookie = typeof document !== 'undefined' ? document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('jwt=')) : undefined
      const jwt = jwtCookie ? decodeURIComponent(jwtCookie.split('=')[1]) : undefined
      
      console.log('🔌 Conectando WebSocket Sensores...')
      
      const newSocket = io(`${socketUrl}/sensores`, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: false, // Deshabilitar reconexión automática para controlarla manualmente
        withCredentials: true,
        auth: jwt ? { token: jwt } : undefined,
      })

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          newSocket.disconnect()
          setIsConnecting(false)
          resolve(false)
        }, 10000)

        newSocket.on('connect', () => {
          clearTimeout(timeout)
          console.log('✅ WebSocket Sensores conectado')
          setSocket(newSocket)
          socketRef.current = newSocket
          setIsConnected(true)
          setIsConnecting(false)
          connectionAttemptsRef.current = 0
          resolve(true)
        })

        newSocket.on('disconnect', (reason) => {
          console.log('❌ WebSocket Sensores desconectado:', reason)
          setSocket(null)
          socketRef.current = null
          setIsConnected(false)
          setIsConnecting(false)
          
          // Solo reconectar si no fue una desconexión manual y no hemos excedido los intentos
          if (reason !== 'io client disconnect' && connectionAttemptsRef.current < 3) { // maxConnectionAttempts removed
            console.log(`🔄 Programando reconexión en 3 segundos... (intento ${connectionAttemptsRef.current + 1}/3)`) // maxConnectionAttempts removed
            reconnectTimeoutRef.current = setTimeout(() => {
              if (!isConnected && !isConnecting) {
                connect()
              }
            }, 3000)
          }
        })

        newSocket.on('connect_error', (error) => {
          clearTimeout(timeout)
          console.error('❌ Error de conexión WebSocket Sensores:', error)
          setSocket(null)
          socketRef.current = null
          setIsConnected(false)
          setIsConnecting(false)
          resolve(false)
        })

        // Eventos de sensores
        newSocket.on('nueva_lectura', (data: { lectura: SensorReading; timestamp: string }) => {
          console.log('📊 Nueva lectura recibida:', data)
          const lectura = data.lectura
          if (lectura) {
            // Si hay un sensor suscrito, solo acumular las suyas
            if (currentSensorIdRef.current && lectura.sensorId !== currentSensorIdRef.current) return
            const key = lectura.id ?? `${lectura.sensorId}-${lectura.fecha}`
            if (seenIdsRef.current.has(key)) return
            seenIdsRef.current.add(key)
            setSensorReadings(prev => [lectura, ...prev.slice(0, 99)]) // Mantener últimas 100 lecturas
          }
        })

        // Evento desde ESP32Service
        newSocket.on('nueva-lectura', (data: { tipo: string; data: SensorReading }) => {
          console.log('📊 Nueva lectura ESP32 recibida:', data)
          if (data.tipo === 'LECTURA_SENSOR') {
            const lectura = data.data
            // Si hay un sensor suscrito, solo acumular las suyas
            if (currentSensorIdRef.current && lectura.sensorId !== currentSensorIdRef.current) return
            const key = lectura.id ?? `${lectura.sensorId}-${lectura.fecha}`
            if (seenIdsRef.current.has(key)) return
            seenIdsRef.current.add(key)
            setSensorReadings(prev => [lectura, ...prev.slice(0, 99)]) // Mantener últimas 100 lecturas
          }
        })

        newSocket.on('lectura-sensor', (data: SensorReading) => {
          console.log('📊 Lectura de sensor específico:', data)
          const key = (data as SensorReading & { id?: string }).id ?? `${data.sensorId}-${(data as SensorReading & { fecha: string }).fecha}`
          if (seenIdsRef.current.has(key)) return
          seenIdsRef.current.add(key)
          setSensorReadings(prev => [data, ...prev.slice(0, 99)])
        })

        newSocket.on('lectura-ubicacion', (data: SensorReading) => {
          console.log('📊 Lectura de ubicación:', data)
          const key = (data as SensorReading & { id?: string }).id ?? `${data.sensorId}-${(data as SensorReading & { fecha: string }).fecha}`
          if (seenIdsRef.current.has(key)) return
          seenIdsRef.current.add(key)
          setSensorReadings(prev => [data, ...prev.slice(0, 99)])
        })

        newSocket.on('estado-sensores', (data: { tipo: string; data: SensorState }) => {
          console.log('📊 Estado de sensores:', data)
          if (data.tipo === 'LECTURAS_MULTIPLES') {
            setSensorState(data.data)
          }
        })

        newSocket.on('nueva-alerta', (data: { tipo: string; data: unknown }) => {
          console.log('🚨 Nueva alerta:', data)
          const payload = (data?.data || {}) as { sensorId?: number; severidad?: string; mensaje?: string; fecha?: string }
          const alertObj = { sensorId: payload.sensorId, tipo: data.tipo, severidad: payload.severidad, mensaje: payload.mensaje, fecha: payload.fecha }
          setLatestAlert(alertObj)
          setAlerts(prev => [alertObj, ...prev].slice(0, 50))
        })

        newSocket.on('suscripcion-exitosa', (data: unknown) => {
          console.log('✅ Suscripción exitosa:', data)
        })

        newSocket.on('error', (error: unknown) => {
          console.error('❌ Error WebSocket Sensores:', error)
        })

        // Conectar manualmente
        newSocket.connect()
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ Error al conectar WebSocket Sensores:', error.message)
      } else {
        console.error('❌ Error desconocido al conectar WebSocket Sensores:', error)
      }
      setIsConnecting(false)
      return Promise.resolve(false)
    }
  }, [isConnected, isConnecting]) // Dependencias estabilizadas

  const disconnect = useCallback(() => {
    // Limpiar timeout de reconexión
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect()
      setSocket(null)
      socketRef.current = null
      setIsConnected(false)
      setIsConnecting(false)
      connectionAttemptsRef.current = 0
      isInitializedRef.current = false
    }
  }, [])

  const subscribeToLocation = useCallback((ubicacionId: number) => {
    if (socketRef.current && isConnected) {
      console.log(`🔔 Suscribiendo a ubicación: ${ubicacionId}`)
      socketRef.current.emit('suscribirse-ubicacion', { ubicacionId })
    }
  }, [isConnected])

  const subscribeToSensor = useCallback((sensorId: number) => {
    if (socketRef.current && isConnected) {
      console.log(`🔔 Suscribiendo a sensor: ${sensorId}`)
      currentSensorIdRef.current = sensorId
      // Limpiar lecturas previas al cambiar de sensor
      setSensorReadings([])
      // Limpiar alertas recientes para nuevo contexto
      setLatestAlert(null)
      socketRef.current.emit('suscribirse-sensor', { sensorId })
    }
  }, [isConnected])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // Conectar automáticamente solo una vez cuando el usuario esté disponible
    if (user && !isInitializedRef.current && !isConnecting && !isConnected) {
      isInitializedRef.current = true
      connect()
    }
  }, [connect, isConnected, isConnecting])

  return {
    socket,
    isConnected,
    isConnecting,
    sensorReadings,
    sensorState,
    alerts,
    latestAlert,
    connect,
    disconnect,
    subscribeToLocation,
    subscribeToSensor,
  }
}
