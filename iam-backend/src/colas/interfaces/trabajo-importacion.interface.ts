export enum TipoImportacion {
  PRODUCTOS = 'productos',
  PROVEEDORES = 'proveedores',
  MOVIMIENTOS = 'movimientos',
}

export interface TrabajoImportacion {
  id: string;
  tipo: TipoImportacion;
  empresaId: number;
  usuarioId: number;
  archivoOriginal: string;
  totalRegistros: number;
  registrosProcesados: number;
  registrosExitosos: number;
  registrosConError: number;
  errores: ErrorImportacion[];
  opciones: OpcionesImportacion;
  fechaCreacion: Date;
  fechaInicio?: Date;
  fechaFin?: Date;
  progreso: number;
  estado: EstadoTrabajo;
}

export interface OpcionesImportacion {
  sobrescribirExistentes: boolean;
  validarSolo: boolean;
  notificarEmail: boolean;
  emailNotificacion?: string;
  configuracionEspecifica?: Record<string, unknown>;
}

export interface ErrorImportacion {
  fila: number;
  columna: string;
  valor: string;
  mensaje: string;
  tipo: 'validacion' | 'duplicado' | 'referencia' | 'sistema';
}

export enum EstadoTrabajo {
  PENDIENTE = 'pendiente',
  PROCESANDO = 'procesando',
  COMPLETADO = 'completado',
  ERROR = 'error',
  CANCELADO = 'cancelado',
}

export interface ResultadoImportacion {
  trabajoId: string;
  estado: EstadoTrabajo;
  estadisticas: {
    total: number;
    exitosos: number;
    errores: number;
    duplicados: number;
  };
  errores: ErrorImportacion[];
  tiempoProcesamiento: number;
  archivoResultado?: string;
}

// Interfaces para datos de importación
export interface RegistroImportacion {
  _filaOriginal: number;
  [key: string]: unknown;
}

export interface DatosExcel {
  encabezados: string[];
  registros: RegistroImportacion[];
}

// Interfaces para productos
export interface ProductoImportacion extends RegistroImportacion {
  nombre: unknown;
  descripcion?: unknown;
  stock: unknown;
  precioCompra: unknown;
  precioVenta: unknown;
  stockMinimo?: unknown;
  categoria?: unknown;
  proveedor?: unknown;
  codigoBarras?: unknown;
  unidadMedida?: unknown;
  ubicacion?: unknown;
  fechaVencimiento?: unknown;
  lote?: unknown;
  notas?: unknown;
}

// Interfaces para proveedores
export interface ProveedorImportacion extends RegistroImportacion {
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  codigoPostal?: string;
  ruc?: string;
  contacto?: string;
  notas?: string;
}

// Interfaces para movimientos
export interface MovimientoImportacion extends RegistroImportacion {
  fecha: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  producto: string;
  cantidad: number;
  precio?: number;
  motivo?: string;
  referencia?: string;
  notas?: string;
} 