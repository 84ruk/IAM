import { safeFetch, validateApiResponse, AppError } from './errorHandler'

// Configuración base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Tipos para las respuestas de API
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Clase para manejo de API
export class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  // Método GET genérico
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...this.defaultHeaders,
        ...options?.headers,
      },
      ...options,
    })

    return validateApiResponse(response)
  }

  // Método POST genérico
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...this.defaultHeaders,
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })

    return validateApiResponse(response)
  }

  // Método PUT genérico
  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        ...this.defaultHeaders,
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })

    return validateApiResponse(response)
  }

  // Método PATCH genérico
  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        ...this.defaultHeaders,
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })

    return validateApiResponse(response)
  }

  // Método DELETE genérico
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        ...this.defaultHeaders,
        ...options?.headers,
      },
      ...options,
    })

    return validateApiResponse(response)
  }
}

// Instancia global del cliente API
export const apiClient = new ApiClient()

// Funciones específicas para cada entidad
export const api = {
  // Productos
  productos: {
    getAll: (params?: URLSearchParams) => 
      apiClient.get(`/productos${params ? `?${params}` : ''}`),
    
    getById: (id: number) => 
      apiClient.get(`/productos/${id}`),
    
    create: (data: any) => 
      apiClient.post('/productos', data),
    
    update: (id: number, data: any) => 
      apiClient.put(`/productos/${id}`, data),
    
    delete: (id: number) => 
      apiClient.delete(`/productos/${id}`),
    
    getEliminados: () => 
      apiClient.get('/productos/eliminados'),
    
    reactivar: (id: number) => 
      apiClient.patch(`/productos/${id}/reactivar`),
    
    eliminarPermanentemente: (id: number) => 
      apiClient.delete(`/productos/${id}/permanent`),
  },

  // Proveedores
  proveedores: {
    getAll: (params?: URLSearchParams) => 
      apiClient.get(`/proveedores${params ? `?${params}` : ''}`),
    
    getById: (id: number) => 
      apiClient.get(`/proveedores/${id}`),
    
    create: (data: any) => 
      apiClient.post('/proveedores', data),
    
    update: (id: number, data: any) => 
      apiClient.put(`/proveedores/${id}`, data),
    
    delete: (id: number) => 
      apiClient.delete(`/proveedores/${id}`),
    
    getEliminados: () => 
      apiClient.get('/proveedores/eliminados'),
    
    reactivar: (id: number) => 
      apiClient.patch(`/proveedores/${id}/reactivar`),
    
    restaurar: (id: number) => 
      apiClient.patch(`/proveedores/${id}/restaurar`),
    
    eliminarPermanentemente: (id: number) => 
      apiClient.delete(`/proveedores/${id}/permanent`),
  },

  // Movimientos
  movimientos: {
    getAll: (params?: URLSearchParams) => 
      apiClient.get(`/movimientos${params ? `?${params}` : ''}`),
    
    getById: (id: number) => 
      apiClient.get(`/movimientos/${id}`),
    
    create: (data: any) => 
      apiClient.post('/movimientos', data),
    
    createByBarcode: (data: any) => 
      apiClient.post('/movimientos/codigo-barras', data),
    
    delete: (id: number) => 
      apiClient.delete(`/movimientos/${id}`),
    
    getEliminados: () => 
      apiClient.get('/movimientos/eliminados'),
    
    getEliminadoById: (id: number) => 
      apiClient.get(`/movimientos/eliminados/${id}`),
    
    reactivar: (id: number) => 
      apiClient.patch(`/movimientos/${id}/reactivar`),
    
    eliminarPermanentemente: (id: number) => 
      apiClient.delete(`/movimientos/${id}/permanent`),
  },

  // Dashboard
  dashboard: {
    getStats: () => 
      apiClient.get('/dashboard/stats'),
    
    getStockChart: () => 
      apiClient.get('/dashboard/stock-chart'),
    
    getMovementsChart: () => 
      apiClient.get('/dashboard/movements-chart'),
    
    getLowStock: () => 
      apiClient.get('/dashboard/low-stock'),
  },

  // Autenticación
  auth: {
    login: (data: { email: string; password: string }) => 
      apiClient.post('/auth/login', data),
    
    register: (data: any) => 
      apiClient.post('/auth/register', data),
    
    me: () => 
      apiClient.get('/auth/me'),
    
    logout: () => 
      apiClient.post('/auth/logout'),
  },

  // Admin
  admin: {
    getUsers: () => 
      apiClient.get('/admin/users'),
    
    createUser: (data: any) => 
      apiClient.post('/admin/users', data),
    
    updateUser: (id: string, data: any) => 
      apiClient.put(`/admin/users/${id}`, data),
    
    changeRole: (id: string, data: { rol: string }) => 
      apiClient.patch(`/admin/users/${id}/role`, data),
    
    deleteUser: (id: string) => 
      apiClient.delete(`/admin/users/${id}`),
  },
}

// Hook personalizado para usar la API con manejo de errores
export function useApi() {
  const handleApiCall = async <T>(
    apiCall: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void
      onError?: (error: AppError) => void
      showError?: boolean
    }
  ): Promise<T | null> => {
    try {
      const result = await apiCall()
      options?.onSuccess?.(result)
      return result
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError('Error desconocido')
      options?.onError?.(appError)
      
      if (options?.showError !== false) {
        // Aquí se podría mostrar una notificación de error
        console.error('API Error:', appError.message)
      }
      
      return null
    }
  }

  return {
    handleApiCall,
    api,
    apiClient
  }
} 