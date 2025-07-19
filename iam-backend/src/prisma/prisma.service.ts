import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private connectionPoolStats = {
    activeConnections: 0,
    idleConnections: 0,
    totalConnections: 0,
    lastCheck: new Date(),
  };

  constructor() {
    super({
      log: process.env.NODE_ENV === 'production' 
        ? [
            { emit: 'stdout' as const, level: 'error' as const },
            { emit: 'stdout' as const, level: 'warn' as const },
          ]
        : [
            { emit: 'stdout' as const, level: 'error' as const },
            { emit: 'stdout' as const, level: 'warn' as const },
            // Removido 'info' y 'query' para reducir logs verbosos
            // Solo mostrar queries si DEBUG_PRISMA=true
            ...(process.env.DEBUG_PRISMA === 'true' ? [
              { emit: 'stdout' as const, level: 'info' as const },
              { emit: 'stdout' as const, level: 'query' as const },
            ] : []),
          ],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // ✅ CONFIGURACIÓN AVANZADA DE CONNECTION POOLING
      // Configuración optimizada para producción y escalabilidad
      errorFormat: 'pretty',
      // Configuración del pool de conexiones
      // Estas configuraciones se aplican cuando se usa PgBouncer o similar
      // Para Supabase, estas configuraciones se manejan automáticamente
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('Conectando a la base de datos...');
      await this.$connect();
      this.logger.log('Conexión a la base de datos establecida exitosamente');
      
      // ✅ INICIAR MONITOREO DE CONEXIONES
      this.startConnectionMonitoring();
      
    } catch (error) {
      this.logger.error('Error al conectar con la base de datos:', error);
      throw new Error(
        'No se pudo conectar con la base de datos. Verifica que el servicio esté ejecutándose.',
      );
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('Desconectando de la base de datos...');
      await this.$disconnect();
      this.logger.log('Desconexión de la base de datos completada');
    } catch (error) {
      this.logger.error('Error al desconectar de la base de datos:', error);
    }
  }



  // ✅ MONITOREO AUTOMÁTICO DE CONEXIONES
  private startConnectionMonitoring() {
    // Monitorear el pool de conexiones cada 30 segundos
    setInterval(async () => {
      try {
        await this.updateConnectionStats();
        
        // Log de estadísticas solo si hay muchas conexiones activas o DEBUG_POOL=true
        if ((process.env.DEBUG_POOL === 'true' || this.connectionPoolStats.activeConnections > 10) && 
            this.connectionPoolStats.activeConnections > 0) {
          this.logger.debug('Estadísticas del pool de conexiones:', {
            activas: this.connectionPoolStats.activeConnections,
            totales: this.connectionPoolStats.totalConnections,
            timestamp: this.connectionPoolStats.lastCheck,
          });
        }

        // Alertas si hay muchas conexiones activas
        if (this.connectionPoolStats.activeConnections > 15) {
          this.logger.warn(`Muchas conexiones activas: ${this.connectionPoolStats.activeConnections}`);
        }

      } catch (error) {
        this.logger.error('Error al actualizar estadísticas de conexiones:', error);
      }
    }, process.env.NODE_ENV === 'production' ? 60000 : 30000); // 1 minuto en producción, 30 segundos en desarrollo
  }

  // ✅ ACTUALIZAR ESTADÍSTICAS DE CONEXIONES
  private async updateConnectionStats() {
    try {
      // Obtener estadísticas del pool de conexiones
      const stats = await this.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;

      if (stats && Array.isArray(stats) && stats.length > 0) {
        const stat = stats[0] as any;
        this.connectionPoolStats = {
          totalConnections: parseInt(stat.total_connections) || 0,
          activeConnections: parseInt(stat.active_connections) || 0,
          idleConnections: parseInt(stat.idle_connections) || 0,
          lastCheck: new Date(),
        };
      }
    } catch (error) {
      // En algunos entornos (como Supabase), esta query puede no estar disponible
      this.logger.debug('No se pudieron obtener estadísticas detalladas del pool');
    }
  }

  // ✅ OBTENER ESTADÍSTICAS DEL POOL DE CONEXIONES
  async getConnectionPoolStats() {
    await this.updateConnectionStats();
    return {
      ...this.connectionPoolStats,
      timestamp: new Date(),
    };
  }

  // Método para verificar la salud de la conexión
  async checkConnection(): Promise<{
    status: 'ok' | 'error';
    message: string;
    poolStats?: any;
  }> {
    try {
      await this.$queryRaw`SELECT 1`;
      
      // Obtener estadísticas del pool
      const poolStats = await this.getConnectionPoolStats();
      
      return {
        status: 'ok',
        message: 'Conexión a la base de datos establecida',
        poolStats,
      };
    } catch (error) {
      this.logger.error('Error al verificar conexión:', error);
      return {
        status: 'error',
        message:
          'No se puede conectar con la base de datos. Verifica que el servicio esté ejecutándose.',
      };
    }
  }

  // ✅ MÉTODO MEJORADO PARA RECONEXIÓN CON BACKOFF EXPONENCIAL
  async reconnect(): Promise<void> {
    const maxAttempts = 5;
    let attempt = 1;

    while (attempt <= maxAttempts) {
      try {
        this.logger.log(`Intentando reconectar a la base de datos (intento ${attempt}/${maxAttempts})...`);
        await this.$disconnect();
        await this.$connect();
        this.logger.log('Reconexión exitosa');
        return;
      } catch (error) {
        this.logger.error(`Error al reconectar (intento ${attempt}):`, error);
        
        if (attempt === maxAttempts) {
          throw error;
        }

        // Backoff exponencial: 1s, 2s, 4s, 8s, 16s
        const delay = Math.pow(2, attempt - 1) * 1000;
        this.logger.log(`Esperando ${delay}ms antes del siguiente intento...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
      }
    }
  }

  // ✅ MÉTODO MEJORADO PARA EJECUTAR OPERACIONES CON REINTENTOS Y CIRCUIT BREAKER
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    circuitBreakerThreshold: number = 5,
  ): Promise<T> {
    let lastError: Error;
    let consecutiveFailures = 0;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Resetear contador de fallos en caso de éxito
        consecutiveFailures = 0;
        return result;
        
      } catch (error: any) {
        lastError = error;
        consecutiveFailures++;

        // Circuit breaker: si hay muchos fallos consecutivos, fallar rápido
        if (consecutiveFailures >= circuitBreakerThreshold) {
          this.logger.error(`Circuit breaker activado después de ${consecutiveFailures} fallos consecutivos`);
          throw new Error('Circuit breaker activado - demasiados fallos consecutivos');
        }

        // Si es un error de conexión, intentar reconectar
        if (
          error.message?.includes('connection') ||
          error.message?.includes('shutdown') ||
          error.message?.includes('termination') ||
          error.message?.includes('timeout')
        ) {
          this.logger.warn(
            `Intento ${attempt}/${maxRetries} falló, intentando reconectar...`,
          );

          try {
            await this.reconnect();
            continue; // Intentar la operación nuevamente
          } catch (reconnectError) {
            this.logger.error('Error al reconectar:', reconnectError);
          }
        }

        // Si no es un error de conexión o ya es el último intento, lanzar el error
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Backoff exponencial para reintentos
        const delay = Math.pow(2, attempt - 1) * 1000;
        this.logger.log(`Esperando ${delay}ms antes del siguiente intento...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // ✅ MÉTODO PARA LIMPIAR CONEXIONES INACTIVAS
  async cleanupIdleConnections(): Promise<void> {
    try {
      this.logger.log('Limpiando conexiones inactivas...');
      
      // Forzar la limpieza del pool de conexiones
      await this.$queryRaw`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND pid <> pg_backend_pid()`;
      
      this.logger.log('Limpieza de conexiones completada');
    } catch (error) {
      this.logger.error('Error al limpiar conexiones inactivas:', error);
    }
  }
}
