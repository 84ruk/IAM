'use client'

import { ReactNode } from 'react'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { Loader2, AlertTriangle } from 'lucide-react'

type Role = 'SUPERADMIN' | 'ADMIN' | 'EMPLEADO' | 'PROVEEDOR'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: Role[]
  redirectTo?: string
  fallback?: ReactNode
}

export default function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard',
  fallback 
}: RoleGuardProps) {
  const { user, isLoading, isAuthenticated, hasAccess, userRole } = useRoleGuard({
    allowedRoles,
    redirectTo
  })

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#8E94F2]" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar nada (se redirigirá al login)
  if (!isAuthenticated) {
    return null
  }

  // Si no tiene acceso, mostrar fallback o mensaje de error
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">
            Tu rol actual ({userRole}) no tiene permisos para acceder a esta sección.
          </p>
          <p className="text-sm text-gray-500">
            Roles permitidos: {allowedRoles.join(', ')}
          </p>
        </div>
      </div>
    )
  }

  // Si tiene acceso, mostrar el contenido
  return <>{children}</>
} 