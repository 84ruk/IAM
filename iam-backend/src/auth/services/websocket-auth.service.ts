import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { JwtUser } from '../interfaces/jwt-user.interface';
import { JwtBlacklistService } from '../jwt-blacklist.service';
import { securityConfig } from '../../config/security.config';

@Injectable()
export class WebSocketAuthService {
  private readonly logger = new Logger(WebSocketAuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly blacklistService: JwtBlacklistService,
  ) {}

  async authenticateSocket(client: Socket): Promise<JwtUser> {
    try {
      const token = this.extractTokenFromSocket(client);
      
      if (!token) {
        throw new UnauthorizedException('Token no encontrado');
      }

      // Verificar token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
      });

      // Validar payload
      const jwtUser = await this.validatePayload(payload);
      
      return jwtUser;
    } catch (error) {
      this.logger.error(`Error de autenticación: ${error.message}`);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  private extractTokenFromSocket(client: Socket): string | undefined {
    // Extraer de cookies primero
    const cookieString = client.handshake.headers.cookie;
    if (cookieString) {
      const cookies = this.parseCookies(cookieString);
      if (cookies.jwt) {
        return cookies.jwt;
      }
    }

    // Fallback a Authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return undefined;
  }

  private async validatePayload(payload: any): Promise<JwtUser> {
    // Verificar que no esté en blacklist
    const isBlacklisted = await this.blacklistService.isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token revocado');
    }

    // Validar claims requeridos
    if (!payload.sub || !payload.email || !payload.rol) {
      throw new UnauthorizedException('Claims inválidos');
    }

    // Validar roles
    const validRoles = ['ADMIN', 'EMPLEADO', 'SUPERADMIN'];
    if (!validRoles.includes(payload.rol)) {
      throw new UnauthorizedException('Rol inválido');
    }

    // Mapear a JwtUser
    const jwtUser: JwtUser = {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
      empresaId: payload.empresaId,
      tipoIndustria: payload.tipoIndustria,
      setupCompletado: payload.setupCompletado,
    };

    return jwtUser;
  }

  private parseCookies(cookieString: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    if (!cookieString) return cookies;

    const cookiePairs = cookieString.split(';');
    
    for (const pair of cookiePairs) {
      const trimmedPair = pair.trim();
      const equalIndex = trimmedPair.indexOf('=');
      
      if (equalIndex > 0) {
        const name = trimmedPair.substring(0, equalIndex);
        const value = trimmedPair.substring(equalIndex + 1);
        cookies[name] = value;
      }
    }

    return cookies;
  }
} 