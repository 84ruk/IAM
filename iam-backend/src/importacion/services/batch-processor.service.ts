import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TrabajoImportacion, ResultadoImportacion, RegistroImportacion, EstadoTrabajo } from '../../colas/interfaces/trabajo-importacion.interface';
import { ImportacionConfigService } from '../config/importacion.config';
import { AdvancedLoggingService } from './advanced-logging.service';
import { ErrorHandlerService } from './error-handler.service';
import { ValidationCacheService } from './validation-cache.service';
import { AutocorreccionInteligenteService } from './autocorreccion-inteligente.service';

export interface BatchConfig {
  size: number;
  concurrency: number;
  timeout: number;
  retryAttempts: number;
  backoffDelay: number;
  enableProgressTracking: boolean;
  enableMemoryMonitoring: boolean;
  maxMemoryUsage: number; // en bytes
}

export interface BatchResult {
  procesados: number;
  exitosos: number;
  errores: number;
  tiempoProcesamiento: number;
  memoriaUtilizada: number;
  throughput: number;
  erroresDetallados: any[];
}

export interface BatchProgress {
  totalRegistros: number;
  registrosProcesados: number;
  lotesCompletados: number;
  lotesTotales: number;
  progreso: number; // 0-100
  tiempoEstimado: number; // en segundos
  velocidad: number; // registros por segundo
}

@Injectable()
export class BatchProcessorService {
  private readonly logger = new Logger(BatchProcessorService.name);
  private readonly config: BatchConfig;
  private readonly activeBatches = new Map<string, {
    startTime: Date;
    processed: number;
    errors: number;
    memoryStart: number;
  }>();

  constructor(
    private readonly loggingService: AdvancedLoggingService,
    private readonly errorHandler: ErrorHandlerService,
    private readonly cacheService: ValidationCacheService,
    private readonly autocorreccionService: AutocorreccionInteligenteService,
  ) {
    const colasConfig = ImportacionConfigService.getConfiguracionColas();
    this.config = {
      size: colasConfig.batchSize,
      concurrency: colasConfig.concurrency,
      timeout: colasConfig.timeout,
      retryAttempts: colasConfig.retryAttempts,
      backoffDelay: colasConfig.backoffDelay,
      enableProgressTracking: true,
      enableMemoryMonitoring: true,
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB
    };
  }

