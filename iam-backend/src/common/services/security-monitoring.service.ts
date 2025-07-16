import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SecureLoggerService } from './secure-logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface SecurityEvent {
  type:
    | 'login_attempt'
    | 'failed_login'
    | 'suspicious_activity'
    | 'rate_limit_exceeded'
    | 'token_blacklisted'
    | '2fa_failed'
    | 'admin_action';
  userId?: number;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface SecurityAlert {
  id: string;
  event: SecurityEvent;
  action: 'log' | 'block_ip' | 'notify_admin' | 'lock_account';
  executed: boolean;
  executedAt?: Date;
}

@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private readonly alerts: Map<string, SecurityAlert> = new Map();
  private readonly suspiciousIPs: Set<string> = new Set();
  private readonly blockedIPs: Set<string> = new Set();

  constructor(
    private prisma: PrismaService,
    private secureLogger: SecureLoggerService,
    private eventEmitter: EventEmitter2,
  ) {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Limpiar alertas antiguas cada hora
    setInterval(
      () => {
        this.cleanupOldAlerts();
      },
      60 * 60 * 1000,
    );

    // Limpiar IPs bloqueadas temporales cada 24 horas
    setInterval(
      () => {
        this.cleanupBlockedIPs();
      },
      24 * 60 * 60 * 1000,
    );

    this.logger.log('Security monitoring service initialized');
  }

  /**
   * Registrar evento de seguridad
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Guardar en base de datos
      await this.prisma.securityEvent.create({
        data: {
          type: event.type,
          userId: event.userId,
          userEmail: event.userEmail,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          details: JSON.stringify(event.details),
          severity: event.severity,
          timestamp: event.timestamp,
        },
      });

      // Analizar evento para determinar acciones
      const alert = await this.analyzeEvent(event);

      if (alert) {
        await this.executeAlert(alert);
      }

      // Emitir evento para otros servicios
      this.eventEmitter.emit('security.event', event);

      this.logger.log(
        `Security event logged: ${event.type} - ${event.severity}`,
        {
          userId: event.userId,
          ipAddress: event.ipAddress,
          severity: event.severity,
        },
      );
    } catch (error) {
      this.logger.error(`Error logging security event: ${error.message}`);
    }
  }

  /**
   * Analizar evento y determinar acciones
   */
  private async analyzeEvent(
    event: SecurityEvent,
  ): Promise<SecurityAlert | null> {
    const alertId = `${event.type}_${event.ipAddress}_${Date.now()}`;

    let action: SecurityAlert['action'] = 'log';
    let shouldAlert = false;

    // Reglas de análisis
    switch (event.type) {
      case 'failed_login':
        const failedLogins = await this.getFailedLoginsCount(
          event.ipAddress,
          15,
        ); // 15 minutos
        if (failedLogins >= 5) {
          action = 'block_ip';
          shouldAlert = true;
        } else if (failedLogins >= 3) {
          action = 'notify_admin';
          shouldAlert = true;
        }
        break;

      case 'suspicious_activity':
        if (event.severity === 'high' || event.severity === 'critical') {
          action = 'block_ip';
          shouldAlert = true;
        } else {
          action = 'notify_admin';
          shouldAlert = true;
        }
        break;

      case 'rate_limit_exceeded':
        action = 'block_ip';
        shouldAlert = true;
        break;

      case '2fa_failed':
        const twoFactorFailures = await this.getTwoFactorFailuresCount(
          event.userId || 0,
          60,
        ); // 1 hora
        if (twoFactorFailures >= 3) {
          action = 'lock_account';
          shouldAlert = true;
        }
        break;

      case 'admin_action':
        if (event.severity === 'high' || event.severity === 'critical') {
          action = 'notify_admin';
          shouldAlert = true;
        }
        break;
    }

    if (!shouldAlert) {
      return null;
    }

    const alert: SecurityAlert = {
      id: alertId,
      event,
      action,
      executed: false,
    };

    this.alerts.set(alertId, alert);
    return alert;
  }

  /**
   * Ejecutar alerta de seguridad
   */
  private async executeAlert(alert: SecurityAlert): Promise<void> {
    try {
      switch (alert.action) {
        case 'block_ip':
          await this.blockIP(
            alert.event.ipAddress,
            'Security alert: ' + alert.event.type,
          );
          break;

        case 'notify_admin':
          await this.notifyAdmins(alert.event);
          break;

        case 'lock_account':
          if (alert.event.userId) {
            await this.lockUserAccount(
              alert.event.userId,
              'Multiple 2FA failures',
            );
          }
          break;
      }

      alert.executed = true;
      alert.executedAt = new Date();

      this.logger.log(`Security alert executed: ${alert.action}`, {
        alertId: alert.id,
        eventType: alert.event.type,
        ipAddress: alert.event.ipAddress,
      });
    } catch (error) {
      this.logger.error(`Error executing security alert: ${error.message}`);
    }
  }

  /**
   * Bloquear IP
   */
  private async blockIP(ipAddress: string, reason: string): Promise<void> {
    this.blockedIPs.add(ipAddress);

    await this.prisma.blockedIP.create({
      data: {
        ipAddress,
        reason,
        blockedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      },
    });

    this.secureLogger.logSecurityError(`IP blocked: ${ipAddress} - ${reason}`);
  }

  /**
   * Notificar administradores
   */
  private async notifyAdmins(event: SecurityEvent): Promise<void> {
    // En producción, enviar notificación por email/Slack/etc.
    this.logger.warn('🔔 ADMIN ALERT: Security event requires attention', {
      eventType: event.type,
      severity: event.severity,
      ipAddress: event.ipAddress,
      userId: event.userId,
      userEmail: event.userEmail,
      details: event.details,
    });
  }

  /**
   * Bloquear cuenta de usuario
   */
  private async lockUserAccount(userId: number, reason: string): Promise<void> {
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { activo: false },
    });

    this.secureLogger.logSecurityError(
      `User account locked: ${userId} - ${reason}`,
      userId,
    );
  }

  /**
   * Verificar si una IP está bloqueada
   */
  async isIPBlocked(ipAddress: string): Promise<boolean> {
    // Verificar en memoria
    if (this.blockedIPs.has(ipAddress)) {
      return true;
    }

    // Verificar en base de datos
    const blockedIP = await this.prisma.blockedIP.findFirst({
      where: {
        ipAddress,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (blockedIP) {
      this.blockedIPs.add(ipAddress);
      return true;
    }

    return false;
  }

  /**
   * Obtener conteo de logins fallidos
   */
  private async getFailedLoginsCount(
    ipAddress: string,
    minutes: number,
  ): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    return await this.prisma.securityEvent.count({
      where: {
        type: 'failed_login',
        ipAddress,
        timestamp: {
          gte: since,
        },
      },
    });
  }

  /**
   * Obtener conteo de fallos de 2FA
   */
  private async getTwoFactorFailuresCount(
    userId: number,
    minutes: number,
  ): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    return await this.prisma.securityEvent.count({
      where: {
        type: '2fa_failed',
        userId,
        timestamp: {
          gte: since,
        },
      },
    });
  }

  /**
   * Obtener estadísticas de seguridad
   */
  async getSecurityStats(hours: number = 24): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    blockedIPs: number;
    lockedAccounts: number;
    topSuspiciousIPs: Array<{ ip: string; count: number }>;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [
      totalEvents,
      eventsByType,
      eventsBySeverity,
      blockedIPs,
      lockedAccounts,
      topSuspiciousIPs,
    ] = await Promise.all([
      this.prisma.securityEvent.count({
        where: { timestamp: { gte: since } },
      }),
      this.prisma.securityEvent.groupBy({
        by: ['type'],
        where: { timestamp: { gte: since } },
        _count: { type: true },
      }),
      this.prisma.securityEvent.groupBy({
        by: ['severity'],
        where: { timestamp: { gte: since } },
        _count: { severity: true },
      }),
      this.prisma.blockedIP.count({
        where: { expiresAt: { gt: new Date() } },
      }),
      this.prisma.usuario.count({
        where: { activo: false },
      }),
      this.prisma.securityEvent.groupBy({
        by: ['ipAddress'],
        where: {
          timestamp: { gte: since },
          severity: { in: ['high', 'critical'] },
        },
        _count: { ipAddress: true },
        orderBy: { _count: { ipAddress: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalEvents,
      eventsByType: eventsByType.reduce(
        (acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        },
        {} as Record<string, number>,
      ),
      eventsBySeverity: eventsBySeverity.reduce(
        (acc, item) => {
          acc[item.severity] = item._count.severity;
          return acc;
        },
        {} as Record<string, number>,
      ),
      blockedIPs,
      lockedAccounts,
      topSuspiciousIPs: topSuspiciousIPs.map((item) => ({
        ip: item.ipAddress,
        count: item._count.ipAddress,
      })),
    };
  }

  /**
   * Limpiar alertas antiguas
   */
  private cleanupOldAlerts(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const [id, alert] of this.alerts.entries()) {
      if (alert.event.timestamp.getTime() < oneHourAgo) {
        this.alerts.delete(id);
      }
    }
  }

  /**
   * Limpiar IPs bloqueadas temporales
   */
  private async cleanupBlockedIPs(): Promise<void> {
    await this.prisma.blockedIP.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Limpiar cache en memoria
    this.blockedIPs.clear();
  }
}
