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

  const handleError = useCallback((error: unknown) => {
    let appError: AppError

    if (error instanceof AppError) {
      appError = error
    } else if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
      // Error de axios/fetch con respuesta
      const responseData = error.response.data as { message?: string; status?: number }
      appError = new AppError(
        responseData.message || 'Error de servidor',
        responseData.status || 500
      )
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      // Error genérico
      appError = new AppError(error.message, 500)
    } else {
      // Error desconocido
      appError = new AppError('Error inesperado', 500)
    }

    setError(appError)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const retryOperation = useCallback(async (operation: () => Promise<unknown>) => {
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