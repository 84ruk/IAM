'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSetupCheck } from '@/hooks/useSetupCheck'

interface OptimizedSetupGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  enableClientFallback?: boolean
}

export default function OptimizedSetupGuard({ 
  children, 
  fallback,
  enableClientFallback = true 
}: OptimizedSetupGuardProps) {
  const router = useRouter()
  const { needsSetup, isLoading, error } = useSetupCheck()
  const [hasRedirected, setHasRedirected] = useState(false)
  const [shouldShowFallback, setShouldShowFallback] = useState(false)

  useEffect(() => {
    // Solo verificar en el cliente si el middleware no pudo hacerlo
    if (enableClientFallback && !isLoading && !error && needsSetup && !hasRedirected) {
      console.log('🔄 OptimizedSetupGuard: Fallback del cliente - Usuario necesita configurar empresa')
      setHasRedirected(true)
      router.push('/setup-empresa')
    }

    // Mostrar fallback solo si hay error o si el middleware no funcionó
    if (error || (isLoading && shouldShowFallback)) {
      setShouldShowFallback(true)
    }
  }, [needsSetup, isLoading, error, hasRedirected, router, enableClientFallback, shouldShowFallback])

  // Mostrar fallback solo si es necesario
  if (shouldShowFallback && (isLoading || error)) {
    if (isLoading) {
      return fallback || (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando configuración...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="bg-red-50 rounded-full p-4 mb-4 mx-auto w-fit">
              <div className="w-8 h-8 text-red-600">⚠️</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error de configuración</h3>
            <p className="text-gray-600 mb-4 max-w-md">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    }
  }

  // Si necesita setup y ya redirigió, mostrar loading
  if (needsSetup && hasRedirected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo a configuración...</p>
        </div>
      </div>
    )
  }

  // Si no necesita setup, mostrar el contenido normal
  if (!needsSetup) {
    return <>{children}</>
  }

  // Por defecto, mostrar el contenido (el middleware debería haber manejado la redirección)
  return <>{children}</>
} 