import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSetupCheck } from './useSetupCheck'

interface UseSetupRedirectReturn {
  redirectAfterSetup: () => void
  redirectToSetup: () => void
  checkAndRedirect: () => Promise<void>
}

export function useSetupRedirect(): UseSetupRedirectReturn {
  const router = useRouter()
  const { invalidateCache, refetch } = useSetupCheck()

  const redirectAfterSetup = useCallback(async () => {
    try {
      console.log('🔄 useSetupRedirect: Setup completado, invalidando cache y redirigiendo...')
      
      // Invalidar cache para forzar nueva verificación
      invalidateCache()
      
      // Esperar un momento para que el backend procese los cambios
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Re-verificar el estado de setup
      await refetch()
      
      // Redirigir al dashboard
      console.log('✅ useSetupRedirect: Redirigiendo al dashboard...')
      router.push('/dashboard')
    } catch (error) {
      console.error('❌ useSetupRedirect: Error en redirección después del setup:', error)
      // Fallback: redirigir al dashboard de todas formas
      router.push('/dashboard')
    }
  }, [invalidateCache, refetch, router])

  const redirectToSetup = useCallback(() => {
    console.log('🔄 useSetupRedirect: Redirigiendo a setup de empresa...')
    router.push('/setup-empresa')
  }, [router])

  const checkAndRedirect = useCallback(async () => {
    try {
      console.log('🔍 useSetupRedirect: Verificando estado de setup...')
      
      // Verificar estado actual
      await refetch()
      
      // La redirección se manejará automáticamente por el componente que use este hook
    } catch (error) {
      console.error('❌ useSetupRedirect: Error verificando setup:', error)
    }
  }, [refetch])

  return {
    redirectAfterSetup,
    redirectToSetup,
    checkAndRedirect
  }
} 