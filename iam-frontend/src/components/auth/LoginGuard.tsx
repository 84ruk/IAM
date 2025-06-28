'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserContext } from '@/context/UserProvider'
import { Loader2 } from 'lucide-react'

interface LoginGuardProps {
  children: React.ReactNode
}

export default function LoginGuard({ children }: LoginGuardProps) {
  const { user, isLoading, isAuthenticated } = useUserContext()
  const router = useRouter()

  useEffect(() => {
    // Si no está cargando y está autenticado, redirigir al dashboard
    if (!isLoading && isAuthenticated) {
      console.log('Usuario ya autenticado, redirigiendo al dashboard')
      router.push('/dashboard')
    }
  }, [isLoading, isAuthenticated, router])

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

  // Si está autenticado, no mostrar nada (se redirigirá)
  if (isAuthenticated) {
    return null
  }

  // Si no está autenticado, mostrar el formulario de login
  return <>{children}</>
} 