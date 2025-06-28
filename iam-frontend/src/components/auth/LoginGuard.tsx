'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserContext } from '@/context/UserProvider'
import { Loader2 } from 'lucide-react'

interface LoginGuardProps {
  children: React.ReactNode
}

export default function LoginGuard({ children }: LoginGuardProps) {
  const { user, isLoading, isAuthenticated } = useUserContext()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Solo redirigir si no está cargando, está autenticado y no hemos redirigido ya
    if (!isLoading && isAuthenticated && !hasRedirected) {
      console.log('Usuario ya autenticado, redirigiendo al dashboard')
      setHasRedirected(true)
      router.push('/dashboard')
    }
  }, [isLoading, isAuthenticated, router, hasRedirected])

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#8E94F2]" />
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Si está autenticado y ya redirigimos, mostrar loading
  if (isAuthenticated && hasRedirected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#8E94F2]" />
          <p className="text-gray-600">Redirigiendo al dashboard...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, mostrar el formulario de login
  if (!isAuthenticated) {
    return <>{children}</>
  }

  // Estado por defecto (no debería llegar aquí)
  return null
} 