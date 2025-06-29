'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserContext } from '@/context/UserProvider'
import { Loader2 } from 'lucide-react'

interface LoginGuardProps {
  children: React.ReactNode
}

export default function LoginGuard({ children }: LoginGuardProps) {
  const { isAuthenticated } = useUserContext()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !hasRedirected) {
      setHasRedirected(true)
      router.push('/dashboard')
    }
  }, [isAuthenticated, router, hasRedirected])

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

  // Siempre mostrar el formulario de login si no está autenticado
  return <>{children}</>
} 