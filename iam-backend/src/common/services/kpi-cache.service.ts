import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { RedisConfigService } from './redis-config.service';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl?: number;
}

@Injectable()
export class KPICacheService {
  private readonly logger = new Logger(KPICacheService.name);
  private redis: RedisClientType;
  private readonly defaultTtl = 300; // 5 minutos por defecto

  constructor(private readonly redisConfigService: RedisConfigService) {
    this.initializeRedis();
  }

  private async initializeRedis() {
    if (!this.redisConfigService.isRedisConfigured()) {
      this.logger.warn('Redis no configurado, KPI cache deshabilitado');
      return;
    }

    try {
      const redisConfig = this.redisConfigService.getRedisConfig();
      this.redis = createClient(redisConfig);

      this.redis.on('error', (err) => {
        this.logger.error('Redis Client Error:', err);
      });

      this.redis.on('connect', () => {
        this.logger.log('Redis Client Connected for KPI Cache');
      });

      await this.redis.connect();
      this.logger.log('KPI Cache Redis connection established successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Redis for KPI Cache:', error);
      // En desarrollo, continuar sin Redis
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  /**
   * Obtiene un valor del cache o lo genera si no existe
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.defaultTtl,
  ): Promise<T> {
    if (!this.redis?.isReady) {
      this.logger.warn('Redis not available, using direct factory');
      return await factory();
    }

    try {
      const cacheKey = `kpi:${key}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        this.logger.debug(`Cache hit for key: ${key}`);
        return JSON.parse(cached);
      }

      this.logger.debug(`Cache miss for key: ${key}, generating...`);
      const result = await factory();

      // ✅ CORREGIDO: usar setEx en lugar de setex
      await this.redis.setEx(cacheKey, ttl, JSON.stringify(result));
      this.logger.debug(`Cached result for key: ${key}`);

      return result;
    } catch (error) {
      this.logger.error(`Cache error for key ${key}:`, error);
      // Fallback a factory directo
      return await factory();
    }
  }

  /**
   * Invalida un key específico
   */
  async invalidate(key: string): Promise<void> {
    if (!this.redis?.isReady) {
      this.logger.warn('Redis not available, cannot invalidate');
      return;
    }

    try {
      const cacheKey = `kpi:${key}`;
      await this.redis.del(cacheKey);
      this.logger.debug(`Invalidated cache key: ${key}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache key ${key}:`, error);
    }
  }

  /**
   * Invalida múltiples keys que coincidan con un patrón
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.redis?.isReady) {
      this.logger.warn('Redis not available, cannot invalidate pattern');
      return;
    }

    try {
      const keys = await this.redis.keys(`kpi:${pattern}*`);
      if (keys.length > 0) {
        // ✅ CORREGIDO: usar del con array de keys
        await this.redis.del(keys);
        this.logger.debug(
          `Invalidated ${keys.length} cache keys matching pattern: ${pattern}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error invalidating pattern ${pattern}:`, error);
    }
  }

  /**
   * Invalida todos los KPIs de una empresa
   */
  async invalidateEmpresaKPIs(empresaId: number): Promise<void> {
    await Promise.all([
      this.invalidate(`kpis:${empresaId}`),
      this.invalidate(`financial-kpis:${empresaId}`),
      this.invalidate(`product-kpis:${empresaId}`),
      this.invalidate(`movement-kpis:${empresaId}`),
    ]);
  }

  /**
   * Invalida KPIs relacionados con un producto específico
   */
  async invalidateProductKPIs(
    productoId: number,
    empresaId: number,
  ): Promise<void> {
    await Promise.all([
      this.invalidate(`kpis:${empresaId}`),
      this.invalidate(`product-kpis:${productoId}`),
      this.invalidate(`movement-kpis:${empresaId}`),
    ]);
  }

  /**
   * Obtiene estadísticas del cache
   */
  async getCacheStats(): Promise<{
    isConnected: boolean;
    keysCount?: number;
    memoryUsage?: string;
  }> {
    if (!this.redis?.isReady) {
      return { isConnected: false };
    }

    try {
      const [keysCount, memoryInfo] = await Promise.all([
        this.redis.dbSize(),
        this.redis.info('memory'),
      ]);

      const memoryUsage =
        memoryInfo
          .split('\n')
          .find((line) => line.startsWith('used_memory_human:'))
          ?.split(':')[1] || 'unknown';

      return {
        isConnected: true,
        keysCount,
        memoryUsage: memoryUsage.trim(),
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return { isConnected: true };
    }
  }

  /**
   * Limpia todo el cache
   */
  async clearAll(): Promise<void> {
    if (!this.redis?.isReady) {
      this.logger.warn('Redis not available, cannot clear cache');
      return;
    }

    try {
      // ✅ CORREGIDO: usar flushDb en lugar de flushdb
      await this.redis.flushDb();
      this.logger.log('Cache cleared successfully');
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
    }
  }

  /**
   * Cierra la conexión de Redis
   */
  async onModuleDestroy() {
    if (this.redis?.isReady) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }
}
