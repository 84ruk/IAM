import { useState, useEffect, useCallback } from 'react'

export type ServerStatus = 'checking' | 'online' | 'cold-start' | 'offline' | 'error'

interface ServerStatusState {
  status: ServerStatus
  lastCheck: Date | null
  responseTime: number | null
  retryCount: number
  isWarmingUp: boolean
}

export function useServerStatus() {
  const [state, setState] = useState<ServerStatusState>({
    status: 'checking',
    lastCheck: null,
    responseTime: null,
    retryCount: 0,
    isWarmingUp: false
  })

  const checkServerStatus = useCallback(async (): Promise<ServerStatus> => {
    const startTime = Date.now()
    
    // Verificar cache primero
    const cachedHealth = sessionStorage.getItem('serverHealthCache')
    if (cachedHealth) {
      const parsed = JSON.parse(cachedHealth)
      const now = Date.now()
      if (now - parsed.timestamp < 30000) { // 30 segundos de cache
        setState(prev => ({
          ...prev,
          status: parsed.status,
          lastCheck: new Date(parsed.timestamp),
          responseTime: parsed.responseTime,
          retryCount: 0
        }))
        return parsed.status
      }
    }
    
    try {
      setState(prev => ({ ...prev, status: 'checking' }))
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos timeout
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      })
      
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        const isColdStart = responseTime > 3000 // Si tarda más de 3 segundos, probablemente es cold start
        const status = isColdStart ? 'cold-start' : 'online'
        
        // Guardar en cache
        sessionStorage.setItem('serverHealthCache', JSON.stringify({
          status,
          responseTime,
          timestamp: Date.now()
        }))
        
        setState(prev => ({
          ...prev,
          status,
          lastCheck: new Date(),
          responseTime,
          retryCount: 0,
          isWarmingUp: isColdStart
        }))
        
        return status
      } else {
        setState(prev => ({
          ...prev,
          status: 'error',
          lastCheck: new Date(),
          responseTime,
          retryCount: prev.retryCount + 1
        }))
        return 'error'
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      if (error instanceof Error && error.name === 'AbortError') {
        setState(prev => ({
          ...prev,
          status: 'offline',
          lastCheck: new Date(),
          responseTime,
          retryCount: prev.retryCount + 1
        }))
        return 'offline'
      }
      
      setState(prev => ({
        ...prev,
        status: 'error',
        lastCheck: new Date(),
        responseTime,
        retryCount: prev.retryCount + 1
      }))
      return 'error'
    }
  }, [])

  const warmUpServer = useCallback(async () => {
    setState(prev => ({ ...prev, isWarmingUp: true }))
    
    try {
      // Hacer una petición ligera para calentar el servidor
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      // Esperar un poco y verificar el estado
      setTimeout(async () => {
        await checkServerStatus()
        setState(prev => ({ ...prev, isWarmingUp: false }))
      }, 2000)
      
    } catch {
      setState(prev => ({ ...prev, isWarmingUp: false }))
    }
  }, [checkServerStatus])

  useEffect(() => {
    // Verificar estado inicial
    checkServerStatus()
    
    // Configurar verificación periódica cada 60 segundos (reducido de 30)
    const interval = setInterval(() => {
      // Solo verificar si el servidor está offline o con error
      // Y solo si han pasado al menos 30 segundos desde la última verificación
      const now = Date.now()
      const lastCheckTime = state.lastCheck ? state.lastCheck.getTime() : 0
      
      if ((state.status === 'offline' || state.status === 'error') && 
          (now - lastCheckTime > 30000)) {
        checkServerStatus()
      }
    }, 60000) // 60 segundos
    
    return () => clearInterval(interval)
  }, [checkServerStatus, state.status, state.lastCheck])

  return {
    ...state,
    checkServerStatus,
    warmUpServer
  }
} 