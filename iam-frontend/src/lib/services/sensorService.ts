import {
  Sensor,
  SensorLectura,
  CreateSensorDto,
  UpdateSensorDto,
  SensorAnalytics,
  SensorFilters,
  Ubicacion,
  CreateUbicacionDto,
  UpdateUbicacionDto,
  DashboardUbicacionTiempoRealDto,
  DashboardAlertasDto,
  CreateSensorLecturaMultipleDto,
  ESP32Configuracion,
  LecturasMultiplesResponse,
  // 🚀 NUEVOS TIPOS
  UmbralesSensorDto,
  ConfiguracionAlertaResponse
} from '@/types/sensor'
import { apiClient } from '../api/apiClient'

// Interfaz para configuraciones predefinidas
interface ConfiguracionPredefinida {
  tipo: string;
  unidad: string;
  rango: {
    min: number;
    max: number;
  };
  intervalo: number;
  umbral_alerta: number;
  umbral_critico: number;
}

// Interfaz para sensor simple
interface CreateSensorSimpleDto {
  nombre: string;
  tipo: string;
  ubicacionId: number;
}

// Interfaz para sensor rápido
interface CreateSensorRapidoDto {
  nombre: string;
  tipo: string;
  ubicacionId: number;
  descripcion?: string;
}

// Interfaz para múltiples sensores
interface CreateSensorMultipleDto {
  sensores: Array<{
    nombre: string;
    tipo: string;
    ubicacionId: number;
    descripcion?: string;
  }>;
}

