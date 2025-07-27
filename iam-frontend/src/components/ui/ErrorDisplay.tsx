'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  AlertTriangle, 
  X, 
  Download, 
  RefreshCw, 
  Info,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { UserFriendlyError } from '@/lib/api/errorHandler'

interface ErrorDisplayProps {
  error: UserFriendlyError | string | null
  onClose?: () => void
  onRetry?: () => void
  onDownloadTemplate?: () => void
  className?: string
  showIcon?: boolean
}

const getErrorIcon = (type: string) => {
  switch (type) {
    case 'validation':
      return <AlertTriangle className="w-5 h-5 text-orange-500" />
    case 'file':
      return <FileText className="w-5 h-5 text-red-500" />
    case 'system':
      return <XCircle className="w-5 h-5 text-red-500" />
    case 'network':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    case 'auth':
      return <AlertCircle className="w-5 h-5 text-blue-500" />
    default:
      return <AlertTriangle className="w-5 h-5 text-red-500" />
  }
}

const getErrorColor = (type: string) => {
  switch (type) {
    case 'validation':
      return 'border-orange-200 bg-orange-50'
    case 'file':
      return 'border-red-200 bg-red-50'
    case 'system':
      return 'border-red-200 bg-red-50'
    case 'network':
      return 'border-yellow-200 bg-yellow-50'
    case 'auth':
      return 'border-blue-200 bg-blue-50'
    default:
      return 'border-red-200 bg-red-50'
  }
}

export default function ErrorDisplay({ 
  error, 
  onClose, 
  onRetry, 
  onDownloadTemplate,
  className = '',
  showIcon = true 
}: ErrorDisplayProps) {
  if (!error) return null

  // Si es un string simple, convertirlo a formato UserFriendlyError
  const userError: UserFriendlyError = typeof error === 'string' 
    ? {
        title: 'Error',
        message: error,
        type: 'system'
      }
    : error

  const errorColor = getErrorColor(userError.type)

  return (
    <Card className={`border-2 ${errorColor} ${className}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {showIcon && (
            <div className="flex-shrink-0 mt-0.5">
              {getErrorIcon(userError.type)}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {userError.title}
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  {userError.message}
                </p>

                {/* Detalles del error */}
                {userError.details && userError.details.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      Detalles:
                    </div>
                    <ul className="space-y-1">
                      {userError.details.map((detail, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sugerencias */}
                {userError.suggestions && userError.suggestions.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Sugerencias:
                    </div>
                    <ul className="space-y-1">
                      {userError.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Botón de cerrar */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 mt-3">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reintentar
                </Button>
              )}
              
              {onDownloadTemplate && (
                <Button
                  onClick={onDownloadTemplate}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Descargar Plantilla
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Variante compacta para mostrar en modales
export function CompactErrorDisplay({ 
  error, 
  onClose, 
  onRetry 
}: ErrorDisplayProps) {
  if (!error) return null

  const userError: UserFriendlyError = typeof error === 'string' 
    ? {
        title: 'Error',
        message: error,
        type: 'system'
      }
    : error

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-red-800 mb-1">
            {userError.title}
          </h4>
          <p className="text-xs text-red-700 mb-2">
            {userError.message}
          </p>
          
          {userError.suggestions && userError.suggestions.length > 0 && (
            <div className="text-xs text-red-600">
              <strong>Sugerencia:</strong> {userError.suggestions[0]}
            </div>
          )}
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      
      {onRetry && (
        <div className="mt-2">
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="text-xs border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reintentar
          </Button>
        </div>
      )}
    </div>
  )
} 