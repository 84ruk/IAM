import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SecureLoggerService } from '../../common/services/secure-logger.service';
import { securityConfig } from '../../config/security.config';
import { Rol } from '@prisma/client';

export interface SessionInfo {
  id: string;
  userId: number;
  email: string;
  rol: Rol;
  empresaId?: number;
  createdAt: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

export interface SessionLimits {
  maxSessions: number;
  sessionTimeout: number;
  cleanupInterval: number;
}

@Injectable()
export class SessionManagementService {
  private readonly logger = new Logger(SessionManagementService.name);

  constructor(
    private prisma: PrismaService,
    private secureLogger: SecureLoggerService,
  ) {
    // Iniciar limpieza automática al arrancar
    this.startAutomaticCleanup();
  }

  /**
   * Obtener límites de sesión por rol
   */
  private getSessionLimits(rol: Rol): SessionLimits {
    const baseLimits = {
      maxSessions: 1, // Una sola sesión por cuenta
      sessionTimeout: securityConfig.advanced.sessionTimeout,
      cleanupInterval: 5 * 60 * 1000, // 5 minutos
    };

    // Todos los roles tienen 1 sesión concurrente por cuenta
    // Los timeouts pueden variar por rol
    switch (rol) {
      case Rol.SUPERADMIN:
        return {
          ...baseLimits,
          sessionTimeout: 2 * 60 * 60 * 1000, // 2 horas
        };
      case Rol.ADMIN:
        return {
          ...baseLimits,
          sessionTimeout: 90 * 60 * 1000, // 1.5 horas
        };
      case Rol.EMPLEADO:
        return {
          ...baseLimits,
          sessionTimeout: 60 * 60 * 1000, // 1 hora
        };
      case Rol.PROVEEDOR:
        return {
          ...baseLimits,
          sessionTimeout: 30 * 60 * 1000, // 30 minutos
        };
      default:
        return baseLimits;
    }
  }

  /**
   * Verificar límites de sesiones concurrentes
   */
  async checkSessionLimits(userId: number, rol: Rol): Promise<{
    allowed: boolean;
    currentSessions: number;
    maxSessions: number;
    needsRevocation: boolean;
  }> {
    const limits = this.getSessionLimits(rol);
    
    // Contar sesiones activas del usuario
    const activeSessions = await this.prisma.refreshToken.count({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    const allowed = activeSessions < limits.maxSessions;
    const needsRevocation = activeSessions >= limits.maxSessions;

    if (needsRevocation) {
      this.secureLogger.logSecurityError(
        `Session limit exceeded for user ${userId}. Active: ${activeSessions}, Max: ${limits.maxSessions}`,
        userId,
      );
    }

    return {
      allowed,
      currentSessions: activeSessions,
      maxSessions: limits.maxSessions,
      needsRevocation,
    };
  }

  /**
   * Revocar sesiones excedentes (las más antiguas)
   */
  async revokeExcessSessions(userId: number, rol: Rol): Promise<number> {
    const limits = this.getSessionLimits(rol);
    
    // Obtener todas las sesiones activas ordenadas por fecha de creación
    const activeSessions = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'asc', // Las más antiguas primero
      },
    });

    if (activeSessions.length <= limits.maxSessions) {
      return 0; // No hay exceso
    }

    // Calcular cuántas sesiones revocar
    const sessionsToRevoke = activeSessions.length - limits.maxSessions;
    const sessionsToRevokeIds = activeSessions
      .slice(0, sessionsToRevoke)
      .map(session => session.id);

