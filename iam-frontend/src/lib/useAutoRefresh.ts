//prueba de auto refresh

import { useEffect, useRef } from 'react'

interface UseAutoRefreshOptions {
  interval?: number // intervalo en milisegundos
  enabled?: boolean // si está habilitado
  onRefresh?: () => void // callback cuando se actualiza
}

export function useAutoRefresh({
  interval = 30000, // 30 segundos por defecto
  enabled = true,
  onRefresh
}: UseAutoRefreshOptions = {}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onRefreshRef = useRef(onRefresh)

  // Actualizar la referencia del callback
  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Limpiar intervalo anterior si existe
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Crear nuevo intervalo
    intervalRef.current = setInterval(() => {
      if (onRefreshRef.current) {
        onRefreshRef.current()
      }
    }, interval)

    // Cleanup al desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [interval, enabled])

  // Función para limpiar manualmente
  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  return { stopAutoRefresh }
} 