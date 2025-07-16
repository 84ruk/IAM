import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterService } from '../services/rate-limiter.service';
import { SecureLoggerService } from '../../common/services/secure-logger.service';

export const RATE_LIMIT_KEY = 'rate_limit';
export const RATE_LIMIT_ACTION_KEY = 'rate_limit_action';

export interface RateLimitOptions {
  action: string;
  key?: string;
  maxAttempts?: number;
  windowMs?: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rateLimiter: RateLimiterService,
    private secureLogger: SecureLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Obtener configuración de rate limiting del decorador
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rateLimitOptions) {
      return true; // No hay rate limiting configurado
    }

    const { action, key } = rateLimitOptions;
    const clientIp = this.getClientIp(request);

    // Determinar la clave para rate limiting
    const rateLimitKey = key || this.determineRateLimitKey(request, action);

    // Verificar rate limit
    const rateLimitResult = await this.rateLimiter.checkRateLimit(
      rateLimitKey,
      action,
      clientIp,
    );

    if (!rateLimitResult.allowed) {
      // Log de la violación
      this.secureLogger.logSuspiciousActivity(
        `Rate limit exceeded for ${action}`,
        undefined,
        clientIp,
      );

      // Lanzar excepción con información útil
      const errorMessage = this.getRateLimitErrorMessage(
        rateLimitResult,
        action,
      );

      throw new HttpException(
        {
          message: errorMessage,
          code: 'RATE_LIMIT_EXCEEDED',
          remainingAttempts: rateLimitResult.remainingAttempts,
          resetTime: rateLimitResult.resetTime,
          blockedUntil: rateLimitResult.blockedUntil,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Agregar headers de rate limiting a la respuesta
    const response = context.switchToHttp().getResponse();
    this.addRateLimitHeaders(response, rateLimitResult);

    return true;
  }

  /**
   * Determinar la clave para rate limiting basada en el request
   */
  private determineRateLimitKey(request: any, action: string): string {
    // Para login, usar email
    if (action === 'login' && request.body?.email) {
      return request.body.email;
    }

    // Para password reset, usar email
    if (action === 'passwordReset' && request.body?.email) {
      return request.body.email;
    }

    // Para registro, usar email
    if (action === 'registration' && request.body?.email) {
      return request.body.email;
    }

    // Para Google auth, usar IP
    if (action === 'googleAuth') {
      return this.getClientIp(request);
    }

    // Por defecto, usar IP
    return this.getClientIp(request);
  }

  /**
   * Obtener IP del cliente
   */
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * Generar mensaje de error apropiado
   */
  private getRateLimitErrorMessage(
    rateLimitResult: any,
    action: string,
  ): string {
    if (rateLimitResult.blockedUntil) {
      const blockedMinutes = Math.ceil(
        (rateLimitResult.blockedUntil.getTime() - Date.now()) / (1000 * 60),
      );

      switch (action) {
        case 'login':
          return `Demasiados intentos de inicio de sesión. Intenta nuevamente en ${blockedMinutes} minutos.`;
        case 'passwordReset':
          return `Demasiados intentos de restablecimiento de contraseña. Intenta nuevamente en ${blockedMinutes} minutos.`;
        case 'registration':
          return `Demasiados intentos de registro. Intenta nuevamente en ${blockedMinutes} minutos.`;
        case 'googleAuth':
          return `Demasiados intentos de autenticación con Google. Intenta nuevamente en ${blockedMinutes} minutos.`;
        case 'refresh':
          return `Demasiados intentos de renovación de token. Intenta nuevamente en ${blockedMinutes} minutos.`;
        default:
          return `Demasiados intentos. Intenta nuevamente en ${blockedMinutes} minutos.`;
      }
    }

    return 'Demasiados intentos. Por favor, espera antes de intentar nuevamente.';
  }

  /**
   * Agregar headers de rate limiting a la respuesta
   */
  private addRateLimitHeaders(response: any, rateLimitResult: any): void {
    response.header('X-RateLimit-Limit', rateLimitResult.maxAttempts || 10);
    response.header('X-RateLimit-Remaining', rateLimitResult.remainingAttempts);

    if (rateLimitResult.resetTime) {
      response.header(
        'X-RateLimit-Reset',
        rateLimitResult.resetTime.toISOString(),
      );
    }

    if (rateLimitResult.blockedUntil) {
      response.header(
        'X-RateLimit-Blocked-Until',
        rateLimitResult.blockedUntil.toISOString(),
      );
    }
  }
}

/**
 * Decorador para aplicar rate limiting
 */
export const RateLimit = (options: RateLimitOptions) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value);
    return descriptor;
  };
};
