export enum SensorTipo {
  TEMPERATURA = 'TEMPERATURA',
  HUMEDAD = 'HUMEDAD',
  PRESION = 'PRESION',
  PESO = 'PESO'
}

export interface Ubicacion {
  id: number
  nombre: string
  descripcion?: string
  empresaId: number
  activa: boolean
  createdAt: string
  updatedAt: string
  sensores?: Sensor[]
  _count?: {
    sensores: number
    productos: number
  }
}

export interface Sensor {
  id: number
  nombre: string
  tipo: SensorTipo
  ubicacionId: number
  empresaId: number
  activo: boolean
  dispositivoIoTId?: number
  configuracion?: Record<string, string | number | boolean>
  createdAt: string
  updatedAt: string
  ubicacion?: Ubicacion
  lecturas?: SensorLectura[]
}

export interface SensorLectura {
  id: number
  tipo: SensorTipo
  valor: number
  unidad: string
  sensorId?: number
  productoId?: number
  ubicacionId?: number
  empresaId: number
  fecha: string
  sensor?: Sensor
  producto?: { id: number; nombre: string; codigo: string }
  ubicacion?: Ubicacion
}

export interface CreateSensorDto {
  nombre: string
  tipo: SensorTipo
  ubicacionId: number
  configuracion?: Record<string, string | number | boolean>
  // 🚀 NUEVO: Umbrales personalizados durante la creación
  umbralesPersonalizados?: UmbralesPersonalizadosDto
  // 🚀 NUEVO: Configuración de notificaciones
  configuracionNotificaciones?: ConfiguracionNotificacionesDto
}

export interface UpdateSensorDto {
  nombre?: string
  tipo?: SensorTipo
  ubicacionId?: number
  activo?: boolean
  configuracion?: Record<string, string | number | boolean>
}

export interface CreateUbicacionDto {
  nombre: string
  descripcion?: string
}

export interface UpdateUbicacionDto {
  nombre?: string
  descripcion?: string
  activa?: boolean
}

export interface CreateSensorLecturaDto {
  tipo: SensorTipo
  valor: number
  unidad: string
  sensorId?: number
  productoId?: number
  ubicacionId?: number
}

// Tipos para el Dashboard
export interface DashboardUbicacionTiempoRealDto {
  desde?: string
  hasta?: string
  limite?: number
}

export interface DashboardAlertasDto {
  ubicacionId?: number
  tipo?: string
  desde?: string
  hasta?: string
}

// Tipos para Analytics
export interface SensorAnalytics {
  totalSensores: number
  sensoresActivos: number
  lecturasHoy: number
  alertasHoy: number
  ubicaciones: number
  sensoresPorTipo: Record<SensorTipo, number>
  lecturasPorHora: Array<{
    hora: string
    cantidad: number
  }>
}

