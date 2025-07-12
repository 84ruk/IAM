import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SecureLoggerService } from '../../common/services/secure-logger.service';
import { JwtAuditService } from '../jwt-audit.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from '../refresh-token.service';
import { v4 as uuidv4 } from 'uuid';

interface GoogleUserData {
  googleId: string;
  email: string;
  nombre?: string;
  picture?: string;
}

@Injectable()
export class OAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private secureLogger: SecureLoggerService,
    private jwtAuditService: JwtAuditService,
  ) {}

  /**
   * Autenticar usuario con Google OAuth
   */
  async authenticateWithGoogle(googleUser: GoogleUserData) {
    try {
      // Validar datos del usuario de Google
      if (!this.validateGoogleUserData(googleUser)) {
        throw new BadRequestException('Datos de Google OAuth inválidos');
      }

      // Buscar usuario por googleId o email
      let user = await this.findOrCreateGoogleUser(googleUser);

      // Generar tokens de acceso
      const { token, refreshToken } = await this.generateTokens(user);

      // Log del login exitoso
      this.secureLogger.logLoginSuccess(user.email, user.id);
      this.jwtAuditService.logJwtEvent('GOOGLE_LOGIN', user.id, user.email, {
        provider: 'google',
        googleId: googleUser.googleId,
      });

      return { token, refreshToken };
    } catch (error) {
      this.jwtAuditService.logJwtEvent('GOOGLE_ERROR', undefined, googleUser?.email, {
        provider: 'google',
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Validar datos del usuario de Google
   */
  private validateGoogleUserData(googleUser: GoogleUserData): boolean {
    return !!(
      googleUser &&
      googleUser.googleId &&
      googleUser.email &&
      googleUser.googleId.length > 0 &&
      googleUser.email.includes('@')
    );
  }

  /**
   * Buscar o crear usuario de Google
   */
  private async findOrCreateGoogleUser(googleUser: GoogleUserData) {
    // Buscar usuario existente
    let user = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { googleId: googleUser.googleId },
          { email: googleUser.email },
        ],
      },
    });

    if (user) {
      // Usuario existe, actualizar si es necesario
      return await this.updateExistingGoogleUser(user, googleUser);
    } else {
      // Crear nuevo usuario
      return await this.createNewGoogleUser(googleUser);
    }
  }

  /**
   * Actualizar usuario existente con datos de Google
   */
  private async updateExistingGoogleUser(user: any, googleUser: GoogleUserData) {
    // Verificar que el email no esté en uso por otro usuario con diferente proveedor
    if (user.email === googleUser.email && user.authProvider !== 'google') {
      throw new BadRequestException('Este email ya está registrado con otro método de autenticación');
    }

    // Actualizar datos si es necesario
    const updateData: any = {};
    
    if (!user.googleId) {
      updateData.googleId = googleUser.googleId;
      updateData.authProvider = 'google';
    }

    if (googleUser.nombre && user.nombre !== googleUser.nombre) {
      updateData.nombre = googleUser.nombre;
    }

    if (Object.keys(updateData).length > 0) {
      user = await this.prisma.usuario.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    return user;
  }

  /**
   * Crear nuevo usuario de Google
   */
  private async createNewGoogleUser(googleUser: GoogleUserData) {
    // Verificar que el email no esté en uso
    const existingUserWithEmail = await this.prisma.usuario.findUnique({
      where: { email: googleUser.email },
    });

    if (existingUserWithEmail) {
      throw new BadRequestException('Este email ya está registrado con otro método de autenticación');
    }

    const userData = {
      nombre: googleUser.nombre || 'Usuario Google',
      email: googleUser.email,
      googleId: googleUser.googleId,
      authProvider: 'google',
      rol: 'ADMIN' as any, // Rol por defecto, se puede cambiar después
      setupCompletado: false, // Necesitará configurar empresa
    };

    const user = await this.prisma.usuario.create({ data: userData });

    // Log del registro exitoso
    this.secureLogger.logUserRegistration(user.email, user.nombre, user.id);
    this.jwtAuditService.logJwtEvent('GOOGLE_REGISTER', user.id, user.email, {
      provider: 'google',
      googleId: googleUser.googleId,
    });

    return user;
  }

  /**
   * Generar tokens de acceso
   */
  private async generateTokens(user: any) {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now,
      jti: uuidv4(),
      sub: user.id,
      email: user.email,
      rol: user.rol,
      empresaId: user.empresaId,
      tipoIndustria: user.empresa?.TipoIndustria || 'GENERICA',
      authProvider: 'google',
    };

    const token = this.jwtService.sign(payload);
    const refreshToken = await this.refreshTokenService.createRefreshToken(user.id);

    return { token, refreshToken };
  }

  /**
   * Verificar estado de autenticación Google
   */
  async checkGoogleAuthStatus(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        googleId: true,
        authProvider: true,
        setupCompletado: true,
        empresaId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      isGoogleUser: user.authProvider === 'google',
      hasGoogleId: !!user.googleId,
      setupCompletado: user.setupCompletado,
      empresaId: user.empresaId,
    };
  }

  /**
   * Desvincular cuenta de Google
   */
  async unlinkGoogleAccount(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (user.authProvider !== 'google') {
      throw new BadRequestException('Este usuario no tiene una cuenta de Google vinculada');
    }

    if (!user.password) {
      throw new BadRequestException('No se puede desvincular Google sin tener una contraseña configurada');
    }

    await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        googleId: null,
        authProvider: 'local',
      },
    });

    this.secureLogger.log(`Cuenta de Google desvinculada para usuario ${userId}`);
    this.jwtAuditService.logJwtEvent('GOOGLE_UNLINK', userId, user.email, {
      provider: 'google',
    });

    return { message: 'Cuenta de Google desvinculada exitosamente' };
  }
} 