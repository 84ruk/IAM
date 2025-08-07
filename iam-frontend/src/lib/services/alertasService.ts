import { apiClient } from '@/lib/api-client'
import {
  AlertaConfiguracion,
  AlertaGenerada,
  ConfigurarAlertaDto,
  EnviarSMSDto,
  EnviarBulkSMSDto,
  SMSTemplate,
  CrearPlantillaDto,
  ProcesarPlantillaDto
} from '@/types/sensor'

export const alertasService = {
  // Endpoints de Alertas Avanzadas
  async configurarAlerta(data: ConfigurarAlertaDto): Promise<AlertaConfiguracion> {
    const response = await apiClient.post('/alertas-avanzadas/configurar', data) as { data: AlertaConfiguracion }
    return response.data
  },

  async obtenerConfiguracionesAlertas(ubicacionId?: number): Promise<AlertaConfiguracion[]> {
    const params = ubicacionId ? { ubicacionId: ubicacionId.toString() } : {}
    const response = await apiClient.get('/alertas-avanzadas/configuraciones', { params }) as { data: AlertaConfiguracion[] }
    return response.data
  },

  async actualizarConfiguracionAlerta(
    id: number,
    data: Partial<ConfigurarAlertaDto>
  ): Promise<AlertaConfiguracion> {
    const response = await apiClient.patch(`/alertas-avanzadas/configuracion/${id}`, data) as { data: AlertaConfiguracion }
    return response.data
  },

  async eliminarConfiguracionAlerta(id: number): Promise<void> {
    await apiClient.delete(`/alertas-avanzadas/configuracion/${id}`)
  },

  async verificarAlertasPorLectura(lectura: { sensorId: number; valor: number; tipo: string }): Promise<AlertaGenerada[]> {
    const response = await apiClient.post('/alertas-avanzadas/verificar-lectura', lectura) as { data: AlertaGenerada[] }
    return response.data
  }
}

export const smsService = {
  // Endpoints de SMS
  async enviarSMS(data: EnviarSMSDto): Promise<{ success: boolean; messageId: string }> {
    const response = await apiClient.post('/sms/enviar', data) as { data: { success: boolean; messageId: string } }
    return response.data
  },

  async enviarBulkSMS(data: EnviarBulkSMSDto): Promise<{ success: number; failed: number; results: Array<{ success: boolean; messageId: string }> }> {
    const response = await apiClient.post('/sms/enviar-bulk', data) as { data: { success: number; failed: number; results: Array<{ success: boolean; messageId: string }> } }
    return response.data
  },

  async validarNumero(phoneNumber: string): Promise<{ valid: boolean; carrier?: string }> {
    const response = await apiClient.post('/sms/validar-numero', { phoneNumber }) as { data: { valid: boolean; carrier?: string } }
    return response.data
  },

  async obtenerConfiguracion(): Promise<{ provider: string; apiKey: string; webhookUrl: string }> {
    const response = await apiClient.get('/sms/configuracion') as { data: { provider: string; apiKey: string; webhookUrl: string } }
    return response.data
  }
}

export const smsWebhookService = {
  // Endpoints de Webhooks SMS
  async setDeliveryStatus(data: { messageId: string; status: string; timestamp: string }): Promise<{ success: boolean }> {
    const response = await apiClient.post('/sms-webhook/delivery-status', data) as { data: { success: boolean } }
    return response.data
  },

  async obtenerLogs(): Promise<{ id: number; messageId: string; status: string; timestamp: string }[]> {
    const response = await apiClient.get('/sms-webhook/logs') as { data: { id: number; messageId: string; status: string; timestamp: string }[] }
    return response.data
  },

  async obtenerEstadisticas(): Promise<{ total: number; entregados: number; fallidos: number; pendientes: number }> {
    const response = await apiClient.get('/sms-webhook/estadisticas') as { data: { total: number; entregados: number; fallidos: number; pendientes: number } }
    return response.data
  },

  async simularWebhook(status: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/sms-webhook/simular/${status}`) as { data: { success: boolean; message: string } }
    return response.data
  }
}

export const smsTemplateService = {
  // Endpoints de Plantillas SMS
  async obtenerPlantillas(): Promise<SMSTemplate[]> {
    const response = await apiClient.get('/sms-templates') as { data: SMSTemplate[] }
    return response.data
  },

  async obtenerVariables(): Promise<string[]> {
    const response = await apiClient.get('/sms-templates/variables') as { data: string[] }
    return response.data
  },

  async obtenerPlantillasPorPrioridad(prioridad: 'low' | 'normal' | 'high' | 'urgent'): Promise<SMSTemplate[]> {
    const response = await apiClient.get('/sms-templates/por-prioridad', {
      params: { prioridad }
    }) as { data: SMSTemplate[] }
    return response.data
  },

  async obtenerPlantillasConEmoji(): Promise<SMSTemplate[]> {
    const response = await apiClient.get('/sms-templates/con-emoji') as { data: SMSTemplate[] }
    return response.data
  },

  async obtenerPlantilla(id: string): Promise<SMSTemplate> {
    const response = await apiClient.get(`/sms-templates/${id}`) as { data: SMSTemplate }
    return response.data
  },

  async crearPlantilla(data: CrearPlantillaDto): Promise<{ success: boolean; templateId: string }> {
    const response = await apiClient.post('/sms-templates/crear', data) as { data: { success: boolean; templateId: string } }
    return response.data
  },

  async procesarPlantilla(data: ProcesarPlantillaDto): Promise<{ success: boolean; mensaje: string }> {
    const response = await apiClient.post('/sms-templates/procesar', data) as { data: { success: boolean; mensaje: string } }
    return response.data
  },

  async procesarPlantillaPorTipo(tipo: string, datos: Record<string, string | number | boolean>): Promise<{ success: boolean; mensaje: string }> {
    const response = await apiClient.post('/sms-templates/procesar-por-tipo', { tipo, datos }) as { data: { success: boolean; mensaje: string } }
    return response.data
  },

  async validarPlantilla(contenido: string, variables: string[]): Promise<{ valid: boolean; errores: string[] }> {
    const response = await apiClient.post('/sms-templates/validar', { contenido, variables }) as { data: { valid: boolean; errores: string[] } }
    return response.data
  }
}

export const notificationService = {
  // Endpoints de Email (Existente)
  async enviarNotificacion(data: { to: string; subject: string; content: string }): Promise<{ success: boolean; messageId: string }> {
    const response = await apiClient.post('/notifications/send', data) as { data: { success: boolean; messageId: string } }
    return response.data
  },

  async obtenerEstadisticas(): Promise<{ total: number; enviados: number; fallidos: number }> {
    const response = await apiClient.get('/notifications/stats') as { data: { total: number; enviados: number; fallidos: number } }
    return response.data
  },

  async gestionarPlantillas(data: { action: string; template: Record<string, unknown> }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/notifications/templates', data) as { data: { success: boolean; message: string } }
    return response.data
  }
} 