import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, IsEnum } from 'class-validator';

export enum ImportacionEventType {
  TRABAJO_CREADO = 'trabajo:creado',
  TRABAJO_ACTUALIZADO = 'trabajo:actualizado',
  TRABAJO_COMPLETADO = 'trabajo:completado',
  TRABAJO_ERROR = 'trabajo:error',
  PROGRESO_ACTUALIZADO = 'progreso:actualizado',
  ERROR_VALIDACION = 'error:validacion',
  ESTADISTICAS_ACTUALIZADAS = 'estadisticas:actualizadas',
  IMPORTACION_INICIADA = 'importacion:iniciada',
  IMPORTACION_FINALIZADA = 'importacion:finalizada'
}

export class TrabajoImportacionEvent {
  @IsString()
  id: string;

  @IsString()
  tipo: string;

  @IsString()
  estado: string;

  @IsNumber()
  progreso: number;

  @IsNumber()
  totalRegistros: number;

  @IsNumber()
  registrosProcesados: number;

  @IsNumber()
  registrosExitosos: number;

  @IsNumber()
  registrosConError: number;

  @IsString()
  archivoOriginal: string;

  @IsDateString()
  fechaCreacion: string;

  @IsDateString()
  fechaActualizacion: string;

  @IsOptional()
  @IsString()
  mensaje?: string;

  @IsOptional()
  errores?: any[];
}

export class ProgresoImportacionEvent {
  @IsString()
  trabajoId: string;

  @IsNumber()
  progreso: number;

  @IsNumber()
  registrosProcesados: number;

  @IsNumber()
  registrosExitosos: number;

  @IsNumber()
  registrosConError: number;

  @IsString()
  estado: string;

  @IsOptional()
  @IsString()
  mensaje?: string;

  @IsDateString()
  timestamp: string;
}

export class ErrorValidacionEvent {
  @IsString()
  trabajoId: string;

  @IsNumber()
  fila: number;

  @IsString()
  columna: string;

  @IsString()
  valor: string;

  @IsString()
  mensaje: string;

  @IsString()
  tipo: string;

  @IsDateString()
  timestamp: string;
}

export class EstadisticasImportacionEvent {
  @IsNumber()
  totalTrabajos: number;

  @IsNumber()
  trabajosCompletados: number;

  @IsNumber()
  trabajosConError: number;

  @IsNumber()
  trabajosEnProgreso: number;

  @IsNumber()
  porcentajeExito: number;

  @IsDateString()
  timestamp: string;
}

export class ImportacionWebSocketMessage {
  @IsEnum(ImportacionEventType)
  event: ImportacionEventType;

  @IsString()
  trabajoId?: string;

  @IsOptional()
  data?: TrabajoImportacionEvent | ProgresoImportacionEvent | ErrorValidacionEvent | EstadisticasImportacionEvent;

  @IsDateString()
  timestamp: string;

  @IsOptional()
  @IsString()
  empresaId?: string;

  @IsOptional()
  @IsString()
  usuarioId?: string;
} 