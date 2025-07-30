import { TipoImportacion } from '@/hooks/useImportacion'

export interface ImportacionConfig {
  title: string
  description: string
  icon: string
  camposRequeridos: string[]
  camposOpcionales: string[]
  maxFileSizeMB: number
  supportedFormats: string[]
}

export const IMPORTACION_CONFIG = {
  // Límites de archivos
  LIMITES: {
    RAPIDA: {
      TAMANO_MAXIMO_MB: 10,
      REGISTROS_MAXIMOS: 1000,
      TIEMPO_ESTIMADO_SEGUNDOS: 30
    },
    WEBSOCKET: {
      TAMANO_MAXIMO_MB: 50,
      REGISTROS_MAXIMOS: 10000,
      TIEMPO_ESTIMADO_SEGUNDOS: 300
    }
  },

  // Tipos de importación soportados
  TIPOS_SOPORTADOS: {
    PRODUCTOS: {
      nombre: 'Productos',
      descripcion: 'Importar productos desde archivo Excel/CSV',
      camposRequeridos: ['nombre', 'precio', 'stock'],
      camposOpcionales: ['descripcion', 'categoria', 'proveedor'],
      formatosSoportados: ['.xlsx', '.xls', '.csv'],
      maxFileSizeMB: 50,
      icono: 'Package',
      color: 'blue'
    },
    PROVEEDORES: {
      nombre: 'Proveedores',
      descripcion: 'Importar proveedores desde archivo Excel/CSV',
      camposRequeridos: ['nombre', 'email'],
      camposOpcionales: ['telefono', 'direccion', 'rfc'],
      formatosSoportados: ['.xlsx', '.xls', '.csv'],
      maxFileSizeMB: 50,
      icono: 'ShoppingCart',
      color: 'orange'
    },
    MOVIMIENTOS: {
      nombre: 'Movimientos',
      descripcion: 'Importar movimientos de inventario desde archivo Excel/CSV',
      camposRequeridos: ['producto', 'tipo', 'cantidad'],
      camposOpcionales: ['fecha', 'motivo', 'proveedor'],
      formatosSoportados: ['.xlsx', '.xls', '.csv'],
      maxFileSizeMB: 50,
      icono: 'Activity',
      color: 'purple'
    }
  },

  // Configuración de WebSocket
  WEBSOCKET: {
    NAMESPACE: '/importacion',
    EVENTOS: {
      PROGRESO: 'progreso:actualizado',
      COMPLETADO: 'trabajo:completado',
      ERROR: 'trabajo:error',
      SUSCRIPCION: 'subscribe:trabajos',
      DESUSCRIPCION: 'unsubscribe:trabajos'
    },
    RECONEXION: {
      INTENTOS_MAXIMOS: 3,
      TIEMPO_ENTRE_INTENTOS: 5000
    }
  },

  // Configuración de polling
  POLLING: {
    INTERVALO_MS: 2000,
    TIMEOUT_MS: 300000 // 5 minutos
  },

  // Mensajes de error
  MENSAJES_ERROR: {
    ARCHIVO_NO_PROPORCIONADO: 'Por favor selecciona un archivo',
    TIPO_NO_VALIDO: 'Tipo de importación no válido',
    TAMANO_EXCEDIDO: 'El archivo es demasiado grande',
    FORMATO_NO_SOPORTADO: 'Formato de archivo no soportado',
    WEBSOCKET_NO_CONECTADO: 'No se pudo conectar al servidor',
    IMPORTACION_FALLIDA: 'Error en la importación',
    CANCELACION_FALLIDA: 'Error al cancelar la importación'
  },

  // Mensajes de éxito
  MENSAJES_EXITO: {
    IMPORTACION_COMPLETADA: 'Importación completada exitosamente',
    PLANTILLA_DESCARGADA: 'Plantilla descargada exitosamente',
    REPORTE_DESCARGADO: 'Reporte de errores descargado',
    TRABAJO_CANCELADO: 'Importación cancelada'
  }
}

// Función para determinar el modo de importación
export function determinarModoImportacion(file: File): 'http' | 'websocket' {
  const fileSizeMB = file.size / (1024 * 1024)
  
  // Archivos pequeños usan HTTP
  if (fileSizeMB < IMPORTACION_CONFIG.LIMITES.RAPIDA.TAMANO_MAXIMO_MB) {
    return 'http'
  }
  
  // Archivos grandes usan WebSocket
  return 'websocket'
}

// Función para validar archivo
export function validarArchivo(file: File): { valido: boolean; error?: string } {
  // Validar tamaño
  const fileSizeMB = file.size / (1024 * 1024)
  if (fileSizeMB > IMPORTACION_CONFIG.LIMITES.WEBSOCKET.TAMANO_MAXIMO_MB) {
    return {
      valido: false,
      error: `El archivo es demasiado grande (${fileSizeMB.toFixed(2)}MB). Máximo: ${IMPORTACION_CONFIG.LIMITES.WEBSOCKET.TAMANO_MAXIMO_MB}MB`
    }
  }

  // Validar formato
  const extension = file.name.toLowerCase().split('.').pop()
  const formatosSoportados = ['.xlsx', '.xls', '.csv']
  if (!extension || !formatosSoportados.includes(`.${extension}`)) {
    return {
      valido: false,
      error: `Formato no soportado: .${extension}. Formatos válidos: ${formatosSoportados.join(', ')}`
    }
  }

  return { valido: true }
}

