import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.jwt, 
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret',
      issuer: process.env.JWT_ISSUER || 'http://localhost:3001',
      audience: process.env.JWT_AUDIENCE || 'http://localhost:3001',
    });
  }

  async validate(payload: any) {
    // Validar claims estándar requeridos
    if (!payload.sub || !payload.email || !payload.rol) {
      throw new UnauthorizedException('Token inválido: claims requeridos faltantes');
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
    
    return user;
  }
}
