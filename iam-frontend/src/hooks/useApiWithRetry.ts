import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api/apiClient'
import { useServerState } from '@/context/ServerStatusContext'

interface UseApiWithRetryOptions {
  maxRetries?: number
  retryDelay?: number
  enableRetry?: boolean
  onError?: (error: Error) => void
  onSuccess?: (data: unknown) => void
}

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  retryCount: number
}

export function useApiWithRetry<T = unknown>(options: UseApiWithRetryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    enableRetry = true,
    onError,
    onSuccess
  } = options

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0
  })

  const { status } = useServerState()

  const executeRequest = useCallback(async (
    requestFn: () => Promise<T>,
    retryCount = 0
  ): Promise<T> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const data = await requestFn()
      
      setState(prev => ({ 
        ...prev, 
        data, 
        loading: false, 
        retryCount: 0 
      }))
      
      onSuccess?.(data)
      return data
      
    } catch (error) {
      const err = error as Error
      
      // Si el servidor está en cold start, usar delays más largos
      const isColdStart = status === 'cold-start' || err.code === 'COLD_START'
      const currentRetryDelay = isColdStart ? retryDelay * 2 : retryDelay
      
      if (enableRetry && retryCount < maxRetries) {
        // Esperar antes del reintento
        await new Promise(resolve => setTimeout(resolve, currentRetryDelay))
        
        setState(prev => ({ 
          ...prev, 
          retryCount: retryCount + 1 
        }))
        
        // Reintentar
        return executeRequest(requestFn, retryCount + 1)
      }
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: err,
        retryCount: 0
      }))
      
      onError?.(err)
      throw err
    }
  }, [maxRetries, retryDelay, enableRetry, onError, onSuccess, status])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0
    })
  }, [])

  return {
    ...state,
    executeRequest,
    reset
  }
}

// Hook específico para peticiones GET
export function useGetWithRetry<T = unknown>(
  url: string,
  options: UseApiWithRetryOptions = {}
) {
  const { executeRequest, ...state } = useApiWithRetry<T>(options)

  const get = useCallback(async (config?: any) => {
    return executeRequest(() => apiClient.get<T>(url, config))
  }, [executeRequest, url])

  return {
    ...state,
    get
  }
}

// Hook específico para peticiones POST
export function usePostWithRetry<T = unknown>(
  url: string,
  options: UseApiWithRetryOptions = {}
) {
  const { executeRequest, ...state } = useApiWithRetry<T>(options)

  const post = useCallback(async (data?: unknown, config?: any) => {
    return executeRequest(() => apiClient.post<T>(url, data, config))
  }, [executeRequest, url])

  return {
    ...state,
    post
  }
}

// Hook para peticiones con manejo automático de cold start
export function useSmartApiRequest<T = unknown>(
  options: UseApiWithRetryOptions = {}
) {
  const { status } = useServerState()
  const { executeRequest, ...state } = useApiWithRetry<T>({
    ...options,
    maxRetries: status === 'cold-start' ? 5 : 3, // Más reintentos para cold start
    retryDelay: status === 'cold-start' ? 2000 : 1000 // Delays más largos para cold start
  })

  const smartRequest = useCallback(async (
    requestFn: () => Promise<T>
  ): Promise<T> => {
    // Si el servidor está offline, intentar calentarlo primero
    if (status === 'offline') {
      try {
        await apiClient.warmUpServer()
      } catch (error) {
        console.log('Warm up failed, continuing with request...')
      }
    }
    
    return executeRequest(requestFn)
  }, [executeRequest, status])

  return {
    ...state,
    smartRequest
  }
} 