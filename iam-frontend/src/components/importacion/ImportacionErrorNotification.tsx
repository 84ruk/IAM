'use client'

import React from 'react'
import { AlertTriangle, X, FileText, Info } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface ErrorImportacion {
  fila: number
  columna: string
  valor: string
  mensaje: string
  tipo: 'validacion' | 'duplicado' | 'error_db' | 'formato'
  sugerencia?: string
  codigoError?: string
  datosOriginales?: unknown
  campoEspecifico?: string
  valorEsperado?: string
  valorRecibido?: string
}

interface ImportacionErrorNotificationProps {
  error: string | null
  errores?: ErrorImportacion[]
  onClose: () => void
  onShowDetails?: () => void
  onRetry?: () => void
  showDetails?: boolean
}

export default function ImportacionErrorNotification({
  error,
  errores = [],
  onClose,
  onShowDetails,
  onRetry,
  showDetails = false
}: ImportacionErrorNotificationProps) {
  if (!error && errores.length === 0) return null

  const errorCount = errores.length
  const hasMultipleErrors = errorCount > 1

  const getErrorTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'validacion':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'duplicado':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'error_db':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'formato':
        return <Info className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getErrorTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'validacion':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'duplicado':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'error_db':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'formato':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className="bg-white border border-red-200 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Error en la Importación
            </h3>
            <p className="text-sm text-gray-600">
              {hasMultipleErrors 
                ? `${errorCount} errores encontrados durante la importación`
                : 'Se encontró un error durante la importación'
              }
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Error principal */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Resumen de errores */}
      {hasMultipleErrors && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="font-medium text-gray-900">Resumen de Errores</h4>
            <Badge variant="destructive">{errorCount} errores</Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(
              errores.reduce((acc, error) => {
                acc[error.tipo] = (acc[error.tipo] || 0) + 1
                return acc
              }, {} as Record<string, number>)
            ).map(([tipo, count]) => (
              <div key={tipo} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                {getErrorTypeIcon(tipo)}
                <span className="text-sm font-medium capitalize">{tipo}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista detallada de errores */}
      {showDetails && errores.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Detalles de Errores</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {errores.map((error, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${getErrorTypeColor(error.tipo)}`}
              >
                <div className="flex items-start gap-3">
                  {getErrorTypeIcon(error.tipo)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">Fila {error.fila}</span>
                      {error.columna && error.columna !== 'general' && (
                        <>
                          <span className="text-gray-500">•</span>
                          <span className="text-sm">Columna: {error.columna}</span>
                        </>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {error.tipo}
                      </Badge>
                    </div>
                    
                    <p className="text-sm mb-2">{error.mensaje}</p>
                    
                    {error.valor && (
                      <div className="text-xs bg-white/50 p-2 rounded mb-2">
                        <span className="font-medium">Valor:</span> {error.valor}
                      </div>
                    )}
                    
                    {error.sugerencia && (
                      <div className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                        <span className="font-medium text-blue-800">💡 Sugerencia:</span>
                        <span className="text-blue-700 ml-1">{error.sugerencia}</span>
                      </div>
                    )}
                    
                    {error.valorEsperado && error.valorRecibido && (
                      <div className="text-xs mt-2 space-y-1">
                        <div><span className="font-medium">Esperado:</span> {error.valorEsperado}</div>
                        <div><span className="font-medium">Recibido:</span> {error.valorRecibido}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Reintentar
            </Button>
          )}
          
          {errores.length > 0 && onShowDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowDetails}
              className="text-gray-600 hover:text-gray-800"
            >
              {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-gray-600 border-gray-200 hover:bg-gray-50"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
} 