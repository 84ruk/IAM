import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SecureLoggerService } from '../common/services/secure-logger.service';
import { ValidationService } from '../common/services/validation.service';
import { RefreshTokenService } from './refresh-token.service';
import { EmpresaSetupService } from './services/empresa-setup.service';
import { OAuthService } from './services/oauth.service';

import * as bcrypt from 'bcrypt';
import { RegisterEmpresaDto } from './dto/register-empresa.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { SetupEmpresaDto } from './dto/setup-empresa.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { JwtAuditService } from './jwt-audit.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtBlacklistService } from './jwt-blacklist.service';
import { CacheStrategiesService } from '../common/services/cache-strategies.service';
import { NotificationService } from '../notifications/notification.service';
import { SessionManagementService } from './services/session-management.service';

interface JwtUserPayload {
  id: number;
  email: string;
  rol: string;
  empresaId?: number;
  tipoIndustria?: string;
  setupCompletado?: boolean;
  jti?: string; // Nuevo: para almacenar el JTI del token
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private blacklistService: JwtBlacklistService, // NUEVO: Servicio de blacklist
    private secureLogger: SecureLoggerService,
    private validationService: ValidationService,
    private empresaSetupService: EmpresaSetupService,
    private oauthService: OAuthService,
    private prisma: PrismaService,
    private jwtAuditService: JwtAuditService,
    private cacheStrategiesService: CacheStrategiesService,
    private notificationService: NotificationService, // NUEVO: Servicio de notificaciones
    private sessionManagementService: SessionManagementService, // NUEVO: Servicio de gestión de sesiones
  ) {}

  async validateUser(email: string, password: string, ip?: string) {
    // Validar email
    const validatedEmail = this.validationService.validateEmail(email);

    const user = await this.usersService.findByEmail(validatedEmail);
    if (!user) {
      // No revelar si el usuario existe o no (seguridad)
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'Este usuario solo puede iniciar sesión con Google',
      );
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      // Log de intento fallido
      this.secureLogger.logLoginFailure(
        validatedEmail,
        'Contraseña incorrecta',
        ip,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }

  async login(user: JwtUserPayload) {
    if (!user) {
      throw new NotFoundException('El correo proporcionado no está registrado');
    }
    if (!user.rol) {
      throw new BadRequestException('El usuario no tiene un rol asignado');
    }

    let tipoIndustria = 'GENERICA';

    if (user.empresaId) {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: user.empresaId },
        select: { TipoIndustria: true },
      });
      tipoIndustria = empresa?.TipoIndustria || 'GENERICA';
    }

    // Claims estándar JWT según RFC 7519 con mayor seguridad
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      // Claims estándar con mayor entropía
      iat: now, // Issued at - cuándo fue emitido
      jti: crypto.randomBytes(32).toString('hex'), // JWT ID - 256 bits de entropía
      sub: user.id.toString(), // Subject - como string para mayor compatibilidad

      // Claims de sesión para mayor seguridad
      sessionId: crypto.randomBytes(16).toString('hex'), // ID único de sesión

      // Claims personalizados
      email: user.email,
      rol: user.rol,
      empresaId: user.empresaId,
      tipoIndustria: tipoIndustria,
      setupCompletado: user.setupCompletado || false, // Incluir setupCompletado
    };

    const token = this.jwtService.sign(payload);

    // NUEVO: Verificar límites de sesiones concurrentes
    const sessionLimits = await this.sessionManagementService.checkSessionLimits(user.id, user.rol as any);
    
    if (sessionLimits.needsRevocation) {
      // Revocar sesiones excedentes (las más antiguas)
      const revokedCount = await this.sessionManagementService.revokeExcessSessions(user.id, user.rol as any);
      
      this.secureLogger.log(
        `Session limit exceeded for user ${user.id}. Revoked ${revokedCount} excess sessions.`,
        user.id.toString(),
      );
    }

    // Crear refresh token
    const refreshToken = await this.refreshTokenService.createRefreshToken(
      user.id,
    );

    // NUEVO: Verificar actividad sospechosa después del login
    const suspiciousActivity =
      await this.blacklistService.detectSuspiciousActivity(user.id);
    if (suspiciousActivity.suspicious) {
      this.secureLogger.logSecurityError(
        `Suspicious login activity detected for user ${user.id} - Active: ${suspiciousActivity.activeTokens}, Recent: ${suspiciousActivity.recentTokens}`,
        user.id,
      );
    }

    // Log del login exitoso con información enmascarada
    this.secureLogger.logLoginSuccess(user.email, user.id);
    this.jwtAuditService.logLogin(user.id, user.email);

    // 🎯 Cache warming después del login exitoso
    if (user.empresaId) {
      // Ejecutar cache warming en background para no bloquear el login
      this.cacheStrategiesService.warmupCache(user.empresaId).catch((error) => {
        this.secureLogger.logSecurityError(
          `Cache warming failed for empresa ${user.empresaId}: ${error.message}`,
          user.id,
        );
      });
    }

    return { token, refreshToken };
  }

  async registerEmpresa(dto: RegisterEmpresaDto, ip?: string) {
    // Validar datos usando el servicio de validación
    const validatedData = this.validationService.validateObject(dto, {
      email: (email) => this.validationService.validateEmail(email),
      password: (password) => this.validationService.validatePassword(password),
      nombreUsuario: (nombre) =>
        this.validationService.validateName(nombre, 'nombre de usuario'),
      nombreEmpresa: (nombre) =>
        this.validationService.validateEmpresaName(nombre),
    });

    // Usar el servicio especializado para registrar empresa
    const result =
      await this.empresaSetupService.registerEmpresa(validatedData);

    // Generar tokens
    const usuarioParaLogin = {
      id: result.user.id,
      email: result.user.email,
      rol: result.user.rol,
      empresaId: result.user.empresaId ?? undefined,
    };
    const { token, refreshToken } = await this.login(usuarioParaLogin);

    return {
      ...result,
      token,
      refreshToken,
    };
  }

  async getCurrentUser(res: any) {
    const token = res?.cookies?.jwt;

    if (!token) {
      throw new UnauthorizedException('No autorizado');
    }

    try {
      const payload = this.jwtService.verify(token);
      const userId = parseInt(payload.sub, 10);
      if (isNaN(userId)) {
        throw new UnauthorizedException(
          'Token inválido: ID de usuario no válido',
        );
      }
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async loginWithGoogle(googleUser: any, ip?: string) {
    try {
      // Usar el servicio especializado de OAuth
      const result = await this.oauthService.authenticateWithGoogle(googleUser);

      return result;
    } catch (error) {
      this.jwtAuditService.logJwtEvent(
        'GOOGLE_ERROR',
        undefined,
        googleUser?.email,
        {
          provider: 'google',
          error: error.message,
        },
      );
      throw error;
    }
  }

  // Nuevo método para registro de usuario individual
  async registerUser(dto: RegisterUserDto) {
    try {
      // Verificar que el email no esté en uso
      const existingUser = await this.prisma.usuario.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new BadRequestException(
          'Ya existe un usuario registrado con este correo',
        );
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Crear usuario sin empresa (setup pendiente)
      const data: any = {
        nombre: dto.nombre,
        email: dto.email,
        password: hashedPassword,
        rol: 'ADMIN', // Rol por defecto, se puede cambiar después
        authProvider: 'local',
        setupCompletado: false, // Necesitará configurar empresa
        // empresaId será null hasta que configure la empresa
      };

      const usuario = await this.prisma.usuario.create({ data });

      // Log del registro exitoso con información enmascarada
      this.secureLogger.logUserRegistration(
        usuario.email,
        usuario.nombre,
        usuario.id,
      );
      this.jwtAuditService.logJwtEvent(
        'USER_REGISTER',
        usuario.id,
        usuario.email,
        {
          provider: 'local',
          method: 'email_password',
        },
      );

      // Emitir JWT para login automático
      const usuarioParaLogin = {
        ...usuario,
        empresaId: usuario.empresaId ?? undefined,
      };
      const { token, refreshToken } = await this.login(usuarioParaLogin);

      return {
        message:
          'Usuario registrado exitosamente. Completa la configuración de tu empresa.',
        token,
        refreshToken,
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          setupCompletado: usuario.setupCompletado,
        },
        needsSetup: true,
      };
    } catch (error) {
      this.secureLogger.logSecurityError(error.message, undefined);
      this.jwtAuditService.logJwtEvent(
        'USER_REGISTER_ERROR',
        undefined,
        dto.email,
        {
          error: error.message,
          provider: 'local',
        },
      );
      throw error;
    }
  }

  // Nuevo método para setup de empresa con transacciones
  async setupEmpresa(userId: number, dto: SetupEmpresaDto) {
    // Log de inicio de setup
    this.jwtAuditService.logSetupStarted(userId, 'unknown', {
      empresaName: dto.nombreEmpresa,
      tipoIndustria: dto.tipoIndustria,
    });

    try {
      // Usar transacción para prevenir race conditions y asegurar consistencia
      const result = await this.prisma.$transaction(
        async (prisma) => {
          // Verificar que el usuario existe y no tiene empresa (con lock optimista)
          const user = await prisma.usuario.findUnique({
            where: { id: userId },
            include: { empresa: true },
          });

          if (!user) {
            throw new NotFoundException('Usuario no encontrado');
          }

          if (user.empresaId) {
            throw new BadRequestException(
              'El usuario ya tiene una empresa configurada',
            );
          }

          // Verificar que el RFC no esté en uso (si se proporciona)
          if (dto.rfc && dto.rfc.trim()) {
            const existingEmpresa = await prisma.empresa.findUnique({
              where: { rfc: dto.rfc.trim() },
            });
            if (existingEmpresa) {
              throw new BadRequestException(
                'El RFC ya está registrado en el sistema',
              );
            }
          }

          // Preparar datos de empresa, excluyendo RFC si está vacío
          const empresaData: any = {
            nombre: dto.nombreEmpresa,
            emailContacto: user.email,
            TipoIndustria: dto.tipoIndustria,
            direccion: dto.direccion,
          };

          // Solo incluir RFC si se proporciona y no está vacío
          if (dto.rfc && dto.rfc.trim()) {
            empresaData.rfc = dto.rfc.trim();
          }

          // Crear empresa
          const empresa = await prisma.empresa.create({
            data: empresaData,
          });

          // Actualizar usuario
          const updatedUser = await prisma.usuario.update({
            where: { id: userId },
            data: {
              empresaId: empresa.id,
              rol: 'ADMIN', // Mantener rol ADMIN, no cambiar a SUPERADMIN
              setupCompletado: true, // Marcar setup como completado
            },
          });

          return { empresa, updatedUser };
        },
        {
          maxWait: 5000, // Máximo 5 segundos de espera
          timeout: 10000, // Timeout de 10 segundos
          isolationLevel: 'Serializable', // Nivel más alto de aislamiento
        },
      );

      // Log de setup completado exitosamente con información enmascarada
      this.secureLogger.logEmpresaCreation(
        result.empresa.nombre,
        result.updatedUser.email,
        result.empresa.id,
      );
      this.jwtAuditService.logSetupCompleted(
        userId,
        result.updatedUser.email,
        result.empresa.id,
        {
          empresaName: result.empresa.nombre,
          tipoIndustria: result.empresa.TipoIndustria,
        },
      );

      // Generar nuevo JWT con la información de empresa actualizada
      const userParaLogin = {
        id: result.updatedUser.id,
        email: result.updatedUser.email,
        rol: result.updatedUser.rol,
        empresaId: result.empresa.id,
        tipoIndustria: result.empresa.TipoIndustria,
      };
      const { token: newToken, refreshToken } = await this.login(userParaLogin);

      return {
        message: 'Empresa configurada exitosamente',
        token: newToken, // Incluir el nuevo token
        refreshToken, // Incluir el refresh token
        empresa: {
          id: result.empresa.id,
          nombre: result.empresa.nombre,
          tipoIndustria: result.empresa.TipoIndustria,
          rfc: result.empresa.rfc,
          direccion: result.empresa.direccion,
        },
        user: {
          id: result.updatedUser.id,
          nombre: result.updatedUser.nombre,
          email: result.updatedUser.email,
          rol: result.updatedUser.rol,
        },
      };
    } catch (error) {
      // Log de error en setup con información enmascarada
      this.secureLogger.logSecurityError(error.message, userId);
      this.jwtAuditService.logSetupFailed(userId, 'unknown', error.message, {
        empresaName: dto.nombreEmpresa,
        tipoIndustria: dto.tipoIndustria,
        errorCode: error.code,
      });

      // Re-lanzar el error para que sea manejado por los filtros globales
      throw error;
    }
  }

  // Método para verificar si el usuario necesita setup
  async needsSetup(userId: number | string): Promise<boolean> {
    // Convertir userId a number si es string (compatibilidad con JWT sub)
    const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;

    if (isNaN(id)) {
      this.jwtAuditService.logSetupCheck(id, 'invalid', true, {
        reason: 'invalid_user_id',
        userId,
        parsedId: id,
      });
      return true;
    }

    const user = await this.prisma.usuario.findUnique({
      where: { id },
      select: { empresaId: true, setupCompletado: true, email: true },
    });

    if (!user) {
      this.jwtAuditService.logSetupCheck(id, 'unknown', true, {
        reason: 'user_not_found',
        userId,
      });
      return true;
    }

    // El usuario necesita setup si no tiene empresa O si setupCompletado es false
    const needsSetup = !user?.empresaId || !user?.setupCompletado;

    // Log de auditoría para cada consulta
    this.jwtAuditService.logSetupCheck(id, user.email, needsSetup, {
      hasEmpresa: !!user.empresaId,
      setupCompletado: user.setupCompletado,
    });

    return needsSetup;
  }

  // Método para obtener el estado completo del usuario
  async getUserStatus(userId: number | string) {
    // Convertir userId a number si es string (compatibilidad con JWT sub)
    const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;

    if (isNaN(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const user = await this.prisma.usuario.findUnique({
      where: { id },
      include: { empresa: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const needsSetup = !user.empresaId || !user.setupCompletado;

    // Log de auditoría para consulta de estado
    this.jwtAuditService.logSetupCheck(id, user.email, needsSetup, {
      action: 'get_status',
      hasEmpresa: !!user.empresaId,
      setupCompletado: user.setupCompletado,
    });

    return {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        empresaId: user.empresaId,
        setupCompletado: user.setupCompletado,
        authProvider: user.authProvider,
        activo: user.activo,
      },
      empresa: user.empresa
        ? {
            id: user.empresa.id,
            nombre: user.empresa.nombre,
            tipoIndustria: user.empresa.TipoIndustria,
            rfc: user.empresa.rfc,
            direccion: user.empresa.direccion,
          }
        : null,
      needsSetup,
      setupStatus: {
        hasEmpresa: !!user.empresaId,
        setupCompletado: user.setupCompletado,
        isComplete: !needsSetup,
      },
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    // Validar que las contraseñas coincidan
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    // Obtener el usuario
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar que el usuario tenga contraseña (no es OAuth)
    if (!user.password) {
      throw new BadRequestException(
        'No puedes cambiar la contraseña de una cuenta OAuth',
      );
    }

    // Verificar la contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Verificar que la nueva contraseña sea diferente
    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual',
      );
    }

    // Hashear la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    // Actualizar la contraseña
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Log de cambio de contraseña exitoso
    this.secureLogger.logPasswordChange(userId, true);

    return {
      message: 'Contraseña cambiada exitosamente',
      success: true,
    };
  }

  async forgotPassword(email: string) {
    // Verificar que el usuario existe
    const user = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return {
        message:
          'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña',
        success: true,
      };
    }

    // Verificar que el usuario no sea OAuth
    if (!user.password) {
      return {
        message:
          'Este email está asociado a una cuenta OAuth. Usa el método de autenticación original.',
        success: false,
      };
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token en la base de datos
    await this.prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    // Generar URL de reset
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    try {
      // Enviar email de recuperación de contraseña
      const result = await this.notificationService.sendPasswordResetEmail(
        email,
        user.nombre || 'Usuario',
        resetUrl
      );

      if (result.success) {
        // Log de envío exitoso
        this.secureLogger.log(`Email de recuperación enviado exitosamente a ${email}`);
        
        return {
          message: 'Se ha enviado un enlace de recuperación a tu email',
          success: true,
        };
      } else {
        // Log de error en envío
        this.secureLogger.logSecurityError(
          `Error al enviar email de recuperación a ${email}: ${result.error}`,
          user.id
        );
        
        return {
          message: 'Error al enviar el email de recuperación. Por favor, intenta nuevamente.',
          success: false,
        };
      }
    } catch (error) {
      // Log de error en envío
      this.secureLogger.logSecurityError(
        `Error al enviar email de recuperación a ${email}: ${error.message}`,
        user.id
      );
      
      return {
        message: 'Error al enviar el email de recuperación. Por favor, intenta nuevamente.',
        success: false,
      };
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    // Validar que las contraseñas coincidan
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    // Buscar el token
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: resetPasswordDto.token },
    });

    if (!resetToken) {
      throw new BadRequestException('Token inválido');
    }

    if (resetToken.used) {
      throw new BadRequestException('Este token ya ha sido utilizado');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('El token ha expirado');
    }

    // Buscar el usuario
    const user = await this.prisma.usuario.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Actualizar la contraseña del usuario
    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Marcar el token como usado
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Log de reset de contraseña exitoso
    this.secureLogger.logPasswordReset(resetToken.email, true);

    return {
      message: 'Contraseña restablecida exitosamente',
      success: true,
    };
  }

  async verifyResetToken(token: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      throw new BadRequestException('Token inválido');
    }

    if (resetToken.used) {
      throw new BadRequestException('Este token ya ha sido utilizado');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('El token ha expirado');
    }

    return {
      message: 'Token válido',
      success: true,
      email: resetToken.email,
    };
  }

  async logout(user: JwtUserPayload) {
    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    try {
      // NUEVO: Blacklist el token actual si tiene JTI
      if (user.jti) {
        await this.blacklistService.blacklistToken(
          user.jti,
          user.id,
          'user_logout',
        );
      }

      // Revocar todos los refresh tokens del usuario
      await this.refreshTokenService.revokeAllUserTokens(user.id);

      // Log de auditoría
      this.jwtAuditService.logLogout(user.id, user.email);

      this.secureLogger.log(`Logout exitoso para usuario ${user.id}`);

      return { message: 'Sesión cerrada exitosamente' };
    } catch (error) {
      this.secureLogger.logSecurityError(error.message, user.id);
      throw new BadRequestException('Error al cerrar sesión');
    }
  }
}
