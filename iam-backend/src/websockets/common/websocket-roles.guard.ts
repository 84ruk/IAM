import { CanActivate, Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@Injectable()
export class WebSocketRolesGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketRolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const user: JwtUser = client.data.user;

      if (!user) {
        this.logger.warn(`❌ WebSocketRolesGuard: Usuario no autenticado - Socket ID: ${client.id}`);
        throw new WsException('Usuario no autenticado');
      }

      // Obtener roles requeridos del decorador (igual que RolesGuard)
      const requiredRoles = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      // Si no hay roles requeridos, permitir acceso
      if (!requiredRoles || requiredRoles.length === 0) {
        this.logger.debug(`✅ WebSocketRolesGuard: Sin roles requeridos - Usuario: ${user.email} - Socket ID: ${client.id}`);
        return true;
      }

      // Verificar si el usuario tiene alguno de los roles requeridos
      const hasRequiredRole = requiredRoles.some(role => user.rol === role);

      if (!hasRequiredRole) {
        this.logger.warn(`❌ WebSocketRolesGuard: Rol insuficiente - Usuario: ${user.email} - Rol: ${user.rol} - Roles requeridos: ${requiredRoles.join(', ')} - Socket ID: ${client.id}`);
        throw new WsException('Rol insuficiente');
      }

      this.logger.debug(`✅ WebSocketRolesGuard: Rol autorizado - Usuario: ${user.email} - Rol: ${user.rol} - Socket ID: ${client.id}`);
      return true;

    } catch (error) {
      const client: Socket = context.switchToWs().getClient();
      this.logger.error(`❌ WebSocketRolesGuard: Error de autorización - Socket ID: ${client.id} - Error: ${error.message}`);
      throw new WsException('No autorizado para esta operación');
    }
  }
} 