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

interface UmbralesSensor {
  temperaturaMin?: number
  temperaturaMax?: number
  humedadMin?: number
  humedadMax?: number
  pesoMin?: number
  pesoMax?: number
  presionMin?: number
  presionMax?: number
  alertasActivas: boolean
  mensajeAlerta?: string
  mensajeCritico?: string
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  intervaloVerificacionMinutos: number
}

interface AlertaBackend {
  id: number
  sensorId: number
  tipo: string
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  mensaje: string
  estado: 'ACTIVA' | 'RESUELTA' | 'ESCALADA'
  fechaCreacion: Date
  fechaResolucion?: Date
  empresaId: number
  umbralesExcedidos: string[]
  recomendaciones: string[]
}

interface UseSensoresBackendReturn {
  // WebSocket
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  
  // Datos
  sensorReadings: SensorReading[]
  historicalReadings: SensorReading[]
  sensorState: SensorState | null
  
  // Alertas del Backend
  alertasBackend: AlertaBackend[]
  alertasActivas: AlertaBackend[]
  alertasResueltas: AlertaBackend[]
  latestAlert: AlertaBackend | null
  
  // Umbrales del Backend
  umbralesSensor: UmbralesSensor | null
  isLoadingUmbrales: boolean
  
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
  loadUmbralesSensor: (sensorId: number) => Promise<void>
  resolverAlerta: (alertId: number, comentario?: string) => Promise<boolean>
  obtenerResumenAlertas: () => Promise<void>
}

