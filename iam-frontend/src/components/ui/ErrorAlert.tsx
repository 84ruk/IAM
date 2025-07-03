'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X, CheckCircle, Info, AlertCircle } from 'lucide-react'
import { AppError, ValidationAppError } from '@/lib/errorHandler'

interface ErrorAlertProps {
  error?: AppError | null
  onClose?: () => void
  autoClose?: boolean
  autoCloseDelay?: number
  className?: string
  showCloseButton?: boolean
}

type AlertType = 'error' | 'warning' | 'info' | 'success'

interface AlertConfig {
  bgColor: string
  borderColor: string
  textColor: string
  iconColor: string
  icon: React.ReactNode
}

const alertConfigs: Record<AlertType, AlertConfig> = {
  error: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
    icon: <AlertTriangle className="w-5 h-5" />
  },
  warning: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600',
    icon: <AlertTriangle className="w-5 h-5" />
  },
  info: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600',
    icon: <Info className="w-5 h-5" />
  },
  success: {
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600',
    icon: <CheckCircle className="w-5 h-5" />
  }
}

export default function ErrorAlert({ 
  error, 
  onClose, 
  autoClose = false, 
  autoCloseDelay = 5000,
  className = '',
  showCloseButton = true
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    if (error) {
      setIsVisible(true)
      
      // Extraer errores de validación si es un ValidationAppError
      if (error instanceof ValidationAppError && error.errors) {
        setValidationErrors(error.errors.map(err => err.message))
      } else {
        setValidationErrors([])
      }

      // Auto-close si está habilitado
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose()
        }, autoCloseDelay)

        return () => clearTimeout(timer)
      }
    } else {
      setIsVisible(false)
      setValidationErrors([])
    }
  }, [error, autoClose, autoCloseDelay])

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!error || !isVisible) return null

  // Determinar tipo de alerta basado en el error
  let alertType: AlertType = 'error'
  if (error instanceof ValidationAppError) {
    alertType = 'warning'
  } else if (error.statusCode === 401) {
    alertType = 'warning'
  } else if (error.statusCode === 403) {
    alertType = 'error'
  } else if (error.statusCode === 404) {
    alertType = 'info'
  } else if (error.statusCode >= 500) {
    alertType = 'error'
  }

  const config = alertConfigs[alertType]

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full ${className}`}>
      <div className={`${config.bgColor} border ${config.borderColor} rounded-lg shadow-lg p-4`}>
        <div className="flex items-start gap-3">
          <div className={`${config.iconColor} flex-shrink-0 mt-0.5`}>
            {config.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`text-sm font-medium ${config.textColor}`}>
                  {error.name === 'ValidationAppError' ? 'Error de Validación' : 
                   error.name === 'AuthError' ? 'Error de Autenticación' :
                   error.name === 'ForbiddenError' ? 'Acceso Denegado' :
                   error.name === 'NotFoundError' ? 'No Encontrado' :
                   error.name === 'NetworkError' ? 'Error de Conexión' :
                   'Error'}
                </h3>
                <p className={`text-sm mt-1 ${config.textColor}`}>
                  {error.message}
                </p>
                
                {/* Mostrar sugerencias si están disponibles */}
                {error.details?.suggestion && (
                  <p className={`text-xs mt-2 ${config.textColor} opacity-80`}>
                    💡 {error.details.suggestion}
                  </p>
                )}
                
                {/* Mostrar errores de validación específicos */}
                {validationErrors.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {validationErrors.map((errMsg, index) => (
                      <li key={index} className={`text-xs ${config.textColor} flex items-center gap-1`}>
                        <span className="w-1 h-1 bg-current rounded-full"></span>
                        {errMsg}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {showCloseButton && onClose && (
                <button
                  onClick={handleClose}
                  className={`${config.textColor} hover:opacity-70 transition-opacity flex-shrink-0 ml-2`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para errores de campo específicos
interface FieldErrorProps {
  error?: string | null
  fieldName?: string
  className?: string
}

export function FieldError({ error, fieldName, className = '' }: FieldErrorProps) {
  if (!error) return null

  return (
    <div className={`text-red-600 text-xs mt-1 flex items-center gap-1 ${className}`}>
      <AlertCircle className="w-3 h-3" />
      {fieldName && <span className="font-medium">{fieldName}: </span>}
      {error}
    </div>
  )
}

// Componente para errores inline
interface InlineErrorProps {
  error?: AppError | string | null
  className?: string
}

export function InlineError({ error, className = '' }: InlineErrorProps) {
  if (!error) return null

  const message = typeof error === 'string' ? error : error.message

  return (
    <div className={`text-red-600 text-sm flex items-center gap-1 ${className}`}>
      <AlertCircle className="w-4 h-4" />
      {message}
    </div>
  )
} 