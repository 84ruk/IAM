import { useServerState, useServerActions } from '@/context/ServerStatusContext'
import { useCallback } from 'react'

/**
 * Hook personalizado para verificar el estado del servidor
 * Proporciona métodos específicos para diferentes casos de uso
 */
export function useServerHealth() {
  const {
    status,
    responseTime,
    retryCount,
    isWarmingUp
  } = useServerState()
  
  const { checkServerStatus, warmUpServer } = useServerActions()

  // Verificar si el servidor está listo para recibir peticiones
  const isReady = useCallback(() => {
    return status === 'online' || status === 'cold-start'
  }, [status])

  // Verificar si hay problemas de conectividad
  const hasConnectivityIssues = useCallback(() => {
    return status === 'offline' || status === 'error'
  }, [status])

  // Verificar si el servidor está en proceso de inicio
  const isStarting = useCallback(() => {
    return status === 'cold-start' || status === 'checking'
  }, [status])

  // Obtener el tiempo de respuesta promedio (últimos 5 checks)
  const getAverageResponseTime = useCallback(() => {
    // En una implementación real, podrías mantener un historial
    // Por ahora, retornamos el tiempo de respuesta actual
    return responseTime || 0
  }, [responseTime])

  // Verificar si el servidor está respondiendo rápidamente
  const isResponsive = useCallback(() => {
    if (!responseTime) return false
    return responseTime < 1000 // Menos de 1 segundo
  }, [responseTime])

  // Verificar si el servidor está lento
  const isSlow = useCallback(() => {
    if (!responseTime) return false
    return responseTime > 3000 // Más de 3 segundos
  }, [responseTime])

  // Obtener recomendaciones basadas en el estado actual
  const getRecommendations = useCallback(() => {
    const recommendations: string[] = []

    if (hasConnectivityIssues()) {
      recommendations.push('Verifica tu conexión a internet')
      recommendations.push('El servidor puede estar en mantenimiento')
      
      if (retryCount > 3) {
        recommendations.push('Considera recargar la página')
      }
    }

    if (isSlow()) {
      recommendations.push('El servidor está respondiendo lentamente')
      recommendations.push('Considera esperar un momento antes de continuar')
    }

    if (status === 'cold-start') {
      recommendations.push('El servidor está iniciando')
      recommendations.push('Las operaciones pueden tardar más de lo normal')
    }

    if (retryCount > 0) {
      recommendations.push(`Se han realizado ${retryCount} reintentos`)
    }

    return recommendations
  }, [hasConnectivityIssues, isSlow, status, retryCount])

  // Verificar si se debe mostrar una advertencia al usuario
  const shouldShowWarning = useCallback(() => {
    return hasConnectivityIssues() || isSlow() || retryCount > 2
  }, [hasConnectivityIssues, isSlow, retryCount])

  // Verificar si se debe mostrar un error crítico
  const shouldShowError = useCallback(() => {
    return hasConnectivityIssues() && retryCount > 5
  }, [hasConnectivityIssues, retryCount])

  // Obtener el nivel de severidad del problema
  const getSeverityLevel = useCallback(() => {
    if (shouldShowError()) return 'critical'
    if (shouldShowWarning()) return 'warning'
    if (isStarting()) return 'info'
    return 'success'
  }, [shouldShowError, shouldShowWarning, isStarting])

  return {
    // Estado básico
    status,
    responseTime,
    retryCount,
    isWarmingUp,
    
    // Métodos de verificación
    isReady,
    hasConnectivityIssues,
    isStarting,
    isResponsive,
    isSlow,
    
    // Métodos de acción
    checkServerStatus,
    warmUpServer,
    
    // Utilidades
    getAverageResponseTime,
    getRecommendations,
    shouldShowWarning,
    shouldShowError,
    getSeverityLevel
  }
}

/**
 * Hook específico para componentes que necesitan esperar a que el servidor esté listo
 */
export function useServerReady() {
  const { isReady, isStarting, hasConnectivityIssues, checkServerStatus } = useServerHealth()

  return {
    isReady: isReady(),
    isStarting: isStarting(),
    hasIssues: hasConnectivityIssues(),
    retry: checkServerStatus
  }
}

/**
 * Hook específico para componentes que necesitan mostrar el estado del servidor
 */
export function useServerStatusDisplay() {
  const { 
    status, 
    responseTime, 
    retryCount, 
    getRecommendations, 
    shouldShowWarning, 
    shouldShowError,
    getSeverityLevel 
  } = useServerHealth()

  return {
    status,
    responseTime,
    retryCount,
    recommendations: getRecommendations(),
    showWarning: shouldShowWarning(),
    showError: shouldShowError(),
    severityLevel: getSeverityLevel()
  }
} 