export const sensorService = {
  // ===========================================
  // ENDPOINTS SIMPLIFICADOS - NUEVOS
  // ===========================================

  // Endpoint más simple - Solo 3 campos obligatorios
  async registrarSensorSimple(data: CreateSensorSimpleDto): Promise<Sensor> {
    const response = await apiClient.post('/mqtt-sensor/sensores/registrar-simple', data) as Sensor
    return response
  },

  // Endpoint rápido - Con descripción opcional
  async registrarSensorRapido(data: CreateSensorRapidoDto): Promise<Sensor> {
    const response = await apiClient.post('/mqtt-sensor/sensores/registrar-rapido', data) as Sensor
    return response
  },

  // Endpoint múltiple - Varios sensores a la vez
  async registrarSensoresMultiples(data: CreateSensorMultipleDto): Promise<Sensor[]> {
    const response = await apiClient.post('/mqtt-sensor/sensores/registrar-multiple', data) as Sensor[]
    return response
  },

  // 🚀 NUEVO: Crear sensor con umbrales personalizados
  async crearSensorConUmbrales(data: CreateSensorDto): Promise<Sensor> {
    const response = await apiClient.post('/sensores', data) as Sensor
    return response
  },

  // 🚀 NUEVO: Obtener umbrales de un sensor
  async obtenerUmbralesSensor(sensorId: number): Promise<ConfiguracionAlertaResponse> {
    const response = await apiClient.get(`/sensores/${sensorId}/umbrales`) as ConfiguracionAlertaResponse
    return response
  },

  // 🚀 NUEVO: Actualizar umbrales de un sensor
  async actualizarUmbralesSensor(sensorId: number, umbrales: UmbralesSensorDto): Promise<ConfiguracionAlertaResponse> {
    const response = await apiClient.put(`/sensores/${sensorId}/umbrales`, umbrales) as ConfiguracionAlertaResponse
    return response
  },

  // Obtener configuraciones disponibles
  async obtenerConfiguraciones(): Promise<ConfiguracionPredefinida[]> {
    const response = await apiClient.get('/mqtt-sensor/configuraciones') as ConfiguracionPredefinida[]
    return response
  },

  // Obtener configuración específica por tipo
  async obtenerConfiguracionPorTipo(tipo: string): Promise<ConfiguracionPredefinida> {
    const response = await apiClient.get(`/mqtt-sensor/configuracion/${tipo}`) as ConfiguracionPredefinida
    return response
  },

  // ===========================================
  // ENDPOINTS LEGACY - MANTENIDOS PARA COMPATIBILIDAD
  // ===========================================

  // Endpoint legacy - Mantenido para compatibilidad
  async registrarSensor(data: CreateSensorDto): Promise<Sensor> {
    // Usar el endpoint simple por defecto
    const sensorData: CreateSensorSimpleDto = {
      nombre: data.nombre,
      tipo: data.tipo,
      ubicacionId: data.ubicacionId
    };
    
    return await this.registrarSensorSimple(sensorData)
  },

  async obtenerSensores(ubicacionId?: number): Promise<Sensor[]> {
    try {
      const url = ubicacionId 
        ? `/mqtt-sensor/sensores/listar?ubicacionId=${ubicacionId}`
        : '/mqtt-sensor/sensores/listar'
      
      console.log('[SensorService] Obteniendo sensores:', { url, ubicacionId })
      console.log('[SensorService] Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
      
      const response = await apiClient.get(url) as Sensor[]
      console.log('[SensorService] Sensores obtenidos:', { count: Array.isArray(response) ? response.length : 0, response })
      return Array.isArray(response) ? response : []
    } catch (error) {
      console.error('[SensorService] Error en obtenerSensores:', error)
      console.error('[SensorService] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as { response?: { status?: number; statusText?: string; data?: unknown } })?.response?.status,
        statusText: (error as { response?: { status?: number; statusText?: string; data?: unknown } })?.response?.statusText,
        data: (error as { response?: { status?: number; statusText?: string; data?: unknown } })?.response?.data
      })
      throw error
    }
  },

  async obtenerSensor(id: number): Promise<Sensor> {
    const response = await apiClient.get(`/mqtt-sensor/sensores/sensor/${id}`) as Sensor
    return response
  },

  async actualizarSensor(id: number, data: UpdateSensorDto): Promise<Sensor> {
    const response = await apiClient.patch(`/mqtt-sensor/sensores/sensor/${id}`, data) as Sensor
    return response
  },

  async eliminarSensor(id: number): Promise<void> {
    await apiClient.delete(`/mqtt-sensor/sensores/sensor/${id}`)
  },

  // ===========================================
  // ENDPOINTS DE LECTURAS
  // ===========================================

  async registrarLectura(data: { tipo: string; valor: number; unidad: string; sensorId?: number; ubicacionId?: number; productoId?: number }): Promise<SensorLectura> {
    const response = await apiClient.post('/mqtt-sensor/lecturas/registrar', data) as SensorLectura
    return response
  },

  async obtenerLecturas(filtros: SensorFilters & { sensorId?: number }): Promise<SensorLectura[]> {
    const params = new URLSearchParams()
    if (filtros.tipo) params.append('tipo', filtros.tipo)
    if (filtros.productoId) params.append('productoId', filtros.productoId.toString())
    if (filtros.desde) params.append('desde', filtros.desde)
    if (filtros.hasta) params.append('hasta', filtros.hasta)
    if (filtros.limite) params.append('limite', filtros.limite.toString())
    if (filtros.sensorId) params.append('sensorId', filtros.sensorId.toString())

    const response = await apiClient.get(`/mqtt-sensor/lecturas/listar?${params.toString()}`) as SensorLectura[]
    return response
  },

  async simularLectura(productoId?: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/mqtt-sensor/lecturas/simular', { productoId }) as { success: boolean; message: string }
    return response
  },

  // ===========================================
  // ENDPOINTS DE ANALYTICS Y DASHBOARD
  // ===========================================

  async obtenerAnalytics(): Promise<SensorAnalytics> {
    const response = await apiClient.get('/mqtt-sensor/analytics') as SensorAnalytics
    return response
  },

  async obtenerAlertas(): Promise<{ id: number; mensaje: string; fecha: string; tipo: string }[]> {
    const response = await apiClient.get('/mqtt-sensor/alertas') as { id: number; mensaje: string; fecha: string; tipo: string }[]
    return response
  },

  async obtenerDashboardUbicaciones(): Promise<{ ubicacion: string; sensores: number; alertas: number }[]> {
    const response = await apiClient.get('/mqtt-sensor/dashboard/ubicaciones') as { ubicacion: string; sensores: number; alertas: number }[]
    return response
  },

  async obtenerDashboardTiempoReal(
    ubicacionId: number,
    opciones: DashboardUbicacionTiempoRealDto
  ): Promise<{ timestamp: string; valor: number; tipo: string }[]> {
    const params = new URLSearchParams()
    if (opciones.desde) params.append('desde', opciones.desde)
    if (opciones.hasta) params.append('hasta', opciones.hasta)
    if (opciones.limite) params.append('limite', opciones.limite.toString())

    const response = await apiClient.get(
      `/mqtt-sensor/dashboard/ubicacion/${ubicacionId}/tiempo-real?${params.toString()}`
    ) as { timestamp: string; valor: number; tipo: string }[]
    return response
  },

  async obtenerDashboardAlertas(filtros: DashboardAlertasDto): Promise<{ id: number; mensaje: string; fecha: string; tipo: string }[]> {
    const params = new URLSearchParams()
    if (filtros.ubicacionId) params.append('ubicacionId', filtros.ubicacionId.toString())
    if (filtros.tipo) params.append('tipo', filtros.tipo)
    if (filtros.desde) params.append('desde', filtros.desde)
    if (filtros.hasta) params.append('hasta', filtros.hasta)

    const response = await apiClient.get(`/mqtt-sensor/dashboard/alertas?${params.toString()}`) as { id: number; mensaje: string; fecha: string; tipo: string }[]
    return response
  },

  // ===========================================
  // MÉTODOS AUXILIARES
  // ===========================================

  // Obtener configuración por defecto según tipo
  async getConfiguracionPorDefecto(tipo: string): Promise<ConfiguracionPredefinida> {
    try {
      return await this.obtenerConfiguracionPorTipo(tipo)
    } catch {
      // Configuración por defecto si no se puede obtener del backend
      return this.getConfiguracionDefault(tipo)
    }
  },

  // Configuración por defecto local
  getConfiguracionDefault(tipo: string): ConfiguracionPredefinida {
    switch (tipo) {
      case 'TEMPERATURA':
        return {
          tipo: 'TEMPERATURA',
          unidad: '°C',
          rango: { min: -20, max: 50 },
          intervalo: 30,
          umbral_alerta: 35,
          umbral_critico: 40
        }
      case 'HUMEDAD':
        return {
          tipo: 'HUMEDAD',
          unidad: '%',
          rango: { min: 0, max: 100 },
          intervalo: 30,
          umbral_alerta: 80,
          umbral_critico: 90
        }
      case 'PESO':
        return {
          tipo: 'PESO',
          unidad: 'kg',
          rango: { min: 0, max: 1000 },
          intervalo: 60,
          umbral_alerta: 800,
          umbral_critico: 950
        }
      case 'PRESION':
        return {
          tipo: 'PRESION',
          unidad: 'Pa',
          rango: { min: 0, max: 2000 },
          intervalo: 30,
          umbral_alerta: 1500,
          umbral_critico: 1800
        }
      default:
        return {
          tipo: tipo,
          unidad: 'N/A',
          rango: { min: 0, max: 100 },
          intervalo: 30,
          umbral_alerta: 80,
          umbral_critico: 95
        }
    }
  },

  // ===========================================
  // MÉTODOS PARA LECTURAS PERIÓDICAS ESP32
  // ===========================================

  // Registrar múltiples lecturas desde ESP32
  async registrarLecturasMultiples(data: CreateSensorLecturaMultipleDto): Promise<LecturasMultiplesResponse> {
    const response = await apiClient.post('/sensores/lecturas-multiples', data) as LecturasMultiplesResponse
    return response
  },

  // Generar código Arduino personalizado
  async generarCodigoArduino(config: ESP32Configuracion): Promise<{
    success: boolean
    message: string
    codigoArduino: string
    configFile: string
  }> {
    const response = await apiClient.post('/sensores/generar-codigo-arduino', config) as {
      success: boolean
      message: string
      codigoArduino: string
      configFile: string
    }
    return response
  }
}

