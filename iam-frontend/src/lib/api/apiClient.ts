import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ErrorHandlerService, UserFriendlyError } from './errorHandler'

class ApiClient {
  private instance: AxiosInstance
  private requestQueue: Array<() => Promise<any>> = []
  private isProcessing = false
  private lastRequestTime = 0
  private readonly minRequestInterval = 100 // 100ms entre requests

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Interceptor de respuesta para manejar errores
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Manejar errores de conexión específicamente
        if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
          const customError = new Error('Servidor no disponible') as Error & { code?: string }
          customError.name = 'BackendUnavailable'
          customError.code = 'ECONNREFUSED'
          return Promise.reject(customError)
        }

        if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
          const customError = new Error('No se puede conectar al servidor') as Error & { code?: string }
          customError.name = 'HostNotFound'
          customError.code = 'ENOTFOUND'
          return Promise.reject(customError)
        }

        if (error.message?.includes('fetch failed')) {
          const customError = new Error('Error de red al conectar con el servidor') as Error & { code?: string }
          customError.name = 'NetworkError'
          customError.code = 'NETWORK_ERROR'
          return Promise.reject(customError)
        }

        // Para otros errores, mantener el comportamiento original
        return Promise.reject(error)
      }
    )

    // Interceptor de request para agregar timeout
    this.instance.interceptors.request.use(
      (config) => {
        // Agregar timeout de 10 segundos por defecto
        if (!config.timeout) {
          config.timeout = 10000
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )
  }

  private async handleRateLimitError(error: AxiosError): Promise<AxiosResponse> {
    const retryAfter = error.response?.headers['retry-after'] || 5
    const delay = parseInt(retryAfter) * 1000

    await this.delay(delay)

    // Reintentar la request original
    const config = error.config!
    return this.instance.request(config)
  }

  private async handleServerError(error: AxiosError): Promise<AxiosResponse> {
    const config = error.config!
    const retryCount = (config as any).retryCount || 0
    const maxRetries = 3

    if (retryCount < maxRetries) {
      ;(config as any).retryCount = retryCount + 1
      const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff
      
      await this.delay(delay)
      
      return this.instance.request(config)
    }

    return Promise.reject(error)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async throttleRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest
      await this.delay(delay)
    }

    this.lastRequestTime = Date.now()
    return requestFn()
  }

  private async makeRequest<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.throttleRequest(async () => {
      try {
        const response = await this.instance.request(config)
        return response.data
      } catch (error) {
        // El error ya fue procesado por el interceptor
        throw error
      }
    })
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.makeRequest({ ...config, method: 'GET', url })
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // Si es FormData, no establecer Content-Type manualmente
    if (data instanceof FormData) {
      const { headers, ...restConfig } = config || {}
      const { 'Content-Type': _, ...restHeaders } = headers || {}
      
      return this.makeRequest({ 
        ...restConfig, 
        method: 'POST', 
        url, 
        data,
        headers: restHeaders
      })
    }
    
    return this.makeRequest({ ...config, method: 'POST', url, data })
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.makeRequest({ ...config, method: 'PUT', url, data })
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.makeRequest({ ...config, method: 'DELETE', url })
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.makeRequest({ ...config, method: 'PATCH', url, data })
  }
}

export const apiClient = new ApiClient() 