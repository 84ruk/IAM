'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ApiClient } from '@/lib/api'
import { DailyMovementsResponse } from '@/types/kpis'
import { DailyMovementsFilters } from '@/types/filters'
import { AppError } from '@/lib/errorHandler'

const api = new ApiClient()

interface UseDailyMovementsOptions {
  days?: number
  filters?: Partial<DailyMovementsFilters>
  autoRefresh?: boolean
  refreshInterval?: number
  onSuccess?: (data: DailyMovementsResponse) => void
  onError?: (error: AppError) => void
}

interface UseDailyMovementsReturn {
  data: DailyMovementsResponse | null
  isLoading: boolean
  error: AppError | null
  refetch: () => Promise<void>
  forceRefresh: () => Promise<void>
  updateDays: (newDays: number) => void
  updateFilters: (filters: Partial<DailyMovementsFilters>) => void
}

export function useDailyMovements(options: UseDailyMovementsOptions = {}): UseDailyMovementsReturn {
  const {
    days = 7,
    filters = {},
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutos
    onSuccess,
    onError
  } = options

  const [data, setData] = useState<DailyMovementsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)
  const [currentDays, setCurrentDays] = useState(days)
  const [currentFilters, setCurrentFilters] = useState<Partial<DailyMovementsFilters>>(filters)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Cancelar petición anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Crear nuevo AbortController
      abortControllerRef.current = new AbortController()

      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()

      // Agregar días si no hay filtros de período personalizado
      if (!currentFilters.period || currentFilters.period === '7d') {
        params.append('days', currentDays.toString())
      }

      // Agregar filtros
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              params.append(key, value.join(','))
            }
          } else {
            params.append(key, value.toString())
          }
        }
      })

      if (forceRefresh) {
        params.append('forceRefresh', 'true')
      }

      const response = await api.get<DailyMovementsResponse>(
        `/dashboard-cqrs/daily-movements?${params.toString()}`,
        {
          signal: abortControllerRef.current.signal
        }
      )

      setData(response)
      onSuccess?.(response)

    } catch (err) {
      // No establecer error si la petición fue cancelada
      if (err instanceof AppError && err.message.includes('aborted')) {
        return
      }

      const appError = err instanceof AppError ? err : new AppError('Error al cargar movimientos diarios', 500)
      setError(appError)
      onError?.(appError)
    } finally {
      setIsLoading(false)
    }
  }, [currentDays, currentFilters, onSuccess, onError])

  const refetch = useCallback(() => fetchData(false), [fetchData])
  const forceRefresh = useCallback(() => fetchData(true), [fetchData])

  const updateDays = useCallback((newDays: number) => {
    if (newDays !== currentDays) {
      setCurrentDays(newDays)
    }
  }, [currentDays])

  const updateFilters = useCallback((newFilters: Partial<DailyMovementsFilters>) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Configurar auto-refresh
  useEffect(() => {
    if (!autoRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      fetchData(false)
    }, refreshInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [autoRefresh, refreshInterval, fetchData])

  // Cargar datos iniciales y cuando cambien los días o filtros
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    refetch,
    forceRefresh,
    updateDays,
    updateFilters
  }
} 