import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { SensoresService } from './sensores.service';
import { SensoresController } from './sensores.controller';
import { IoTController } from './iot.controller';
import { ESP32SensorService } from './esp32-sensor.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertasAvanzadasModule } from '../alertas/alertas-avanzadas.module';
import { SensoresGateway } from '../websockets/sensores/sensores.gateway';
import { IPValidationMiddleware } from './middleware/ip-validation.middleware';
import { IoTAuditService } from './services/iot-audit.service';
import { SensorAlertsModule } from '../alertas/sensor-alerts.module';
import { WebSocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [
    AuthModule, 
    PrismaModule, 
    AlertasAvanzadasModule, 
    SensorAlertsModule,
    WebSocketsModule, // Importar el módulo de WebSockets
  ],
  providers: [
    SensoresService, 
    ESP32SensorService, 
    SensoresGateway, 
    IoTAuditService
  ],
  controllers: [SensoresController, IoTController],
  exports: [SensoresService, SensoresGateway], // Exportar el gateway también
})
export class SensoresModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IPValidationMiddleware)
      .forRoutes(
        { path: 'iot/*', method: RequestMethod.ALL },
        { path: 'sensores/iot/*', method: RequestMethod.ALL }
      );
  }
}
