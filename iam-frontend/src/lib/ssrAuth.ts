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
      return null
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos de timeout

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

      const userData = await res.json()
      
      // ✅ Validar que el usuario tenga los campos requeridos
      if (!userData || !userData.id || !userData.email) {
        return null
      }

      return userData
      
    } catch {
      clearTimeout(timeoutId)
      return null
    }
  } catch {
    return null
  }
}

/**
 * Mapea el usuario del backend (que tiene 'id') al formato del frontend (que espera 'sub')
 * @param userFromBackend - Usuario devuelto por requireAuth()
 * @returns Usuario mapeado al formato del frontend
 */
export function mapUserFromBackend(userFromBackend: Record<string, unknown>): User {
  // ✅ NUEVO: Validación adicional de datos
  if (!userFromBackend || !userFromBackend.id || !userFromBackend.email) {
    throw new Error('Datos de usuario incompletos para mapeo')
  }

  return {
    sub: userFromBackend.id as number, // Mapear id a sub
    email: userFromBackend.email as string,
    rol: userFromBackend.rol as "SUPERADMIN" | "ADMIN" | "EMPLEADO" | "PROVEEDOR",
    empresaId: userFromBackend.empresaId as number,
    tipoIndustria: userFromBackend.tipoIndustria as string,
    setupCompletado: userFromBackend.setupCompletado as boolean
  }
}

// ✅ NUEVO: Función para validar sesión en el cliente
export async function validateClientSession(): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    return response.ok
  } catch (error) {
    console.error('❌ Client Auth: Error validando sesión:', error)
    return false
  }
} 