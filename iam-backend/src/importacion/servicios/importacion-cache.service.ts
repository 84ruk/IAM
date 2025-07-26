import { Injectable, Logger } from '@nestjs/common';
import { RedisConfigService } from '../../common/services/redis-config.service';
import { createClient, RedisClientType } from 'redis';

export interface ImportacionCacheConfig {
  // Cache de plantillas
  plantillas: {
    ttl: number; // 1 hora
    prefix: string;
  };
  
  // Cache de productos por empresa (para validación)
  productosEmpresa: {
    ttl: number; // 30 minutos
    prefix: string;
  };
  
  // Cache de trabajos de importación
  trabajos: {
    ttl: number; // 2 horas
    prefix: string;
  };
  
  // Cache de resultados de validación
  validacion: {
    ttl: number; // 10 minutos
    prefix: string;
  };
  
  // Cache de estadísticas de importación
  estadisticas: {
    ttl: number; // 1 hora
    prefix: string;
  };
}

@Injectable()
export class ImportacionCacheService {
  private readonly logger = new Logger(ImportacionCacheService.name);
  private redis: RedisClientType;
  private readonly config: ImportacionCacheConfig = {
    plantillas: {
      ttl: 3600, // 1 hora
      prefix: 'import:plantillas',
    },
    productosEmpresa: {
      ttl: 1800, // 30 minutos
      prefix: 'import:productos:empresa',
    },
    trabajos: {
      ttl: 7200, // 2 horas
      prefix: 'import:trabajos',
    },
    validacion: {
      ttl: 600, // 10 minutos
      prefix: 'import:validacion',
    },
    estadisticas: {
      ttl: 3600, // 1 hora
      prefix: 'import:stats',
    },
  };

  constructor(private readonly redisConfigService: RedisConfigService) {
    this.initializeRedis();
  }

