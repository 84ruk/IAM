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
  configuracionEspecifica?: Record<string, any>;
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