import { CanActivate, Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { WebSocketAuthService } from '../../auth/services/websocket-auth.service';

@Injectable()
export class WebSocketAuthGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketAuthGuard.name);

  constructor(private readonly webSocketAuthService: WebSocketAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      
      const jwtUser = await this.webSocketAuthService.authenticateSocket(client);
      client.data.user = jwtUser;
      
      return true;
    } catch (error) {
      const client: Socket = context.switchToWs().getClient();
      this.logger.error(`Error de autenticación: ${error.message}`);
      throw new WsException('Token inválido o expirado');
    }
  }
} 