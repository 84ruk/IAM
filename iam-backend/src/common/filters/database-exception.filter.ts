import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientInitializationError,
} from '@prisma/client/runtime/library';

import {
  InsufficientStockException,
  ProductNotFoundException,
  InvalidMovementException,
  DuplicateProductException,
  InvalidProviderException,
  InsufficientPermissionsException,
} from '../exceptions/business-exceptions';

@Catch()
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let details: any = null;

    this.logger.error(`Error en ${request.method} ${request.url}:`, exception);

    // Excepciones personalizadas del dominio
    if (
      exception instanceof InsufficientStockException ||
      exception instanceof ProductNotFoundException ||
      exception instanceof InvalidMovementException ||
      exception instanceof DuplicateProductException ||
      exception instanceof InvalidProviderException
    ) {
      status =
        exception instanceof ProductNotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;
      message = exception.message;
      details = exception.getResponse?.() || null;
    }

    // Excepciones de permisos
    else if (exception instanceof InsufficientPermissionsException) {
      status = HttpStatus.FORBIDDEN;
      message = exception.message;
      details = exception.getResponse?.() || null;
    }

    // Excepciones estándar de NestJS
    else if (exception instanceof BadRequestException) {
      status = HttpStatus.BAD_REQUEST;
      const badRequestResponse = exception.getResponse() as any;
      message = badRequestResponse.message || exception.message;
      details = {
        code: 'VALIDATION_ERROR',
        suggestion: 'Verifica los datos enviados',
        originalError:
          process.env.NODE_ENV === 'development'
            ? badRequestResponse.message
            : undefined,
        ...(badRequestResponse.details && {
          details: badRequestResponse.details,
        }),
      };
    } else if (exception instanceof ForbiddenException) {
      status = HttpStatus.FORBIDDEN;
      const forbiddenResponse = exception.getResponse() as any;
      message = forbiddenResponse.message || exception.message;
      details = {
        code: 'FORBIDDEN',
        suggestion:
          'Verifica que tengas los permisos necesarios para realizar esta acción',
        originalError:
          process.env.NODE_ENV === 'development'
            ? forbiddenResponse.message
            : undefined,
        ...(forbiddenResponse.details && {
          details: forbiddenResponse.details,
        }),
      };
    }

    // Prisma: errores conocidos
    else if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Ya existe un registro con estos datos';
          details = {
            code: 'DUPLICATE_ENTRY',
            field: exception.meta?.target,
            suggestion: 'Verifica que los datos sean únicos',
          };
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'El registro solicitado no fue encontrado';
          details = {
            code: 'RECORD_NOT_FOUND',
            suggestion:
              'Verifica que el ID o criterios de búsqueda sean correctos',
          };
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Error de referencia: el registro referenciado no existe';
          details = {
            code: 'FOREIGN_KEY_CONSTRAINT',
            suggestion: 'Verifica que los datos relacionados existan',
          };
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Error en la base de datos';
          details = {
            code: exception.code,
            suggestion: 'Verifica los datos enviados',
            ...(process.env.NODE_ENV === 'development' && {
              originalError: exception.message,
            }),
          };
      }
    }

    // Prisma: error de conexión o inicialización
    else if (exception instanceof PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'La base de datos no está disponible';
      details = {
        code: 'DATABASE_CONNECTION_ERROR',
        suggestion:
          'Verifica que el servicio de base de datos esté ejecutándose',
        ...(process.env.NODE_ENV === 'development' && {
          originalError: exception.message,
        }),
      };
    }

    // Prisma: error desconocido
    else if (exception instanceof PrismaClientUnknownRequestError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Error desconocido en la base de datos';
      details = {
        code: 'UNKNOWN_DATABASE_ERROR',
        suggestion: 'Contacta al administrador del sistema',
        ...(process.env.NODE_ENV === 'development' && {
          originalError: exception.message,
        }),
      };
    }

    // Errores generales
    else if (exception instanceof Error) {
      message = exception.message;
      details = {
        code: 'GENERAL_ERROR',
        suggestion: 'Contacta al administrador del sistema',
        ...(process.env.NODE_ENV === 'development' && {
          originalError: exception.message,
        }),
      };

      if (message.includes('connect') || message.includes('ECONNREFUSED')) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'No se puede conectar con la base de datos';
        details.code = 'CONNECTION_ERROR';
        details.suggestion =
          'Verifica que el servicio de base de datos esté ejecutándose';
      }
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      details,
      ...(process.env.NODE_ENV === 'development' &&
        exception instanceof Error && {
          stack: exception.stack,
        }),
    };

    this.logger.error(
      `Error response: ${JSON.stringify(errorResponse, null, 2)}`,
    );
    response.status(status).json(errorResponse);
  }
}
