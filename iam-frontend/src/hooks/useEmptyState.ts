import { useMemo } from 'react'
import { isEmptyResponse, getEmptyStateMessage } from '@/lib/api'

interface UseEmptyStateOptions {
  data: unknown
  type: 'productos' | 'proveedores' | 'movimientos' | 'usuarios' | 'dashboard'
  context?: string
  hayFiltrosActivos?: boolean
}

interface UseEmptyStateReturn {
  isEmpty: boolean
  message: { title: string; description: string }
  shouldShowEmptyState: boolean
}

export function useEmptyState({
  data,
  type,
  context,
  hayFiltrosActivos = false
}: UseEmptyStateOptions): UseEmptyStateReturn {
  
  const isEmpty = useMemo(() => {
    return isEmptyResponse(data)
  }, [data])

  const message = useMemo(() => {
    if (hayFiltrosActivos) {
      return {
        title: `No se encontraron ${type}`,
        description: `Intenta ajustar los filtros de búsqueda para encontrar ${type}.`
      }
    }
    
    return getEmptyStateMessage(type, context)
  }, [type, context, hayFiltrosActivos])

  const shouldShowEmptyState = useMemo(() => {
    return isEmpty && !hayFiltrosActivos || (isEmpty && hayFiltrosActivos)
  }, [isEmpty, hayFiltrosActivos])

  return {
    isEmpty,
    message,
    shouldShowEmptyState
  }
} 