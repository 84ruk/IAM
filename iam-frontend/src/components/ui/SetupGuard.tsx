'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSetupCheck } from '@/hooks/useSetupCheck'

interface SetupGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export default function SetupGuard({ 
  children, 
  fallback,
  redirectTo = '/setup-empresa'
}: SetupGuardProps) {
  const router = useRouter()
  const { needsSetup, isLoading, error } = useSetupCheck()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Solo redirigir si no está cargando, no hay error, y necesita setup
    if (!isLoading && !error && needsSetup && !hasRedirected) {
      console.log('🔄 SetupGuard: Usuario necesita configurar empresa, redirigiendo automáticamente')
      setHasRedirected(true)
      router.push(redirectTo)
    }
  }, [needsSetup, isLoading, error, hasRedirected, router, redirectTo])

  // Mostrar loading mientras se verifica setup
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

  // Mostrar error si hay problema verificando setup
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

  // Fallback mientras se procesa la redirección
  return fallback || (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Preparando aplicación...</p>
      </div>
    </div>
  )
} 