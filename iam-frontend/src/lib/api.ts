import { AppError, validateApiResponse } from './errorHandler'

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
export interface ApiResponse<T = unknown> {
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
function validateInput(data: unknown, schema?: Record<string, unknown>): void {
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
    data?: unknown,
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

      return await validateApiResponse(response) as T
    } catch (error) {
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
  async get<T>(endpoint: string, options?: RequestInit & { params?: Record<string, unknown>; responseType?: string }): Promise<T> {
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
  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>('POST', endpoint, data, options)
  }

  // Método PUT genérico
  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>('PUT', endpoint, data, options)
  }

  // Método PATCH genérico
  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>('PATCH', endpoint, data, options)
  }

  // Método DELETE genérico
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.makeRequest<T>('DELETE', endpoint, undefined, options)
  }
}

// Funciones helper para manejo de datos
export function normalizeApiResponse<T>(response: unknown): T {
  // Si la respuesta es un array, asegurar que siempre sea un array
  if (Array.isArray(response)) {
    return response as T
  }
  
  // Si la respuesta tiene una propiedad 'data' que es un array
  if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as Record<string, unknown>).data)) {
    return (response as Record<string, unknown>).data as T
  }
  
  // Si la respuesta tiene una propiedad 'data' que no es un array
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as Record<string, unknown>).data as T
  }
  
  // Si no hay datos, retornar array vacío para arrays, o el valor original
  if (response === null || response === undefined) {
    return (Array.isArray(response) ? [] : response) as T
  }
  
  return response as T
}

