import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WebSocketAuthGuard } from '../common/websocket-auth.guard';
import { WebSocketEmpresaGuard } from '../common/websocket-empresa.guard';
import { WebSocketRolesGuard } from '../common/websocket-roles.guard';
import { ImportacionEventType, ImportacionWebSocketMessage } from './dto/importacion-events.dto';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { WebSocketAuthService } from '../../auth/services/websocket-auth.service';

@WebSocketGateway({
  namespace: '/importacion',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-Empresa-Id', 'X-Requested-With'],
  },
  transports: ['websocket', 'polling'],
})
export class ImportacionGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ImportacionGateway.name);
  private connectedClients = new Map<string, { socket: Socket; user: JwtUser }>();

  constructor(
    private readonly webSocketAuthService: WebSocketAuthService,
    private readonly webSocketAuthGuard: WebSocketAuthGuard,
    private readonly webSocketEmpresaGuard: WebSocketEmpresaGuard,
  ) {}

  afterInit(server: Server) {
    this.logger.log('ImportacionGateway inicializado');
  }

  async handleConnection(client: Socket) {
    try {
      // Ejecutar autenticación manualmente
      const isAuthenticated = await this.authenticateClient(client);
      if (!isAuthenticated) {
        client.emit('connection:error', {
          message: 'Autenticación fallida',
          error: 'AUTHENTICATION_FAILED',
          timestamp: new Date().toISOString(),
        });
        client.disconnect();
        return;
      }

      // Ejecutar validación de empresa manualmente
      const isAuthorized = await this.authorizeClient(client);
      if (!isAuthorized) {
        client.emit('connection:error', {
          message: 'No autorizado para esta empresa',
          error: 'AUTHORIZATION_FAILED',
          timestamp: new Date().toISOString(),
        });
        client.disconnect();
        return;
      }

      const user = client.data.user as JwtUser;
      
      const clientInfo = {
        socket: client,
        user,
      };
      this.connectedClients.set(client.id, clientInfo);
      client.join(`empresa:${user.empresaId}`);
      
      this.logger.log(`Cliente conectado: ${client.id} - Usuario: ${user.email} - Empresa: ${user.empresaId}`);
      
      client.emit('connection:established', {
        message: 'Conexión establecida',
        userId: user.id,
        empresaId: user.empresaId,
        rol: user.rol,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error en handleConnection: ${error.message}`);
      client.emit('connection:error', {
        message: 'Error al establecer la conexión',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      client.disconnect();
    }
  }

  private async authenticateClient(client: Socket): Promise<boolean> {
    try {
      const jwtUser = await this.webSocketAuthService.authenticateSocket(client);
      client.data.user = jwtUser;
      return true;
    } catch (error) {
      this.logger.error(`Error de autenticación: ${error.message}`);
      return false;
    }
  }

  private async authorizeClient(client: Socket): Promise<boolean> {
    try {
      const user = client.data.user as JwtUser;
      
      if (!user || !user.empresaId) {
        return false;
      }

      if (user.rol === 'SUPERADMIN') {
        return true;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error de autorización: ${error.message}`);
      return false;
    }
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      this.connectedClients.delete(client.id);
      this.logger.log(`Cliente desconectado: ${client.id}`);
    }
  }

  @SubscribeMessage('subscribe:trabajos')
  @UseGuards(WebSocketRolesGuard)
  @Roles(Rol.ADMIN, Rol.EMPLEADO)
  handleSubscribeTrabajos(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { trabajoId?: string }
  ) {
    try {
      const user = client.data.user as JwtUser;
      
      if (data.trabajoId) {
        client.join(`trabajo:${data.trabajoId}`);
        client.emit('subscription:success', {
          message: `Suscrito al trabajo ${data.trabajoId}`,
          trabajoId: data.trabajoId,
          timestamp: new Date().toISOString(),
        });
      } else {
        client.emit('subscription:success', {
          message: `Suscrito a trabajos de empresa ${user.empresaId}`,
          empresaId: user.empresaId,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(`Error en subscribe:trabajos: ${error.message}`);
      client.emit('subscription:error', {
        message: 'Error al suscribirse',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('unsubscribe:trabajos')
  @UseGuards(WebSocketRolesGuard)
  @Roles(Rol.ADMIN, Rol.EMPLEADO)
  handleUnsubscribeTrabajos(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { trabajoId?: string }
  ) {
    try {
      const user = client.data.user as JwtUser;
      
      if (data.trabajoId) {
        client.leave(`trabajo:${data.trabajoId}`);
        client.emit('unsubscription:success', {
          message: `Desuscrito del trabajo ${data.trabajoId}`,
          trabajoId: data.trabajoId,
          timestamp: new Date().toISOString(),
        });
      } else {
        client.emit('unsubscription:success', {
          message: 'Desuscrito de trabajos específicos',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(`Error en unsubscribe:trabajos: ${error.message}`);
      client.emit('unsubscription:error', {
        message: 'Error al desuscribirse',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    const user = client.data.user as JwtUser;
    client.emit('pong', {
      message: 'Pong',
      userId: user.id,
      timestamp: new Date().toISOString(),
    });
  }

  // Métodos públicos para emitir eventos (usados por otros servicios)
  public emitTrabajoCreado(empresaId: string, trabajo: any) {
    this.server.to(`empresa:${empresaId}`).emit('trabajo:creado', {
      trabajo,
      timestamp: new Date().toISOString(),
    });
  }

  public emitTrabajoActualizado(empresaId: string, trabajo: any) {
    this.server.to(`empresa:${empresaId}`).emit('trabajo:actualizado', {
      trabajo,
      timestamp: new Date().toISOString(),
    });
  }

  public emitProgresoActualizado(empresaId: string, trabajoId: string, progreso: any) {
    this.server.to(`empresa:${empresaId}`).to(`trabajo:${trabajoId}`).emit('progreso:actualizado', {
      trabajoId,
      progreso,
      timestamp: new Date().toISOString(),
    });
  }

  public emitTrabajoCompletado(empresaId: string, trabajo: any) {
    this.server.to(`empresa:${empresaId}`).emit('trabajo:completado', {
      trabajo,
      timestamp: new Date().toISOString(),
    });
  }

  public emitTrabajoError(empresaId: string, trabajo: any) {
    this.server.to(`empresa:${empresaId}`).emit('trabajo:error', {
      trabajo,
      timestamp: new Date().toISOString(),
    });
  }

  public emitErrorValidacion(empresaId: string, trabajoId: string, error: any) {
    this.server.to(`empresa:${empresaId}`).to(`trabajo:${trabajoId}`).emit('error:validacion', {
      trabajoId,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  public emitEstadisticasActualizadas(empresaId: string, estadisticas: any) {
    this.server.to(`empresa:${empresaId}`).emit('estadisticas:actualizadas', {
      estadisticas,
      timestamp: new Date().toISOString(),
    });
  }

  public getConnectionStats() {
    return {
      totalConnections: this.connectedClients.size,
      connectedClients: Array.from(this.connectedClients.entries()).map(([id, info]) => ({
        socketId: id,
        userId: info.user.id,
        email: info.user.email,
        empresaId: info.user.empresaId,
        rol: info.user.rol,
      })),
    };
  }
}