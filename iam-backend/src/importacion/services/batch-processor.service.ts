import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ErrorImportacion } from '../../colas/interfaces/trabajo-importacion.interface';

export interface BatchProcessorConfig {
  batchSize: number;
  concurrency: number;
  retryAttempts: number;
  timeout: number;
  enableProgressTracking: boolean;
}

export interface BatchProcessorResult<T> {
  success: boolean;
  processed: number;
  errors: ErrorImportacion[];
  data: T[];
  executionTime: number;
}

@Injectable()
export class BatchProcessorService {
  private readonly logger = new Logger(BatchProcessorService.name);

  /**
   * Procesa datos en lotes optimizados con concurrencia controlada
   */
  async processBatch<T, R>(
    data: T[],
    processor: (item: T, index: number) => Promise<R>,
    config: Partial<BatchProcessorConfig> = {},
    job?: Job
  ): Promise<BatchProcessorResult<R>> {
    const startTime = Date.now();
    const finalConfig: BatchProcessorConfig = {
      batchSize: 100,
      concurrency: 5,
      retryAttempts: 3,
      timeout: 30000,
      enableProgressTracking: true,
      ...config
    };

    const result: BatchProcessorResult<R> = {
      success: true,
      processed: 0,
      errors: [],
      data: [],
      executionTime: 0
    };

    try {
      // Dividir datos en lotes
      const batches = this.createBatches(data, finalConfig.batchSize);
      
      // Procesar lotes con concurrencia controlada
      for (let i = 0; i < batches.length; i += finalConfig.concurrency) {
        const currentBatches = batches.slice(i, i + finalConfig.concurrency);
        
        // Procesar lotes en paralelo
        const batchPromises = currentBatches.map((batch, batchIndex) =>
          this.processBatchWithRetry(batch, processor, finalConfig, i + batchIndex)
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        // Consolidar resultados
        batchResults.forEach((batchResult, index) => {
          if (batchResult.status === 'fulfilled') {
            result.data.push(...batchResult.value.data);
            result.processed += batchResult.value.processed;
            result.errors.push(...batchResult.value.errors);
          } else {
            result.success = false;
            result.errors.push({
              fila: i + index,
              columna: 'sistema',
              valor: '',
              mensaje: `Error procesando lote: ${batchResult.reason}`,
              tipo: 'sistema'
            });
          }
        });

        // Actualizar progreso si está habilitado
        if (finalConfig.enableProgressTracking && job) {
          const progress = Math.round(((i + finalConfig.concurrency) / batches.length) * 100);
          await job.updateProgress(Math.min(progress, 100));
        }
      }

      result.executionTime = Date.now() - startTime;
      
      this.logger.log(`Procesamiento por lotes completado: ${result.processed}/${data.length} registros procesados en ${result.executionTime}ms`);
      
      return result;

    } catch (error) {
      result.success = false;
      result.errors.push({
        fila: 0,
        columna: 'sistema',
        valor: '',
        mensaje: `Error en procesamiento por lotes: ${error.message}`,
        tipo: 'sistema'
      });
      result.executionTime = Date.now() - startTime;
      
      this.logger.error('Error en procesamiento por lotes:', error);
      return result;
    }
  }

  /**
   * Procesa un lote individual con reintentos
   */
  private async processBatchWithRetry<T, R>(
    batch: T[],
    processor: (item: T, index: number) => Promise<R>,
    config: BatchProcessorConfig,
    batchIndex: number
  ): Promise<BatchProcessorResult<R>> {
    let lastError: Error = new Error('Error desconocido en procesamiento por lotes');
    
    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        const batchPromises = batch.map((item, index) =>
          this.processItemWithTimeout(item, processor, config.timeout, batchIndex * config.batchSize + index)
        );

        const results = await Promise.allSettled(batchPromises);
        
        const data: R[] = [];
        const errors: ErrorImportacion[] = [];
        let processed = 0;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            data.push(result.value);
            processed++;
          } else {
            errors.push({
              fila: batchIndex * config.batchSize + index + 1,
              columna: 'procesamiento',
              valor: '',
              mensaje: `Error procesando item: ${result.reason}`,
              tipo: 'sistema'
            });
          }
        });

        return {
          success: errors.length === 0,
          processed,
          errors,
          data,
          executionTime: 0
        };

      } catch (error) {
        lastError = error;
        if (attempt < config.retryAttempts) {
          await this.delay(Math.pow(2, attempt) * 1000); // Backoff exponencial
        }
      }
    }

    throw lastError || new Error('Error desconocido en procesamiento por lotes');
  }

  /**
   * Procesa un item individual con timeout
   */
  private async processItemWithTimeout<T, R>(
    item: T,
    processor: (item: T, index: number) => Promise<R>,
    timeout: number,
    index: number
  ): Promise<R> {
    return Promise.race([
      processor(item, index),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  }

  /**
   * Crea lotes de datos
   */
  private createBatches<T>(data: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Optimiza la configuración de lotes basado en el tamaño de datos
   */
  getOptimizedConfig(dataSize: number): BatchProcessorConfig {
    if (dataSize <= 100) {
      return {
        batchSize: 10,
        concurrency: 2,
        retryAttempts: 2,
        timeout: 15000,
        enableProgressTracking: true
      };
    } else if (dataSize <= 1000) {
      return {
        batchSize: 50,
        concurrency: 3,
        retryAttempts: 3,
        timeout: 20000,
        enableProgressTracking: true
      };
    } else {
      return {
        batchSize: 100,
        concurrency: 5,
        retryAttempts: 3,
        timeout: 30000,
        enableProgressTracking: true
      };
    }
  }
} 