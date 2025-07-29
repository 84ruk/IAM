import { safeFetch, validateApiResponse, AppError } from './errorHandler'

// Configuración base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Configuración de seguridad
const API_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000, // 30 segundos
  maxConcurrentRequests: 10,
}

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

// Validación de entrada
function validateInput(data: any, schema?: Record<string, any>): void {
  if (!data) return

  // Validación básica de tipos
  if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) continue
      
      // Validar strings
      if (typeof value === 'string') {
        if (value.length > 10000) {
          throw new AppError(`Campo ${key} excede el límite de caracteres`, 400)
        }
        // Sanitizar strings básicos
        if (value.includes('<script>') || value.includes('javascript:')) {
          throw new AppError(`Campo ${key} contiene contenido no permitido`, 400)
        }
      }
      
      // Validar números
      if (typeof value === 'number') {
        if (!isFinite(value) || value > Number.MAX_SAFE_INTEGER) {
          throw new AppError(`Campo ${key} contiene un valor numérico inválido`, 400)
        }
      }
    }
  }
}

// Rate limiting básico
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private maxRequests = 100
  private windowMs = 60000 // 1 minuto

  canMakeRequest(endpoint: string): boolean {
    const now = Date.now()
    const key = endpoint.split('?')[0] // Ignorar query params para el rate limiting
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [now])
      return true
    }

    const requests = this.requests.get(key)!
    const validRequests = requests.filter(time => now - time < this.windowMs)
    
    if (validRequests.length >= this.maxRequests) {
      return false
    }

    validRequests.push(now)
    this.requests.set(key, validRequests)
    return true
  }
}

const rateLimiter = new RateLimiter()

// Clase para manejo de API
export class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>
  private activeRequests = 0

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    }
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: RequestInit & { responseType?: string },
    retryCount = 0
  ): Promise<T> {
    // Rate limiting
    if (!rateLimiter.canMakeRequest(endpoint)) {
      throw new AppError('Demasiadas solicitudes. Intenta de nuevo en un momento.', 429)
    }

    // Control de concurrencia
    if (this.activeRequests >= API_CONFIG.maxConcurrentRequests) {
      throw new AppError('Demasiadas solicitudes simultáneas', 429)
    }

    this.activeRequests++

    try {
      // Validar entrada
      if (data) {
        validateInput(data)
      }

    const url = `${this.baseURL}${endpoint}`
      
      // Crear AbortController para timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    const response = await fetch(url, {
        method,
      credentials: 'include',
      headers: data instanceof FormData 
        ? {
            // Para FormData, no incluir Content-Type para que el navegador lo establezca automáticamente
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...options?.headers,
          }
        : {
            ...this.defaultHeaders,
            ...options?.headers,
          },
        body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
        signal: controller.signal,
      ...options,
    })

      clearTimeout(timeoutId)

      // Manejar diferentes tipos de respuesta
      if (options?.responseType === 'blob') {
        return response.blob() as T
      }

      return await validateApiResponse(response)
    } catch (error: unknown) {
      // Manejar errores específicos antes de reintentos
      if (error instanceof AppError) {
        // Error 403 específico de empresa requerida
        if (error.statusCode === 403) {
          const errorMessage = error.message.toLowerCase();
          if (errorMessage.includes('configurar una empresa') || 
              errorMessage.includes('empresa requerida') ||
              errorMessage.includes('needs setup')) {
            
            // Solo redirigir si no estamos ya en la página de setup
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/setup-empresa')) {
              console.log('🔄 Redirigiendo a setup de empresa debido a error 403');
              window.location.href = '/setup-empresa';
              return Promise.reject(new AppError('Redirigiendo a setup de empresa', 403));
            }
          }
        }
        
        // Error 401 (no autenticado)
        if (error.statusCode === 401) {
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            console.log('🔄 Redirigiendo a login debido a error 401');
            window.location.href = '/login';
            return Promise.reject(new AppError('Redirigiendo a login', 401));
          }
        }
      }
      
      // Reintentos automáticos para errores de red
      if (retryCount < API_CONFIG.maxRetries && 
          (error instanceof AppError && error.statusCode >= 500) ||
          (error instanceof Error && (error.name === 'AbortError' || error.name === 'TypeError'))) {
        
        await new Promise(resolve => 
          setTimeout(resolve, API_CONFIG.retryDelay * (retryCount + 1))
        )
        
        return this.makeRequest(method, endpoint, data, options, retryCount + 1)
      }
      
      throw error
    } finally {
      this.activeRequests--
    }
  }

  // Método GET genérico
  async get<T>(endpoint: string, options?: RequestInit & { params?: Record<string, any>; responseType?: string }): Promise<T> {
    let url = endpoint
    
    if (options?.params) {
      const searchParams = new URLSearchParams()
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }
    
    const { params, ...requestOptions } = options || {}
    return this.makeRequest<T>('GET', url, undefined, requestOptions)
  }

  // Método POST genérico
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>('POST', endpoint, data, options)
  }

  // Método PUT genérico
  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>('PUT', endpoint, data, options)
  }

  // Método PATCH genérico
  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>('PATCH', endpoint, data, options)
  }

  // Método DELETE genérico
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>('DELETE', endpoint, undefined, options)
  }
}

