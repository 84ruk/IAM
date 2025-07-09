import { useState, useEffect, useCallback } from 'react'
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
}

export function useSetupCheck(): UseSetupCheckReturn {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChecked, setHasChecked] = useState(false)

  const checkSetup = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiClient.get<SetupCheckResponse>('/auth/needs-setup')
      setNeedsSetup(response.needsSetup)
      setHasChecked(true)
    } catch (err) {
      console.error('Error verificando setup:', err)
      setError(err instanceof Error ? err.message : 'Error al verificar configuración')
      // Por defecto, asumir que necesita setup si hay error
      setNeedsSetup(true)
      setHasChecked(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const checkSetupIfNeeded = useCallback(async () => {
    if (!hasChecked && !isLoading) {
      await checkSetup()
    }
  }, [hasChecked, isLoading, checkSetup])

  // Verificar setup solo una vez al montar el componente
  useEffect(() => {
    checkSetupIfNeeded()
  }, [checkSetupIfNeeded])

  return {
    needsSetup,
    isLoading,
    error,
    refetch: checkSetup,
    checkSetupIfNeeded
  }
} 