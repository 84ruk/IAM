import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RefreshTokenService } from './refresh-token.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { JwtAuditService } from './jwt-audit.service';
import { UnifiedEmpresaGuard } from './guards/unified-empresa.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { EmpresaCacheService } from './empresa-cache.service';
import { AppLoggerService } from '../common/services/logger.service';
import { SecureLoggerService } from '../common/services/secure-logger.service';
import { ValidationService } from '../common/services/validation.service';
import { SecurityValidator } from '../common/services/security-validator.service';
import { EmpresaSetupService } from './services/empresa-setup.service';
import { OAuthService } from './services/oauth.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { securityConfig } from '../config/security.config';
import { JwtBlacklistService } from './jwt-blacklist.service';
import { TwoFactorService } from './services/two-factor.service';
import { TwoFactorController } from './two-factor.controller';

@Module({
  imports: [
    forwardRef(() => UsersModule), // Usar forwardRef para evitar dependencia circular
    PrismaModule,
    CommonModule, // Importar CommonModule para servicios de cache
    PassportModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 10, // 10 requests por minuto
      },
    ]),
    JwtModule.register({
      secret: securityConfig.jwt.secret,
      signOptions: {
        expiresIn: securityConfig.jwt.expiresIn,
        issuer: securityConfig.jwt.issuer,
        audience: securityConfig.jwt.audience,
        algorithm: 'HS256',
      },
      verifyOptions: {
        issuer: securityConfig.jwt.issuer,
        audience: securityConfig.jwt.audience,
        algorithms: ['HS256'],
        clockTolerance: 30, // 30 segundos de tolerancia para sincronización de reloj
      },
    }),
  ],
  providers: [
    AuthService,
    RefreshTokenService,
    JwtBlacklistService, // NUEVO: Servicio de blacklist
    TwoFactorService, // NUEVO: Servicio de 2FA
    JwtStrategy,
    GoogleStrategy,
    JwtAuditService,
    UnifiedEmpresaGuard, // Guard unificado que reemplaza los tres guards anteriores
    EmpresaCacheService,
    AppLoggerService,
    SecureLoggerService,
    ValidationService, // Servicio de validación robusto
    SecurityValidator, // Validador de seguridad centralizado
    EmpresaSetupService, // Servicio especializado para setup de empresa
    OAuthService, // Servicio especializado para OAuth
    RateLimiterService, // Servicio de rate limiting
    RateLimitGuard, // Guard de rate limiting
  ],
  controllers: [
    AuthController,
    TwoFactorController, // NUEVO: Controlador de 2FA
  ],
  exports: [
    AuthService,
    RefreshTokenService,
    JwtBlacklistService, // NUEVO: Exportar servicio de blacklist
    TwoFactorService, // NUEVO: Exportar servicio de 2FA
    JwtAuditService,
    UnifiedEmpresaGuard, // Exportar el guard unificado
    EmpresaCacheService,
    AppLoggerService,
    SecureLoggerService,
    ValidationService, // Exportar el servicio de validación
    SecurityValidator, // Exportar el validador de seguridad
    EmpresaSetupService, // Exportar el servicio de setup de empresa
    OAuthService, // Exportar el servicio de OAuth
    RateLimiterService, // Exportar el servicio de rate limiting
    RateLimitGuard, // Exportar el guard de rate limiting
  ],
})
export class AuthModule {}
