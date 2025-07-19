import useSWR from 'swr'
import { Proveedor } from '@/types/proveedor'

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

export function useProviders() {
  const { data, error, isLoading, mutate } = useSWR<Proveedor[]>(
    '/proveedores',
    fetcher,
    {
      refreshInterval: 300000, // 5 minutos
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    providers: data || [],
    isLoading,
    error,
    mutate
  }
}

// Hook para obtener un proveedor específico
export function useProvider(id: number) {
  const { data, error, isLoading, mutate } = useSWR<Proveedor>(
    id ? `/proveedores/${id}` : null,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    provider: data,
    isLoading,
    error,
    mutate
  }
} 