import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SecureLoggerService } from '../common/services/secure-logger.service';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RefreshTokenService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private secureLogger: SecureLoggerService,
  ) {}

  /**
   * Crear un refresh token seguro
   */
  async createRefreshToken(userId: number): Promise<string> {
    // Generar token criptográficamente seguro
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    // Crear JWT ID único para este refresh token
    const jti = uuidv4();

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
        jti,
        isRevoked: false,
      },
    });

    this.secureLogger.log(`Refresh token creado para usuario ${userId}`);
    return token;
  }

  /**
   * Validar y usar un refresh token
   */
  async validateRefreshToken(
    token: string,
  ): Promise<{ userId: number; jti: string }> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshToken) {
      this.secureLogger.logSecurityError('Refresh token no encontrado');
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (refreshToken.isRevoked) {
      this.secureLogger.logSecurityError(
        'Refresh token revocado',
        refreshToken.userId,
      );
      throw new UnauthorizedException('Refresh token revocado');
    }

    if (refreshToken.expiresAt < new Date()) {
      this.secureLogger.logSecurityError(
        'Refresh token expirado',
        refreshToken.userId,
      );
      throw new UnauthorizedException('Refresh token expirado');
    }

    if (!refreshToken.user || !refreshToken.user.activo) {
      this.secureLogger.logSecurityError(
        'Usuario inactivo o no encontrado',
        refreshToken.userId,
      );
      throw new UnauthorizedException('Usuario inactivo');
    }

    return {
      userId: refreshToken.userId,
      jti: refreshToken.jti,
    };
  }

  /**
   * Revocar un refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    });

    this.secureLogger.log('Refresh token revocado');
  }

  /**
   * Revocar todos los refresh tokens de un usuario
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    this.secureLogger.log(
      `Todos los refresh tokens revocados para usuario ${userId}`,
    );
  }

  /**
   * Limpiar tokens expirados
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (result.count > 0) {
      this.secureLogger.log(
        `${result.count} refresh tokens expirados eliminados`,
      );
    }

    return result.count;
  }

  /**
   * Obtener estadísticas de refresh tokens
   */
  async getTokenStats(): Promise<{
    total: number;
    active: number;
    revoked: number;
    expired: number;
  }> {
    const [total, active, revoked, expired] = await Promise.all([
      this.prisma.refreshToken.count(),
      this.prisma.refreshToken.count({
        where: {
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      }),
      this.prisma.refreshToken.count({
        where: { isRevoked: true },
      }),
      this.prisma.refreshToken.count({
        where: {
          expiresAt: { lt: new Date() },
        },
      }),
    ]);

    return { total, active, revoked, expired };
  }

  /**
   * Generar nuevo access token usando refresh token
   */
  async generateNewAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    const { userId, jti } = await this.validateRefreshToken(refreshToken);

    // Obtener información del usuario
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { empresa: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Generar nuevo access token
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now,
      jti: uuidv4(), // Nuevo JWT ID para el access token
      sub: user.id.toString(), // Convertir a string para compatibilidad
      email: user.email,
      rol: user.rol,
      empresaId: user.empresaId,
      tipoIndustria: user.empresa?.TipoIndustria || 'GENERICA',
      refreshJti: jti, // Referencia al refresh token usado
    };

    const accessToken = this.jwtService.sign(payload);

    // Revocar el refresh token usado y crear uno nuevo
    await this.revokeRefreshToken(refreshToken);
    const newRefreshToken = await this.createRefreshToken(userId);

    this.secureLogger.log(`Nuevo access token generado para usuario ${userId}`);

    return { accessToken, newRefreshToken };
  }
}
