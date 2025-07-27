import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import Redis from 'ioredis';

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  url?: string;
}

@Injectable()
export class RedisConfigService {
  private readonly logger = new Logger(RedisConfigService.name);
  private redisConfig: RedisConfig;

  constructor() {
    this.initializeConfig();
  }

  private initializeConfig() {
    // ✅ SOPORTE PARA UPSTASH Y CONFIGURACIÓN INDIVIDUAL
    if (process.env.REDIS_URL) {
      // Usar URL completa (Upstash, Railway, etc.)
      this.logger.log('Using REDIS_URL configuration for unified Redis');
      this.redisConfig = {
        url: process.env.REDIS_URL,
      };
    } else {
      // Usar configuración individual (host, port, password)
      this.logger.log('Using individual Redis configuration');
      this.redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      };
    }
  }

  /**
   * Obtiene configuración para redis package (usado en KPIs)
   */
  getRedisConfig(): any {
    if (this.redisConfig.url) {
      return { url: this.redisConfig.url };
    }
    
    return {
      socket: {
        host: this.redisConfig.host,
        port: this.redisConfig.port,
      },
      password: this.redisConfig.password,
      database: this.redisConfig.db,
    };
  }

  /**
   * Obtiene configuración para ioredis package (usado en Colas)
   */
  getIORedisConfig(): any {
    let baseConfig: any;
    
    if (this.redisConfig.url) {
      baseConfig = this.redisConfig.url;
    } else {
      baseConfig = {
        host: this.redisConfig.host,
        port: this.redisConfig.port,
        password: this.redisConfig.password,
        db: this.redisConfig.db,
      };
    }

    // Configuración optimizada para evitar timeouts y advertencias
    const optimizedConfig = {
      ...baseConfig,
      connectTimeout: 30000,
      commandTimeout: 15000,
      retryDelayOnFailover: 100,
      retryDelayOnClusterDown: 300,
      enableOfflineQueue: true,
      maxLoadingTimeout: 30000,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      // Configuración para evitar advertencias de evicción
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      // Configuración de memoria para evitar evicción
      maxMemoryPolicy: 'noeviction',
    };

    return optimizedConfig;
  }

  /**
   * Verifica si Redis está configurado
   */
  isRedisConfigured(): boolean {
    return !!(this.redisConfig.url || this.redisConfig.host);
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): RedisConfig {
    return { ...this.redisConfig };
  }
} 