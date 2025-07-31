export type TipoImportacion = 'productos' | 'proveedores' | 'movimientos' | 'auto'

export interface ErrorImportacion {
  fila: number
  columna: string
  valor: string
  mensaje: string
  tipo: 'validacion' | 'duplicado' | 'error_db' | 'formato'
  sugerencia?: string
  codigoError?: string
  datosOriginales?: unknown
  campoEspecifico?: string
  valorEsperado?: string
  valorRecibido?: string
}

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
  
  // Información de detección automática
  tipoDetectado?: string | null
  tipoUsado?: string
  confianzaDetectada?: number
  mensajeDeteccion?: string
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

// Nueva interfaz para registrar detalles de registros exitosos
export interface RegistroExitoso {
  fila: number
  tipo: string
  datos: Record<string, unknown>
  identificador: string // nombre, código, etc.
  correccionesAplicadas?: CorreccionImportacion[]
  timestamp: Date
}

export interface ImportacionResultado {
  success?: boolean
  hasErrors?: boolean
  registrosProcesados: number
  registrosExitosos: number
  registrosConError: number
  errores: ErrorImportacion[]
  correcciones?: CorreccionImportacion[]
  registrosExitososDetalle?: RegistroExitoso[] // Nueva propiedad para detalles
  resumen?: Record<string, unknown>
  archivoErrores?: string | null
  errorFile?: string | null
  message?: string
  mensaje?: string
  errorCount?: number
  successCount?: number
  
  // Información de detección automática
  tipoDetectado?: string | null
  tipoUsado?: string
  confianzaDetectada?: number
  mensajeDeteccion?: string
  
  // Campos adicionales para compatibilidad
  data?: {
    registrosProcesados: number
    registrosExitosos: number
    registrosConError: number
    errores: ErrorImportacion[]
    correcciones?: CorreccionImportacion[]
    registrosExitososDetalle?: RegistroExitoso[] // Nueva propiedad para detalles
    resumen?: Record<string, unknown>
    archivoErrores?: string | null
    tiempoProcesamiento?: number
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