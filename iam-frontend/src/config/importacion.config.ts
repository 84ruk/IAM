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

export const IMPORTACION_CONFIG: Record<TipoImportacion, ImportacionConfig> = {
  productos: {
    title: 'Productos',
    description: 'Importa tu catálogo de productos',
    icon: '📦',
    camposRequeridos: ['nombre', 'stock', 'precioCompra', 'precioVenta'],
    camposOpcionales: ['descripcion', 'stockMinimo', 'etiqueta', 'proveedor'],
    maxFileSizeMB: 50,
    supportedFormats: ['.xlsx', '.xls', '.numbers', '.csv']
  },
  proveedores: {
    title: 'Proveedores',
    description: 'Importa tu lista de proveedores',
    icon: '🏢',
    camposRequeridos: ['nombre', 'email'],
    camposOpcionales: ['telefono', 'direccion', 'rfc', 'contacto'],
    maxFileSizeMB: 50,
    supportedFormats: ['.xlsx', '.xls', '.numbers', '.csv']
  },
  movimientos: {
    title: 'Movimientos',
    description: 'Importa movimientos de inventario',
    icon: '📊',
    camposRequeridos: ['producto', 'tipo', 'cantidad', 'fecha'],
    camposOpcionales: ['motivo', 'proveedor', 'observaciones'],
    maxFileSizeMB: 50,
    supportedFormats: ['.xlsx', '.xls', '.numbers', '.csv']
  },
  auto: {
    title: 'Importación Automática',
    description: 'Detecta automáticamente el tipo de datos',
    icon: '🤖',
    camposRequeridos: [],
    camposOpcionales: [],
    maxFileSizeMB: 50,
    supportedFormats: ['.xlsx', '.xls', '.numbers', '.csv']
  }
}

export const getImportacionConfig = (tipo: TipoImportacion): ImportacionConfig => {
  return IMPORTACION_CONFIG[tipo]
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