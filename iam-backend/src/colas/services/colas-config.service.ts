import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ColasConfig {
  // Configuración de Redis
  redis: {
    maxRetriesPerRequest: number | null;
    enableReadyCheck: boolean;
    lazyConnect: boolean;
    keepAlive: number;
    family: number;
    connectTimeout: number;
    commandTimeout: number;
  };
  
  // Configuración de colas
  queue: {
    removeOnComplete: number;
    removeOnFail: number;
    attempts: number;
    backoffDelay: number;
    backoffType: 'exponential' | 'fixed';
  };
  
  // Configuración de workers
  worker: {
    concurrency: number;
    autorun: boolean;
    maxMemoryUsage: number;
  };
  
  // Configuración de procesamiento
  processing: {
    defaultLoteSize: number;
    maxRetries: number;
    timeout: number;
    enableCache: boolean;
    cacheTTL: number;
  };
  
  // Configuración de prioridades
  priorities: {
    movimientos: number;
    productos: number;
    proveedores: number;
  };
}

@Injectable()
export class ColasConfigService {
  private readonly config: ColasConfig;

  constructor(private configService: ConfigService) {
    this.config = this.initializeConfig();
  }

  private initializeConfig(): ColasConfig {
    return {
      redis: {
        maxRetriesPerRequest: null, // BullMQ requiere que sea null
        enableReadyCheck: false,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        connectTimeout: 30000, // Aumentado de 10s a 30s
        commandTimeout: 15000, // Aumentado de 5s a 15s
      },
      queue: {
        removeOnComplete: 1000, // Aumentado para mantener más trabajos completados
        removeOnFail: 500,      // Aumentado para mantener más trabajos fallidos
        attempts: 3,
        backoffDelay: 2000,
        backoffType: 'exponential',
      },
      worker: {
        concurrency: 2,
        autorun: true,
        maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      },
      processing: {
        defaultLoteSize: 100,
        maxRetries: 3,
        timeout: 30000,
        enableCache: true,
        cacheTTL: 1800,
      },
      priorities: {
        movimientos: 1,    // Mayor prioridad
        productos: 2,
        proveedores: 3,    // Menor prioridad
      },
    };
  }

  getRedisConfig() {
    return this.config.redis;
  }

  getQueueConfig() {
    return this.config.queue;
  }

  getWorkerConfig() {
    return this.config.worker;
  }

  getProcessingConfig() {
    return this.config.processing;
  }

  getPriorities() {
    return this.config.priorities;
  }

  getConfig(): ColasConfig {
    return { ...this.config };
  }
} 