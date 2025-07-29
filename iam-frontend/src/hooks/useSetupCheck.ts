import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api'

interface SetupCheckResponse {
  needsSetup: boolean
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
} = {
  needsSetup: null,
  timestamp: 0,
  checking: false
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

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

    // Usar cache si es válido
    const now = Date.now()
    if (globalSetupCache.needsSetup !== null && 
        (now - globalSetupCache.timestamp) < CACHE_DURATION) {
      setNeedsSetup(globalSetupCache.needsSetup)
      hasCheckedRef.current = true
      return
    }

    try {
      globalSetupCache.checking = true
      setIsLoading(true)
      setError(null)
      
      const response = await apiClient.get<SetupCheckResponse>('/auth/needs-setup')
      
      // Validar que la respuesta sea válida
      if (!response || typeof response !== 'object') {
        throw new Error('Respuesta inválida del servidor')
      }
      
      // Validar que tenga la propiedad needsSetup
      if (typeof response.needsSetup !== 'boolean') {
        throw new Error('Formato de respuesta inválido')
      }
      
      // Actualizar cache global
      globalSetupCache = {
        needsSetup: response.needsSetup,
        timestamp: now,
        checking: false
      }
      
      setNeedsSetup(response.needsSetup)
      hasCheckedRef.current = true
    } catch (err) {
      console.error('Error verificando setup:', err)
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al verificar configuración'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      
      setError(errorMessage)
      
      // Por defecto, asumir que necesita setup si hay error
      globalSetupCache = {
        needsSetup: true,
        timestamp: now,
        checking: false
      }
      setNeedsSetup(true)
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
    globalSetupCache = {
      needsSetup: null,
      timestamp: 0,
      checking: false
    }
    hasCheckedRef.current = false
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