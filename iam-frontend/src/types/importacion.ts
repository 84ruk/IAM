export type TipoImportacion = 'productos' | 'proveedores' | 'movimientos'

export interface ImportacionTrabajo {
  id: string
  estado: 'pendiente' | 'procesando' | 'completado' | 'error' | 'cancelado'
  progreso: number
  registrosProcesados: number
  registrosExitosos: number
  registrosConError: number
  totalRegistros: number
  mensaje?: string
  fechaCreacion: string
  fechaActualizacion: string
  tipo: string
  empresaId: number
  usuarioId: number
  archivoOriginal: string
  errores: unknown[]
  opciones: ImportacionOpciones
  modo?: 'http' | 'websocket'
}

export interface ImportacionOpciones {
  sobrescribirExistentes?: boolean
  validarSolo?: boolean
  notificarEmail?: boolean
  emailNotificacion?: string
  [key: string]: unknown
}

export interface CorreccionImportacion {
  campo: string
  valorOriginal: string
  valorCorregido: string
  tipo: 'formato' | 'normalizacion'
  confianza: number
  fila: number
  datosOriginales?: unknown
}

export interface ImportacionResultado {
  trabajoId?: string
  registrosProcesados: number
  registrosExitosos: number
  registrosConError: number
  mensaje?: string
  message?: string
  errores?: unknown[]
  correcciones?: CorreccionImportacion[]
  hasErrors?: boolean
  errorCount?: number
  successCount?: number
  errorFile?: string
  processingTime?: number
  modo?: 'http' | 'websocket'
  usuarioId?: number
  empresaId?: number
  data?: {
    correcciones?: CorreccionImportacion[]
    [key: string]: unknown
  }
}

export interface ImportacionEstado {
  isImporting: boolean
  currentTrabajo: ImportacionTrabajo | null
  error: string | null
  success: string | null
  modo: 'http' | 'websocket' | null
  isConnected: boolean
  trabajos: ImportacionTrabajo[]
  estadisticas: {
    total: number
    completados: number
    conError: number
    enProgreso: number
    porcentajeExito: number
  }
} 