import { Controller, Get, Req } from '@nestjs/common';
import { ImportacionGateway } from './importacion.gateway';

@Controller('ws-monitor')
export class WebSocketMonitorController {
  constructor(private readonly importacionGateway: ImportacionGateway) {}

  @Get('connections')
  getConnections(@Req() req: any) {
    // Solo permitir en desarrollo o para admin
    if (process.env.NODE_ENV !== 'development' && req.user?.rol !== 'admin') {
      return { error: 'No autorizado' };
    }
    return this.importacionGateway.getConnectionStats();
  }
} 