// Funciones helper para manejo de datos
export function normalizeApiResponse<T>(response: any): T {
  // Si la respuesta es un array, asegurar que siempre sea un array
  if (Array.isArray(response)) {
    return response as T
  }
  
  // Si la respuesta tiene una propiedad 'data' que es un array
  if (response && typeof response === 'object' && Array.isArray(response.data)) {
    return response.data as T
  }
  
  // Si la respuesta tiene una propiedad 'data' que no es un array
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T
  }
  
  // Si no hay datos, retornar array vacío para arrays, o el valor original
  if (response === null || response === undefined) {
    return (Array.isArray(response) ? [] : response) as T
  }
  
  return response as T
}

export function isEmptyResponse(response: any): boolean {
  if (!response) return true
  if (Array.isArray(response)) return response.length === 0
  if (typeof response === 'object' && 'data' in response) {
    return Array.isArray(response.data) ? response.data.length === 0 : !response.data
  }
  return false
}

export function getEmptyStateMessage(type: string, context?: string): { title: string; description: string } {
  const messages = {
    productos: {
      title: 'No hay productos',
      description: context === 'eliminados' 
        ? 'No hay productos eliminados para mostrar.'
        : 'Comienza agregando tu primer producto para gestionar tu inventario.'
    },
    proveedores: {
      title: 'No hay proveedores',
      description: context === 'eliminados'
        ? 'No hay proveedores eliminados para mostrar.'
        : 'Agrega proveedores para gestionar tus compras y suministros.'
    },
    movimientos: {
      title: 'No hay movimientos',
      description: context === 'eliminados'
        ? 'No hay movimientos eliminados para mostrar.'
        : 'Los movimientos de inventario aparecerán aquí cuando registres entradas o salidas.'
    },
    usuarios: {
      title: 'No hay usuarios',
      description: 'No hay usuarios registrados en el sistema.'
    },
    dashboard: {
      title: 'Sin datos',
      description: 'Aún no hay datos para mostrar en el dashboard.'
    }
  }
  
  return messages[type as keyof typeof messages] || {
    title: 'Sin datos',
    description: 'No hay información para mostrar.'
  }
}

// Instancia global del cliente API
export const apiClient = new ApiClient()

