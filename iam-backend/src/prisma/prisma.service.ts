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
}
