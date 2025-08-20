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
  empresaId: number
}

interface SensorState {
  totalLecturas: number
  ubicacionId: number
  lecturas: SensorReading[]
}

interface Alerta {
  id: number
  sensorId: number
  tipo: string
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  mensaje: string
  fecha: Date
  estado?: string
}

interface UseSensoresCompletoReturn {
  // WebSocket
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  
  // Datos
  sensorReadings: SensorReading[]
  historicalReadings: SensorReading[]
  sensorState: SensorState | null
  
  // Alertas
  alerts: Alerta[]
  latestAlert: Alerta | null
  activeAlerts: Alerta[]
  resolvedAlerts: Alerta[]
  
  // Estado de carga
  isLoadingHistorical: boolean
  historicalError: string | null
  
  // Funciones
  connect: (ubicacionId?: number) => Promise<boolean>
  disconnect: () => void
  subscribeToLocation: (ubicacionId: number) => void
  subscribeToSensor: (sensorId: number) => void
  loadHistoricalData: (sensorId: number, limit?: number) => Promise<void>
  refreshHistoricalData: () => Promise<void>
  resolveAlert: (alertId: number) => void
}

export function useSensoresCompleto(): UseSensoresCompletoReturn {
  const user = useServerUser()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  
  // Datos en tiempo real
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([])
  
  // Datos históricos
  const [historicalReadings, setHistoricalReadings] = useState<SensorReading[]>([])
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)
  const [historicalError, setHistoricalError] = useState<string | null>(null)
  
  // Estado del sistema
  const [sensorState, setSensorState] = useState<SensorState | null>(null)
  
  // Alertas
  const [alerts, setAlerts] = useState<Alerta[]>([])
  const [latestAlert, setLatestAlert] = useState<Alerta | null>(null)
  const [activeAlerts, setActiveAlerts] = useState<Alerta[]>([])
  const [resolvedAlerts, setResolvedAlerts] = useState<Alerta[]>([])
  
  const socketRef = useRef<Socket | null>(null)
  const connectionAttemptsRef = useRef(0)
  const currentSensorIdRef = useRef<number | null>(null)
  const seenIdsRef = useRef<Set<string | number>>(new Set())

  const connect = useCallback((ubicacionId?: number): Promise<boolean> => {
    if (isConnecting || isConnected) {
      console.log('⚠️ WebSocket ya está conectando o conectado')
      return Promise.resolve(true)
    }

    try {
      setIsConnecting(true)
      connectionAttemptsRef.current++

      const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      console.log('🔌 Conectando WebSocket Sensores...')
      
      const newSocket = io(`${socketUrl}/sensores`, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        withCredentials: true,
        auth: { token: localStorage.getItem('jwt') || sessionStorage.getItem('jwt') },
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

        newSocket.on('disconnect', () => {
          console.log('❌ WebSocket Sensores desconectado')
          setSocket(null)
          socketRef.current = null
          setIsConnected(false)
          setIsConnecting(false)
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
            
            // Agregar a lecturas en tiempo real
            setSensorReadings(prev => [lectura, ...prev.slice(0, 99)])
            
            // Agregar al histórico también
            setHistoricalReadings(prev => [lectura, ...prev.slice(0, 99)])
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
            
            // Agregar a lecturas en tiempo real
            setSensorReadings(prev => [lectura, ...prev.slice(0, 99)])
            
            // Agregar al histórico también
            setHistoricalReadings(prev => [lectura, ...prev.slice(0, 99)])
          }
        })

        newSocket.on('lectura-sensor', (data: SensorReading) => {
          console.log('📊 Lectura de sensor específico:', data)
          const key = (data as SensorReading & { id?: string }).id ?? `${data.sensorId}-${(data as SensorReading & { fecha: string }).fecha}`
          if (seenIdsRef.current.has(key)) return
          seenIdsRef.current.add(key)
          
          // Agregar a lecturas en tiempo real
          setSensorReadings(prev => [data, ...prev.slice(0, 99)])
          
          // Agregar al histórico también
          setHistoricalReadings(prev => [data, ...prev.slice(0, 99)])
        })

        newSocket.on('lectura-ubicacion', (data: SensorReading) => {
          console.log('📊 Lectura de ubicación:', data)
          const key = (data as SensorReading & { id?: string }).id ?? `${data.sensorId}-${(data as SensorReading & { fecha: string }).fecha}`
          if (seenIdsRef.current.has(key)) return
          seenIdsRef.current.add(key)
          
          // Agregar a lecturas en tiempo real
          setSensorReadings(prev => [data, ...prev.slice(0, 99)])
          
          // Agregar al histórico también
          setHistoricalReadings(prev => [data, ...prev.slice(0, 99)])
        })

        newSocket.on('estado-sensores', (data: { tipo: string; data: SensorState }) => {
          console.log('📊 Estado de sensores:', data)
          if (data.tipo === 'LECTURAS_MULTIPLES') {
            setSensorState(data.data)
          }
        })

        // 🚨 NUEVO: Eventos de alertas
        newSocket.on('nueva-alerta', (data: { tipo: string; data: unknown }) => {
          console.log('🚨 Nueva alerta recibida:', data)
          
          if (data.tipo === 'ALERTA' && data.data) {
            const alerta: Alerta = {
              id: (data.data as { id?: number }).id || Date.now(),
              sensorId: (data.data as { sensorId: number }).sensorId,
              tipo: (data.data as { tipo: string }).tipo || 'ALERTA_SENSOR',
              severidad: ((): 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' => {
                const sev = (data.data as { severidad?: string }).severidad;
                if (sev === 'BAJA' || sev === 'MEDIA' || sev === 'ALTA' || sev === 'CRITICA') return sev;
                return 'MEDIA';
              })(),
              mensaje: (data.data as { mensaje: string }).mensaje || 'Alerta de sensor',
              fecha: new Date((data.data as { fecha: string }).fecha || Date.now()),
              estado: 'ACTIVA'
            }
            
            // Agregar a la lista de alertas
            setAlerts(prev => [alerta, ...prev])
            setLatestAlert(alerta)
            setActiveAlerts(prev => [alerta, ...prev])
            
            console.log('🚨 Alerta agregada:', alerta)
          }
        })

        // Evento específico de alertas del sistema
        newSocket.on('estado-sensores', (data: unknown) => {
          if ((data as { tipo: string }).tipo === 'ALERTA') {
            console.log('🚨 Alerta del sistema recibida:', data)
            
            const alerta: Alerta = {
              id: (data as { alerta?: { id?: number } }).alerta?.id || Date.now(),
              sensorId: (data as { alerta?: { sensorId: number } }).alerta?.sensorId || currentSensorIdRef.current || 0,
              tipo: (data as { alerta?: { tipo: string } }).alerta?.tipo || 'ALERTA_SISTEMA',
              severidad: ((): 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' => {
                const sev = (data as { alerta?: { severidad?: string } }).alerta?.severidad;
                if (sev === 'BAJA' || sev === 'MEDIA' || sev === 'ALTA' || sev === 'CRITICA') return sev;
                return 'MEDIA';
              })(),
              mensaje: (data as { alerta?: { mensaje: string } }).alerta?.mensaje || 'Alerta del sistema',
              fecha: new Date((data as { alerta?: { fecha: string } }).alerta?.fecha || Date.now()),
              estado: 'ACTIVA'
            }
            
            // Agregar a la lista de alertas
            setAlerts(prev => [alerta, ...prev])
            setLatestAlert(alerta)
            setActiveAlerts(prev => [alerta, ...prev])
            
            console.log('🚨 Alerta del sistema agregada:', alerta)
          }
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
      console.error('❌ Error al conectar WebSocket Sensores:', error)
      setIsConnecting(false)
      return Promise.resolve(false)
    }
  }, [isConnecting, isConnected])

  useEffect(() => {
    if (user && !isConnecting && !isConnected) {
      connect()
    }
  }, [user, connect, isConnected, isConnecting, user])

  // Función para cargar datos históricos
  const loadHistoricalData = useCallback(async (sensorId: number, limit: number = 100) => {
    try {
      setIsLoadingHistorical(true)
      setHistoricalError(null)
      
      console.log(`📊 Cargando datos históricos para sensor ${sensorId}...`)
      
      // Intentar cargar desde el backend local primero
      const localResponse = await fetch(`http://localhost:3001/sensores/lecturas?sensorId=${sensorId}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt') || sessionStorage.getItem('jwt') || ''}`,
          'Content-Type': 'application/json'
        }
      })

      if (localResponse.ok) {
        const localData = await localResponse.json()
        if (localData && localData.length > 0) {
          console.log(`✅ Datos históricos cargados desde backend local: ${localData.length} lecturas`)
          setHistoricalReadings(localData)
          return
        }
      }

      // Si no hay datos locales, generar datos simulados con alertas
      console.log('⚠️ No hay datos locales, generando datos simulados con alertas...')
      
      const mockHistoricalData: SensorReading[] = generateMockHistoricalDataWithAlerts(sensorId, limit)
      setHistoricalReadings(mockHistoricalData)
      
      console.log(`✅ Datos históricos simulados cargados: ${mockHistoricalData.length} lecturas`)
      
    } catch (error: unknown) {
      console.error('❌ Error cargando datos históricos:', error)
      if (error && typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
        setHistoricalError((error as { message: string }).message);
      } else {
        setHistoricalError('Error cargando datos históricos');
      }
      
      // En caso de error, generar datos de prueba
      const fallbackData = generateMockHistoricalDataWithAlerts(sensorId, 50)
      setHistoricalReadings(fallbackData)
      console.log(`✅ Datos de fallback cargados: ${fallbackData.length} lecturas`)
    } finally {
      setIsLoadingHistorical(false)
    }
  }, [])

  // Función para refrescar datos históricos
  const refreshHistoricalData = useCallback(async () => {
    if (currentSensorIdRef.current) {
      await loadHistoricalData(currentSensorIdRef.current)
    }
  }, [loadHistoricalData])

  // Generar datos históricos simulados CON ALERTAS para desarrollo
  const generateMockHistoricalDataWithAlerts = (sensorId: number, count: number): SensorReading[] => {
    const data: SensorReading[] = []
    const now = new Date()
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)) // Una hora atrás por cada lectura
      const valor = 20 + Math.random() * 10 + Math.sin(i * 0.1) * 2 // Temperatura variable entre 20-30°C
      
      // Generar alertas basadas en umbrales
      let estado: 'NORMAL' | 'ALERTA' | 'CRITICO' = 'NORMAL'
      if (valor > 28) {
        estado = 'CRITICO'
      } else if (valor > 25) {
        estado = 'ALERTA'
      }
      
      data.push({
        id: 2000 + i,
        tipo: 'TEMPERATURA',
        valor: Math.round(valor * 10) / 10, // Redondear a 1 decimal
        unidad: '°C',
        fecha: timestamp,
        estado: estado,
        sensorId: sensorId,
        ubicacionId: 2,
        empresaId: 2
      })
    }
    
    return data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) // Más recientes primero
  }

  // Función para resolver alerta
  const resolveAlert = useCallback((alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, estado: 'RESUELTA' }
        : alert
    ))
    
    // Mover a alertas resueltas
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId))
    setResolvedAlerts(prev => {
      const alerta = alerts.find(a => a.id === alertId)
      return alerta ? [alerta, ...prev] : prev
    })
  }, [alerts])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      setSocket(null)
      socketRef.current = null
      setIsConnected(false)
      setIsConnecting(false)
      connectionAttemptsRef.current = 0
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
      setHistoricalReadings([])
      setAlerts([])
      setLatestAlert(null)
      setActiveAlerts([])
      setResolvedAlerts([])
      
      // Cargar datos históricos del nuevo sensor
      loadHistoricalData(sensorId)
      
      socketRef.current.emit('suscribirse-sensor', { sensorId })
    }
  }, [isConnected, loadHistoricalData])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  return {
    socket,
    isConnected,
    isConnecting,
    sensorReadings,
    historicalReadings,
    sensorState,
    alerts,
    latestAlert,
    activeAlerts,
    resolvedAlerts,
    isLoadingHistorical,
    historicalError,
    connect,
    disconnect,
    subscribeToLocation,
    subscribeToSensor,
    loadHistoricalData,
    refreshHistoricalData,
    resolveAlert,
  }
}
