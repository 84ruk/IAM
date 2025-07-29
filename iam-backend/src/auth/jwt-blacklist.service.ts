import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecureLoggerService } from '../common/services/secure-logger.service';
import * as crypto from 'crypto';

export interface BlacklistedToken {
  jti: string;
  userId: number;
  reason: string;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class JwtBlacklistService {
  private readonly logger = new Logger(JwtBlacklistService.name);

  constructor(
    private prisma: PrismaService,
    private secureLogger: SecureLoggerService,
  ) {}

  /**
   * Agregar un token al blacklist
   */
  async blacklistToken(
    jti: string,
    userId: number,
    reason: string = 'manual_revocation',
  ): Promise<void> {
    try {
      // Calcular tiempo de expiración (mismo que el token JWT)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas por defecto

      await this.prisma.blacklistedToken.create({
        data: {
          jti,
          userId,
          reason,
          expiresAt,
        },
      });

      this.secureLogger.log(
        `Token blacklisted: ${jti.substring(0, 8)}...`,
        userId.toString(),
      );
      this.logger.log(
        `Token blacklisted for user ${userId}, reason: ${reason}`,
      );
    } catch (error) {
      this.logger.error(`Error blacklisting token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar si un token está en el blacklist
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    try {
      const blacklistedToken = await this.prisma.blacklistedToken.findUnique({
        where: { jti },
      });

      if (!blacklistedToken) {
        return false;
      }

      // Verificar si el token ha expirado
      if (blacklistedToken.expiresAt < new Date()) {
        // Eliminar token expirado
        await this.prisma.blacklistedToken.delete({
          where: { jti },
        });
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error checking token blacklist: ${error.message}`);
      return false; // En caso de error, permitir el token por seguridad
    }
  }

  /**
   * Blacklist todos los tokens de un usuario
   */
  async blacklistAllUserTokens(
    userId: number,
    reason: string = 'user_logout',
  ): Promise<number> {
    try {
      // Obtener todos los refresh tokens activos del usuario
      const refreshTokens = await this.prisma.refreshToken.findMany({
        where: {
          userId,
          isRevoked: false,
        },
      });

      // Blacklist cada refresh token
      const blacklistPromises = refreshTokens.map((token) =>
        this.blacklistToken(token.jti, userId, reason),
      );

      await Promise.all(blacklistPromises);

      // Revocar todos los refresh tokens
      await this.prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });

      this.secureLogger.log(
        `All tokens blacklisted for user ${userId}`,
        userId.toString(),
      );
      this.logger.log(
        `Blacklisted ${refreshTokens.length} tokens for user ${userId}`,
      );

      return refreshTokens.length;
    } catch (error) {
      this.logger.error(`Error blacklisting all user tokens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Blacklist tokens por empresa (para casos de seguridad)
   */
  async blacklistTokensByEmpresa(
    empresaId: number,
    reason: string = 'empresa_security',
  ): Promise<number> {
    try {
      // Obtener todos los usuarios de la empresa
      const users = await this.prisma.usuario.findMany({
        where: { empresaId },
        select: { id: true },
      });

      let totalBlacklisted = 0;

      // Blacklist tokens de cada usuario
      for (const user of users) {
        const count = await this.blacklistAllUserTokens(user.id, reason);
        totalBlacklisted += count;
      }

      this.logger.log(
        `Blacklisted ${totalBlacklisted} tokens for empresa ${empresaId}`,
      );
      return totalBlacklisted;
    } catch (error) {
      this.logger.error(
        `Error blacklisting tokens by empresa: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Limpiar tokens expirados del blacklist
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await this.prisma.blacklistedToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `Cleaned up ${result.count} expired blacklisted tokens`,
        );
      }

