export interface ApiError {
  message: string | string[]
  statusCode?: number
  error?: string
  timestamp?: string
  path?: string
}

export interface ValidationError {
  field: string
  message: string
}

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean
  public errors?: ValidationError[]

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.name = this.constructor.name

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationAppError extends AppError {
  constructor(errors: ValidationError[]) {
    super('Error de validación', 400, true)
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

// Función para parsear errores de la API
export function parseApiError(response: Response, data?: any): AppError {
  const statusCode = response.status
  let message = 'Error desconocido'
  let errors: ValidationError[] = []

  if (data) {
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
        ? new ValidationAppError(errors)
        : new AppError(message, statusCode)
    case 401:
      return new AuthError(message)
    case 403:
      return new ForbiddenError(message)
    case 404:
      return new NotFoundError(message)
    case 422:
      return new ValidationAppError(errors)
    case 500:
      return new AppError('Error interno del servidor', statusCode)
    default:
      return new AppError(message, statusCode)
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

  return new AppError(error.message || 'Error de red desconocido')
}

// Función para mostrar errores al usuario
export function showErrorToUser(error: AppError): string {
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
    default:
      return error.message || 'Ha ocurrido un error inesperado'
  }
}

// Función para logging de errores
export function logError(error: AppError, context?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      context
    })
  } else {
    // En producción, enviar a servicio de logging
    console.error('Error:', {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      context
    })
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

  return {
    handleError,
    handleApiError,
    showErrorToUser
  }
} 