// Tipos para Alertas
export interface AlertaConfiguracion {
  id: number
  empresaId: number
  tipoAlerta: string
  activo: boolean
  destinatarios: string[]
  frecuencia: string
  ventanaEsperaMinutos?: number
  umbralCritico?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface AlertaGenerada {
  id: number
  tipo: string
  mensaje: string
  severidad: string
  empresaId: number
  ubicacionId?: number
  sensorId?: number
  productoId?: number
  fecha: string
  estado: string
  condicionActivacion: Record<string, unknown>
}

export interface ConfigurarAlertaDto {
  tipoAlerta: string
  activo: boolean
  destinatarios: string[]
  frecuencia: string
  ventanaEsperaMinutos?: number
  umbralCritico?: Record<string, unknown>
}

// Tipos para SMS
export interface EnviarSMSDto {
  to: string
  message: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

export interface EnviarBulkSMSDto {
  messages: {
    to: string
    message: string
    priority?: 'low' | 'normal' | 'high' | 'urgent'
  }[]
}

export interface SMSTemplate {
  id: string
  nombre: string
  tipo: string
  contenido: string
  variables: string[]
  prioridad: 'low' | 'normal' | 'high' | 'urgent'
  emoji?: string
}

export interface CrearPlantillaDto {
  nombre: string
  tipo: string
  contenido: string
  variables: string[]
  prioridad?: 'low' | 'normal' | 'high' | 'urgent'
  emoji?: string
}

export interface ProcesarPlantillaDto {
  templateId: string
  datos: Record<string, string | number | boolean>
}

// Tipos para filtros
export interface SensorFilters {
  tipo?: SensorTipo
  productoId?: number
  desde?: string
  hasta?: string
  limite?: number
}

export interface AlertaFilters {
  ubicacionId?: number
  tipo?: string
  desde?: string
  hasta?: string
}

// ===========================================
// TIPOS PARA SISTEMA DE LECTURAS PERIÓDICAS
// ===========================================

export interface SensorReadingDto {
  nombre: string
  tipo: 'TEMPERATURA' | 'HUMEDAD' | 'PESO' | 'PRESION'
  valor: number
  unidad: string
  umbralMin?: number
  umbralMax?: number
}

export interface CreateSensorLecturaMultipleDto {
  deviceId: string
  deviceName: string
  ubicacionId: number
  empresaId: number
  timestamp: number
  sensors: Record<string, number>
  sensorDetails?: SensorReadingDto[]
}

export interface ESP32Configuracion {
  deviceId: string
  deviceName: string
  ubicacionId: number
  empresaId: number
  wifi: {
    ssid: string
    password: string
  }
  api: {
    baseUrl: string
    token: string
    endpoint: string
  }
  sensores: Array<{
    tipo: string
    nombre: string
    pin: number
    pin2: number
    enabled: boolean
    umbralMin: number
    umbralMax: number
    unidad: string
    intervalo: number
  }>
  intervalo: number
  timestamp: string
}

export interface SensorConfiguracion {
  tipo: string
  nombre: string
  pin: number
  pin2: number
  enabled: boolean
  umbralMin: number
  umbralMax: number
  unidad: string
  intervalo: number
}

export interface LecturasMultiplesResponse {
  totalLecturas: number
  alertasGeneradas: number
  lecturas: Array<{
    id: number
    tipo: SensorTipo
    valor: number
    unidad: string
    sensorId?: number
    fecha: string
    estado: 'NORMAL' | 'ALERTA' | 'CRITICO'
    mensaje: string
  }>
}

// ===========================================
// NUEVOS TIPOS PARA UMBRALES PERSONALIZADOS
// ===========================================

export interface UmbralesPersonalizadosDto {
  rango_min: number
  rango_max: number
  umbral_alerta_bajo: number
  umbral_alerta_alto: number
  umbral_critico_bajo: number
  umbral_critico_alto: number
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  intervalo_lectura: number
  alertasActivas: boolean
}

export interface ConfiguracionNotificacionesDto {
  email?: boolean
  sms?: boolean
  webSocket?: boolean
}

// ===========================================
// TIPOS PARA CONFIGURACIÓN DE UMBRALES VÍA API
// ===========================================

export interface UmbralesSensorDto {
  rango_min: number
  rango_max: number
  umbral_alerta_bajo: number
  umbral_alerta_alto: number
  umbral_critico_bajo: number
  umbral_critico_alto: number
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  intervalo_lectura: number
  alertasActivas: boolean
}

export interface ConfiguracionAlertaResponse {
  id: number
  sensorId: number
  empresaId: number
  umbralCritico: UmbralesSensorDto
  configuracionNotificacion: {
    email: boolean
    sms: boolean
    webSocket: boolean
  }
  destinatarios: Array<{
    id: number
    configuracionAlertaId: number
    destinatarioId: number
    userId: number | null
    destinatario: {
      tipo: 'USUARIO' | 'EMAIL' | 'TELEFONO'
      nombre: string
      activo: boolean
      email: string
      telefono: string | null
    }
  }>
  createdAt: string
  updatedAt: string
}

// Tipos para el sistema de alertas avanzado
export enum SeveridadAlerta {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA'
}

export enum EstadoAlerta {
  ACTIVA = 'ACTIVA',
  EN_ESCALAMIENTO = 'EN_ESCALAMIENTO',
  RESUELTA = 'RESUELTA',
  ESCALADA = 'ESCALADA'
}

export enum CanalNotificacion {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WEBSOCKET = 'WEBSOCKET',
  PUSH = 'PUSH'
}

export interface UmbralesSensor {
  id?: number
  sensorId: number
  empresaId: number
  tipo: SensorTipo
  umbralMin: number
  umbralMax: number
  umbralCriticoMin?: number
  umbralCriticoMax?: number
  alertasActivadas: boolean
  severidad: SeveridadAlerta
  mensajeAlerta?: string
  intervaloVerificacion: number
  canalesNotificacion: CanalNotificacion[]
  destinatarios: string[]
  createdAt?: string
  updatedAt?: string
}

export interface ConfiguracionSistemaAlertas {
  id?: number
  empresaId: number
  sistemaActivado: boolean
  modoDebug: boolean
  
  // Escalamiento automático
  escalamientoAutomatico: boolean
  tiempoEscalamientoMinutos: number
  maximoNivelEscalamiento: number
  
  // Canales de notificación
  canalesHabilitados: CanalNotificacion[]
  
  // Destinatarios por nivel
  destinatariosPrincipales: string[]
  destinatariosSupervisores: string[]
  destinatariosAdministradores: string[]
  
  // Plantillas de notificación
  plantillaEmailNormal: string
  plantillaEmailCritica: string
  plantillaSMSNormal: string
  plantillaSMSCritica: string
  
  // Lógica de reintentos
  maximoReintentos: number
  intervaloReintentosMinutos: number
  
  // Horarios de blackout
  horarioBlackout: {
    horaInicio: string
    horaFin: string
    diasSemana: number[]
  }
  
  // Agrupación de alertas
  agruparAlertas: boolean
  ventanaAgrupacionMinutos: number
  
  createdAt?: string
  updatedAt?: string
}

export interface AlertaActiva {
  id: number
  sensorId: number
  sensorNombre: string
  sensorTipo: SensorTipo
  ubicacionId: number
  ubicacionNombre: string
  empresaId: number
  valorActual: number
  valorNormal: {
    min: number
    max: number
  }
  severidad: SeveridadAlerta
  estado: EstadoAlerta
  mensaje: string
  fechaActivacion: string
  tiempoActiva: string
  nivelEscalamiento: number
  destinatariosNotificados: string[]
  notificaciones: {
    email: {
      intentos: number
      ultimoIntento?: string
      proximoIntento?: string
      exitoso: boolean
    }
    sms: {
      intentos: number
      ultimoIntento?: string
      proximoIntento?: string
      exitoso: boolean
    }
    websocket: {
      enviado: boolean
      fechaEnvio?: string
    }
  }
  historialEscalamiento: Array<{
    nivel: number
    fecha: string
    destinatarios: string[]
    resultado: string
  }>
} 