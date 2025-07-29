'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface BackendError {
  name: string
  message: string
  code?: string
  status?: number
}

export function useBackendError() {
  const [error, setError] = useState<BackendError | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const router = useRouter()

  const handleError = useCallback((error: any) => {
    let backendError: BackendError

    // Determinar el tipo de error
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      backendError = {
        name: 'BackendUnavailable',
        message: 'El servidor no está disponible. Verifica que el backend esté ejecutándose.',
        code: 'ECONNREFUSED'
      }
    } else if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
      backendError = {
        name: 'HostNotFound',
        message: 'No se puede conectar al servidor. Verifica la configuración de red.',
        code: 'ENOTFOUND'
      }
    } else if (error.message?.includes('fetch failed') || error.name === 'NetworkError') {
      backendError = {
        name: 'NetworkError',
        message: 'Error de red al conectar con el servidor.',
        code: 'NETWORK_ERROR'
      }
    } else if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      backendError = {
        name: 'TimeoutError',
        message: 'La conexión con el servidor tardó demasiado.',
        code: 'TIMEOUT'
      }
    } else if (error && typeof error === 'object' && error.response?.status === 401) {
      backendError = {
        name: 'Unauthorized',
        message: 'Sesión expirada. Redirigiendo al login...',
        status: 401
      }
      // Redirigir al login después de un breve delay
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else if (error && typeof error === 'object' && error.response?.status === 403) {
      backendError = {
        name: 'Forbidden',
        message: 'No tienes permisos para realizar esta acción.',
        status: 403
      }
    } else if (error && typeof error === 'object' && error.response?.status >= 500) {
      backendError = {
        name: 'ServerError',
        message: 'Error interno del servidor. Intenta nuevamente más tarde.',
        status: error.response.status
      }
    } else {
      // Error genérico
      backendError = {
        name: 'UnknownError',
        message: error.message || 'Error desconocido',
        status: error && typeof error === 'object' ? error.response?.status : undefined
      }
    }

    setError(backendError)
    return backendError
  }, [router])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const retryOperation = useCallback(async (operation: () => Promise<any>) => {
    setIsRetrying(true)
    clearError()
    
    try {
      const result = await operation()
      setIsRetrying(false)
      return result
    } catch (error) {
      setIsRetrying(false)
      handleError(error)
      throw error
    }
  }, [clearError, handleError])

  const isBackendUnavailable = error?.code === 'ECONNREFUSED' || 
                              error?.code === 'ENOTFOUND' || 
                              error?.code === 'NETWORK_ERROR'

  const isAuthError = error?.status === 401 || error?.status === 403

  const isServerError = error?.status && error.status >= 500

  return {
    error,
    isRetrying,
    isBackendUnavailable,
    isAuthError,
    isServerError,
    handleError,
    clearError,
    retryOperation
  }
} 