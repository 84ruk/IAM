import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from './useUser'

export const useAuth = () => {
  const { data: user, isLoading, error, mutate } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Si hay un error de autenticación (401), redirigir al login
    if (error && !isLoading) {
      console.log('Error de autenticación detectado:', error)
      router.push('/login')
    }
  }, [error, isLoading, router])

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      // Limpiar el cache de SWR
      mutate()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      // Limpiar el cache de SWR incluso si hay error
      mutate()
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