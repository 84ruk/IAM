import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'info' },
      ],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Configuración mejorada para Supabase
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('Conectando a la base de datos...');
      await this.$connect();
      this.logger.log('Conexión a la base de datos establecida exitosamente');
    } catch (error) {
      this.logger.error('Error al conectar con la base de datos:', error);
      throw new Error('No se pudo conectar con la base de datos. Verifica que el servicio esté ejecutándose.');
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

  // Método para verificar la salud de la conexión
  async checkConnection(): Promise<{ status: 'ok' | 'error'; message: string }> {
    try {
      await this.$queryRaw`SELECT 1`;
      return { status: 'ok', message: 'Conexión a la base de datos establecida' };
    } catch (error) {
      this.logger.error('Error al verificar conexión:', error);
      return { 
        status: 'error', 
        message: 'No se puede conectar con la base de datos. Verifica que el servicio esté ejecutándose.' 
      };
    }
  }

  // Método para reconectar automáticamente
  async reconnect(): Promise<void> {
    try {
      this.logger.log('Intentando reconectar a la base de datos...');
      await this.$disconnect();
      await this.$connect();
      this.logger.log('Reconexión exitosa');
    } catch (error) {
      this.logger.error('Error al reconectar:', error);
      throw error;
    }
  }

  // Método para ejecutar operaciones con reintentos
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Si es un error de conexión, intentar reconectar
        if (error.message?.includes('connection') || 
            error.message?.includes('shutdown') || 
            error.message?.includes('termination')) {
          
          this.logger.warn(`Intento ${attempt}/${maxRetries} falló, intentando reconectar...`);
          
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
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw lastError!;
  }
}
