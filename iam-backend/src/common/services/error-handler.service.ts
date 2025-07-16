import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);

  /**
   * Maneja errores de Prisma de manera centralizada
   */
  handlePrismaError(error: any, operation: string, context?: string) {
    this.logger.error(
      `Error en ${operation}${context ? ` (${context})` : ''}:`,
      error,
    );

    // Errores de conexión
    if (error.code === 'P2024' || error.code === 'P2025') {
      throw new ServiceUnavailableException({
        message: 'La base de datos no está disponible',
        details: {
          code: 'DATABASE_UNAVAILABLE',
          suggestion:
            'Verifica que el servicio de base de datos esté ejecutándose',
          operation,
          context,
        },
      });
    }

    // Errores de registro no encontrado
    if (error.code === 'P2025') {
      throw new NotFoundException({
        message: 'No se encontraron los datos solicitados',
        details: {
          code: 'RECORD_NOT_FOUND',
          suggestion: 'Verifica que los datos existan',
          operation,
          context,
        },
      });
    }

    // Errores de validación
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'campo';
      throw new BadRequestException({
        message: `El ${field} ya existe en el sistema`,
        details: {
          code: 'DUPLICATE_ENTRY',
          suggestion: `Utiliza un ${field} diferente`,
          operation,
          context,
          field,
        },
      });
    }

    // Errores de foreign key
    if (error.code === 'P2003') {
      throw new BadRequestException({
        message: 'Referencia inválida en la base de datos',
        details: {
          code: 'FOREIGN_KEY_VIOLATION',
          suggestion: 'Verifica que las referencias existan',
          operation,
          context,
        },
      });
    }

    // Error genérico de base de datos
    throw new InternalServerErrorException({
      message: 'Error interno del servidor',
      details: {
        code: 'INTERNAL_ERROR',
        suggestion: 'Contacta al administrador del sistema',
        operation,
        context,
      },
    });
  }

  /**
   * Maneja errores de validación
   */
  handleValidationError(error: any, operation: string) {
    this.logger.warn(`Error de validación en ${operation}:`, error);

    throw new BadRequestException({
      message: 'Datos de entrada inválidos',
      details: {
        code: 'VALIDATION_ERROR',
        suggestion: 'Verifica que todos los campos requeridos estén completos',
        operation,
        errors: error.errors || error.message,
      },
    });
  }

  /**
   * Maneja errores de autenticación/autorización
   */
  handleAuthError(error: any, operation: string) {
    this.logger.warn(`Error de autenticación en ${operation}:`, error);

    throw new BadRequestException({
      message: 'Credenciales inválidas o permisos insuficientes',
      details: {
        code: 'AUTH_ERROR',
        suggestion: 'Verifica tus credenciales y permisos',
        operation,
      },
    });
  }

  /**
   * Log de errores no manejados
   */
  logUnhandledError(error: any, context: string) {
    this.logger.error(`Error no manejado en ${context}:`, error);
  }
}
