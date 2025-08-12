import { CanActivate, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { securityConfig } from '../../config/security.config';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: any): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractTokenFromHeader(client);
      
      if (!token) {
        throw new WsException('Token no proporcionado');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: securityConfig.jwt.secret,
        issuer: securityConfig.jwt.issuer,
        audience: securityConfig.jwt.audience,
        algorithms: ['HS256'],
      });

      // Asignar el usuario al socket para uso posterior
      (client as any).user = payload;
      
      return true;
    } catch (error) {
      throw new WsException('Token inválido');
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    // 1) Token enviado explícitamente en el handshake
    const auth = (client.handshake.auth && (client.handshake.auth as any).token) || client.handshake.headers.authorization;
    if (auth) {
      if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
        return auth.substring(7);
      }
      if (typeof auth === 'string') {
        return auth;
      }
    }

    // 2) Token vía cookie httpOnly (p. ej. 'jwt=<token>')
    const rawCookie = client.handshake.headers.cookie;
    if (rawCookie) {
      const parts = rawCookie.split(';').map((c) => c.trim());
      const jwtPair = parts.find((p) => p.startsWith('jwt='));
      if (jwtPair) {
        const value = jwtPair.substring('jwt='.length);
        if (value) {
          return decodeURIComponent(value);
        }
      }
    }

    return undefined;
  }
} 