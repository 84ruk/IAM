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
      console.log('Iniciando logout...')
      
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
      
      // Limpiar el cache de SWR
      mutate()
      
      // Limpiar cookies del lado del cliente como respaldo
      document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      // Redirigir al login
      router.push('/login')
      
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      
      // Limpiar el cache de SWR incluso si hay error
      mutate()
      
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