      return result.count;
    } catch (error) {
      this.logger.error(`Error cleaning up expired tokens: ${error.message}`);
      return 0;
    }
  }

  /**
   * Obtener estadísticas del blacklist
   */
  async getBlacklistStats(): Promise<{
    totalBlacklisted: number;
    activeBlacklisted: number;
    expiredBlacklisted: number;
    byReason: Record<string, number>;
  }> {
    try {
      const [total, active, expired, byReason] = await Promise.all([
        this.prisma.blacklistedToken.count(),
        this.prisma.blacklistedToken.count({
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },
        }),
        this.prisma.blacklistedToken.count({
          where: {
            expiresAt: {
              lt: new Date(),
            },
          },
        }),
        this.prisma.blacklistedToken.groupBy({
          by: ['reason'],
          _count: {
            reason: true,
          },
        }),
      ]);

      const byReasonMap = byReason.reduce(
        (acc, item) => {
          acc[item.reason] = item._count.reason;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        totalBlacklisted: total,
        activeBlacklisted: active,
        expiredBlacklisted: expired,
        byReason: byReasonMap,
      };
    } catch (error) {
      this.logger.error(`Error getting blacklist stats: ${error.message}`);
      return {
        totalBlacklisted: 0,
        activeBlacklisted: 0,
        expiredBlacklisted: 0,
        byReason: {},
      };
    }
  }

  /**
   * Verificar tokens sospechosos (múltiples tokens activos del mismo usuario)
   */
  async detectSuspiciousActivity(userId: number): Promise<{
    suspicious: boolean;
    activeTokens: number;
    recentTokens: number;
  }> {
    try {
      const [activeTokens, recentTokens] = await Promise.all([
        this.prisma.refreshToken.count({
          where: {
            userId,
            isRevoked: false,
            expiresAt: {
              gt: new Date(),
            },
          },
        }),
        this.prisma.refreshToken.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
            },
          },
        }),
      ]);

      // Umbrales más realistas para evitar falsos positivos
      // En desarrollo/testing puede haber más tokens activos
      const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
      const activeThreshold = isDevelopment ? 25 : 15; // Más permisivo en desarrollo
      const recentThreshold = isDevelopment ? 50 : 30; // Más permisivo en desarrollo

      const suspicious = activeTokens > activeThreshold || recentTokens > recentThreshold;

      if (suspicious) {
        this.secureLogger.logSecurityError(
          `Suspicious token activity detected for user ${userId}`,
          userId,
          JSON.stringify({
            activeTokens,
            recentTokens,
            threshold: { active: activeThreshold, recent: recentThreshold },
            environment: process.env.NODE_ENV,
          }),
        );
      }

      return {
        suspicious,
        activeTokens,
        recentTokens,
      };
    } catch (error) {
      this.logger.error(
        `Error detecting suspicious activity: ${error.message}`,
      );
      return {
        suspicious: false,
        activeTokens: 0,
        recentTokens: 0,
      };
    }
  }

  /**
   * Limpiar tokens excedentes automáticamente
   */
  async cleanupExcessTokens(userId: number, maxActiveTokens: number = 10): Promise<number> {
    try {
      // Obtener todos los tokens activos del usuario ordenados por fecha de creación
      const activeTokens = await this.prisma.refreshToken.findMany({
        where: {
          userId,
          isRevoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: 'asc', // Los más antiguos primero
        },
      });

      // Si hay más tokens de los permitidos, revocar los más antiguos
      if (activeTokens.length > maxActiveTokens) {
        const tokensToRevoke = activeTokens.slice(0, activeTokens.length - maxActiveTokens);
        
        const revokedCount = await this.prisma.refreshToken.updateMany({
          where: {
            id: {
              in: tokensToRevoke.map(token => token.id),
            },
          },
          data: {
            isRevoked: true,
          },
        });

        this.logger.log(
          `Cleaned up ${revokedCount.count} excess tokens for user ${userId}`,
        );

        return revokedCount.count;
      }

      return 0;
    } catch (error) {
      this.logger.error(
        `Error cleaning up excess tokens for user ${userId}: ${error.message}`,
      );
      return 0;
    }
  }

  /**
   * Limpiar toda la blacklist (solo para desarrollo/testing)
   */
  async clearBlacklist(): Promise<void> {
    try {
      await this.prisma.blacklistedToken.deleteMany({});
      this.logger.log('Blacklist cleared successfully');
    } catch (error) {
      this.logger.error(`Error clearing blacklist: ${error.message}`);
      throw error;
    }
  }

  /**
   * Programar limpieza automática de tokens expirados
   */
  scheduleCleanup(): void {
    // Ejecutar limpieza cada hora
    setInterval(
      async () => {
        try {
          await this.cleanupExpiredTokens();
        } catch (error) {
          this.logger.error(`Error in scheduled cleanup: ${error.message}`);
        }
      },
      60 * 60 * 1000,
    ); // 1 hora

    this.logger.log('Scheduled blacklist cleanup every hour');
  }
}
