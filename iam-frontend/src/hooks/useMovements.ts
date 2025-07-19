import useSWR from 'swr'
import { Movimiento } from '@/types/movimiento'
import { TipoMovimiento } from '@/types/enums'

const fetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }).then(res => {
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`)
    }
    return res.json()
  })

export function useMovements(tipo?: TipoMovimiento) {
  const url = tipo ? `/movimientos?tipo=${tipo}` : '/movimientos'
  
  const { data, error, isLoading, mutate } = useSWR<Movimiento[]>(
    url,
    fetcher,
    {
      refreshInterval: 300000, // 5 minutos
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    movements: Array.isArray(data) ? data : [],
    isLoading,
    error,
    mutate
  }
}

// Hook para obtener movimientos de un producto específico
export function useProductMovements(productId: number) {
  const { data, error, isLoading, mutate } = useSWR<Movimiento[]>(
    productId ? `/movimientos/producto/${productId}` : null,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    movements: Array.isArray(data) ? data : [],
    isLoading,
    error,
    mutate
  }
}

// Hook para obtener un movimiento específico
export function useMovement(id: number) {
  const { data, error, isLoading, mutate } = useSWR<Movimiento>(
    id ? `/movimientos/${id}` : null,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    movement: data,
    isLoading,
    error,
    mutate
  }
}

// Hook para obtener movimientos eliminados
export function useDeletedMovements() {
  const { data, error, isLoading, mutate } = useSWR<Movimiento[]>(
    '/movimientos/eliminados',
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    movements: Array.isArray(data) ? data : [],
    isLoading,
    error,
    mutate
  }
} 