import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export interface AlertaSensor {
  id: number
  tipo: string
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  mensaje: string
  estado: 'ACTIVA' | 'RESUELTA' | 'ESCALADA'
  fechaEnvio: Date
  fechaResolucion?: Date
  valor?: string
  umbralesExcedidos?: string[]
  recomendaciones?: string[]
}

export interface EstadisticasAlertas {
  total: number
  activas: number
  resueltas: number
  escaladas: number
  porSeveridad: {
    BAJA: number
    MEDIA: number
    ALTA: number
    CRITICA: number
  }
}

export interface HistorialAlertas {
  historico: AlertaSensor[]
  agrupadoPorFecha: Record<string, AlertaSensor[]>
  estadisticas: EstadisticasAlertas
  periodo: {
    dias: number
    fechaInicio: Date
    fechaFin: Date
  }
}

export function useAlertasSensor(sensorId: number) {
  const { authInfo, getAuthHeaders } = useAuth()
  
  const [alertas, setAlertas] = useState<AlertaSensor[]>([])
  const [alertasActivas, setAlertasActivas] = useState<AlertaSensor[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasAlertas | null>(null)
  const [historial, setHistorial] = useState<HistorialAlertas | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Obtener todas las alertas de un sensor
   */
  const obtenerAlertas = useCallback(async (
    estado?: string,
    limite: number = 50,
    pagina: number = 1
  ) => {
    if (!authInfo.isAuthenticated) return

    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        limite: limite.toString(),
        pagina: pagina.toString()
      })
      
      if (estado) {
        params.append('estado', estado)
      }

      const response = await fetch(`http://localhost:3001/sensores/${sensorId}/alertas?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAlertas(data.data.alertas)
          setEstadisticas(data.data.estadisticas)
        }
      } else if (response.status === 401) {
        setError('No autorizado. Por favor, inicia sesión nuevamente.')
      } else {
        setError(`Error al obtener alertas: ${response.status}`)
      }
    } catch {
      setError('Error de conexión al servidor - Backend no disponible')
    } finally {
      setIsLoading(false)
    }
  }, [sensorId, authInfo.isAuthenticated, getAuthHeaders])

  /**
   * Obtener alertas activas de un sensor
   */
  const obtenerAlertasActivas = useCallback(async () => {
    if (!authInfo.isAuthenticated) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`http://localhost:3001/sensores/${sensorId}/alertas/activas`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAlertasActivas(data.data.alertasActivas)
        }
      } else if (response.status === 401) {
        setError('No autorizado. Por favor, inicia sesión nuevamente.')
      } else {
        setError(`Error al obtener alertas activas: ${response.status}`)
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }, [sensorId, authInfo.isAuthenticated, getAuthHeaders])

  /**
   * Obtener histórico de alertas de un sensor
   */
  const obtenerHistorial = useCallback(async (
    dias: number = 30,
    estado?: string
  ) => {
    if (!authInfo.isAuthenticated) return

    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        dias: dias.toString()
      })
      
      if (estado) {
        params.append('estado', estado)
      }

      const response = await fetch(`http://localhost:3001/sensores/${sensorId}/alertas/historico?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHistorial(data.data)
        }
      } else if (response.status === 401) {
        setError('No autorizado. Por favor, inicia sesión nuevamente.')
      } else {
        setError(`Error al obtener historial: ${response.status}`)
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }, [sensorId, authInfo.isAuthenticated, getAuthHeaders])

  /**
   * Resolver una alerta
   */
  const resolverAlerta = useCallback(async (
    alertaId: number,
    comentario?: string
  ) => {
    if (!authInfo.isAuthenticated) return false

    try {
      const response = await fetch(`http://localhost:3001/sensores/alertas/${alertaId}/resolver`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ comentario })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Actualizar la alerta en el estado local
          setAlertas(prev => prev.map(a => 
            a.id === alertaId 
              ? { ...a, estado: 'RESUELTA', fechaResolucion: new Date() }
              : a
          ))
          
          setAlertasActivas(prev => prev.filter(a => a.id !== alertaId))
          
          // Actualizar estadísticas
          if (estadisticas) {
            setEstadisticas(prev => prev ? {
              ...prev,
              activas: Math.max(0, prev.activas - 1),
              resueltas: prev.resueltas + 1
            } : null)
          }
          
          return true
        }
      }
      return false
    } catch {
      setError('Error al resolver la alerta')
      return false
    }
  }, [authInfo.isAuthenticated, getAuthHeaders, estadisticas])

  /**
   * Probar configuración de alertas
   */
  const probarConfiguracion = useCallback(async (
    tipoPrueba: 'EMAIL' | 'SMS' | 'WEBSOCKET',
    destinatario?: string
  ) => {
    if (!authInfo.isAuthenticated) return null

    try {
      const response = await fetch(`http://localhost:3001/sensores/${sensorId}/alertas/probar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ tipoPrueba, destinatario })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.data.resultado
        }
      }
      return null
    } catch {
      setError('Error al probar configuración')
      return null
    }
  }, [sensorId, authInfo.isAuthenticated, getAuthHeaders])

  /**
   * Refrescar datos
   */
  const refrescarDatos = useCallback(async () => {
    await Promise.all([
      obtenerAlertas(),
      obtenerAlertasActivas(),
      obtenerHistorial()
    ])
  }, [obtenerAlertas, obtenerAlertasActivas, obtenerHistorial])

  return {
    // Estados
    alertas,
    alertasActivas,
    estadisticas,
    historial,
    isLoading,
    error,
    
    // Funciones
    obtenerAlertas,
    obtenerAlertasActivas,
    obtenerHistorial,
    resolverAlerta,
    probarConfiguracion,
    refrescarDatos,
    
    // Utilidades
    totalAlertas: alertas.length,
    totalAlertasActivas: alertasActivas.length,
    tieneAlertasCriticas: alertasActivas.some(a => a.severidad === 'CRITICA'),
    tieneAlertasAltas: alertasActivas.some(a => a.severidad === 'ALTA'),
  }
}