export function isEmptyResponse(response: unknown): boolean {
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
    
    create: (data: Record<string, unknown>) => 
      apiClient.post('/productos', data),
    
    update: (id: number, data: Record<string, unknown>) => 
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
    
    create: (data: Record<string, unknown>) => 
      apiClient.post('/proveedores', data),
    
    update: (id: number, data: Record<string, unknown>) => 
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
    
    create: (data: Record<string, unknown>) => 
      apiClient.post('/movimientos', data),
    
    createByBarcode: (data: Record<string, unknown>) => 
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
    
    getKPIs: async () => {
      const response = await apiClient.get('/dashboard-cqrs/kpis')
      return normalizeApiResponse(response)
    },
    
    getFinancialKPIs: async () => {
      const response = await apiClient.get('/dashboard-cqrs/financial-kpis')
      return normalizeApiResponse(response)
    },
    
    getIndustryKPIs: async () => {
      const response = await apiClient.get('/dashboard-cqrs/industry-kpis')
      return normalizeApiResponse(response)
    },
    
    getPredictiveKPIs: async () => {
      const response = await apiClient.get('/dashboard-cqrs/predictive-kpis')
      return normalizeApiResponse(response)
    },
    
    getDailyMovements: async (filters?: Record<string, unknown>) => {
      const params = filters ? new URLSearchParams() : undefined
      if (filters && params) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }
      
      const response = await apiClient.get(`/dashboard-cqrs/daily-movements${params ? `?${params}` : ''}`)
      return normalizeApiResponse(response)
    },
    
    getData: async (filters?: Record<string, unknown>) => {
      const params = filters ? new URLSearchParams() : undefined
      if (filters && params) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }
      
      const response = await apiClient.get(`/dashboard-cqrs/data${params ? `?${params}` : ''}`)
      return normalizeApiResponse(response)
    }
  },

  // Usuarios
  usuarios: {
    getProfile: () => 
      apiClient.get('/auth/me'),
    
    updateProfile: (data: Record<string, unknown>) => 
      apiClient.put('/auth/profile', data),
    
    changePassword: (data: Record<string, unknown>) => 
      apiClient.post('/auth/change-password', data),
    
    getAll: async (params?: URLSearchParams) => {
      const response = await apiClient.get(`/usuarios${params ? `?${params}` : ''}`)
      return normalizeApiResponse(response)
    },
    
    getById: (id: number) => 
      apiClient.get(`/usuarios/${id}`),
    
    create: (data: Record<string, unknown>) => 
      apiClient.post('/usuarios', data),
    
    update: (id: number, data: Record<string, unknown>) => 
      apiClient.put(`/usuarios/${id}`, data),
    
    delete: (id: number) => 
      apiClient.delete(`/usuarios/${id}`),
  },

  // Empresa
  empresa: {
    getCurrent: () => 
      apiClient.get('/empresa/current'),
    
    update: (data: Record<string, unknown>) => 
      apiClient.put('/empresa', data),
    
    setup: (data: Record<string, unknown>) => 
      apiClient.post('/empresa/setup', data),
  },

  // Autenticación
  auth: {
    login: (credentials: Record<string, unknown>) => 
      apiClient.post('/auth/login', credentials),
    
    register: (userData: Record<string, unknown>) => 
      apiClient.post('/auth/register', userData),
    
    logout: () => 
      apiClient.post('/auth/logout'),
    
    refresh: () => 
      apiClient.post('/auth/refresh'),
    
    forgotPassword: (email: string) => 
      apiClient.post('/auth/forgot-password', { email }),
    
    resetPassword: (token: string, password: string) => 
      apiClient.post('/auth/reset-password', { token, password }),
  },

  // Importación
  importacion: {
    importarProductos: (file: File, opciones: Record<string, unknown>) => {
      const formData = new FormData()
      formData.append('archivo', file)
      Object.entries(opciones).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
      return apiClient.post('/importacion/productos', formData)
    },
    
    importarProveedores: (file: File, opciones: Record<string, unknown>) => {
      const formData = new FormData()
      formData.append('archivo', file)
      Object.entries(opciones).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
      return apiClient.post('/importacion/proveedores', formData)
    },
    
    importarMovimientos: (file: File, opciones: Record<string, unknown>) => {
      const formData = new FormData()
      formData.append('archivo', file)
      Object.entries(opciones).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
      return apiClient.post('/importacion/movimientos', formData)
    },
    
    importarUnificada: (file: File, opciones: Record<string, unknown>) => {
      const formData = new FormData()
      formData.append('archivo', file)
      Object.entries(opciones).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
      return apiClient.post('/importacion/unificada', formData)
    },
    
    importarAuto: (file: File, opciones: Record<string, unknown>) => {
      const formData = new FormData()
      formData.append('archivo', file)
      Object.entries(opciones).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
      return apiClient.post('/importacion/auto', formData)
    },
    
    validarAuto: (file: File, opciones?: Record<string, unknown>) => {
      const formData = new FormData()
      formData.append('archivo', file)
      if (opciones) {
        Object.entries(opciones).forEach(([key, value]) => {
          formData.append(key, String(value))
        })
      }
      return apiClient.post('/importacion/auto/validar', formData)
    },
    
    confirmarAuto: (trabajoId: string, opciones: Record<string, unknown>) => {
      return apiClient.post(`/importacion/auto/${trabajoId}/confirmar`, opciones)
    },
    
    obtenerEstadoTrabajo: (trabajoId: string) => 
      apiClient.get(`/importacion/trabajos/${trabajoId}`),
    
    listarTrabajos: (limit = 50, offset = 0) => 
      apiClient.get(`/importacion/trabajos?limit=${limit}&offset=${offset}`),
    
    cancelarTrabajo: (trabajoId: string) => 
      apiClient.delete(`/importacion/trabajos/${trabajoId}`),
    
    descargarReporteErrores: (trabajoId: string) => 
      apiClient.get(`/importacion/trabajos/${trabajoId}/reporte-errores`, { responseType: 'blob' }),
    
    descargarPlantilla: (tipo: string) => 
      apiClient.get(`/importacion/plantillas/${tipo}`, { responseType: 'blob' }),
    
    obtenerTiposSoportados: () => 
      apiClient.get('/importacion/tipos-soportados'),
  }
}

// Hook para usar la API con manejo de errores
export function useApi(client: ApiClient = apiClient) {
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
      const result = await apiCall()
      
      if (options?.onSuccess) {
        options.onSuccess(result)
      }
      
      return result
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError('Error desconocido')
      
      if (options?.onError) {
        options.onError(appError)
      }
      
      if (options?.showError !== false) {
        console.error('API Error:', appError)
      }
      
      return null
    }
  }

  return { handleApiCall }
} 