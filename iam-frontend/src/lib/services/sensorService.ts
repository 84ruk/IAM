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
  DashboardAlertasDto
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
    const params = ubicacionId ? { ubicacionId: ubicacionId.toString() } : {}
    const response = await apiClient.get('/mqtt-sensor/sensores/listar', { params }) as Sensor[]
    return response
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

  async obtenerLecturas(filtros: SensorFilters): Promise<SensorLectura[]> {
    const params = new URLSearchParams()
    if (filtros.tipo) params.append('tipo', filtros.tipo)
    if (filtros.productoId) params.append('productoId', filtros.productoId.toString())
    if (filtros.desde) params.append('desde', filtros.desde)
    if (filtros.hasta) params.append('hasta', filtros.hasta)
    if (filtros.limite) params.append('limite', filtros.limite.toString())

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
  }
} 