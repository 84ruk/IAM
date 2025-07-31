'use client'

import { ReactNode } from 'react'
import { AlertTriangle, WifiOff, RefreshCw, Shield, Server } from 'lucide-react'
import { BackendError } from '@/hooks/useBackendError'

interface BackendErrorHandlerProps {
  children: ReactNode
  error: BackendError | null
  isRetrying?: boolean
  onRetry?: () => void
  onClear?: () => void
}

export function BackendErrorHandler({ 
  children, 
  error, 
  isRetrying = false, 
  onRetry, 
  onClear 
}: BackendErrorHandlerProps) {
  if (!error) {
    return <>{children}</>
  }

  const getErrorIcon = () => {
    switch (error.name) {
      case 'BackendUnavailable':
      case 'HostNotFound':
      case 'NetworkError':
        return <WifiOff className="h-6 w-6 text-red-500" />
      case 'Unauthorized':
      case 'Forbidden':
        return <Shield className="h-6 w-6 text-yellow-500" />
      case 'ServerError':
        return <Server className="h-6 w-6 text-orange-500" />
      default:
        return <AlertTriangle className="h-6 w-6 text-red-500" />
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center mb-4">
          {getErrorIcon()}
        </div>
        
        <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">
          {error.name === 'BackendUnavailable' && 'Servidor no disponible'}
          {error.name === 'HostNotFound' && 'No se puede conectar'}
          {error.name === 'NetworkError' && 'Error de red'}
          {error.name === 'Unauthorized' && 'Sesión expirada'}
          {error.name === 'Forbidden' && 'Sin permisos'}
          {error.name === 'ServerError' && 'Error del servidor'}
          {error.name === 'TimeoutError' && 'Tiempo de espera agotado'}
          {error.name === 'UnknownError' && 'Error inesperado'}
        </h2>
        
        <p className="text-gray-600 text-center mb-6">
          {error.message}
        </p>
        
        <div className="flex flex-col space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isRetrying ? 'Reintentando...' : 'Reintentar'}
            </button>
          )}
          
          {onClear && (
            <button
              onClick={onClear}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Continuar
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Recargar página
          </button>
        </div>
        
        {/* Información adicional según el tipo de error */}
        {error.name === 'BackendUnavailable' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              <p className="font-medium">Solución:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Verifica que el servidor backend esté ejecutándose</li>
                <li>Comprueba que el puerto 3001 esté disponible</li>
                <li>Revisa los logs del servidor</li>
              </ul>
            </div>
          </div>
        )}
        
        {error.name === 'NetworkError' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              <p className="font-medium">Solución:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Verifica tu conexión a internet</li>
                <li>Comprueba la configuración de red</li>
                <li>Intenta desde otra red si es posible</li>
              </ul>
            </div>
          </div>
        )}
        
        {error.name === 'ServerError' && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <div className="text-sm text-orange-800">
              <p className="font-medium">Información:</p>
              <p>El servidor está experimentando problemas. Intenta nuevamente en unos minutos.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 