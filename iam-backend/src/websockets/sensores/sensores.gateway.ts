import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WsJwtAuthGuard } from '../../auth/guards/ws-jwt-auth.guard';

interface SensorSubscription {
  userId: number;
  empresaId: number;
  ubicacionId?: number;
  sensorId?: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/sensores',
})
export class SensoresGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SensoresGateway.name);
  private subscriptions = new Map<string, SensorSubscription>();

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    this.subscriptions.delete(client.id);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('suscribirse-ubicacion')
  async suscribirseAUbicacion(
    @MessageBody() data: { ubicacionId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = (client as any).user;
      if (!user || !user.empresaId) {
        client.emit('error', { message: 'Usuario no autenticado' });
        return;
      }

      const subscription: SensorSubscription = {
        userId: user.id,
        empresaId: user.empresaId,
        ubicacionId: data.ubicacionId,
      };

      this.subscriptions.set(client.id, subscription);
      client.join(`ubicacion-${data.ubicacionId}`);
      client.join(`empresa-${user.empresaId}`);

      this.logger.log(`Usuario ${user.id} suscrito a ubicación ${data.ubicacionId}`);
      client.emit('suscripcion-exitosa', { ubicacionId: data.ubicacionId });
    } catch (error) {
      this.logger.error('Error en suscripción a ubicación:', error);
      client.emit('error', { message: 'Error en suscripción' });
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('suscribirse-sensor')
  async suscribirseASensor(
    @MessageBody() data: { sensorId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = (client as any).user;
      if (!user || !user.empresaId) {
        client.emit('error', { message: 'Usuario no autenticado' });
        return;
      }

      const subscription: SensorSubscription = {
        userId: user.id,
        empresaId: user.empresaId,
        sensorId: data.sensorId,
      };

      this.subscriptions.set(client.id, subscription);
      client.join(`sensor-${data.sensorId}`);
      client.join(`empresa-${user.empresaId}`);

      this.logger.log(`Usuario ${user.id} suscrito a sensor ${data.sensorId}`);
      client.emit('suscripcion-exitosa', { sensorId: data.sensorId });
    } catch (error) {
      this.logger.error('Error en suscripción a sensor:', error);
      client.emit('error', { message: 'Error en suscripción' });
    }
  }

  @SubscribeMessage('desuscribirse')
  async desuscribirse(@ConnectedSocket() client: Socket) {
    try {
      const subscription = this.subscriptions.get(client.id);
      if (subscription) {
        if (subscription.ubicacionId) {
          client.leave(`ubicacion-${subscription.ubicacionId}`);
        }
        if (subscription.sensorId) {
          client.leave(`sensor-${subscription.sensorId}`);
        }
        client.leave(`empresa-${subscription.empresaId}`);
        this.subscriptions.delete(client.id);

        this.logger.log(`Usuario ${subscription.userId} desuscrito`);
        client.emit('desuscripcion-exitosa');
      }
    } catch (error) {
      this.logger.error('Error en desuscripción:', error);
      client.emit('error', { message: 'Error en desuscripción' });
    }
  }

  // Métodos para emitir eventos a los clientes suscritos
  async emitirLecturaSensor(lectura: any, empresaId: number) {
    try {
      // Emitir a todos los clientes de la empresa
      this.server.to(`empresa-${empresaId}`).emit('nueva-lectura', {
        tipo: 'LECTURA_SENSOR',
        data: lectura,
        timestamp: new Date(),
      });

      // Emitir específicamente a los suscritos al sensor
      if (lectura.sensorId) {
        this.server.to(`sensor-${lectura.sensorId}`).emit('lectura-sensor', {
          sensorId: lectura.sensorId,
          tipo: lectura.tipo,
          valor: lectura.valor,
          unidad: lectura.unidad,
          fecha: lectura.fecha,
          estado: lectura.estado,
        });
      }

      // Emitir a los suscritos a la ubicación
      if (lectura.ubicacionId) {
        this.server.to(`ubicacion-${lectura.ubicacionId}`).emit('lectura-ubicacion', {
          ubicacionId: lectura.ubicacionId,
          sensorId: lectura.sensorId,
          tipo: lectura.tipo,
          valor: lectura.valor,
          unidad: lectura.unidad,
          fecha: lectura.fecha,
          estado: lectura.estado,
        });
      }
    } catch (error) {
      this.logger.error('Error emitiendo lectura de sensor:', error);
    }
  }

  async emitirAlerta(alerta: any, empresaId: number) {
    try {
      // Emitir a todos los clientes de la empresa
      this.server.to(`empresa-${empresaId}`).emit('nueva-alerta', {
        tipo: 'ALERTA_SENSOR',
        data: alerta,
        timestamp: new Date(),
      });

      // Emitir específicamente a los suscritos a la ubicación
      if (alerta.ubicacionId) {
        this.server.to(`ubicacion-${alerta.ubicacionId}`).emit('alerta-ubicacion', {
          ubicacionId: alerta.ubicacionId,
          tipo: alerta.tipo,
          severidad: alerta.severidad,
          mensaje: alerta.mensaje,
          fecha: alerta.fecha,
        });
      }
    } catch (error) {
      this.logger.error('Error emitiendo alerta:', error);
    }
  }

  async emitirEstadoSensores(estado: any, empresaId: number) {
    try {
      this.server.to(`empresa-${empresaId}`).emit('estado-sensores', {
        tipo: 'ESTADO_SENSORES',
        data: estado,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error emitiendo estado de sensores:', error);
    }
  }
} 