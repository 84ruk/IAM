import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppLoggerService {
  private readonly logger = new Logger(AppLoggerService.name);
  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly logLevel = process.env.LOG_LEVEL || 'info';

  /**
   * Log de información general
   */
  log(message: string, context?: string) {
    if (this.shouldLog('info')) {
      this.logger.log(message, context);
    }
  }

  /**
   * Log de errores (siempre se muestran)
   */
  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, trace, context);
  }

  /**
   * Log de advertencias
   */
  warn(message: string, context?: string) {
    if (this.shouldLog('warn')) {
      this.logger.warn(message, context);
    }
  }

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message: string, context?: string) {
    if (this.isDevelopment && this.shouldLog('debug')) {
      this.logger.debug(message, context);
    }
  }

  /**
   * Log de información sensible (solo en desarrollo)
   */
  debugSensitive(message: string, data?: any, context?: string) {
    if (this.isDevelopment && this.shouldLog('debug')) {
      this.logger.debug(
        `${message} ${data ? JSON.stringify(data, null, 2) : ''}`,
        context,
      );
    }
  }

  /**
   * Log de auditoría (siempre se registra)
   */
  audit(event: string, userId?: number, email?: string, additionalData?: any) {
    const auditMessage = `AUDIT: ${event} - User: ${email || userId || 'unknown'}`;
    this.logger.log(auditMessage, 'AUDIT');

    // En producción, también escribir a archivo de auditoría
    if (this.isProduction) {
      // Aquí se podría implementar escritura a archivo o base de datos
      this.logger.log(
        `AUDIT_FILE: ${JSON.stringify({
          timestamp: new Date().toISOString(),
          event,
          userId,
          email,
          ...additionalData,
        })}`,
        'AUDIT_FILE',
      );
    }
  }

  /**
   * Log de performance
   */
  performance(operation: string, duration: number, context?: string) {
    if (this.shouldLog('info') || duration > 1000) {
      // Log si es lento (>1s)
      this.logger.log(`PERF: ${operation} took ${duration}ms`, context);
    }
  }

  /**
   * Determina si debe loggear basado en el nivel configurado
   */
  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);

    return requestedLevelIndex <= currentLevelIndex;
  }

  /**
   * Log de información de seguridad (sin datos sensibles)
   */
  security(
    event: string,
    userId?: number,
    email?: string,
    additionalData?: any,
  ) {
    const securityData = {
      event,
      userId,
      email: email
        ? `${email.substring(0, 3)}***@${email.split('@')[1]}`
        : undefined,
      timestamp: new Date().toISOString(),
      ...additionalData,
    };

    this.logger.log(`SECURITY: ${JSON.stringify(securityData)}`, 'SECURITY');
  }
}
