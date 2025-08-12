import { UmbralesSensor, ConfiguracionSistemaAlertas, AlertaActiva } from '@/types/sensor'
import { apiClient } from '../api'

export const umbralesService = {
  // Configuración de umbrales por sensor
  async obtenerUmbralesSensor(sensorId: number): Promise<UmbralesSensor | null> {
    try {
      const response = await apiClient.get(`/sensores/${sensorId}/umbrales`)
      return (response as { data: UmbralesSensor }).data
    } catch (error) {
      console.error('Error obteniendo umbrales del sensor:', error)
      return null
    }
  },

  async guardarUmbralesSensor(umbrales: UmbralesSensor): Promise<UmbralesSensor> {
    try {
      if (umbrales.id) {
        const response = await apiClient.put(`/sensores/umbrales/${umbrales.id}`, umbrales)
        return (response as { data: UmbralesSensor }).data
      } else {
        const response = await apiClient.post('/sensores/umbrales', umbrales)
        return (response as { data: UmbralesSensor }).data
      }
    } catch (error) {
      console.error('Error guardando umbrales del sensor:', error)
      throw error
    }
  },

  async obtenerUmbralesEmpresa(empresaId: number): Promise<UmbralesSensor[]> {
    try {
      const response = await apiClient.get(`/empresas/${empresaId}/sensores/umbrales`)
      return (response as { data: UmbralesSensor[] }).data
    } catch (error) {
      console.error('Error obteniendo umbrales de la empresa:', error)
      return []
    }
  },

  async eliminarUmbralesSensor(umbralesId: number): Promise<boolean> {
    try {
      await apiClient.delete(`/sensores/umbrales/${umbralesId}`)
      return true
    } catch (error) {
      console.error('Error eliminando umbrales del sensor:', error)
      return false
    }
  },

  // Configuración del sistema de alertas
  async obtenerConfiguracionSistema(empresaId: number): Promise<ConfiguracionSistemaAlertas | null> {
    try {
      const response = await apiClient.get(`/empresas/${empresaId}/alertas/configuracion`)
      return (response as { data: ConfiguracionSistemaAlertas }).data
    } catch (error) {
      console.error('Error obteniendo configuración del sistema:', error)
      return null
    }
  },

  async guardarConfiguracionSistema(configuracion: ConfiguracionSistemaAlertas): Promise<ConfiguracionSistemaAlertas> {
    try {
      if (configuracion.id) {
        const response = await apiClient.put(`/empresas/alertas/configuracion/${configuracion.id}`, configuracion)
        return (response as { data: ConfiguracionSistemaAlertas }).data
      } else {
        const response = await apiClient.post('/empresas/alertas/configuracion', configuracion)
        return (response as { data: ConfiguracionSistemaAlertas }).data
      }
    } catch (error) {
      console.error('Error guardando configuración del sistema:', error)
      throw error
    }
  },

  // Gestión de alertas activas
  async obtenerAlertasActivas(empresaId: number, filtros?: {
    severidad?: string
    estado?: string
    sensorTipo?: string
    ubicacionId?: number
    search?: string
  }): Promise<AlertaActiva[]> {
    try {
      const params = new URLSearchParams()
      if (filtros?.severidad) params.append('severidad', filtros.severidad)
      if (filtros?.estado) params.append('estado', filtros.estado)
      if (filtros?.sensorTipo) params.append('sensorTipo', filtros.sensorTipo)
      if (filtros?.ubicacionId) params.append('ubicacionId', filtros.ubicacionId.toString())
      if (filtros?.search) params.append('search', filtros.search)

      const response = await apiClient.get(`/empresas/${empresaId}/alertas/activas?${params.toString()}`)
      return (response as { data: AlertaActiva[] }).data
    } catch (error) {
      console.error('Error obteniendo alertas activas:', error)
      return []
    }
  },

  async resolverAlerta(alertaId: number, comentario?: string): Promise<boolean> {
    try {
      await apiClient.patch(`/alertas/${alertaId}/resolver`, { comentario })
      return true
    } catch (error) {
      console.error('Error resolviendo alerta:', error)
      return false
    }
  },

  async escalarAlerta(alertaId: number, nivel: number, destinatarios: string[]): Promise<boolean> {
    try {
      await apiClient.patch(`/alertas/${alertaId}/escalar`, { nivel, destinatarios })
      return true
    } catch (error) {
      console.error('Error escalando alerta:', error)
      return false
    }
  },

  async reenviarNotificacion(alertaId: number, canal: 'email' | 'sms' | 'websocket'): Promise<boolean> {
    try {
      await apiClient.post(`/alertas/${alertaId}/reenviar-notificacion`, { canal })
      return true
    } catch (error) {
      console.error('Error reenviando notificación:', error)
      return false
    }
  },

  // Pruebas de notificación
  async probarNotificacionEmail(destinatario: string, tipo: 'normal' | 'critica'): Promise<boolean> {
    try {
      await apiClient.post('/alertas/probar-notificacion', {
        canal: 'email',
        destinatario,
        tipo
      })
      return true
    } catch (error) {
      console.error('Error probando notificación email:', error)
      return false
    }
  },

  async probarNotificacionSMS(destinatario: string, tipo: 'normal' | 'critica'): Promise<boolean> {
    try {
      await apiClient.post('/alertas/probar-notificacion', {
        canal: 'sms',
        destinatario,
        tipo
      })
      return true
    } catch (error) {
      console.error('Error probando notificación SMS:', error)
      return false
    }
  },

  async probarNotificacionWebSocket(empresaId: number, tipo: 'normal' | 'critica'): Promise<boolean> {
    try {
      await apiClient.post('/alertas/probar-notificacion', {
        canal: 'websocket',
        empresaId,
        tipo
      })
      return true
    } catch (error) {
      console.error('Error probando notificación WebSocket:', error)
      return false
    }
  }
}
