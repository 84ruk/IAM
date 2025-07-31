import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, AxiosInstance } from 'axios'

class ApiClient {
  private instance: AxiosInstance
  private requestQueue: Array<() => Promise<unknown>> = []
  private isProcessing = false
  private lastRequestTime = 0
  private readonly minRequestInterval = 100 // 100ms entre requests
  private coldStartDetected = false
  private retryDelays = [1000, 2000, 4000] // Delays exponenciales para cold starts

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
      (response) => {
        // Si la respuesta es exitosa, resetear el flag de cold start
        this.coldStartDetected = false
        return response
      },
      async (error) => {
        // Detectar cold start por tiempo de respuesta
        if (error.code === 'ECONNABORTED' && error.message?.includes('timeout')) {
          this.coldStartDetected = true
          const customError = new Error('Servidor en proceso de inicio (cold start)') as Error & { code?: string }
          customError.name = 'ColdStart'
          customError.code = 'COLD_START'
          return Promise.reject(customError)
        }

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

    // Interceptor de request para agregar timeout y manejo de cold start
    this.instance.interceptors.request.use(
      (config) => {
        // Si se detectó un cold start anteriormente, aumentar el timeout
        if (this.coldStartDetected) {
          config.timeout = 45000 // 45 segundos para cold starts
        } else if (!config.timeout) {
          config.timeout = 10000 // 10 segundos por defecto
        }
        
        // Agregar headers para identificar cold start (solo si no es health check)
        if (!config.url?.includes('/health')) {
          config.headers = {
            ...config.headers,
            'X-Client-Type': 'web-app',
            'X-Request-Type': 'api-request'
          }
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
    const retryCount = Number(((config as unknown) as Record<string, unknown>).retryCount) || 0
    const maxRetries = this.coldStartDetected ? 5 : 3 // Más reintentos para cold starts

    if (retryCount < maxRetries) {
      ((config as unknown) as Record<string, unknown>).retryCount = retryCount + 1
      
      // Usar delays exponenciales más largos para cold starts
      const delay = this.coldStartDetected 
        ? this.retryDelays[Math.min(retryCount, this.retryDelays.length - 1)]
        : Math.pow(2, retryCount) * 1000
      
      await this.delay(delay)
      
      return this.instance.request(config)
    }

    return Promise.reject(error)
  }

  private async handleColdStartError(error: AxiosError): Promise<AxiosResponse> {
    const config = error.config!
    const retryCount = Number(((config as unknown) as Record<string, unknown>).retryCount) || 0
    const maxRetries = 3

    if (retryCount < maxRetries) {
      ((config as unknown) as Record<string, unknown>).retryCount = retryCount + 1
      
      // Delays específicos para cold start
      const delay = this.retryDelays[Math.min(retryCount, this.retryDelays.length - 1)]
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
      await this.delay(this.minRequestInterval - timeSinceLastRequest)
    }

    this.lastRequestTime = Date.now()
    return requestFn()
  }

  private async makeRequest<T = unknown>(config: AxiosRequestConfig): Promise<T> {
    return this.throttleRequest(async () => {
      try {
        const response = await this.instance.request<T>(config)
        return response.data
      } catch (error) {
        const axiosError = error as AxiosError
        
        // Manejar diferentes tipos de errores
        if (axiosError.code === 'COLD_START') {
          return this.handleColdStartError(axiosError)
        }
        
        if (axiosError.response?.status === 429) {
          return this.handleRateLimitError(axiosError)
        }
        
        if (axiosError.response?.status >= 500) {
          return this.handleServerError(axiosError)
        }
        
        throw error
      }
    })
  }

  // Método para verificar el estado del servidor
  async checkServerHealth(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now()
    
    try {
      const response = await this.instance.get('/health', { timeout: 5000 })
      const responseTime = Date.now() - startTime
      
      return {
        status: response.status === 200 ? 'online' : 'error',
        responseTime
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        status: 'offline',
        responseTime
      }
    }
  }

  // Método para calentar el servidor
  async warmUpServer(): Promise<void> {
    try {
      // Hacer una petición ligera para calentar el servidor
      await this.instance.get('/health', { 
        timeout: 10000
      })
    } catch (error) {
      // Ignorar errores en warm up
      console.log('Warm up request failed, continuing...')
    }
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.makeRequest<T>({ ...config, method: 'GET', url })
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.makeRequest<T>({ ...config, method: 'POST', url, data })
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.makeRequest<T>({ ...config, method: 'PUT', url, data })
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.makeRequest<T>({ ...config, method: 'DELETE', url })
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.makeRequest<T>({ ...config, method: 'PATCH', url, data })
  }
}

export const apiClient = new ApiClient() 