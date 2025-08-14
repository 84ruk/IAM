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
import { IoTConfigService } from './services/iot-config.service';
import { SensorAlertsModule } from '../alertas/sensor-alerts.module';
import { WebSocketsModule } from '../websockets/websockets.module';
import { CommonModule } from '../common/common.module';
import { SensorRetentionService } from './services/sensor-retention.service';

@Module({
  imports: [
    AuthModule, 
    PrismaModule, 
    AlertasAvanzadasModule, 
    SensorAlertsModule,
    WebSocketsModule, // Importar el módulo de WebSockets
    CommonModule, // Importar el módulo común para URLConfigService
  ],
  providers: [
    SensoresService, 
    ESP32SensorService, 
    IoTAuditService,
    IoTConfigService,
    SensorRetentionService,
    // 🔧 CORREGIR: El gateway se importa desde WebSocketsModule, no se declara aquí
  ],
  controllers: [SensoresController, IoTController],
  exports: [SensoresService, IoTConfigService], // Exportar servicios, no el gateway
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