  /**
   * Procesa registros en lotes optimizados
   */
  async procesarEnLotes(
    registros: RegistroImportacion[],
    trabajo: TrabajoImportacion,
    procesador: (lote: RegistroImportacion[], contexto: any) => Promise<BatchResult>,
    contexto: any = {},
    job?: Job
  ): Promise<ResultadoImportacion> {
    const startTime = Date.now();
    const batchId = `${trabajo.id}-${Date.now()}`;
    
    // Inicializar tracking
    this.activeBatches.set(batchId, {
      startTime: new Date(),
      processed: 0,
      errors: 0,
      memoryStart: process.memoryUsage().heapUsed,
    });

    this.loggingService.iniciarTracking(trabajo.id, {
      trabajoId: trabajo.id,
      empresaId: trabajo.empresaId,
      usuarioId: trabajo.usuarioId,
      tipoImportacion: trabajo.tipo,
      archivo: trabajo.archivoOriginal,
    });

    try {
      // Dividir registros en lotes
      const lotes = this.dividirEnLotes(registros, this.config.size);
      const totalLotes = lotes.length;
      let lotesCompletados = 0;
      let totalProcesados = 0;
      let totalExitosos = 0;
      let totalErrores = 0;
      const erroresAcumulados: any[] = [];

      this.loggingService.log('info', `Iniciando procesamiento de ${registros.length} registros en ${totalLotes} lotes`, {
        trabajoId: trabajo.id,
        empresaId: trabajo.empresaId,
        usuarioId: trabajo.usuarioId,
        tipoImportacion: trabajo.tipo,
        archivo: trabajo.archivoOriginal,
        etapa: 'inicio_procesamiento',
        timestamp: new Date(),
      }, {
        totalRegistros: registros.length,
        totalLotes,
        configuracionLotes: this.config,
      });

      // Procesar lotes con concurrencia controlada
      const resultados = await this.procesarLotesConConcurrencia(
        lotes,
        procesador,
        contexto,
        (progreso) => {
          // Callback de progreso
          if (this.config.enableProgressTracking) {
            this.actualizarProgreso(trabajo, progreso, job);
          }
        }
      );

      // Consolidar resultados
      for (const resultado of resultados) {
        totalProcesados += resultado.procesados;
        totalExitosos += resultado.exitosos;
        totalErrores += resultado.errores;
        erroresAcumulados.push(...resultado.erroresDetallados);
        lotesCompletados++;
      }

      const tiempoTotal = Date.now() - startTime;
      const memoriaFinal = process.memoryUsage().heapUsed;
      const throughput = totalProcesados > 0 ? (totalProcesados / tiempoTotal) * 1000 : 0;

      // Actualizar métricas finales
      this.loggingService.actualizarMetricas(trabajo.id, {
        registrosProcesados: totalProcesados,
        registrosExitosos: totalExitosos,
        registrosConError: totalErrores,
      });

      const resultadoFinal: ResultadoImportacion = {
        trabajoId: trabajo.id,
        estado: totalErrores === 0 ? EstadoTrabajo.COMPLETADO : EstadoTrabajo.ERROR,
        estadisticas: {
          total: totalProcesados,
          exitosos: totalExitosos,
          errores: totalErrores,
          duplicados: 0, // Se calcularía si es necesario
        },
        errores: erroresAcumulados.slice(0, 100), // Limitar a 100 errores
        tiempoProcesamiento: tiempoTotal,
        archivoResultado: undefined, // Se generaría si es necesario
      };

      // Log de finalización
      this.loggingService.log('info', 'Procesamiento por lotes completado', {
        trabajoId: trabajo.id,
        empresaId: trabajo.empresaId,
        usuarioId: trabajo.usuarioId,
        tipoImportacion: trabajo.tipo,
        archivo: trabajo.archivoOriginal,
        etapa: 'finalizacion',
        timestamp: new Date(),
      }, {
        totalProcesados,
        totalExitosos,
        totalErrores,
        tiempoTotal,
        throughput,
        memoriaUtilizada: memoriaFinal,
        eficiencia: totalProcesados > 0 ? (totalExitosos / totalProcesados) * 100 : 0,
      });

      // Finalizar tracking
      this.loggingService.finalizarTracking(trabajo.id);
      this.activeBatches.delete(batchId);

      return resultadoFinal;

    } catch (error) {
      this.logger.error(`Error en procesamiento por lotes para trabajo ${trabajo.id}:`, error);
      
      // Log de error
      this.loggingService.log('error', 'Error en procesamiento por lotes', {
        trabajoId: trabajo.id,
        empresaId: trabajo.empresaId,
        usuarioId: trabajo.usuarioId,
        tipoImportacion: trabajo.tipo,
        archivo: trabajo.archivoOriginal,
        etapa: 'error',
        timestamp: new Date(),
      }, {
        error: error.message,
        stack: error.stack,
      });

      this.activeBatches.delete(batchId);

      throw error;
    }
  }

  /**
   * Procesa lotes con control de concurrencia
   */
  private async procesarLotesConConcurrencia(
    lotes: RegistroImportacion[][],
    procesador: (lote: RegistroImportacion[], contexto: any) => Promise<BatchResult>,
    contexto: any,
    onProgress?: (progreso: BatchProgress) => void
  ): Promise<BatchResult[]> {
    const resultados: BatchResult[] = [];
    const semaphore = new Semaphore(this.config.concurrency);

    for (let i = 0; i < lotes.length; i++) {
      const lote = lotes[i];
      const loteIndex = i;

      await semaphore.acquire();

      try {
        // Verificar memoria antes de procesar
        if (this.config.enableMemoryMonitoring) {
          this.verificarMemoria();
        }

        const resultado = await this.procesarLoteConRetry(lote, procesador, contexto, loteIndex);
        resultados.push(resultado);

        // Actualizar progreso
        if (onProgress) {
          const progreso: BatchProgress = {
            totalRegistros: lotes.reduce((sum, l) => sum + l.length, 0),
            registrosProcesados: resultados.reduce((sum, r) => sum + r.procesados, 0),
            lotesCompletados: resultados.length,
            lotesTotales: lotes.length,
            progreso: Math.round((resultados.length / lotes.length) * 100),
            tiempoEstimado: this.calcularTiempoEstimado(resultados, lotes.length),
            velocidad: this.calcularVelocidad(resultados),
          };
          onProgress(progreso);
        }

      } finally {
        semaphore.release();
      }
    }

    return resultados;
  }

