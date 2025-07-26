'use client'

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Button from '@/components/ui/Button'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  X,
  Download,
  RefreshCw
} from 'lucide-react'
import { ImportacionValidationError } from '@/lib/api/importacion'

interface ImportacionNotificationsProps {
  success: string | null
  error: string | null
  validationErrors: ImportacionValidationError[] | null
  onClearSuccess: () => void
  onClearError: () => void
  onClearValidationErrors: () => void
  onDownloadErrors?: () => void
  onRetry?: () => void
  className?: string
}

export const ImportacionNotifications: React.FC<ImportacionNotificationsProps> = React.memo(({
  success,
  error,
  validationErrors,
  onClearSuccess,
  onClearError,
  onClearValidationErrors,
  onDownloadErrors,
  onRetry,
  className = ''
}) => {
  if (!success && !error && !validationErrors) return null

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Notificación de éxito */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">¡Importación exitosa!</AlertTitle>
          <AlertDescription className="text-green-700">
            {success}
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSuccess}
            className="absolute top-2 right-2 h-6 w-6 p-0 text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Notificación de error */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Error en la importación</AlertTitle>
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
          <div className="flex items-center gap-2 mt-2">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="text-red-600 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearError}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Alert>
      )}

      {/* Notificación de errores de validación */}
      {validationErrors && validationErrors.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Errores de validación</AlertTitle>
          <AlertDescription className="text-orange-700">
            Se encontraron {validationErrors.length} errores de validación en tu archivo. 
            Corrige los errores y vuelve a intentar la importación.
          </AlertDescription>
          <div className="flex items-center gap-2 mt-2">
            {onDownloadErrors && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadErrors}
                className="text-orange-600 border-orange-300 hover:bg-orange-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar errores
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearValidationErrors}
              className="text-orange-600 hover:text-orange-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Alert>
      )}
    </div>
  )
})

ImportacionNotifications.displayName = 'ImportacionNotifications' 