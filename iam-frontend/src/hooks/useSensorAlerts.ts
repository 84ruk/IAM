import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api'

export interface SensorAlert {
  id: string
  sensorId: number
  sensorNombre: string
  sensorTipo: string
  ubicacionId: number
  ubicacionNombre: string
  valor: number
  unidad: string
  umbralMin?: number
  umbralMax?: number
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTA' | 'IGNORADA'
  mensaje: string
  timestamp: string
  empresaId: number
}

export interface AlertStats {
  total: number
  pendientes: number
  enProceso: number
  resueltas: number
  ignoradas: number
  porSeveridad: {
    BAJA: number
    MEDIA: number
    ALTA: number
    CRITICA: number
  }
}

export interface AlertFilters {
  estado?: string
  tipo?: string
  ubicacionId?: number
}

export function useSensorAlerts() {
  const { authInfo } = useAuth()
  const [alertas, setAlertas] = useState<SensorAlert[]>([])
  const [estadisticas, setEstadisticas] = useState<AlertStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAlertas = useCallback(async (filtros?: AlertFilters) => {
    if (!authInfo.isAuthenticated || !authInfo.empresaId) {
      setError('Usuario no autenticado')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (filtros?.estado) params.append('estado', filtros.estado)
      if (filtros?.tipo) params.append('tipo', filtros.tipo)
      if (filtros?.ubicacionId) params.append('ubicacionId', filtros.ubicacionId.toString())
      
      const response = await apiClient.get(`/alertas/sensor?${params.toString()}`)
      setAlertas((response as { data: SensorAlert[] }).data || [])
    } catch (err) {
      setError('Error al cargar las alertas')
      console.error('Error fetching alertas:', err)
    } finally {
      setLoading(false)
    }
  }, [authInfo.isAuthenticated, authInfo.empresaId])

  const fetchEstadisticas = useCallback(async () => {
    if (!authInfo.isAuthenticated || !authInfo.empresaId) return

    try {
      const response = await apiClient.get(`/alertas/sensor-alerts/estadisticas`)
      setEstadisticas((response as { data: AlertStats }).data)
    } catch (err) {
      console.error('Error fetching estadísticas:', err)
    }
  }, [authInfo.isAuthenticated, authInfo.empresaId])

  const actualizarEstadoAlerta = useCallback(async (
    alertaId: string, 
    nuevoEstado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTA' | 'IGNORADA'
  ) => {
    if (!authInfo.isAuthenticated || !authInfo.empresaId) return false

    try {
      await apiClient.patch(`/alertas/sensor-alerts/${alertaId}/estado`, {
        estado: nuevoEstado
      })
      
      // Actualizar la alerta localmente
      setAlertas(prev => prev.map(alerta => 
        alerta.id === alertaId 
          ? { ...alerta, estado: nuevoEstado }
          : alerta
      ))

      // Recargar estadísticas
      await fetchEstadisticas()
      
      return true
    } catch (err) {
      setError('Error al actualizar el estado de la alerta')
      console.error('Error updating alerta:', err)
      return false
    }
  }, [authInfo.isAuthenticated, authInfo.empresaId, fetchEstadisticas])

  const simularAlerta = useCallback(async (tipo: string, valor: number) => {
    if (!authInfo.isAuthenticated || !authInfo.empresaId) return

    try {
      setLoading(true)
      const response = await apiClient.post(`/alertas/sensor-alerts/simular`, {
        tipo,
        valor,
        empresaId: authInfo.empresaId
      })
      
      // Recargar alertas después de simular
      await fetchAlertas()
      await fetchEstadisticas()
      
      return (response as { data: unknown }).data
    } catch (err) {
      setError('Error al simular la alerta')
      console.error('Error simulating alerta:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [authInfo.isAuthenticated, authInfo.empresaId, fetchAlertas, fetchEstadisticas])

  useEffect(() => {
    if (authInfo.isAuthenticated && authInfo.empresaId) {
      fetchAlertas()
      fetchEstadisticas()
    }
  }, [authInfo.isAuthenticated, authInfo.empresaId, fetchAlertas, fetchEstadisticas])

  return {
    alertas,
    estadisticas,
    loading,
    error,
    fetchAlertas,
    fetchEstadisticas,
    actualizarEstadoAlerta,
    simularAlerta,
    refetch: () => {
      fetchAlertas()
      fetchEstadisticas()
    }
  }
}