  /**
   * Procesa un lote individual con reintentos
   */
  private async procesarLoteConRetry(
    lote: RegistroImportacion[],
    procesador: (lote: RegistroImportacion[], contexto: any) => Promise<BatchResult>,
    contexto: any,
    loteIndex: number
  ): Promise<BatchResult> {
    let ultimoError: Error | null = null;

    for (let intento = 1; intento <= this.config.retryAttempts; intento++) {
      try {
        const startTime = Date.now();
        const resultado = await Promise.race([
          procesador(lote, contexto),
          this.crearTimeout(this.config.timeout, `Timeout procesando lote ${loteIndex}`)
        ]);

        const tiempoProcesamiento = Date.now() - startTime;
        const memoriaUtilizada = process.memoryUsage().heapUsed;
        const throughput = lote.length > 0 ? (lote.length / tiempoProcesamiento) * 1000 : 0;

        return {
          ...resultado,
          tiempoProcesamiento,
          memoriaUtilizada,
          throughput,
        };

      } catch (error) {
        ultimoError = error;
        
        if (intento < this.config.retryAttempts) {
          this.logger.warn(`Intento ${intento} falló para lote ${loteIndex}, reintentando en ${this.config.backoffDelay * intento}ms`);
          await this.delay(this.config.backoffDelay * intento);
        }
      }
    }

    // Si todos los intentos fallaron, devolver resultado con error
    this.logger.error(`Todos los intentos fallaron para lote ${loteIndex}:`, ultimoError);
    
    return {
      procesados: lote.length,
      exitosos: 0,
      errores: lote.length,
      tiempoProcesamiento: 0,
      memoriaUtilizada: process.memoryUsage().heapUsed,
      throughput: 0,
      erroresDetallados: [{
        tipo: 'sistema',
        mensaje: `Error procesando lote: ${ultimoError?.message}`,
        loteIndex,
        registros: lote.length,
      }],
    };
  }

  /**
   * Divide registros en lotes optimizados
   */
  private dividirEnLotes(registros: RegistroImportacion[], tamanoLote: number): RegistroImportacion[][] {
    const lotes: RegistroImportacion[][] = [];
    
    for (let i = 0; i < registros.length; i += tamanoLote) {
      lotes.push(registros.slice(i, i + tamanoLote));
    }

    return lotes;
  }

  /**
   * Verifica el uso de memoria y aplica optimizaciones si es necesario
   */
  private verificarMemoria(): void {
    const memoriaActual = process.memoryUsage().heapUsed;
    
    if (memoriaActual > this.config.maxMemoryUsage) {
      this.logger.warn(`Uso de memoria alto: ${Math.round(memoriaActual / 1024 / 1024)}MB`);
      
      // Forzar garbage collection si está disponible
      if (global.gc) {
        global.gc();
        this.logger.log('Garbage collection forzado');
      }
      
      // Limpiar cache si es necesario
      this.cacheService.optimizeCache();
    }
  }

