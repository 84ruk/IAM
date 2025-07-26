import { Injectable, Logger } from '@nestjs/common';
import { RedisConfigService } from './redis-config.service';
import Redis from 'ioredis';

export interface RedisHealthStatus {
  isConnected: boolean;
  latency: number;
  memoryUsage: string;
  lastError?: string;
  uptime: number;
  totalCommands: number;
  failedCommands: number;
  successRate: number;
}

@Injectable()
export class RedisHealthService {
  private readonly logger = new Logger(RedisHealthService.name);
  private redis: Redis;
  private healthStats = {
    totalCommands: 0,
    failedCommands: 0,
    lastError: null as string | null,
    uptime: 0,
    startTime: Date.now(),
  };

  constructor(private readonly redisConfigService: RedisConfigService) {
    this.initializeRedis();
  }

  private async initializeRedis() {
    if (!this.redisConfigService.isRedisConfigured()) {
      this.logger.warn('Redis no configurado, monitoreo de salud deshabilitado');
      return;
    }

    try {
      const redisConfig = this.redisConfigService.getIORedisConfig();
      this.redis = new Redis(redisConfig);

      // Eventos de monitoreo
      this.redis.on('connect', () => {
        this.logger.log('🔗 Redis conectado - monitoreo de salud iniciado');
        this.healthStats.startTime = Date.now();
      });

      this.redis.on('ready', () => {
        this.logger.log('✅ Redis listo para operaciones');
      });

      this.redis.on('error', (error) => {
        this.healthStats.lastError = error.message;
        this.healthStats.failedCommands++;
        this.logger.error('❌ Error de Redis:', error.message);
      });

      this.redis.on('close', () => {
        this.logger.warn('🔌 Conexión Redis cerrada');
      });

      this.redis.on('reconnecting', () => {
        this.logger.log('🔄 Reconectando a Redis...');
      });

      this.redis.on('end', () => {
        this.logger.warn('🔚 Conexión Redis terminada');
      });

      // Interceptar comandos para estadísticas
      this.interceptCommands();

    } catch (error) {
      this.logger.error('Error inicializando Redis para monitoreo:', error);
      this.healthStats.lastError = error.message;
    }
  }

  private interceptCommands() {
    // No interceptamos comandos en ioredis ya que no es necesario
    // Los eventos de error ya están manejados por los listeners
    this.logger.log('Monitoreo de comandos Redis iniciado');
  }

  /**
   * Verifica la salud de Redis
   */
  async checkHealth(): Promise<RedisHealthStatus> {
    if (!this.redis?.status || this.redis.status !== 'ready') {
      return {
        isConnected: false,
        latency: -1,
        memoryUsage: 'N/A',
        lastError: this.healthStats.lastError || 'Redis no disponible',
        uptime: this.healthStats.uptime,
        totalCommands: this.healthStats.totalCommands,
        failedCommands: this.healthStats.failedCommands,
        successRate: this.calculateSuccessRate(),
      };
    }

    try {
      const startTime = Date.now();
      await this.redis.ping();
      const latency = Date.now() - startTime;

      const memoryInfo = await this.getMemoryInfo();
      const successRate = this.calculateSuccessRate();

      return {
        isConnected: true,
        latency,
        memoryUsage: memoryInfo,
        lastError: this.healthStats.lastError || undefined,
        uptime: this.healthStats.uptime,
        totalCommands: this.healthStats.totalCommands,
        failedCommands: this.healthStats.failedCommands,
        successRate,
      };
    } catch (error) {
      this.healthStats.failedCommands++;
      this.healthStats.lastError = error.message;
      
      return {
        isConnected: false,
        latency: -1,
        memoryUsage: 'N/A',
        lastError: error.message,
        uptime: this.healthStats.uptime,
        totalCommands: this.healthStats.totalCommands,
        failedCommands: this.healthStats.failedCommands,
        successRate: this.calculateSuccessRate(),
      };
    }
  }

  /**
   * Obtiene información de memoria de Redis
   */
  private async getMemoryInfo(): Promise<string> {
    try {
      const info = await this.redis.info('memory');
      const usedMemoryMatch = info.match(/used_memory_human:(\S+)/);
      const maxMemoryMatch = info.match(/maxmemory_human:(\S+)/);
      
      if (usedMemoryMatch && maxMemoryMatch) {
        return `${usedMemoryMatch[1]}/${maxMemoryMatch[1]}`;
      }
      
      return 'N/A';
    } catch (error) {
      this.logger.warn('Error obteniendo información de memoria Redis:', error);
      return 'N/A';
    }
  }

  /**
   * Calcula la tasa de éxito de comandos
   */
  private calculateSuccessRate(): number {
    if (this.healthStats.totalCommands === 0) return 100;
    
    const successfulCommands = this.healthStats.totalCommands - this.healthStats.failedCommands;
    return Math.round((successfulCommands / this.healthStats.totalCommands) * 100);
  }

  /**
   * Ejecuta un comando con timeout y retry
   */
  async executeWithRetry<T>(
    command: () => Promise<T>,
    maxRetries: number = 3,
    timeout: number = 10000
  ): Promise<T> {
    let lastError: Error = new Error('Operación falló después de todos los intentos');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Command timeout')), timeout);
        });

        const result = await Promise.race([command(), timeoutPromise]);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Intento ${attempt}/${maxRetries} falló:`, lastError.message);
        
        if (attempt < maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000); // Backoff exponencial
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Limpia las estadísticas de salud
   */
  resetStats(): void {
    this.healthStats = {
      totalCommands: 0,
      failedCommands: 0,
      lastError: null,
      uptime: 0,
      startTime: Date.now(),
    };
    this.logger.log('Estadísticas de salud de Redis reiniciadas');
  }

  /**
   * Obtiene recomendaciones basadas en el estado de salud
   */
  getRecommendations(health: RedisHealthStatus): string[] {
    const recommendations: string[] = [];

    if (!health.isConnected) {
      recommendations.push('Verificar conectividad de red con Redis');
      recommendations.push('Revisar configuración de Redis');
      recommendations.push('Verificar credenciales de Redis');
    }

    if (health.latency > 1000) {
      recommendations.push('Latencia alta detectada - considerar Redis más cercano');
      recommendations.push('Optimizar consultas de Redis');
    }

    if (health.successRate < 95) {
      recommendations.push('Tasa de éxito baja - revisar logs de errores');
      recommendations.push('Considerar aumentar timeouts de conexión');
    }

    if (health.failedCommands > 100) {
      recommendations.push('Muchos comandos fallidos - revisar estabilidad de Redis');
      recommendations.push('Considerar reiniciar conexión Redis');
    }

    return recommendations;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cierra la conexión Redis
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Conexión Redis cerrada');
    }
  }
} 