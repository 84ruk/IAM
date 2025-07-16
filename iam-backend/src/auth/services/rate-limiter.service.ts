import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SecureLoggerService } from '../../common/services/secure-logger.service';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitEntry {
  key: string;
  attempts: number;
  firstAttempt: Date;
  lastAttempt: Date;
  blockedUntil?: Date;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly memoryStore = new Map<string, RateLimitEntry>();

  // Configuraciones de rate limiting por tipo de acción
  private readonly rateLimitConfigs: Record<string, RateLimitConfig> = {
    login: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutos
      blockDurationMs: 30 * 60 * 1000, // 30 minutos
    },
    passwordReset: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hora
      blockDurationMs: 2 * 60 * 60 * 1000, // 2 horas
    },
    registration: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hora
      blockDurationMs: 2 * 60 * 60 * 1000, // 2 horas
    },
    googleAuth: {
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000, // 15 minutos
      blockDurationMs: 30 * 60 * 1000, // 30 minutos
    },
    refresh: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutos
      blockDurationMs: 30 * 60 * 1000, // 30 minutos
    },
    default: {
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000, // 15 minutos
      blockDurationMs: 30 * 60 * 1000, // 30 minutos
    },
  };

  constructor(
    private prisma: PrismaService,
    private secureLogger: SecureLoggerService,
  ) {
    // Limpiar entradas expiradas cada 5 minutos
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000);
  }

  /**
   * Verificar si una acción está permitida
   */
  async checkRateLimit(
    key: string,
    action: string = 'default',
    ip?: string,
  ): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    resetTime?: Date;
    blockedUntil?: Date;
  }> {
    const config =
      this.rateLimitConfigs[action] || this.rateLimitConfigs.default;
    const rateLimitKey = this.generateKey(key, action, ip);
    const now = new Date();

    // Obtener entrada existente
    let entry = this.memoryStore.get(rateLimitKey);

    // Si no existe, crear nueva entrada
    if (!entry) {
      entry = {
        key: rateLimitKey,
        attempts: 0,
        firstAttempt: now,
        lastAttempt: now,
      };
      this.memoryStore.set(rateLimitKey, entry);
    }

    // Verificar si está bloqueado
    if (entry.blockedUntil && entry.blockedUntil > now) {
      this.logRateLimitViolation(key, action, 'blocked', ip);
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: entry.blockedUntil,
      };
    }

    // Verificar si la ventana de tiempo ha expirado
    const windowStart = new Date(now.getTime() - config.windowMs);
    if (entry.firstAttempt < windowStart) {
      // Resetear contador si la ventana ha expirado
      entry.attempts = 0;
      entry.firstAttempt = now;
      entry.blockedUntil = undefined;
    }

    // Verificar si se ha excedido el límite
    if (entry.attempts >= config.maxAttempts) {
      // Bloquear por el tiempo especificado
      entry.blockedUntil = new Date(now.getTime() + config.blockDurationMs);
      this.logRateLimitViolation(key, action, 'limit_exceeded', ip);

      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: entry.blockedUntil,
      };
    }

    // Incrementar contador
    entry.attempts++;
    entry.lastAttempt = now;

    const remainingAttempts = config.maxAttempts - entry.attempts;
    const resetTime = new Date(entry.firstAttempt.getTime() + config.windowMs);

    return {
      allowed: true,
      remainingAttempts,
      resetTime,
    };
  }

  /**
   * Registrar un intento exitoso (resetear contador)
   */
  async recordSuccess(
    key: string,
    action: string = 'default',
    ip?: string,
  ): Promise<void> {
    const rateLimitKey = this.generateKey(key, action, ip);
    this.memoryStore.delete(rateLimitKey);
  }

  /**
   * Obtener estadísticas de rate limiting
   */
  getRateLimitStats(): {
    totalEntries: number;
    blockedEntries: number;
    activeEntries: number;
  } {
    const now = new Date();
    let blockedEntries = 0;
    let activeEntries = 0;

    for (const entry of this.memoryStore.values()) {
      if (entry.blockedUntil && entry.blockedUntil > now) {
        blockedEntries++;
      } else {
        activeEntries++;
      }
    }

    return {
      totalEntries: this.memoryStore.size,
      blockedEntries,
      activeEntries,
    };
  }

  /**
   * Limpiar entradas expiradas
   */
  private cleanupExpiredEntries(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.memoryStore.entries()) {
      const isExpired =
        (entry.blockedUntil && entry.blockedUntil < now) ||
        entry.lastAttempt.getTime() + this.rateLimitConfigs.default.windowMs <
          now.getTime();

      if (isExpired) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.memoryStore.delete(key));

    if (expiredKeys.length > 0) {
      this.logger.debug(
        `Limpiadas ${expiredKeys.length} entradas expiradas de rate limiting`,
      );
    }
  }

  /**
   * Generar clave única para rate limiting
   */
  private generateKey(key: string, action: string, ip?: string): string {
    const components = [action, key];
    if (ip) {
      components.push(ip);
    }
    return components.join(':');
  }

  /**
   * Log de violaciones de rate limiting
   */
  private logRateLimitViolation(
    key: string,
    action: string,
    reason: string,
    ip?: string,
  ): void {
    this.secureLogger.logSuspiciousActivity(
      `Rate limit violation: ${action} - ${reason}`,
      undefined,
      ip,
    );

    this.logger.warn(
      `Rate limit violation - Action: ${action}, Key: ${key}, IP: ${ip}, Reason: ${reason}`,
    );
  }

  /**
   * Obtener información de rate limiting para un usuario/IP
   */
  getRateLimitInfo(
    key: string,
    action: string = 'default',
    ip?: string,
  ): {
    attempts: number;
    maxAttempts: number;
    remainingAttempts: number;
    resetTime?: Date;
    blockedUntil?: Date;
    isBlocked: boolean;
  } {
    const config =
      this.rateLimitConfigs[action] || this.rateLimitConfigs.default;
    const rateLimitKey = this.generateKey(key, action, ip);
    const entry = this.memoryStore.get(rateLimitKey);
    const now = new Date();

    if (!entry) {
      return {
        attempts: 0,
        maxAttempts: config.maxAttempts,
        remainingAttempts: config.maxAttempts,
        isBlocked: false,
      };
    }

    const isBlocked = !!(entry.blockedUntil && entry.blockedUntil > now);
    const remainingAttempts = Math.max(0, config.maxAttempts - entry.attempts);
    const resetTime = new Date(entry.firstAttempt.getTime() + config.windowMs);

    return {
      attempts: entry.attempts,
      maxAttempts: config.maxAttempts,
      remainingAttempts,
      resetTime,
      blockedUntil: entry.blockedUntil,
      isBlocked,
    };
  }
}
