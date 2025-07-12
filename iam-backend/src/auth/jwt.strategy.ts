import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { securityConfig } from '../config/security.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor() {
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
    // Validar claims estándar requeridos
    if (!payload.sub || !payload.email || !payload.rol) {
        this.logger.warn('Token inválido: claims requeridos faltantes', {
          hasSub: !!payload.sub,
          hasEmail: !!payload.email,
          hasRol: !!payload.rol,
        });
      throw new UnauthorizedException('Token inválido: claims requeridos faltantes');
    }

      // Validar tipos de datos
      if (typeof payload.sub !== 'number' || typeof payload.email !== 'string' || typeof payload.rol !== 'string') {
        this.logger.warn('Token inválido: tipos de datos incorrectos', {
          subType: typeof payload.sub,
          emailType: typeof payload.email,
          rolType: typeof payload.rol,
        });
        throw new UnauthorizedException('Token inválido: formato incorrecto');
      }

      // Validar rol permitido
      const rolesPermitidos = ['SUPERADMIN', 'ADMIN', 'EMPLEADO', 'PROVEEDOR'];
      if (!rolesPermitidos.includes(payload.rol)) {
        this.logger.warn('Token inválido: rol no permitido', { rol: payload.rol });
        throw new UnauthorizedException('Token inválido: rol no permitido');
      }

    // empresaId es opcional (puede ser undefined para usuarios sin empresa)
    const user = {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
      empresaId: payload.empresaId || undefined,
      tipoIndustria: payload.tipoIndustria || 'GENERICA',
      jti: payload.jti, // JWT ID para posible revocación futura
    };
    
      this.logger.debug('Token validado exitosamente', { userId: user.id, email: user.email });
    return user;
    } catch (error) {
      this.logger.error('Error validando token JWT:', error);
      throw error;
    }
  }
}
