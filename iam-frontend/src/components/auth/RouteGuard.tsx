'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types/user'

interface RouteGuardProps {
  children: React.ReactNode
  user: User | null
  requiredRoles?: string[]
  fallback?: React.ReactNode
}

export default function RouteGuard({ 
  children, 
  user, 
  requiredRoles = [], 
  fallback 
}: RouteGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Si no hay usuario, no está autorizado
    if (!user) {
      setIsAuthorized(false)
      router.push('/login')
      return
    }

    // Si no hay roles requeridos, está autorizado
    if (requiredRoles.length === 0) {
      setIsAuthorized(true)
      return
    }

    // Verificar si el usuario tiene el rol requerido
    const hasRequiredRole = requiredRoles.includes(user.rol)
    setIsAuthorized(hasRequiredRole)

    // Si no tiene el rol requerido, redirigir
    if (!hasRequiredRole) {
      router.push('/dashboard')
    }
  }, [user, requiredRoles, router])

  // Mostrar loading mientras se verifica
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Mostrar fallback si no está autorizado
  if (!isAuthorized) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    )
  }

  // Renderizar contenido si está autorizado
  return <>{children}</>
} 