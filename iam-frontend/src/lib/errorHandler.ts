export interface ApiError {
  message: string | string[]
  statusCode?: number
  error?: string
  timestamp?: string
  path?: string
  details?: {
    code?: string
    suggestion?: string
    field?: string
    operation?: string
    context?: string
  }
}

export interface ValidationError {
  field: string
  message: string
}

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean
  public errors?: ValidationError[]
  public details?: unknown
  public timestamp: string

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.details = details
    this.name = this.constructor.name
    this.timestamp = new Date().toISOString()

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationAppError extends AppError {
  constructor(errors: ValidationError[], details?: unknown) {
    super('Error de validación', 400, true, details)
    this.errors = errors
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Error de conexión') {
    super(message, 0, true)
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Error de autenticación') {
    super(message, 401, true)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403, true)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado') {
    super(message, 404, true)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflicto de datos') {
    super(message, 409, true)
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message: string = 'Entidad no procesable') {
    super(message, 422, true)
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Servicio no disponible') {
    super(message, 503, true)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Demasiadas solicitudes') {
    super(message, 429, true)
  }
}

// Sanitización de mensajes de error para evitar XSS
function sanitizeMessage(message: string): string {
  return message
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

// Función para parsear errores de la API
export function parseApiError(response: Response, data?: unknown): AppError {
  const statusCode = response.status
  let message = 'Error desconocido'
  let errors: ValidationError[] = []
  let details: unknown = null

  if (data && typeof data === 'object' && data !== null) {
    const errorData = data as Record<string, unknown>
    
    // Extraer detalles si están disponibles
    if ('details' in errorData && errorData.details) {
      details = errorData.details
    }

    // Manejar diferentes formatos de error
    if ('message' in errorData && errorData.message) {
      if (typeof errorData.message === 'string') {
        message = sanitizeMessage(errorData.message)
      } else if (Array.isArray(errorData.message)) {
        const messages = errorData.message as string[]
        message = messages.map((msg: string) => sanitizeMessage(msg)).join(', ')
        errors = messages.map((msg: string, index: number) => ({
          field: `field_${index}`,
          message: sanitizeMessage(msg)
        }))
      }
    } else if ('error' in errorData && errorData.error && typeof errorData.error === 'string') {
      message = sanitizeMessage(errorData.error)
    }

    // Manejar errores de validación específicos
    if ('errors' in errorData && errorData.errors && Array.isArray(errorData.errors)) {
      const errorArray = errorData.errors as Array<Record<string, unknown>>
      errors = errorArray.map((err) => ({
        field: (err.field || err.path || 'unknown') as string,
        message: sanitizeMessage((err.message || 'Error de validación') as string)
      }))
    }
  }

  // Crear error específico según el código de estado
  switch (statusCode) {
    case 400:
      return errors.length > 0 
        ? new ValidationAppError(errors, details)
        : new AppError(message, statusCode, true, details)
    case 401:
      return new AuthError(message)
    case 403:
      return new ForbiddenError(message)
    case 404:
      return new NotFoundError(message)
    case 409:
      return new ConflictError(message)
    case 422:
      return new ValidationAppError(errors, details)
    case 429:
      return new RateLimitError(message)
    case 503:
      return new ServiceUnavailableError(message)
    case 500:
      return new AppError('Error interno del servidor', statusCode, true, details)
    default:
      return new AppError(message, statusCode, true, details)
  }
}

// Función para manejar errores de red
export function handleNetworkError(error: unknown): AppError {
  if (error instanceof Error) {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new NetworkError('No se pudo conectar con el servidor')
  }
  
  if (error.name === 'AbortError') {
    return new NetworkError('La solicitud fue cancelada')
  }

  if (error.name === 'TimeoutError') {
    return new NetworkError('La solicitud tardó demasiado en completarse')
  }

  return new AppError(error.message || 'Error de red desconocido')
  }

  return new AppError('Error de red desconocido')
}

// Función para mostrar errores al usuario
export function showErrorToUser(error: AppError): string {
  // Si hay detalles con sugerencias, usarlas
  if (error.details && typeof error.details === 'object' && error.details !== null) {
    const details = error.details as Record<string, unknown>
    if ('suggestion' in details && details.suggestion && typeof details.suggestion === 'string') {
      return sanitizeMessage(details.suggestion)
    }
  }

  switch (error.constructor) {
    case ValidationAppError:
      return 'Por favor, corrige los errores en el formulario'
    case NetworkError:
      return 'Error de conexión. Verifica tu conexión a internet'
    case AuthError:
      return 'Sesión expirada. Por favor, inicia sesión nuevamente'
    case ForbiddenError:
      return 'No tienes permisos para realizar esta acción'
    case NotFoundError:
      return 'El recurso solicitado no fue encontrado'
    case ConflictError:
      return 'Los datos ya existen en el sistema'
    case RateLimitError:
      return 'Demasiadas solicitudes. Intenta de nuevo en un momento'
    case ServiceUnavailableError:
      return 'El servicio no está disponible en este momento'
    default:
      return sanitizeMessage(error.message || 'Ha ocurrido un error inesperado')
  }
}

// Función para log de errores
export function logError(error: AppError, context?: { context?: string, operation?: string, userId?: string }) {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      details: error.details,
      timestamp: error.timestamp
    },
    context: {
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      ...context
    }
  }

  // En desarrollo, mostrar en consola
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', logData)
  }

  // En producción, enviar a servicio de logging (ej: Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    // Aquí se podría integrar con servicios de logging
    // console.error('Production error:', logData)
  }

  return logData
}

// Hook para manejo de errores en componentes
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string): AppError => {
    let appError: AppError

    if (error instanceof AppError) {
      appError = error
    } else if (error instanceof Response) {
      // Manejar respuesta de fetch
      appError = new AppError(`Error HTTP ${error.status}`, error.status)
    } else if (error instanceof Error) {
      // Error estándar de JavaScript
      appError = new AppError(error.message || 'Error desconocido')
    } else {
      // Error genérico
      appError = new AppError('Error desconocido')
    }

    logError(appError, { context })
    return appError
  }

  const handleApiError = async (response: Response): Promise<AppError> => {
    try {
      const data = await response.json()
      return parseApiError(response, data)
    } catch {
      return parseApiError(response)
    }
  }

  const handleAsyncError = async <T>(asyncFn: () => Promise<T>, context?: string): Promise<T> => {
    try {
      return await asyncFn()
    } catch (error) {
      const appError = handleError(error, context)
      throw appError
    }
  }

  return {
    handleError,
    handleApiError,
    handleAsyncError,
    showErrorToUser,
    logError
  }
}

// Función para validar respuestas de API
export async function validateApiResponse(response: Response): Promise<unknown> {
  if (!response.ok) {
    try {
      const data = await response.json()
      const error = parseApiError(response, data)
      throw error
    } catch {
      // Si no se puede parsear la respuesta JSON, crear un error básico
      const error = parseApiError(response)
      throw error
    }
  }

  try {
    return await response.json()
  } catch (error) {
    throw new AppError('Error al procesar la respuesta del servidor')
  }
}

// Función para crear fetch con manejo de errores
export async function safeFetch(url: string, options?: RequestInit): Promise<unknown> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers
      },
      ...options
    })

    return await validateApiResponse(response)
  } catch {
    throw new AppError('Error de conexión')
  }
} 