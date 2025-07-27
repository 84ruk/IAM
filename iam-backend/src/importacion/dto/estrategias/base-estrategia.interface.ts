import { 
  TrabajoImportacion, 
  ResultadoImportacion, 
  ErrorImportacion,
  RegistroImportacion 
} from '../../../colas/interfaces/trabajo-importacion.interface';
import { Job } from 'bullmq';

export interface EstrategiaImportacion {
  readonly tipo: string;
  readonly nombre: string;
  
  // Validación de estructura del archivo
  validarEstructuraArchivo(datos: RegistroImportacion[]): ErrorImportacion[];
  
  // Validación de registros individuales
  validarRegistro(registro: RegistroImportacion, contexto?: any): ErrorImportacion[];
  
  // Transformación de datos
  transformarDatos(datos: RegistroImportacion[]): Promise<RegistroImportacion[]>;
  
  // Verificación de existencia
  verificarExistencia(registro: RegistroImportacion, empresaId: number): Promise<any>;
  
  // Guardado de registros
  guardarRegistro(registro: RegistroImportacion, trabajo: TrabajoImportacion, existente: any): Promise<void>;
  
  // Configuración específica
  obtenerConfiguracionProcesamiento(): {
    loteSize: number;
    maxRetries: number;
    timeout: number;
    enableCache: boolean;
    cacheTTL: number;
  };
  
  // Columnas requeridas para este tipo
  obtenerColumnasRequeridas(): string[];
  
  // Columnas opcionales para este tipo
  obtenerColumnasOpcionales(): string[];
  
  // Validaciones específicas del tipo
  obtenerValidacionesEspecificas(): any[];
  
  // Procesamiento de lote específico
  procesarLote(
    lote: RegistroImportacion[], 
    trabajo: TrabajoImportacion, 
    resultado: ResultadoImportacion, 
    job: Job,
    contexto?: any
  ): Promise<void>;
}

export interface ContextoValidacion {
  empresaId: number;
  productosEmpresa?: Map<string, any>;
  proveedoresEmpresa?: Map<string, any>;
  configuracion?: Record<string, unknown>;
}

export interface ConfiguracionEstrategia {
  loteSize: number;
  maxRetries: number;
  timeout: number;
  enableCache: boolean;
  cacheTTL: number;
  validacionesEspecificas: any[];
  transformacionesEspecificas: any[];
} 