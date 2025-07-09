import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, displayName, emails } = profile;
      
      // Validar que tenemos la información necesaria
      if (!emails || emails.length === 0) {
        this.logger.error('Google profile no contiene email');
        return done(new Error('Email requerido para autenticación'), null);
      }

      const email = emails[0].value;
      
      // Validar formato de email
      if (!email || !email.includes('@')) {
        this.logger.error('Email inválido en Google profile');
        return done(new Error('Email inválido'), null);
      }

      const user = {
        googleId: id,
        nombre: displayName || 'Usuario Google',
        email: email,
        authProvider: 'google',
      };

      this.logger.log(`Google OAuth exitoso para: ${email}`);
      done(null, user);
    } catch (error) {
      this.logger.error('Error en Google OAuth validation:', error);
      done(error, null);
    }
  }
} 