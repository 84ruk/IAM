'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserContext } from '@/context/UserProvider'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, error, isAuthenticated } = useUserContext()
  const router = useRouter()
  const pathname = usePathname();
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Solo redirigir si no está cargando, no está autenticado, no hemos redirigido ya y NO estamos en /login
    if (!isLoading && !isAuthenticated && !hasRedirected && pathname !== '/login') {
      console.log('Usuario no autenticado, redirigiendo al login')
      setHasRedirected(true)
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router, hasRedirected, pathname])

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#8E94F2]" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si hay error de autenticación y no hemos redirigido, mostrar mensaje
  if (error && !hasRedirected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error de autenticación</p>
          <button 
            onClick={() => {
              setHasRedirected(true)
              router.push('/login')
            }}
            className="px-4 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0]"
          >
            Ir al login
          </button>
        </div>
      </div>
    )
  }

  // Si no está autenticado y ya redirigimos, mostrar loading
  if (!isAuthenticated && hasRedirected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#8E94F2]" />
          <p className="text-gray-600">Redirigiendo al login...</p>
        </div>
      </div>
    )
  }

  // Si está autenticado, mostrar el contenido
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Estado por defecto (no debería llegar aquí)
  return null
} 