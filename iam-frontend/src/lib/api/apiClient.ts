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
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Agregar timestamp para rate limiting
        ;(config as any).metadata = { startTime: Date.now() }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        return response
      },
      async (error: AxiosError) => {
        // Log del error para debugging
        console.error('🔍 API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method,
          message: error.message,
          data: error.response?.data
        })

        if (error.response?.status === 429) {
          // Rate limit exceeded - implementar retry con backoff
          console.warn('Rate limit exceeded, retrying with backoff...')
          return this.handleRateLimitError(error)
        }
        
        if (error.response?.status && error.response.status >= 500) {
          // Server error - implementar retry
          console.warn('Server error, retrying...')
          return this.handleServerError(error)
        }

        // Transformar el error en un formato más útil
        const userFriendlyError = ErrorHandlerService.parseBackendError({
          statusCode: error.response?.status || 0,
          message: (error.response?.data as any)?.message || error.message,
          error: (error.response?.data as any)?.error,
          details: (error.response?.data as any)?.details || error.response?.data
        })

        // Agregar el error transformado al objeto de error original
        ;(error as any).userFriendlyError = userFriendlyError

        return Promise.reject(error)
      }
    )
  }

  private async handleRateLimitError(error: AxiosError): Promise<AxiosResponse> {
    const retryAfter = error.response?.headers['retry-after'] || 5
    const delay = parseInt(retryAfter) * 1000

    console.log(`Waiting ${delay}ms before retry...`)
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
      
      console.log(`Retrying request (${retryCount + 1}/${maxRetries}) after ${delay}ms...`)
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