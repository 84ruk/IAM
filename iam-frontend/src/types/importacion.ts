// Tipos compartidos para importación - Compatibles con backend y frontend

export interface MensajeUsuario {
  tipo: 'success' | 'warning' | 'error' | 'info'
  titulo: string
  mensaje: string
  detalles?: string[]
  timestamp?: string
}

export interface ResumenProcesamiento {
  duplicadosEncontrados: number
  erroresValidacion: number
  erroresSistema: number
  registrosOmitidos: number
  recomendaciones: string[]
}

// Extensión de TrabajoImportacion para incluir nuevos campos opcionales
export interface TrabajoImportacionExtendido {
  // Campos existentes
  id: string
  tipo: 'productos' | 'proveedores' | 'movimientos'
  estado: 'pendiente' | 'procesando' | 'completado' | 'error' | 'cancelado'
  empresaId: number
  usuarioId: number
  archivoOriginal: string
  totalRegistros: number
  registrosProcesados: number
  registrosExitosos: number
  registrosConError: number
  fechaCreacion: string
  fechaActualizacion: string
  progreso: number
  mensaje?: string
  errores?: string[]
  
  // Nuevos campos opcionales para compatibilidad
  mensajesUsuario?: MensajeUsuario[]
  resumenProcesamiento?: ResumenProcesamiento
}

// Extensión de ResultadoImportacion para incluir nuevos campos opcionales
export interface ResultadoImportacionExtendido {
  // Campos existentes
  success: boolean
  message: string
  trabajoId: string
  estado: string
  totalRegistros?: number
  errores?: number
  erroresDetallados?: any[]
  deteccionTipo?: any
  
  // Nuevos campos opcionales para compatibilidad
  mensajesUsuario?: MensajeUsuario[]
  resumenProcesamiento?: ResumenProcesamiento
}

// Tipos para eventos de WebSocket
export interface ImportacionWebSocketEvent {
  event: string
  trabajoId?: string
  data?: any
}

// Tipos para opciones de manejo de duplicados
export interface DuplicateHandlingOptions {
  sobrescribirExistentes: boolean
  onSobrescribirChange: (value: boolean) => void
  duplicadosEncontrados?: number
  totalRegistros?: number
  onRetry?: () => void
  className?: string
} 