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
  sobrescribirExistentes: false,
  validarSolo: false,
  notificarEmail: false,
  emailNotificacion: ''
}

export const IMPORTACION_MESSAGES = {
  FILE_TOO_LARGE: (maxSize: number) => `El archivo es demasiado grande. Máximo ${maxSize}MB`,
  INVALID_FORMAT: 'Solo se permiten archivos Excel (.xlsx, .xls, .numbers) o CSV',
  NO_FILE_SELECTED: 'Por favor selecciona un archivo',
  IMPORT_SUCCESS: (tipo: string, count: number) => `¡Importación de ${tipo} completada! ${count} registros procesados exitosamente.`,
  NUMBERS_FILE_DETECTED: 'Archivo Numbers detectado',
  NUMBERS_FILE_DESCRIPTION: 'Los archivos .numbers de Mac se procesan automáticamente como archivos Excel.'
} as const 