  private async initializeRedis() {
    if (!this.redisConfigService.isRedisConfigured()) {
      this.logger.warn('Redis no configurado, cache de importación deshabilitado');
      return;
    }

    try {
      const redisConfig = this.redisConfigService.getRedisConfig();
      this.redis = createClient(redisConfig);

      this.redis.on('error', (err) => {
        this.logger.error('Redis Client Error:', err);
      });

      this.redis.on('connect', () => {
        this.logger.log('Redis Client Connected for Importacion Cache');
      });

      await this.redis.connect();
      this.logger.log('Importacion Cache Redis connection established');
    } catch (error) {
      this.logger.error('Failed to connect to Redis for Importacion Cache:', error);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  /**
   * Cache de plantillas de importación
   */
  async getPlantillaCache<T>(tipo: string): Promise<T | null> {
    if (!this.redis?.isReady) return null;

    try {
      const key = `${this.config.plantillas.prefix}:${tipo}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.error(`Error getting plantilla cache for ${tipo}:`, error);
      return null;
    }
  }

  async setPlantillaCache<T>(tipo: string, data: T): Promise<void> {
    if (!this.redis?.isReady) return;

    try {
      const key = `${this.config.plantillas.prefix}:${tipo}`;
      await this.redis.setEx(key, this.config.plantillas.ttl, JSON.stringify(data));
    } catch (error) {
      this.logger.error(`Error setting plantilla cache for ${tipo}:`, error);
    }
  }

  /**
   * Cache de productos por empresa (para validación rápida)
   */
  async getProductosEmpresaCache(empresaId: number): Promise<Map<string, any> | null> {
    if (!this.redis?.isReady) return null;

    try {
      const key = `${this.config.productosEmpresa.prefix}:${empresaId}`;
      const cached = await this.redis.get(key);
      if (!cached) return null;

      const productosArray = JSON.parse(cached);
      const productosMap = new Map();
      productosArray.forEach(([key, value]) => productosMap.set(key, value));
      return productosMap;
    } catch (error) {
      this.logger.error(`Error getting productos empresa cache for ${empresaId}:`, error);
      return null;
    }
  }

  async setProductosEmpresaCache(empresaId: number, productos: Map<string, any>): Promise<void> {
    if (!this.redis?.isReady) return;

    try {
      const key = `${this.config.productosEmpresa.prefix}:${empresaId}`;
      const productosArray = Array.from(productos.entries());
      await this.redis.setEx(key, this.config.productosEmpresa.ttl, JSON.stringify(productosArray));
    } catch (error) {
      this.logger.error(`Error setting productos empresa cache for ${empresaId}:`, error);
    }
  }

  /**
   * Cache de trabajos de importación
   */
  async getTrabajoCache(trabajoId: string): Promise<any | null> {
    if (!this.redis?.isReady) return null;

    try {
      const key = `${this.config.trabajos.prefix}:${trabajoId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.error(`Error getting trabajo cache for ${trabajoId}:`, error);
      return null;
    }
  }

  async setTrabajoCache(trabajoId: string, trabajo: any): Promise<void> {
    if (!this.redis?.isReady) return;

    try {
      const key = `${this.config.trabajos.prefix}:${trabajoId}`;
      await this.redis.setEx(key, this.config.trabajos.ttl, JSON.stringify(trabajo));
    } catch (error) {
      this.logger.error(`Error setting trabajo cache for ${trabajoId}:`, error);
    }
  }

  /**
   * Cache de resultados de validación
   */
  async getValidacionCache<T>(hash: string): Promise<T | null> {
    if (!this.redis?.isReady) return null;

    try {
      const key = `${this.config.validacion.prefix}:${hash}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.error(`Error getting validacion cache for ${hash}:`, error);
      return null;
    }
  }

  async setValidacionCache<T>(hash: string, resultado: T): Promise<void> {
    if (!this.redis?.isReady) return;

    try {
      const key = `${this.config.validacion.prefix}:${hash}`;
      await this.redis.setEx(key, this.config.validacion.ttl, JSON.stringify(resultado));
    } catch (error) {
      this.logger.error(`Error setting validacion cache for ${hash}:`, error);
    }
  }

  /**
   * Cache de estadísticas de importación
   */
  async getEstadisticasCache(empresaId: number): Promise<any | null> {
    if (!this.redis?.isReady) return null;

    try {
      const key = `${this.config.estadisticas.prefix}:${empresaId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.error(`Error getting estadisticas cache for ${empresaId}:`, error);
      return null;
    }
  }

  async setEstadisticasCache(empresaId: number, estadisticas: any): Promise<void> {
    if (!this.redis?.isReady) return;

    try {
      const key = `${this.config.estadisticas.prefix}:${empresaId}`;
      await this.redis.setEx(key, this.config.estadisticas.ttl, JSON.stringify(estadisticas));
    } catch (error) {
      this.logger.error(`Error setting estadisticas cache for ${empresaId}:`, error);
    }
  }

  /**
   * Invalidación de cache
   */
  async invalidatePlantillas(): Promise<void> {
    if (!this.redis?.isReady) return;

    try {
      const pattern = `${this.config.plantillas.prefix}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
        this.logger.log(`Invalidated ${keys.length} plantilla cache keys`);
      }
    } catch (error) {
      this.logger.error('Error invalidating plantillas cache:', error);
    }
  }

  async invalidateProductosEmpresa(empresaId: number): Promise<void> {
    if (!this.redis?.isReady) return;

    try {
      const key = `${this.config.productosEmpresa.prefix}:${empresaId}`;
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error invalidating productos empresa cache for ${empresaId}:`, error);
    }
  }

  async invalidateTrabajo(trabajoId: string): Promise<void> {
    if (!this.redis?.isReady) return;

    try {
      const key = `${this.config.trabajos.prefix}:${trabajoId}`;
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error invalidating trabajo cache for ${trabajoId}:`, error);
    }
  }

  async invalidateEstadisticas(empresaId: number): Promise<void> {
    if (!this.redis?.isReady) return;

    try {
      const key = `${this.config.estadisticas.prefix}:${empresaId}`;
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error invalidating estadisticas cache for ${empresaId}:`, error);
    }
  }

  /**
   * Limpiar todo el cache de importación
   */
  async clearAll(): Promise<void> {
    if (!this.redis?.isReady) return;

    try {
      const patterns = [
        `${this.config.plantillas.prefix}:*`,
        `${this.config.productosEmpresa.prefix}:*`,
        `${this.config.trabajos.prefix}:*`,
        `${this.config.validacion.prefix}:*`,
        `${this.config.estadisticas.prefix}:*`,
      ];

      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      }

      this.logger.log('All importacion cache cleared');
    } catch (error) {
      this.logger.error('Error clearing importacion cache:', error);
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  async getCacheStats(): Promise<{
    isConnected: boolean;
    keysCount: number;
    memoryUsage?: string;
  }> {
    if (!this.redis?.isReady) {
      return {
        isConnected: false,
        keysCount: 0,
      };
    }

    try {
      const patterns = [
        `${this.config.plantillas.prefix}:*`,
        `${this.config.productosEmpresa.prefix}:*`,
        `${this.config.trabajos.prefix}:*`,
        `${this.config.validacion.prefix}:*`,
        `${this.config.estadisticas.prefix}:*`,
      ];

      let totalKeys = 0;
      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        totalKeys += keys.length;
      }

      return {
        isConnected: true,
        keysCount: totalKeys,
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
        isConnected: true,
        keysCount: 0,
      };
    }
  }
} 