// Funciones específicas para cada entidad
export const api = {
  // Productos
  productos: {
    getAll: async (params?: URLSearchParams) => {
      const response = await apiClient.get(`/productos${params ? `?${params}` : ''}`)
      return normalizeApiResponse(response)
    },
    
    getById: (id: number) => 
      apiClient.get(`/productos/${id}`),
    
    create: (data: any) => 
      apiClient.post('/productos', data),
    
    update: (id: number, data: any) => 
      apiClient.put(`/productos/${id}`, data),
    
    delete: (id: number) => 
      apiClient.delete(`/productos/${id}`),
    
    getEliminados: async () => {
      const response = await apiClient.get('/productos/eliminados')
      return normalizeApiResponse(response)
    },
    
    reactivar: (id: number) => 
      apiClient.patch(`/productos/${id}/reactivar`),
    
    eliminarPermanentemente: (id: number) => 
      apiClient.delete(`/productos/${id}/permanent`),
  },

  // Proveedores
  proveedores: {
    getAll: async (params?: URLSearchParams) => {
      const response = await apiClient.get(`/proveedores${params ? `?${params}` : ''}`)
      return normalizeApiResponse(response)
    },
    
    getById: (id: number) => 
      apiClient.get(`/proveedores/${id}`),
    
    create: (data: any) => 
      apiClient.post('/proveedores', data),
    
    update: (id: number, data: any) => 
      apiClient.put(`/proveedores/${id}`, data),
    
    delete: (id: number) => 
      apiClient.delete(`/proveedores/${id}`),
    
    getEliminados: async () => {
      const response = await apiClient.get('/proveedores/eliminados')
      return normalizeApiResponse(response)
    },
    
    reactivar: (id: number) => 
      apiClient.patch(`/proveedores/${id}/reactivar`),
    
    restaurar: (id: number) => 
      apiClient.patch(`/proveedores/${id}/restaurar`),
    
    eliminarPermanentemente: (id: number) => 
      apiClient.delete(`/proveedores/${id}/permanent`),
  },

  // Movimientos
  movimientos: {
    getAll: async (params?: URLSearchParams) => {
      const response = await apiClient.get(`/movimientos${params ? `?${params}` : ''}`)
      return normalizeApiResponse(response)
    },
    
    getById: (id: number) => 
      apiClient.get(`/movimientos/${id}`),
    
    create: (data: any) => 
      apiClient.post('/movimientos', data),
    
    createByBarcode: (data: any) => 
      apiClient.post('/movimientos/codigo-barras', data),
    
    delete: (id: number) => 
      apiClient.delete(`/movimientos/${id}`),
    
    getEliminados: async () => {
      const response = await apiClient.get('/movimientos/eliminados')
      return normalizeApiResponse(response)
    },
    
    getEliminadoById: (id: number) => 
      apiClient.get(`/movimientos/eliminados/${id}`),
    
    reactivar: (id: number) => 
      apiClient.patch(`/movimientos/${id}/reactivar`),
    
    eliminarPermanentemente: (id: number) => 
      apiClient.delete(`/movimientos/${id}/permanent`),
  },

  // Dashboard
  dashboard: {
    getStats: async () => {
      const response = await apiClient.get('/dashboard/stats')
      return normalizeApiResponse(response)
    },
    
    getStockChart: async () => {
      const response = await apiClient.get('/dashboard/stock-chart')
      return normalizeApiResponse(response)
    },
    
    getMovementsChart: async () => {
      const response = await apiClient.get('/dashboard/movements-chart')
      return normalizeApiResponse(response)
    },
    
    getLowStock: async () => {
      const response = await apiClient.get('/dashboard/low-stock')
      return normalizeApiResponse(response)
    },
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
    getUsers: async () => {
      const response = await apiClient.get('/admin/users')
      return normalizeApiResponse(response)
    },
    
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

import { useAuth } from '@/hooks/useAuth'
import axios, { AxiosError, AxiosInstance } from 'axios'

// Hook personalizado para usar la API con manejo de errores y autenticación
export function useApi(client: ApiClient = apiClient) {
  const { getAuthHeaders, validateAuth, validateAuthAsync } = useAuth()

  const handleApiCall = async <T>(
    apiCall: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void
      onError?: (error: AppError) => void
      showError?: boolean
      requireAuth?: boolean | 'async'
    }
  ): Promise<T | null> => {
    try {
      // Verificar autenticación si es requerida
      if (options?.requireAuth !== false) {
        const isValid = options?.requireAuth === 'async' 
          ? await validateAuthAsync() 
          : validateAuth()
        
        if (!isValid) {
          const authError = new AppError('Usuario no autenticado', 401)
          options?.onError?.(authError)
          return null
        }
      }

      const result = await apiCall()
      options?.onSuccess?.(result)
      return result
    } catch (error) {
      let appError: AppError
      
      // Manejar diferentes tipos de errores
      if (error instanceof AppError) {
        appError = error
      } else if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError
        const status = axiosError.response?.status || 500
        const message = (axiosError.response?.data as any)?.message || axiosError.message || 'Error en la solicitud'
        appError = new AppError(message, status)
      } else if (error instanceof Error) {
        appError = new AppError(error.message, 500)
      } else {
        appError = new AppError('Error desconocido', 500)
      }
      
      options?.onError?.(appError)
      
      if (options?.showError !== false) {
        console.error('API Error:', appError.message)
      }
      
      return null
    }
  }

  // API con autenticación automática usando cookies
  const authenticatedApi = {
    get: async <T>(url: string, config?: any): Promise<T> => {
      const headers = getAuthHeaders()
      return client.get<T>(url, { 
        ...config, 
        headers: { ...config?.headers, ...headers },
        withCredentials: true // Enviar cookies automáticamente
      })
    },
    post: async <T>(url: string, data?: any, config?: any): Promise<T> => {
      const headers = getAuthHeaders()
      return client.post<T>(url, data, { 
        ...config, 
        headers: { ...config?.headers, ...headers },
        withCredentials: true // Enviar cookies automáticamente
      })
    },
    put: async <T>(url: string, data?: any, config?: any): Promise<T> => {
      const headers = getAuthHeaders()
      return client.put<T>(url, data, { 
        ...config, 
        headers: { ...config?.headers, ...headers },
        withCredentials: true // Enviar cookies automáticamente
      })
    },
    delete: async <T>(url: string, config?: any): Promise<T> => {
      const headers = getAuthHeaders()
      return client.delete<T>(url, { 
        ...config, 
        headers: { ...config?.headers, ...headers },
        withCredentials: true // Enviar cookies automáticamente
      })
    }
  }

  return {
    handleApiCall,
    api,
    apiClient,
    authenticatedApi,
    getAuthHeaders,
    validateAuth,
    validateAuthAsync
  }
} 