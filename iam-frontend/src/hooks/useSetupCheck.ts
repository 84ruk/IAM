import { useState, useCallback, useEffect, useRef } from 'react'
import { apiClient } from '@/lib/api'

interface SetupCheckResponse {
  needsSetup: boolean
  user?: Record<string, unknown>
  empresa?: Record<string, unknown>
  setupStatus?: Record<string, unknown>
}

interface UseSetupCheckReturn {
  needsSetup: boolean | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  checkSetupIfNeeded: () => Promise<void>
  invalidateCache: () => void
}

// Cache global para evitar verificaciones múltiples
let globalSetupCache: {
  needsSetup: boolean | null
  timestamp: number
  checking: boolean
  error: string | null
} = {
  needsSetup: null,
  timestamp: 0,
  checking: false,
  error: null
}

const CACHE_DURATION = 2 * 60 * 1000 // 2 minutos (reducido para mayor responsividad)

export function useSetupCheck(): UseSetupCheckReturn {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasCheckedRef = useRef(false)

  const checkSetup = useCallback(async () => {
    // Evitar verificaciones simultáneas
    if (globalSetupCache.checking) {
      return
    }

    // Usar cache si es válido y no hay error
    const now = Date.now()
    if (globalSetupCache.needsSetup !== null && 
        globalSetupCache.error === null &&
        (now - globalSetupCache.timestamp) < CACHE_DURATION) {
      setNeedsSetup(globalSetupCache.needsSetup)
      setError(null)
      hasCheckedRef.current = true
      return
    }

    try {
      globalSetupCache.checking = true
      setIsLoading(true)
      setError(null)
      
      console.log('🔍 useSetupCheck: Verificando estado de setup...')
      
      const response = await apiClient.get<SetupCheckResponse>('/auth/needs-setup')
      
      // Validar que la respuesta sea válida
      if (!response || typeof response !== 'object') {
        throw new Error('Respuesta inválida del servidor')
      }
      
      // Validar que tenga la propiedad needsSetup
      if (typeof response.needsSetup !== 'boolean') {
        throw new Error('Formato de respuesta inválido')
      }
      
      console.log('✅ useSetupCheck: Setup verificado:', response.needsSetup ? 'necesita setup' : 'setup completo')
      
      // Actualizar cache global
      globalSetupCache = {
        needsSetup: response.needsSetup,
        timestamp: now,
        checking: false,
        error: null
      }
      
      setNeedsSetup(response.needsSetup)
      setError(null)
      hasCheckedRef.current = true
    } catch (err) {
      console.error('❌ useSetupCheck: Error verificando setup:', err)
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al verificar configuración'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      
      setError(errorMessage)
      
      // Actualizar cache con error
      globalSetupCache = {
        needsSetup: null,
        timestamp: now,
        checking: false,
        error: errorMessage
      }
      
      hasCheckedRef.current = true
    } finally {
      setIsLoading(false)
    }
  }, [])

  const checkSetupIfNeeded = useCallback(async () => {
    if (!hasCheckedRef.current && !isLoading) {
      await checkSetup()
    }
  }, [isLoading, checkSetup])

  // Verificar setup solo una vez al montar el componente
  useEffect(() => {
    checkSetupIfNeeded()
  }, [checkSetupIfNeeded])

  // Función para invalidar cache (útil después de completar setup)
  const invalidateCache = useCallback(() => {
    console.log('🔄 useSetupCheck: Invalidando cache...')
    globalSetupCache = {
      needsSetup: null,
      timestamp: 0,
      checking: false,
      error: null
    }
    hasCheckedRef.current = false
    setNeedsSetup(null)
    setError(null)
  }, [])

  return {
    needsSetup,
    isLoading,
    error,
    refetch: checkSetup,
    checkSetupIfNeeded,
    invalidateCache
  }
} 