'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'

interface BackendStatusProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function BackendStatus({ children }: BackendStatusProps) {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking')

  const checkBackendStatus = async () => {
    setStatus('checking')
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        setStatus('offline')
        return
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const response = await fetch(`${apiUrl}/health`, {
        signal: controller.signal,
        cache: 'no-store'
      })

      clearTimeout(timeoutId)
      setStatus(response.ok ? 'online' : 'offline')
    } catch {
      setStatus('offline')
    } finally {
      // setIsChecking(false) // This line was removed from the new_code, so it's removed here.
    }
  }

  useEffect(() => {
    checkBackendStatus()
  }, [])

  // Si el backend no está disponible, mostrar fallback o mensaje de error
  if (status === 'offline') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center mb-4">
            <WifiOff className="h-12 w-12 text-red-500" />
          </div>
          
          <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">
            Servidor no disponible
          </h2>
          
          <p className="text-gray-600 text-center mb-6">
            No se puede conectar con el servidor. Verifica que el backend esté ejecutándose.
          </p>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={checkBackendStatus}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Recargar página
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Solución:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Verifica que el servidor backend esté ejecutándose</li>
                  <li>Comprueba que el puerto 3001 esté disponible</li>
                  <li>Revisa los logs del servidor</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Si está verificando, mostrar loading
  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando conexión con el servidor...</p>
        </div>
      </div>
    )
  }

  // Si el backend está disponible, mostrar el contenido normal
  return <>{children}</>
}

// Hook para verificar el estado del backend
export function useBackendStatus() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

  const checkStatus = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        setIsAvailable(false)
        return
      }

      const response = await fetch(`${apiUrl}/health`, {
        cache: 'no-store'
      })
      setIsAvailable(response.ok)
    } catch {
      setIsAvailable(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return {
    isAvailable,
    checkStatus
  }
} 