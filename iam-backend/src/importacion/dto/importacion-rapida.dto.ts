import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export enum EstrategiaDuplicados {
  IGNORAR = 'ignorar',
  ACTUALIZAR = 'actualizar',
  ERROR = 'error',
  SOLO_VALIDAR = 'solo_validar'
}

export class ImportacionRapidaDto {
  @IsString()
  tipo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsEnum(EstrategiaDuplicados)
  estrategiaDuplicados?: EstrategiaDuplicados = EstrategiaDuplicados.ERROR;

  @IsOptional()
  @IsBoolean()
  validarSolo?: boolean = false;

  @IsOptional()
  @IsBoolean()
  generarReporteDetallado?: boolean = true;
}

export interface ErrorImportacion {
  fila: number;
  columna: string;
  valor: string;
  mensaje: string;
  tipo: 'validacion' | 'duplicado' | 'error_db' | 'formato';
  sugerencia?: string;
  codigoError?: string;
  datosOriginales?: any;
  campoEspecifico?: string;
  valorEsperado?: string;
  valorRecibido?: string;
}

export interface CorreccionImportacion {
  campo: string;
  valorOriginal: string;
  valorCorregido: string;
  tipo: 'formato' | 'normalizacion';
  confianza: number;
  fila: number;
  datosOriginales?: any;
}

// Nueva interfaz para registrar detalles de registros exitosos
export interface RegistroExitoso {
  fila: number;
  tipo: string;
  datos: Record<string, any>;
  identificador: string; // nombre, código, etc.
  correccionesAplicadas?: CorreccionImportacion[];
  timestamp: Date;
}

export interface ResumenImportacion {
  tipo: string;
  empresaId: string;
  usuarioId: string;
  fechaProcesamiento: Date;
  estrategiaDuplicados?: EstrategiaDuplicados;
  correccionesAplicadas?: number;
}

export interface ResultadoImportacionRapida {
  registrosProcesados: number;
  registrosExitosos: number;
  registrosConError: number;
  registrosIgnorados?: number;
  registrosActualizados?: number;
  errores: ErrorImportacion[];
  correcciones?: CorreccionImportacion[];
  registrosExitososDetalle?: RegistroExitoso[]; // Nueva propiedad para detalles
  archivoErrores?: string;
  resumen: ResumenImportacion;
  tiempoProcesamiento?: number;
  estadisticas?: {
    duplicados: number;
    erroresValidacion: number;
    erroresBaseDatos: number;
    erroresFormato: number;
  };
} 