export const ubicacionService = {
  // Endpoints de Ubicaciones - Manteniendo la ruta original
  async crearUbicacion(data: CreateUbicacionDto): Promise<Ubicacion> {
    const response = await apiClient.post('/ubicaciones', data) as Ubicacion
    return response
  },

  async obtenerUbicaciones(): Promise<Ubicacion[]> {
    console.log('🔍 UbicacionService: Haciendo petición a /ubicaciones')
    const response = await apiClient.get('/ubicaciones') as Ubicacion[]
    console.log('🔍 UbicacionService: Respuesta recibida:', response)
    return response
  },

  async obtenerUbicacion(id: number): Promise<Ubicacion> {
    const response = await apiClient.get(`/ubicaciones/${id}`) as Ubicacion
    return response
  },

  async obtenerEstadisticasUbicacion(id: number): Promise<{ totalSensores: number; totalProductos: number; alertasActivas: number }> {
    const response = await apiClient.get(`/ubicaciones/${id}/estadisticas`) as { totalSensores: number; totalProductos: number; alertasActivas: number }
    return response
  },

  async actualizarUbicacion(id: number, data: UpdateUbicacionDto): Promise<Ubicacion> {
    const response = await apiClient.patch(`/ubicaciones/${id}`, data) as Ubicacion
    return response
  },

  async eliminarUbicacion(id: number): Promise<void> {
    await apiClient.delete(`/ubicaciones/${id}`)
  },

  // ===========================================
  // NUEVOS MÉTODOS PARA LECTURAS PERIÓDICAS
  // ===========================================

  // Registrar múltiples lecturas desde ESP32
  async registrarLecturasMultiples(data: CreateSensorLecturaMultipleDto): Promise<LecturasMultiplesResponse> {
    const response = await apiClient.post('/sensores/lecturas-multiples', data) as LecturasMultiplesResponse
    return response
  },

  // Configurar ESP32 para lecturas periódicas
  async configurarESP32LecturasPeriodicas(config: ESP32Configuracion): Promise<{ success: boolean; message: string; configFile: string }> {
    const response = await apiClient.post('/sensores/configurar-esp32', config) as { success: boolean; message: string; configFile: string }
    return response
  },

  // Obtener configuración de ESP32
  async obtenerConfiguracionESP32(deviceId: string): Promise<ESP32Configuracion> {
    const response = await apiClient.get(`/sensores/esp32-config/${deviceId}`) as ESP32Configuracion
    return response
  },

  // Probar conexión de ESP32
  async probarConexionESP32(deviceId: string): Promise<{ connected: boolean; lastSeen: string; status: string }> {
    const response = await apiClient.get(`/sensores/esp32-status/${deviceId}`) as { connected: boolean; lastSeen: string; status: string }
    return response
  },

  // Obtener estadísticas de dispositivos ESP32
  async obtenerEstadisticasESP32(): Promise<{
    totalDispositivos: number
    dispositivosConectados: number
    totalLecturas: number
    alertasGeneradas: number
  }> {
    const response = await apiClient.get('/sensores/esp32-stats') as {
      totalDispositivos: number
      dispositivosConectados: number
      totalLecturas: number
      alertasGeneradas: number
    }
    return response
  },

  // Generar código Arduino personalizado
  async generarCodigoArduino(config: ESP32Configuracion): Promise<{
    success: boolean
    message: string
    codigoArduino: string
    configFile: string
  }> {
    const response = await apiClient.post('/sensores/generar-codigo-arduino', config) as {
      success: boolean
      message: string
      codigoArduino: string
      configFile: string
    }
    return response
  }
} 