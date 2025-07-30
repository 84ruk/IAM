import React from 'react'
import { AlertTriangle, FileText, Info, XCircle } from 'lucide-react'
import { ErrorImportacion } from '@/types/importacion'

interface ImportacionErrorDetailsProps {
  errores: ErrorImportacion[]
  onClose?: () => void
  onRetry?: () => void
  onDownloadReport?: () => void
}

export default function ImportacionErrorDetails({
  errores,
  onClose,
  onRetry,
  onDownloadReport
}: ImportacionErrorDetailsProps) {
  if (!errores || errores.length === 0) {
    return null
  }

  const getErrorTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'validacion':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'duplicado':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'error_db':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'formato':
        return <Info className="w-4 h-4 text-purple-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getErrorTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'validacion':
        return 'border-orange-200 bg-orange-50'
      case 'duplicado':
        return 'border-blue-200 bg-blue-50'
      case 'error_db':
        return 'border-red-200 bg-red-50'
      case 'formato':
        return 'border-purple-200 bg-purple-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getErrorTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'validacion':
        return 'Error de Validación'
      case 'duplicado':
        return 'Registro Duplicado'
      case 'error_db':
        return 'Error de Base de Datos'
      case 'formato':
        return 'Error de Formato'
      default:
        return 'Error'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-red-200 shadow-lg">
      {/* Header */}
      <div className="bg-red-50 border-b border-red-200 px-6 py-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                Errores de Importación
              </h3>
              <p className="text-sm text-red-600">
                Se encontraron {errores.length} error{errores.length !== 1 ? 'es' : ''} en el archivo
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {onDownloadReport && (
              <button
                onClick={onDownloadReport}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
              >
                Descargar Reporte
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de errores */}
      <div className="max-h-96 overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {errores.map((error, index) => (
            <div key={index} className={`p-4 ${getErrorTypeColor(error.tipo)}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getErrorTypeIcon(error.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {getErrorTypeLabel(error.tipo)}
                    </span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border">
                      Fila {error.fila}
                    </span>
                    {error.columna && error.columna !== 'general' && (
                      <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border">
                        Col: {error.columna}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    {error.mensaje}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {error.valor && (
                      <div>
                        <span className="text-gray-500">Valor recibido:</span>
                        <span className="ml-1 font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                          {error.valor}
                        </span>
                      </div>
                    )}
                    {error.valorEsperado && (
                      <div>
                        <span className="text-gray-500">Valor esperado:</span>
                        <span className="ml-1 font-mono bg-green-100 px-1.5 py-0.5 rounded text-green-700">
                          {error.valorEsperado}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {error.sugerencia && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-start gap-2">
                        <Info className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700">
                          <span className="font-medium">Sugerencia:</span> {error.sugerencia}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer con acciones */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{errores.length}</span> error{errores.length !== 1 ? 'es' : ''} encontrado{errores.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Reintentar
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 