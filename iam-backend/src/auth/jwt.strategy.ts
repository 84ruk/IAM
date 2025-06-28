import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          console.log('JWT Strategy - Cookies:', req?.cookies);
          console.log('JWT Strategy - JWT Cookie:', req?.cookies?.jwt);
          return req?.cookies?.jwt;
        }, 
        ExtractJwt.fromAuthHeaderAsBearerToken(), //QUITAR
      ]),
      ignoreExpiration: false, 
      secretOrKey: process.env.JWT_SECRET || 'supersecreto123',
    });
  }

  async validate(payload: any) {
    console.log('JWT Strategy - Payload validated:', payload);
    return payload; 
  }
}
