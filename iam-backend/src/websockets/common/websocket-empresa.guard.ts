import { CanActivate, Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';

@Injectable()
export class WebSocketEmpresaGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketEmpresaGuard.name);

  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const user: JwtUser = client.data.user;

      if (!user) {
        throw new WsException('Usuario no autenticado');
      }

      if (!user.empresaId) {
        throw new WsException('Usuario sin empresa asignada');
      }

      if (user.rol === 'SUPERADMIN') {
        return true;
      }

      return true;

    } catch (error) {
      const client: Socket = context.switchToWs().getClient();
      this.logger.error(`Error de autorización: ${error.message}`);
      throw new WsException('No autorizado para esta empresa');
    }
  }
} 