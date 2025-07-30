'use client'

import { useCallback, useMemo } from 'react'
import { useServerUser } from '@/context/ServerUserContext'

interface AuthInfo {
  isAuthenticated: boolean
  user: unknown | null
  token: string | null
  error: string | null
  empresaId: number | null
}

interface UseAuthReturn {
  authInfo: AuthInfo
  getAuthHeaders: () => Record<string, string>
  getWebSocketAuth: () => { token: string | null; error: string | null }
  validateAuth: () => boolean
  validateAuthAsync: () => Promise<boolean>
  isTokenExpired: () => boolean
}

export function useAuth(): UseAuthReturn {
  const user = useServerUser()

  // Información de autenticación basada en ServerUserContext
  const authInfo = useMemo((): AuthInfo => {
    // Si no hay usuario del contexto, no está autenticado
    if (!user) {
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        error: 'Usuario no autenticado',
        empresaId: null
      }
    }

    // Si el usuario no tiene empresaId, no está completamente configurado
    if (!user.empresaId) {
      return {
        isAuthenticated: false,
        user: user,
        token: null, // No necesitamos token en el cliente
        error: 'Usuario sin empresa asignada',
        empresaId: null
      }
    }

    // Usuario autenticado y configurado
    return {
      isAuthenticated: true,
      user: user,
      token: null, // El token se maneja automáticamente por las cookies
      error: null,
      empresaId: user.empresaId
    }
  }, [user])

  // Headers para peticiones HTTP - las cookies se envían automáticamente
  const getAuthHeaders = useCallback((): Record<string, string> => {
    // En este sistema, las cookies se envían automáticamente con credentials: 'include'
    // Solo necesitamos headers de contenido
    return {
      'Content-Type': 'application/json'
    }
  }, [])

  // Configuración para WebSocket - las cookies se envían automáticamente
  const getWebSocketAuth = useCallback((): { token: string | null; error: string | null } => {
    if (!authInfo.isAuthenticated) {
      return {
        token: null,
        error: authInfo.error || 'No autenticado'
      }
    }
    
    // En este sistema, el WebSocket debe usar withCredentials: true
    // para enviar las cookies automáticamente
    return {
      token: null, // No necesitamos enviar token manualmente
      error: null
    }
  }, [authInfo])

  // Validar autenticación (síncrona)
  const validateAuth = useCallback((): boolean => {
    return authInfo.isAuthenticated && !!authInfo.empresaId
  }, [authInfo])

  // Validar autenticación (asíncrona) - para validación remota si es necesaria
  const validateAuthAsync = useCallback(async (): Promise<boolean> => {
    // Primero validación local
    if (!validateAuth()) {
      return false
    }

    try {
      // Aquí podrías agregar validación remota si es necesaria
      // Por ejemplo, verificar si la sesión sigue válida en el servidor
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        credentials: 'include', // Enviar cookies automáticamente
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        return false
      }

      return true
    } catch (error) {
      console.error('❌ Auth: Error en validación remota:', error)
      return false
    }
  }, [validateAuth])

  // Verificar si el token está expirado - en este sistema no es necesario
  // porque el backend maneja la expiración automáticamente
  const isTokenExpired = useCallback((): boolean => {
    // En este sistema, el backend maneja la expiración de tokens
    // y las cookies se renuevan automáticamente
    return false
  }, [])

  return {
    authInfo,
    getAuthHeaders,
    getWebSocketAuth,
    validateAuth,
    validateAuthAsync,
    isTokenExpired
  }
} 