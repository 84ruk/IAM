import { cookies } from 'next/headers'
import { User } from '@/types/user'

export async function requireAuth() {
  try {
    const cookieStore = await cookies()
    const jwt = cookieStore.get('jwt')?.value

    if (!jwt) {
      return null
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) {
      console.warn('NEXT_PUBLIC_API_URL no está configurado')
      return null
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos de timeout

    try {
      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          Cookie: `jwt=${jwt}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        return null
      }

      return await res.json()
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      // Manejar diferentes tipos de errores de conexión
      if (fetchError.name === 'AbortError') {
        console.warn('Timeout al verificar autenticación - backend no responde')
        return null
      }
      
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message?.includes('ECONNREFUSED')) {
        console.warn('Backend no disponible - conexión rechazada')
        return null
      }
      
      if (fetchError.code === 'ENOTFOUND' || fetchError.message?.includes('ENOTFOUND')) {
        console.warn('No se puede resolver el host del backend')
        return null
      }
      
      if (fetchError.message?.includes('fetch failed')) {
        console.warn('Error de red al conectar con el backend')
        return null
      }
      
      // Para otros errores, loggear pero no fallar
      console.warn('Error al verificar autenticación:', fetchError.message)
      return null
    }
  } catch (error: any) {
    // Error general en la función
    console.warn('Error general en requireAuth:', error.message)
    return null
  }
}

/**
 * Mapea el usuario del backend (que tiene 'id') al formato del frontend (que espera 'sub')
 * @param userFromBackend - Usuario devuelto por requireAuth()
 * @returns Usuario mapeado al formato del frontend
 */
export function mapUserFromBackend(userFromBackend: any): User {
  return {
    sub: userFromBackend.id, // Mapear id a sub
    email: userFromBackend.email,
    rol: userFromBackend.rol,
    empresaId: userFromBackend.empresaId,
    tipoIndustria: userFromBackend.tipoIndustria,
    setupCompletado: userFromBackend.setupCompletado
  }
} 