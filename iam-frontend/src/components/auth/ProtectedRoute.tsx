'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserContext } from '@/context/UserProvider'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, error, isAuthenticated } = useUserContext()
  const router = useRouter()

  useEffect(() => {
    // Si no está cargando y no hay usuario autenticado, redirigir al login
    if (!isLoading && !isAuthenticated) {
      console.log('Usuario no autenticado, redirigiendo al login')
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

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

  // Si hay error de autenticación, mostrar mensaje
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error de autenticación</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0]"
          >
            Ir al login
          </button>
        </div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar nada (se redirigirá)
  if (!isAuthenticated) {
    return null
  }

  // Si está autenticado, mostrar el contenido
  return <>{children}</>
} 