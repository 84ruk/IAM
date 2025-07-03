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
    options?: RequestInit,
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
        headers: {
          ...this.defaultHeaders,
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)

      return await validateApiResponse(response)
    } catch (error: unknown) {
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
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>('GET', endpoint, undefined, options)
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