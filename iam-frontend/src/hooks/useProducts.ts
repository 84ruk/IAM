import useSWR from 'swr'
import { Producto } from '@/types/producto'

interface ProductFilters {
  search?: string
  etiqueta?: string
  estado?: string
  tipoProducto?: string
  agotados?: boolean
  proveedorId?: number
  page?: number
  limit?: number
  temperaturaMin?: number
  temperaturaMax?: number
  humedadMin?: number
  humedadMax?: number
  talla?: string
  color?: string
  sku?: string
  codigoBarras?: string
}

interface ProductsResponse {
  productos: Producto[]
  total: number
  page: number
  limit: number
  totalPages: number
}

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

export function useProducts(filters: ProductFilters = {}) {
  // Construir query string
  const queryParams = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString())
    }
  })

  const queryString = queryParams.toString()
  const url = `/productos${queryString ? `?${queryString}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
    url,
    fetcher,
    {
      refreshInterval: 300000, // 5 minutos
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    products: data?.productos || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 50,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate
  }
}

// Hook para obtener un producto específico
export function useProduct(id: number) {
  const { data, error, isLoading, mutate } = useSWR<Producto>(
    id ? `/productos/${id}` : null,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    product: data,
    isLoading,
    error,
    mutate
  }
}

// Hook para obtener productos agotados
export function useOutOfStockProducts() {
  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
    '/productos?agotados=true',
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    products: data?.productos || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate
  }
}

// Hook para obtener productos sin proveedor
export function useProductsWithoutProvider() {
  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
    '/productos/sin-proveedor',
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    products: data?.productos || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate
  }
} 