    // Revocar las sesiones más antiguas
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        id: {
          in: sessionsToRevokeIds,
        },
      },
      data: {
        isRevoked: true,
      },
    });

    this.secureLogger.log(
      `Revoked ${result.count} excess sessions for user ${userId}`,
      userId.toString(),
    );

    return result.count;
  }

  /**
   * Obtener información de sesiones activas de un usuario
   */
  async getUserSessions(userId: number): Promise<SessionInfo[]> {
    const sessions = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            email: true,
            rol: true,
            empresaId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions.map(session => ({
      id: session.jti,
      userId: session.userId,
      email: session.user.email,
      rol: session.user.rol,
      empresaId: session.user.empresaId || undefined,
      createdAt: session.createdAt,
      lastActivity: session.createdAt, // Por ahora usamos createdAt
      isActive: true,
    }));
  }

  /**
   * Revocar una sesión específica
   */
  async revokeSession(jti: string, userId: number, reason: string = 'manual_revocation'): Promise<boolean> {
    try {
      const result = await this.prisma.refreshToken.updateMany({
        where: {
          jti,
          userId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
        },
      });

      if (result.count > 0) {
        this.secureLogger.log(
          `Session revoked: ${jti.substring(0, 8)}... for user ${userId}, reason: ${reason}`,
          userId.toString(),
        );
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error revoking session: ${error.message}`);
      return false;
    }
  }

  /**
   * Revocar todas las sesiones de un usuario excepto la actual
   */
  async revokeAllOtherSessions(userId: number, currentJti: string): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          jti: {
            not: currentJti,
          },
          isRevoked: false,
        },
        data: {
          isRevoked: true,
        },
      });

      if (result.count > 0) {
        this.secureLogger.log(
          `Revoked ${result.count} other sessions for user ${userId}`,
          userId.toString(),
        );
      }

      return result.count;
    } catch (error) {
      this.logger.error(`Error revoking other sessions: ${error.message}`);
      return 0;
    }
  }

  /**
   * Limpiar sesiones expiradas automáticamente
   */
  async cleanupExpiredSessions(): Promise<{
    refreshTokens: number;
    blacklistedTokens: number;
    total: number;
  }> {
    try {
      const now = new Date();

      // Limpiar refresh tokens expirados
      const refreshTokensResult = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      // Limpiar blacklisted tokens expirados
      const blacklistedTokensResult = await this.prisma.blacklistedToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      const total = refreshTokensResult.count + blacklistedTokensResult.count;

      if (total > 0) {
        this.logger.log(
          `Cleanup completed: ${refreshTokensResult.count} refresh tokens, ${blacklistedTokensResult.count} blacklisted tokens (${total} total)`,
        );
      }

      return {
        refreshTokens: refreshTokensResult.count,
        blacklistedTokens: blacklistedTokensResult.count,
        total,
      };
    } catch (error) {
      this.logger.error(`Error in cleanup: ${error.message}`);
      return {
        refreshTokens: 0,
        blacklistedTokens: 0,
        total: 0,
      };
    }
  }

  /**
   * Iniciar limpieza automática
   */
  private startAutomaticCleanup(): void {
    // Limpiar cada 5 minutos
    setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        this.logger.error(`Error in automatic cleanup: ${error.message}`);
      }
    }, 5 * 60 * 1000); // 5 minutos

    this.logger.log('Automatic session cleanup started (every 5 minutes)');
  }

  /**
   * Obtener estadísticas de sesiones
   */
  async getSessionStats(): Promise<{
    totalActiveSessions: number;
    totalExpiredSessions: number;
    sessionsByRole: Record<string, number>;
    cleanupStats: {
      lastCleanup: Date;
      sessionsCleaned: number;
    };
  }> {
    const now = new Date();

    // Contar sesiones activas
    const activeSessions = await this.prisma.refreshToken.count({
      where: {
        isRevoked: false,
        expiresAt: {
          gt: now,
        },
      },
    });

    // Contar sesiones expiradas
    const expiredSessions = await this.prisma.refreshToken.count({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    // Sesiones por rol - usar una consulta más simple
    const sessionsWithUsers = await this.prisma.refreshToken.findMany({
      where: {
        isRevoked: false,
        expiresAt: {
          gt: now,
        },
      },
      include: {
        user: {
          select: {
            rol: true,
          },
        },
      },
    });

    const roleStats: Record<string, number> = {};
    sessionsWithUsers.forEach(session => {
      const role = session.user?.rol || 'UNKNOWN';
      roleStats[role] = (roleStats[role] || 0) + 1;
    });

    return {
      totalActiveSessions: activeSessions,
      totalExpiredSessions: expiredSessions,
      sessionsByRole: roleStats,
      cleanupStats: {
        lastCleanup: new Date(), // Por ahora, podríamos almacenar esto en una tabla
        sessionsCleaned: 0,
      },
    };
  }
} 