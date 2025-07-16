import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { securityConfig } from '../config/security.config';
import { JwtBlacklistService } from './jwt-blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly blacklistService: JwtBlacklistService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.jwt, 
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: securityConfig.jwt.secret,
      issuer: securityConfig.jwt.issuer,
      audience: securityConfig.jwt.audience,
      algorithms: ['HS256'], // Especificar algoritmo explícitamente
    });
  }

  async validate(payload: any) {
    try {
      // NUEVO: Verificar si el token está en el blacklist
      if (payload.jti) {
        const isBlacklisted = await this.blacklistService.isTokenBlacklisted(payload.jti);
        if (isBlacklisted) {
          this.logger.warn('Token blacklisted detected', {
            jti: payload.jti.substring(0, 8) + '...',
            userId: payload.sub,
            email: payload.email
          });
          throw new UnauthorizedException('Token revocado');
        }
      }

      // Validar claims estándar requeridos
      if (!payload.sub || !payload.email || !payload.rol) {
        this.logger.warn('Token inválido: claims requeridos faltantes', {
          hasSub: !!payload.sub,
          hasEmail: !!payload.email,
          hasRol: !!payload.rol,
        });
        throw new UnauthorizedException('Token inválido: claims requeridos faltantes');
      }

      // Validar tipos de datos (sub como string)
      if (typeof payload.sub !== 'string' || typeof payload.email !== 'string' || typeof payload.rol !== 'string') {
        this.logger.warn('Token inválido: tipos de datos incorrectos', {
          subType: typeof payload.sub,
          emailType: typeof payload.email,
          rolType: typeof payload.rol,
        });
        throw new UnauthorizedException('Token inválido: formato incorrecto');
      }

      // Convertir sub a number para compatibilidad
      const userId = parseInt(payload.sub, 10);
      if (isNaN(userId)) {
        this.logger.warn('Token inválido: sub no es un número válido', { sub: payload.sub });
        throw new UnauthorizedException('Token inválido: sub no es un número válido');
      }

      // Validar rol permitido
      const rolesPermitidos = ['SUPERADMIN', 'ADMIN', 'EMPLEADO', 'PROVEEDOR'];
      if (!rolesPermitidos.includes(payload.rol)) {
        this.logger.warn('Token inválido: rol no permitido', { rol: payload.rol });
        throw new UnauthorizedException('Token inválido: rol no permitido');
      }

      // NUEVO: Verificar actividad sospechosa
      const suspiciousActivity = await this.blacklistService.detectSuspiciousActivity(userId);
      if (suspiciousActivity.suspicious) {
        this.logger.warn('Actividad sospechosa detectada durante validación de token', {
          userId,
          email: payload.email,
          activeTokens: suspiciousActivity.activeTokens,
          recentTokens: suspiciousActivity.recentTokens
        });
        // No bloquear el token, solo loggear la actividad sospechosa
      }

      // empresaId es opcional (puede ser undefined para usuarios sin empresa)
      const user = {
        id: userId,
        email: payload.email,
        rol: payload.rol,
        empresaId: payload.empresaId || undefined,
        tipoIndustria: payload.tipoIndustria || 'GENERICA',
        setupCompletado: payload.setupCompletado || false, // Incluir setupCompletado
        jti: payload.jti, // JWT ID para posible revocación futura
        sessionId: payload.sessionId, // ID de sesión para tracking
      };

      this.logger.debug('Token validado exitosamente', {
        userId,
        email: payload.email,
        rol: payload.rol,
        empresaId: payload.empresaId,
        jti: payload.jti ? payload.jti.substring(0, 8) + '...' : undefined
      });

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error('Error validando token JWT', {
        error: error.message,
        payload: payload ? {
          sub: payload.sub,
          email: payload.email,
          rol: payload.rol,
          jti: payload.jti ? payload.jti.substring(0, 8) + '...' : undefined
        } : 'No payload'
      });
      
      throw new UnauthorizedException('Token inválido');
    }
  }
}
