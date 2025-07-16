import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DatabaseErrorHandlerService {
  private readonly logger = new Logger(DatabaseErrorHandlerService.name);
  private connectionRetries = 0;
  private readonly maxRetries = 3;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Maneja errores de conexión a la base de datos
   */
  async handleDatabaseError<T>(
    operation: () => Promise<T>,
    fallback?: T,
    context?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logger.error(`Error en operación de base de datos${context ? ` (${context})` : ''}:`, error);

      // Si es un error de conexión, intentar reconectar
      if (this.isConnectionError(error)) {
        return this.handleConnectionError(operation, fallback, context);
      }

      // Para otros errores, devolver fallback si existe
      if (fallback !== undefined) {
        this.logger.warn(`Usando valor fallback para ${context || 'operación'}`);
        return fallback;
      }

      throw error;
    }
  }

  /**
   * Verifica si el error es de conexión
   */
  private isConnectionError(error: any): boolean {
    const connectionErrors = [
      'Can\'t reach database server',
      'Server has closed the connection',
      'DbHandler exited',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];

    return connectionErrors.some(msg => 
      error.message?.includes(msg) || 
      error.cause?.message?.includes(msg)
    );
  }

  /**
   * Maneja errores de conexión con reintentos
   */
  private async handleConnectionError<T>(
    operation: () => Promise<T>,
    fallback?: T,
    context?: string
  ): Promise<T> {
    if (this.connectionRetries >= this.maxRetries) {
      this.logger.error(`Máximo de reintentos alcanzado para ${context || 'operación'}`);
      this.connectionRetries = 0;
      
      if (fallback !== undefined) {
        return fallback;
      }
      
      throw new Error(`No se pudo conectar a la base de datos después de ${this.maxRetries} intentos`);
    }

    this.connectionRetries++;
    this.logger.warn(`Reintentando conexión (${this.connectionRetries}/${this.maxRetries}) para ${context || 'operación'}`);

    // Esperar antes de reintentar (backoff exponencial)
    const delay = Math.min(1000 * Math.pow(2, this.connectionRetries - 1), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      // Intentar reconectar
      await this.prisma.$connect();
      this.connectionRetries = 0;
      
      // Reintentar la operación
      return await operation();
    } catch (retryError) {
      return this.handleConnectionError(operation, fallback, context);
    }
  }

  /**
   * Verifica el estado de la conexión
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Error verificando conexión a base de datos:', error);
      return false;
    }
  }

  /**
   * Limpia el contador de reintentos
   */
  resetRetries(): void {
    this.connectionRetries = 0;
  }

  /**
   * Obtiene estadísticas de errores
   */
  getErrorStats() {
    return {
      connectionRetries: this.connectionRetries,
      maxRetries: this.maxRetries,
      isConnected: this.checkConnection()
    };
  }
} 