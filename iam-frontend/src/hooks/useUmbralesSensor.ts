import { useState, useCallback } from 'react'
import { sensorService } from '@/lib/services/sensorService'
import { UmbralesSensorDto, ConfiguracionAlertaResponse } from '@/types/sensor'
import { useToast } from '@/components/ui/Toast'

export const useUmbralesSensor = (sensorId: number) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [umbrales, setUmbrales] = useState<UmbralesSensorDto | null>(null)
  const [configuracion, setConfiguracion] = useState<ConfiguracionAlertaResponse | null>(null)
  const { addToast } = useToast()

  const cargarUmbrales = useCallback(async () => {
    if (!sensorId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await sensorService.obtenerUmbralesSensor(sensorId)
      setConfiguracion(data)
      setUmbrales(data.umbralCritico)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar umbrales'
      setError(errorMessage)
      addToast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }, [sensorId, addToast])

  const actualizarUmbrales = useCallback(async (nuevosUmbrales: UmbralesSensorDto) => {
    if (!sensorId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await sensorService.actualizarUmbralesSensor(sensorId, nuevosUmbrales)
      setConfiguracion(data)
      setUmbrales(data.umbralCritico)
      
      addToast({
        type: 'success',
        title: 'Umbrales actualizados',
        message: 'La configuración se ha guardado correctamente'
      })
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar umbrales'
      setError(errorMessage)
      addToast({
        type: 'error',
        title: 'Error',
        message: errorMessage
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [sensorId, addToast])

  const resetearUmbrales = useCallback(() => {
    setUmbrales(null)
    setConfiguracion(null)
    setError(null)
  }, [])

  return {
    umbrales,
    configuracion,
    isLoading,
    error,
    cargarUmbrales,
    actualizarUmbrales,
    resetearUmbrales
  }
}