// Función para obtener información del archivo
export function obtenerInformacionArchivo(file: File) {
  const fileSizeMB = file.size / (1024 * 1024)
  const modo = determinarModoImportacion(file)
  const extension = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN'
  
  return {
    nombre: file.name,
    tamaño: fileSizeMB.toFixed(2),
    tipo: file.type,
    extension,
    modo,
    ultimaModificacion: new Date(file.lastModified).toLocaleDateString(),
    registrosEstimados: Math.floor(fileSizeMB * 100) // Estimación aproximada
  }
}

export const DEFAULT_IMPORTACION_OPTIONS = {
  // Opciones generales
  skipHeader: true,
  validateData: true,
  createMissingRecords: false,
  updateExistingRecords: true,
  
  // Opciones de procesamiento
  batchSize: 100,
  maxConcurrency: 3,
  
  // Opciones de validación
  strictValidation: false,
  allowPartialImport: true,
  
  // Opciones de archivo
  supportedFormats: ['xlsx', 'xls', 'csv', 'numbers'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  
  // Opciones de notificación
  showProgress: true,
  showNotifications: true,
  autoCloseNotifications: true,
  
  // Opciones de WebSocket
  enableRealTimeUpdates: true,
  reconnectAttempts: 3,
  reconnectDelay: 1000,
}

export const IMPORTACION_MESSAGES = {
  // Mensajes de éxito
  SUCCESS: {
    UPLOAD_COMPLETE: 'Archivo subido exitosamente',
    VALIDATION_COMPLETE: 'Validación completada',
    IMPORT_COMPLETE: 'Importación completada exitosamente',
    TEMPLATE_DOWNLOADED: 'Plantilla descargada exitosamente',
  },
  
  // Mensajes de error
  ERROR: {
    UPLOAD_FAILED: 'Error al subir el archivo',
    VALIDATION_FAILED: 'Error en la validación',
    IMPORT_FAILED: 'Error en la importación',
    INVALID_FILE_TYPE: 'Tipo de archivo no soportado',
    FILE_TOO_LARGE: 'El archivo es demasiado grande',
    NO_FILE_SELECTED: 'No se ha seleccionado ningún archivo',
    NETWORK_ERROR: 'Error de conexión',
    SERVER_ERROR: 'Error del servidor',
  },
  
  // Mensajes de validación
  VALIDATION: {
    REQUIRED_FIELDS: 'Campos requeridos faltantes',
    INVALID_FORMAT: 'Formato inválido',
    DUPLICATE_RECORDS: 'Registros duplicados encontrados',
    INVALID_DATA: 'Datos inválidos',
  },
  
  // Mensajes de progreso
  PROGRESS: {
    UPLOADING: 'Subiendo archivo...',
    VALIDATING: 'Validando datos...',
    PROCESSING: 'Procesando importación...',
    COMPLETING: 'Finalizando...',
  },
}

export const FILE_TYPE_CONFIG = {
  xlsx: {
    name: 'Excel (.xlsx)',
    icon: '📊',
    description: 'Archivo Excel moderno',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensions: ['.xlsx']
  },
  xls: {
    name: 'Excel (.xls)',
    icon: '📈',
    description: 'Archivo Excel clásico',
    mimeType: 'application/vnd.ms-excel',
    extensions: ['.xls']
  },
  csv: {
    name: 'CSV',
    icon: '📄',
    description: 'Archivo de valores separados por comas',
    mimeType: 'text/csv',
    extensions: ['.csv']
  },
  numbers: {
    name: 'Numbers',
    icon: '📱',
    description: 'Archivo de Apple Numbers',
    mimeType: 'application/x-iwork-numbers-sffnumbers',
    extensions: ['.numbers']
  }
}

export const VALIDATION_RULES = {
  // Reglas generales
  general: {
    maxStringLength: 255,
    maxTextLength: 1000,
    minStringLength: 1,
    dateFormat: 'YYYY-MM-DD',
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phonePattern: /^[\d\s\-\+\(\)]+$/,
    urlPattern: /^https?:\/\/.+/,
  },
  
  // Reglas específicas por campo
  fields: {
    nombre: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\d\-\.]+$/
    },
    email: {
      required: true,
      type: 'email',
      maxLength: 255
    },
    telefono: {
      required: true,
      pattern: /^[\d\s\-\+\(\)]+$/,
      minLength: 7,
      maxLength: 20
    },
    codigo: {
      required: true,
      pattern: /^[A-Z0-9\-_]+$/,
      minLength: 3,
      maxLength: 50
    },
    precio: {
      required: true,
      type: 'number',
      min: 0,
      max: 999999.99,
      decimals: 2
    },
    cantidad: {
      required: true,
      type: 'number',
      min: 0,
      max: 999999
    }
  }
} 