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
    });
  }

  async validate(payload: any) {
    // Validar claims estándar
    if (!payload.sub || !payload.email || !payload.rol || !payload.empresaId) {
      throw new UnauthorizedException('Token inválido: claims requeridos faltantes');
    }

    return {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
      empresaId: payload.empresaId,
      tipoIndustria: payload.tipoIndustria,
      jti: payload.jti, // JWT ID para posible revocación futura
    };
  }
}
