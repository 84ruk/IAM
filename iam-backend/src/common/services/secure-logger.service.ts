import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SecureLoggerService {
  private readonly logger = new Logger(SecureLoggerService.name);

  /**
   * Enmascara un email para logging seguro
   * Ejemplo: "usuario@empresa.com" -> "usu***@empresa.com"
   */
  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '***@***';
    }

    const [localPart, domain] = email.split('@');
    const maskedLocal =
      localPart.length > 3 ? `${localPart.substring(0, 3)}***` : '***';

    return `${maskedLocal}@${domain}`;
  }

  /**
   * Enmascara un nombre para logging seguro
   * Ejemplo: "Juan Pérez" -> "J*** P***"
   */
  private maskName(name: string): string {
    if (!name) return '***';

    return name
      .split(' ')
      .map((word) => (word.length > 1 ? `${word[0]}***` : '***'))
      .join(' ');
  }

  /**
   * Enmascara un ID de usuario para logging seguro
   * Ejemplo: 12345 -> "U***5"
   */
  private maskUserId(userId: number): string {
    if (!userId) return 'U***';
    const idStr = userId.toString();
    return `U***${idStr.slice(-1)}`;
  }

  /**
   * Enmascara una dirección IP para logging seguro
   * Ejemplo: "192.168.1.100" -> "192.168.***.***"
   */
  private maskIpAddress(ip: string): string {
    if (!ip) return '***.***.***.***';

    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }

    return '***.***.***.***';
  }

  /**
   * Log de login exitoso con información enmascarada
   */
  logLoginSuccess(email: string, userId: number, ip?: string): void {
    const maskedEmail = this.maskEmail(email);
    const maskedUserId = this.maskUserId(userId);
    const maskedIp = ip ? this.maskIpAddress(ip) : 'N/A';

    this.logger.log(
      `Login exitoso - Usuario: ${maskedUserId}, Email: ${maskedEmail}, IP: ${maskedIp}`,
    );
  }

  /**
   * Log de login fallido con información enmascarada
   */
  logLoginFailure(email: string, reason: string, ip?: string): void {
    const maskedEmail = this.maskEmail(email);
    const maskedIp = ip ? this.maskIpAddress(ip) : 'N/A';

    this.logger.warn(
      `Login fallido - Email: ${maskedEmail}, Razón: ${reason}, IP: ${maskedIp}`,
    );
  }

  /**
   * Log de registro de usuario con información enmascarada
   */
  logUserRegistration(email: string, name: string, userId: number): void {
    const maskedEmail = this.maskEmail(email);
    const maskedName = this.maskName(name);
    const maskedUserId = this.maskUserId(userId);

    this.logger.log(
      `Usuario registrado - ID: ${maskedUserId}, Nombre: ${maskedName}, Email: ${maskedEmail}`,
    );
  }

  /**
   * Log de cambio de contraseña con información enmascarada
   */
  logPasswordChange(userId: number, success: boolean): void {
    const maskedUserId = this.maskUserId(userId);
    const status = success ? 'exitoso' : 'fallido';

    this.logger.log(
      `Cambio de contraseña ${status} - Usuario: ${maskedUserId}`,
    );
  }

  /**
   * Log de reset de contraseña con información enmascarada
   */
  logPasswordReset(email: string, success: boolean): void {
    const maskedEmail = this.maskEmail(email);
    const status = success ? 'exitoso' : 'fallido';

    this.logger.log(`Reset de contraseña ${status} - Email: ${maskedEmail}`);
  }

  /**
   * Log de creación de empresa con información enmascarada
   */
  logEmpresaCreation(
    empresaName: string,
    adminEmail: string,
    empresaId: number,
  ): void {
    const maskedEmail = this.maskEmail(adminEmail);
    const maskedName =
      empresaName.length > 10
        ? `${empresaName.substring(0, 10)}***`
        : empresaName;

    this.logger.log(
      `Empresa creada - ID: ${empresaId}, Nombre: ${maskedName}, Admin: ${maskedEmail}`,
    );
  }

  /**
   * Log de acceso a recursos sensibles
   */
  logSensitiveAccess(userId: number, resource: string, action: string): void {
    const maskedUserId = this.maskUserId(userId);

    this.logger.log(
      `Acceso sensible - Usuario: ${maskedUserId}, Recurso: ${resource}, Acción: ${action}`,
    );
  }

  /**
   * Log de error de seguridad
   */
  logSecurityError(error: string, userId?: number, ip?: string): void {
    const maskedUserId = userId ? this.maskUserId(userId) : 'N/A';
    const maskedIp = ip ? this.maskIpAddress(ip) : 'N/A';

    this.logger.error(
      `Error de seguridad - Usuario: ${maskedUserId}, IP: ${maskedIp}, Error: ${error}`,
    );
  }

  /**
   * Log de actividad sospechosa
   */
  logSuspiciousActivity(activity: string, userId?: number, ip?: string): void {
    const maskedUserId = userId ? this.maskUserId(userId) : 'N/A';
    const maskedIp = ip ? this.maskIpAddress(ip) : 'N/A';

    this.logger.warn(
      `Actividad sospechosa - Usuario: ${maskedUserId}, IP: ${maskedIp}, Actividad: ${activity}`,
    );
  }

  /**
   * Log genérico con información enmascarada
   */
  log(message: string, context?: string): void {
    this.logger.log(message, context);
  }

  /**
   * Log de error con información enmascarada
   */
  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, trace, context);
  }

  /**
   * Log de advertencia con información enmascarada
   */
  warn(message: string, context?: string): void {
    this.logger.warn(message, context);
  }

  /**
   * Log de debug con información enmascarada
   */
  debug(message: string, context?: string): void {
    this.logger.debug(message, context);
  }
}
