import { Job } from 'bullmq';
import { TrabajoImportacion, ResultadoImportacion, ErrorImportacion, RegistroImportacion } from './trabajo-importacion.interface';

export interface BaseProcesadorInterface {
  procesar(trabajo: TrabajoImportacion, job: Job): Promise<ResultadoImportacion>;
}

export interface ProcesadorConfig {
  loteSize: number;
  maxRetries: number;
  timeout: number;
  enableCache: boolean;
  cacheTTL: number;
}

export interface ProcesadorResultado {
  exitoso: boolean;
  registrosProcesados: number;
  errores: ErrorImportacion[];
  tiempoProcesamiento: number;
}

export interface LoteProcesador<T = RegistroImportacion> {
  procesarLote(
    lote: T[], 
    trabajo: TrabajoImportacion, 
    resultado: ResultadoImportacion, 
    job: Job
  ): Promise<void>;
  
  validarRegistro(registro: T): ErrorImportacion[];
  
  guardarRegistro(registro: T, trabajo: TrabajoImportacion): Promise<void>;
} 