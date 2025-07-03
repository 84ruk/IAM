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
  public details?: any

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, details?: any) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.details = details
    this.name = this.constructor.name

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationAppError extends AppError {
  constructor(errors: ValidationError[], details?: any) {
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

// Función para parsear errores de la API
export function parseApiError(response: Response, data?: any): AppError {
  const statusCode = response.status
  let message = 'Error desconocido'
  let errors: ValidationError[] = []
  let details: any = null

  if (data) {
    // Extraer detalles si están disponibles
    if (data.details) {
      details = data.details
    }

    // Manejar diferentes formatos de error
    if (typeof data.message === 'string') {
      message = data.message
    } else if (Array.isArray(data.message)) {
      message = data.message.join(', ')
      errors = data.message.map((msg: string, index: number) => ({
        field: `field_${index}`,
        message: msg
      }))
    } else if (data.error) {
      message = data.error
    }

    // Manejar errores de validación específicos
    if (data.errors && Array.isArray(data.errors)) {
      errors = data.errors.map((err: any) => ({
        field: err.field || err.path || 'unknown',
        message: err.message || 'Error de validación'
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
    case 503:
      return new ServiceUnavailableError(message)
    case 500:
      return new AppError('Error interno del servidor', statusCode, true, details)
    default:
      return new AppError(message, statusCode, true, details)
  }
}

// Función para manejar errores de red
export function handleNetworkError(error: any): AppError {
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

// Función para mostrar errores al usuario
export function showErrorToUser(error: AppError): string {
  // Si hay detalles con sugerencias, usarlas
  if (error.details?.suggestion) {
    return error.details.suggestion
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
    case ServiceUnavailableError:
      return 'El servicio no está disponible en este momento'
    default:
      return error.message || 'Ha ocurrido un error inesperado'
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
      details: error.details
    },
    context
  }

  // En desarrollo, mostrar en consola
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', logData)
  }

  // En producción, enviar a servicio de logging
  if (process.env.NODE_ENV === 'production') {
    // Aquí se podría integrar con servicios como Sentry, LogRocket, etc.
    console.error('Production error:', logData)
  }
}

// Hook para manejo de errores en componentes
export function useErrorHandler() {
  const handleError = (error: any, context?: string): AppError => {
    let appError: AppError

    if (error instanceof AppError) {
      appError = error
    } else if (error instanceof Response) {
      // Manejar respuesta de fetch
      appError = new AppError(`Error HTTP ${error.status}`, error.status)
    } else {
      // Error genérico
      appError = new AppError(error.message || 'Error desconocido')
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

  const handleAsyncError = async (asyncFn: () => Promise<any>, context?: string): Promise<any> => {
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
export async function validateApiResponse(response: Response): Promise<any> {
  if (!response.ok) {
    const error = await handleApiError(response)
    throw error
  }

  try {
    return await response.json()
  } catch (error) {
    throw new AppError('Error al procesar la respuesta del servidor')
  }
}

// Función para crear fetch con manejo de errores
export async function safeFetch(url: string, options?: RequestInit): Promise<any> {
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
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    throw handleNetworkError(error)
  }
} 