  /**
   * Crea un timeout para evitar bloqueos
   */
  private crearTimeout(ms: number, mensaje: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(mensaje)), ms);
    });
  }

  /**
   * Delay para reintentos
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Actualiza el progreso del trabajo
   */
  private actualizarProgreso(trabajo: TrabajoImportacion, progreso: BatchProgress, job?: Job): void {
    // Actualizar trabajo si está disponible
    if (job) {
      job.updateProgress(progreso.progreso);
    }

    // Log de progreso cada 10%
    if (progreso.progreso % 10 === 0) {
      this.loggingService.log('info', `Progreso: ${progreso.progreso}%`, {
        trabajoId: trabajo.id,
        empresaId: trabajo.empresaId,
        usuarioId: trabajo.usuarioId,
        tipoImportacion: trabajo.tipo,
        archivo: trabajo.archivoOriginal,
        etapa: 'progreso',
        timestamp: new Date(),
      }, {
        progreso: progreso.progreso,
        registrosProcesados: progreso.registrosProcesados,
        velocidad: progreso.velocidad,
        tiempoEstimado: progreso.tiempoEstimado,
      });
    }
  }

  /**
   * Calcula tiempo estimado restante
   */
  private calcularTiempoEstimado(resultados: BatchResult[], lotesTotales: number): number {
    if (resultados.length === 0) return 0;

    const lotesRestantes = lotesTotales - resultados.length;
    const tiempoPromedioPorLote = resultados.reduce((sum, r) => sum + r.tiempoProcesamiento, 0) / resultados.length;
    
    return Math.round(lotesRestantes * tiempoPromedioPorLote / 1000);
  }

  /**
   * Calcula velocidad de procesamiento
   */
  private calcularVelocidad(resultados: BatchResult[]): number {
    if (resultados.length === 0) return 0;

    const totalTiempo = resultados.reduce((sum, r) => sum + r.tiempoProcesamiento, 0);
    const totalRegistros = resultados.reduce((sum, r) => sum + r.procesados, 0);
    
    return totalTiempo > 0 ? (totalRegistros / totalTiempo) * 1000 : 0;
  }

  /**
   * Obtiene estadísticas de lotes activos
   */
  obtenerEstadisticasBatches(): {
    batchesActivos: number;
    memoriaTotalUtilizada: number;
    throughputPromedio: number;
  } {
    const batchesActivos = this.activeBatches.size;
    let memoriaTotalUtilizada = 0;
    let throughputTotal = 0;

    for (const batch of this.activeBatches.values()) {
      const memoriaActual = process.memoryUsage().heapUsed;
      memoriaTotalUtilizada += memoriaActual - batch.memoryStart;
      
      const tiempoTranscurrido = Date.now() - batch.startTime.getTime();
      if (tiempoTranscurrido > 0) {
        throughputTotal += (batch.processed / tiempoTranscurrido) * 1000;
      }
    }

    return {
      batchesActivos,
      memoriaTotalUtilizada,
      throughputPromedio: batchesActivos > 0 ? throughputTotal / batchesActivos : 0,
    };
  }

  /**
   * Limpia batches inactivos
   */
  limpiarBatchesInactivos(): void {
    const ahora = Date.now();
    const tiempoLimite = 30 * 60 * 1000; // 30 minutos

    for (const [batchId, batch] of this.activeBatches.entries()) {
      if (ahora - batch.startTime.getTime() > tiempoLimite) {
        this.activeBatches.delete(batchId);
        this.logger.warn(`Batch inactivo eliminado: ${batchId}`);
      }
    }
  }

  /**
   * Obtiene configuración optimizada basada en el número de registros
   */
  getOptimizedConfig(totalRegistros: number): BatchConfig {
    if (totalRegistros <= 100) {
      return {
        ...this.config,
        size: 50,
        concurrency: 1,
        enableProgressTracking: false,
      };
    } else if (totalRegistros <= 1000) {
      return {
        ...this.config,
        size: 100,
        concurrency: 2,
      };
    } else if (totalRegistros <= 10000) {
      return {
        ...this.config,
        size: 200,
        concurrency: 3,
      };
    } else {
      return {
        ...this.config,
        size: 500,
        concurrency: 4,
      };
    }
  }

  /**
   * Procesa un lote de datos con una función de procesamiento
   */
  async processBatch<T>(
    datos: T[],
    procesador: (item: T) => Promise<any>,
    config?: Partial<BatchConfig>
  ): Promise<BatchResult> {
    const batchConfig = config ? { ...this.config, ...config } : this.config;
    const lotes = this.dividirEnLotesGenerico(datos, batchConfig.size);
    
    let totalProcesados = 0;
    let totalExitosos = 0;
    let totalErrores = 0;
    const erroresDetallados: any[] = [];

    for (const lote of lotes) {
      try {
        const resultados = await Promise.allSettled(
          lote.map(item => procesador(item))
        );

        for (const resultado of resultados) {
          totalProcesados++;
          if (resultado.status === 'fulfilled') {
            totalExitosos++;
          } else {
            totalErrores++;
            erroresDetallados.push({
              error: resultado.reason,
              timestamp: new Date(),
            });
          }
        }
      } catch (error) {
        totalErrores += lote.length;
        erroresDetallados.push({
          error,
          timestamp: new Date(),
        });
      }
    }

    return {
      procesados: totalProcesados,
      exitosos: totalExitosos,
      errores: totalErrores,
      tiempoProcesamiento: 0, // Se calcularía si es necesario
      memoriaUtilizada: process.memoryUsage().heapUsed,
      throughput: totalProcesados > 0 ? totalProcesados : 0,
      erroresDetallados,
    };
  }

  /**
   * Divide datos genéricos en lotes
   */
  private dividirEnLotesGenerico<T>(datos: T[], tamanoLote: number): T[][] {
    const lotes: T[][] = [];
    for (let i = 0; i < datos.length; i += tamanoLote) {
      lotes.push(datos.slice(i, i + tamanoLote));
    }
    return lotes;
  }
}

/**
 * Semáforo para controlar concurrencia
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }
} 