import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserContext } from '@/context/UserProvider'

type Role = 'SUPERADMIN' | 'ADMIN' | 'EMPLEADO' | 'PROVEEDOR'

interface UseRoleGuardOptions {
  allowedRoles: Role[]
  redirectTo?: string
}

export const useRoleGuard = ({ allowedRoles, redirectTo = '/dashboard' }: UseRoleGuardOptions) => {
  const { user, isLoading, isAuthenticated } = useUserContext()
  const router = useRouter()

  useEffect(() => {
    // Si no está cargando y no está autenticado, redirigir al login
    if (!isLoading && !isAuthenticated) {
      console.log('Usuario no autenticado, redirigiendo al login')
      router.push('/login')
      return
    }

    // Si no está cargando, está autenticado pero no tiene el rol requerido
    if (!isLoading && isAuthenticated && user && !allowedRoles.includes(user.rol as Role)) {
      console.log(`Usuario con rol ${user.rol} no tiene acceso. Roles permitidos:`, allowedRoles)
      router.push(redirectTo)
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, redirectTo, router])

  const hasAccess = user && allowedRoles.includes(user.rol as Role)

  return {
    user,
    isLoading,
    isAuthenticated,
    hasAccess,
    userRole: user?.rol
  }
} 