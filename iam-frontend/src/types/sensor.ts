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