export function useSensoresBackend(): UseSensoresBackendReturn {
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
  
  // Alertas del Backend
  const [alertasBackend, setAlertasBackend] = useState<AlertaBackend[]>([])
  const [alertasActivas, setAlertasActivas] = useState<AlertaBackend[]>([])
  const [alertasResueltas, setAlertasResueltas] = useState<AlertaBackend[]>([])
  const [latestAlert, setLatestAlert] = useState<AlertaBackend | null>(null)
  
  // Umbrales del Backend
  const [umbralesSensor, setUmbralesSensor] = useState<UmbralesSensor | null>(null)
  const [isLoadingUmbrales, setIsLoadingUmbrales] = useState(false)
  
  const socketRef = useRef<Socket | null>(null)
  const connectionAttemptsRef = useRef(0)
  const currentSensorIdRef = useRef<number | null>(null)
  const seenIdsRef = useRef<Set<string | number>>(new Set())
  const maxConnectionAttempts = 3

  // Función para conectar WebSocket
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
        reconnectionDelay: 2000,
        query: ubicacionId ? { ubicacionId } : undefined,
      })

      setSocket(newSocket)

      newSocket.on('connect', () => {
        setIsConnected(true)
        setIsConnecting(false)
        setHistoricalError(null)
        connectionAttemptsRef.current = 0
        console.log('✅ WebSocket Sensores conectado')
      })

      newSocket.on('disconnect', () => {
        setIsConnected(false)
        setIsConnecting(false)
        setHistoricalError('Desconectado del servidor de sensores')
        console.log('❌ WebSocket Sensores desconectado')
      })

      newSocket.on('connect_error', (err: unknown) => {
        setIsConnected(false)
        setIsConnecting(false)
        if (err instanceof Error) {
          setHistoricalError('Error de conexión con el servidor de sensores: ' + err.message)
          console.error('❌ Error de conexión WebSocket Sensores', err)
        } else {
          setHistoricalError('Error de conexión con el servidor de sensores')
          console.error('❌ Error de conexión WebSocket Sensores', err)
        }
      })

      return Promise.resolve(true)
    } catch (err) {
      setIsConnecting(false)
      setIsConnected(false)
      setHistoricalError('Error inesperado al conectar WebSocket')
      return Promise.resolve(false)
    }
  }, [isConnecting, isConnected])

  // Conectar automáticamente cuando el usuario esté disponible
  useEffect(() => {
    if (user && !isConnecting && !isConnected) {
      connect()
    }
  }, [user, connect, isConnecting, isConnected])

  // Función para cargar umbrales del sensor desde el backend
  const loadUmbralesSensor = useCallback(async (sensorId: number) => {
    try {
      setIsLoadingUmbrales(true)
      console.log(`🔧 Cargando umbrales del sensor ${sensorId} desde el backend...`)
      
      // Intentar obtener umbrales configurados del sensor
      const response = await fetch(`http://localhost:3001/sensores/${sensorId}/umbrales`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt') || sessionStorage.getItem('jwt') || ''}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const umbrales = await response.json()
        console.log(`✅ Umbrales cargados desde backend:`, umbrales)
        setUmbralesSensor(umbrales)
        return
      }

      // Si no hay endpoint específico, usar configuración por defecto del backend
      console.log('⚠️ No hay umbrales configurados, usando configuración por defecto del backend...')
      
      // Los umbrales por defecto están en el backend:
      // TEMPERATURA: min=15°C, max=25°C
      // HUMEDAD: min=40%, max=60%
      // PESO: min=100kg, max=900kg
      // PRESION: min=1000, max=1500
      
      const umbralesPorDefecto: UmbralesSensor = {
        temperaturaMin: 15,
        temperaturaMax: 25,
        humedadMin: 40,
        humedadMax: 60,
        pesoMin: 100,
        pesoMax: 900,
        presionMin: 1000,
        presionMax: 1500,
        alertasActivas: true,
        severidad: 'MEDIA',
        intervaloVerificacionMinutos: 5
      }
      
      setUmbralesSensor(umbralesPorDefecto)
      console.log(`✅ Umbrales por defecto del backend configurados`)
      
    } catch (error) {
      console.error('❌ Error cargando umbrales:', error)
      
      // En caso de error, usar umbrales por defecto
      const umbralesPorDefecto: UmbralesSensor = {
        temperaturaMin: 15,
        temperaturaMax: 25,
        humedadMin: 40,
        humedadMax: 60,
        pesoMin: 100,
        pesoMax: 900,
        presionMin: 1000,
        presionMax: 1500,
        alertasActivas: true,
        severidad: 'MEDIA',
        intervaloVerificacionMinutos: 5
      }
      
      setUmbralesSensor(umbralesPorDefecto)
      console.log(`✅ Umbrales por defecto configurados como fallback`)
    } finally {
      setIsLoadingUmbrales(false)
    }
  }, [])

  // Función para cargar datos históricos desde el backend
  const loadHistoricalData = useCallback(async (sensorId: number, limit: number = 100) => {
    try {
      setIsLoadingHistorical(true)
      setHistoricalError(null)
      
      console.log(`📊 Cargando datos históricos para sensor ${sensorId} desde el backend...`)
      
      // Intentar cargar desde el backend local
      const localResponse = await fetch(`http://localhost:3001/sensores/lecturas?sensorId=${sensorId}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt') || sessionStorage.getItem('jwt') || ''}`,
          'Content-Type': 'application/json'
        }
      })

      if (localResponse.ok) {
        const localData = await localResponse.json()
        if (localData && localData.length > 0) {
          console.log(`✅ Datos históricos cargados desde backend: ${localData.length} lecturas`)
          setHistoricalReadings(localData)
          return
        }
      }

      // Si no hay datos locales, generar datos basados en umbrales del backend
      console.log('⚠️ No hay datos locales, generando datos basados en umbrales del backend...')
      
      if (umbralesSensor) {
        const mockData = generateDataBasedOnBackendUmbrales(sensorId, umbralesSensor, limit)
        setHistoricalReadings(mockData)
        console.log(`✅ Datos generados basados en umbrales del backend: ${mockData.length} lecturas`)
      } else {
        // Esperar a que se carguen los umbrales
        await loadUmbralesSensor(sensorId)
        const mockData = generateDataBasedOnBackendUmbrales(sensorId, umbralesSensor!, limit)
        setHistoricalReadings(mockData)
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos históricos:', error)
      setHistoricalError('Error cargando datos históricos')
      
      // En caso de error, generar datos de prueba
      const fallbackData = generateDataBasedOnBackendUmbrales(sensorId, umbralesSensor || getDefaultUmbrales(), 50)
      setHistoricalReadings(fallbackData)
      console.log(`✅ Datos de fallback cargados: ${fallbackData.length} lecturas`)
    } finally {
      setIsLoadingHistorical(false)
    }
  }, [umbralesSensor, loadUmbralesSensor])

  // Generar datos basados en umbrales del backend
  const generateDataBasedOnBackendUmbrales = (sensorId: number, umbrales: UmbralesSensor, count: number): SensorReading[] => {
    const data: SensorReading[] = []
    const now = new Date()
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)) // Una hora atrás por cada lectura
      
      // Generar valor basado en umbrales del backend
      let valor: number
      let estado: 'NORMAL' | 'ALERTA' | 'CRITICO' = 'NORMAL'
      
      if (umbrales.temperaturaMax !== undefined) {
        // Simular temperatura con variación natural
        const baseTemp = (umbrales.temperaturaMin || 20) + (umbrales.temperaturaMax - (umbrales.temperaturaMin || 20)) / 2
        valor = baseTemp + Math.sin(i * 0.1) * 5 + Math.random() * 3
        
        // Aplicar lógica de alertas del backend
        if (valor > umbrales.temperaturaMax + 3) {
          estado = 'CRITICO'
        } else if (valor > umbrales.temperaturaMax) {
          estado = 'ALERTA'
        } else if (umbrales.temperaturaMin && valor < umbrales.temperaturaMin) {
          estado = 'ALERTA'
        }
      } else {
        // Fallback si no hay umbrales específicos
        valor = 20 + Math.random() * 10
      }
      
      data.push({
        id: 2000 + i,
        tipo: 'TEMPERATURA',
        valor: Math.round(valor * 10) / 10,
        unidad: '°C',
        fecha: timestamp,
        estado: estado,
        sensorId: sensorId,
        ubicacionId: 2,
        empresaId: 2
      })
    }
    
    return data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }

  // Umbrales por defecto como fallback
  const getDefaultUmbrales = (): UmbralesSensor => ({
    temperaturaMin: 15,
    temperaturaMax: 25,
    humedadMin: 40,
    humedadMax: 60,
    pesoMin: 100,
    pesoMax: 900,
    presionMin: 1000,
    presionMax: 1500,
    alertasActivas: true,
    severidad: 'MEDIA',
    intervaloVerificacionMinutos: 5
  })

  // Función para refrescar datos históricos
  const refreshHistoricalData = useCallback(async () => {
    if (currentSensorIdRef.current) {
      await loadHistoricalData(currentSensorIdRef.current)
    }
  }, [loadHistoricalData])

  // Función para resolver alerta usando el backend
  const resolverAlerta = useCallback(async (alertId: number, comentario?: string): Promise<boolean> => {
    try {
      console.log(`🔧 Resolviendo alerta ${alertId} en el backend...`)
      
      const response = await fetch(`http://localhost:3001/sensores/alertas/${alertId}/resolver`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt') || sessionStorage.getItem('jwt') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comentario })
      })

      if (response.ok) {
        console.log(`✅ Alerta ${alertId} resuelta en el backend`)
        
        // Actualizar estado local
        setAlertasBackend(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, estado: 'RESUELTA', fechaResolucion: new Date() }
            : alert
        ))
        
        // Actualizar listas
        setAlertasActivas(prev => prev.filter(alert => alert.id !== alertId))
        setAlertasResueltas(prev => {
          const alerta = alertasBackend.find(a => a.id === alertId)
          return alerta ? [alerta, ...prev] : prev
        })
        
        return true
      } else {
        console.error(`❌ Error resolviendo alerta ${alertId}:`, response.statusText)
        return false
      }
    } catch (error) {
      console.error(`❌ Error resolviendo alerta ${alertId}:`, error)
      return false
    }
  }, [alertasBackend])

  // Función para obtener resumen de alertas del backend
  const obtenerResumenAlertas = useCallback(async () => {
    try {
      console.log('📊 Obteniendo resumen de alertas del backend...')
      
      const response = await fetch(`http://localhost:3001/sensores/alertas/resumen?empresaId=2`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt') || sessionStorage.getItem('jwt') || ''}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const resumen = await response.json()
        console.log('✅ Resumen de alertas obtenido:', resumen)
        
        // Aquí podrías actualizar el estado con el resumen
        // setResumenAlertas(resumen)
      } else {
        console.log('⚠️ No se pudo obtener resumen de alertas del backend')
      }
    } catch (error) {
      console.error('❌ Error obteniendo resumen de alertas:', error)
    }
  }, [])

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
      
      // Limpiar datos previos
      setSensorReadings([])
      setHistoricalReadings([])
      setAlertasBackend([])
      setLatestAlert(null)
      setAlertasActivas([])
      setAlertasResueltas([])
      
      // Cargar umbrales y datos históricos del sensor
      loadUmbralesSensor(sensorId)
      loadHistoricalData(sensorId)
      
      socketRef.current.emit('suscribirse-sensor', { sensorId })
    }
  }, [isConnected, loadUmbralesSensor, loadHistoricalData])

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
    alertasBackend,
    alertasActivas,
    alertasResueltas,
    latestAlert,
    umbralesSensor,
    isLoadingUmbrales,
    isLoadingHistorical,
    historicalError,
    connect,
    disconnect,
    subscribeToLocation,
    subscribeToSensor,
    loadHistoricalData,
    refreshHistoricalData,
    loadUmbralesSensor,
    resolverAlerta,
    obtenerResumenAlertas,
  }
}
