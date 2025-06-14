import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
    (req) => req?.cookies?.jwt, // Cambia 'jwt' por el nombre de tu cookie si es diferente
  ]),
  secretOrKey: process.env.JWT_SECRET || 'supersecreto123',
    });
  }

  async validate(payload: any) {
    return payload; 
  }
}
