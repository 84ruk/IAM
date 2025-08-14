import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WebSocketAuthGuard } from './common/websocket-auth.guard';
import { WebSocketEmpresaGuard } from './common/websocket-empresa.guard';
import { WebSocketRolesGuard } from './common/websocket-roles.guard';
import { ImportacionGateway } from './importacion/importacion.gateway';
import { SensoresGateway } from './sensores/sensores.gateway';
import { IoTGateway } from './sensores/iot.gateway';

@Module({
  imports: [
    AuthModule, // Importar AuthModule para acceder a WebSocketAuthService y otros servicios
  ],
  providers: [
    // Guards de autenticación y autorización para WebSockets
    WebSocketAuthGuard,
    WebSocketEmpresaGuard,
    WebSocketRolesGuard,
    
    // Gateways
    ImportacionGateway,
    SensoresGateway, // Agregar el gateway de sensores
    IoTGateway, // 🆕 NUEVO - Gateway específico para dispositivos IoT
  ],
  exports: [
    // Exportar guards para uso en otros módulos
    WebSocketAuthGuard,
    WebSocketEmpresaGuard,
    WebSocketRolesGuard,
    
    // Exportar gateways
    ImportacionGateway,
    SensoresGateway, // Exportar el gateway de sensores
    IoTGateway, // 🆕 NUEVO - Exportar el gateway IoT
  ],
})
export class WebSocketsModule {} 