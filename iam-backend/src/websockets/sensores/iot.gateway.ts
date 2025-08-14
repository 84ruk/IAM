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
import { Logger } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

interface IoTDevice {
  deviceId: string;
  empresaId: number;
  deviceType: string;
  lastSeen: Date;
  status: 'ONLINE' | 'OFFLINE';
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/iot',
})
export class IoTGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(IoTGateway.name);
  private connectedDevices = new Map<string, IoTDevice>();

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Dispositivo IoT conectado: ${client.id}`);
    this.logger.debug(`📡 Headers de conexión:`, client.handshake.headers);
    
    // Extraer información del dispositivo desde headers
    const deviceId = client.handshake.headers['x-device-id'] as string;
    const empresaId = parseInt(client.handshake.headers['x-empresa-id'] as string);
    const deviceType = client.handshake.headers['x-device-type'] as string || 'ESP32';
    
    if (deviceId && empresaId && !isNaN(empresaId)) {
      const device: IoTDevice = {
        deviceId,
        empresaId,
        deviceType,
        lastSeen: new Date(),
        status: 'ONLINE'
      };
      
      this.connectedDevices.set(client.id, device);
      client.data.device = device;
      
      // Unir al dispositivo a su sala de empresa
      client.join(`empresa-${empresaId}`);
      client.join(`device-${deviceId}`);
      
      this.logger.log(`🤖 Dispositivo ${deviceType} registrado: ${deviceId} - Empresa: ${empresaId}`);
      
      // Emitir confirmación de conexión
      client.emit('conexion-exitosa', {
        deviceId,
        empresaId,
        timestamp: new Date().toISOString(),
        message: 'Conectado al servidor IoT'
      });
      
      // Notificar a otros clientes sobre el nuevo dispositivo
      client.to(`empresa-${empresaId}`).emit('dispositivo-conectado', {
        deviceId,
        deviceType,
        timestamp: new Date().toISOString()
      });
    } else {
      this.logger.warn(`⚠️ Dispositivo sin información válida: ${client.id}`);
      client.emit('error', { message: 'Información de dispositivo inválida' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const device = client.data.device;
    if (device) {
      this.logger.log(`🔌 Dispositivo IoT desconectado: ${device.deviceId} (${device.deviceType})`);
      
      // Marcar como offline
      device.status = 'OFFLINE';
      device.lastSeen = new Date();
      
      // Notificar a otros clientes
      client.to(`empresa-${device.empresaId}`).emit('dispositivo-desconectado', {
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        timestamp: new Date().toISOString()
      });
      
      this.connectedDevices.delete(client.id);
    } else {
      this.logger.log(`🔌 Cliente desconectado: ${client.id}`);
    }
  }

  @Public()
  @SubscribeMessage('enviar-lectura')
  async recibirLectura(
    @MessageBody() data: { 
      sensorId?: number;
      tipo: string;
      valor: number;
      unidad: string;
      timestamp?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const device = client.data.device;
      if (!device) {
        client.emit('error', { message: 'Dispositivo no autenticado' });
        return;
      }

      this.logger.log(`📊 Lectura recibida de ${device.deviceType} ${device.deviceId}: ${data.tipo} = ${data.valor}${data.unidad}`);

      // Actualizar último contacto
      device.lastSeen = new Date();

      // Emitir lectura a todos los clientes de la empresa
      const lecturaData = {
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        sensorId: data.sensorId,
        tipo: data.tipo,
        valor: data.valor,
        unidad: data.unidad,
        timestamp: data.timestamp || new Date().toISOString(),
        empresaId: device.empresaId
      };

      client.to(`empresa-${device.empresaId}`).emit('lectura-recibida', lecturaData);
      
      // Confirmar recepción
      client.emit('lectura-confirmada', {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        message: 'Lectura recibida correctamente'
      });

    } catch (error) {
      this.logger.error('Error procesando lectura IoT:', error);
      client.emit('error', { message: 'Error procesando lectura' });
    }
  }

  @Public()
  @SubscribeMessage('ping')
  async ping(@ConnectedSocket() client: Socket) {
    const device = client.data.device;
    if (device) {
      device.lastSeen = new Date();
      client.emit('pong', {
        timestamp: new Date().toISOString(),
        deviceId: device.deviceId
      });
    }
  }

  @Public()
  @SubscribeMessage('obtener-estado')
  async obtenerEstado(@ConnectedSocket() client: Socket) {
    const device = client.data.device;
    if (device) {
      client.emit('estado-dispositivo', {
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        empresaId: device.empresaId,
        status: device.status,
        lastSeen: device.lastSeen,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Método para obtener estadísticas de dispositivos conectados
  getConnectedDevicesStats() {
    const stats = {
      total: this.connectedDevices.size,
      byEmpresa: new Map<number, number>(),
      byType: new Map<string, number>()
    };

    for (const device of this.connectedDevices.values()) {
      // Contar por empresa
      stats.byEmpresa.set(device.empresaId, (stats.byEmpresa.get(device.empresaId) || 0) + 1);
      
      // Contar por tipo
      stats.byType.set(device.deviceType, (stats.byType.get(device.deviceType) || 0) + 1);
    }

    return stats;
  }

  // Método para emitir mensaje a todos los dispositivos de una empresa
  emitToEmpresa(empresaId: number, event: string, data: any) {
    this.server.to(`empresa-${empresaId}`).emit(event, data);
  }

  // Método para emitir mensaje a un dispositivo específico
  emitToDevice(deviceId: string, event: string, data: any) {
    this.server.to(`device-${deviceId}`).emit(event, data);
  }
}
