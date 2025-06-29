import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from './useUser'

export const useAuth = () => {
  const { data: user, isLoading, error, mutate } = useUser()
  const router = useRouter()
  const pathname = usePathname();

  useEffect(() => {
    // Si hay un error de autenticación (401), redirigir al login solo si no estamos ya en /login
    if (error && !isLoading && pathname !== '/login') {
      router.push('/login')
    }
  }, [error, isLoading, router, pathname])

  const logout = async () => {
    try {
      // Llamar al endpoint de logout del backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      
      if (response.ok) {
        console.log('Logout exitoso en el backend')
      } else {
        console.log('Error en logout del backend:', response.status)
      }
      
      // Limpiar el cache de SWR y forzar usuario null
      mutate(null, false)
      
      // Limpiar cookies del lado del cliente como respaldo
      document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      // Redirigir al login
      router.push('/login')
      
    } catch (error) {
      // Limpiar el cache de SWR y forzar usuario null incluso si hay error
      mutate(null, false)
      
      // Limpiar cookies del lado del cliente como respaldo
      document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      // Redirigir al login
      router.push('/login')
    }
  }

  return {
    user,
    isLoading,
    error,
    mutate,
    logout,
    isAuthenticated: !!user && !error
  }
} 