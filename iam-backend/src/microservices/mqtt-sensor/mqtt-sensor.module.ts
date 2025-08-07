import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MqttSensorService } from './mqtt-sensor.service';
import { EmqxApiService } from './emqx-api.service';
import { ESP32AutoConfigService } from './esp32-auto-config.service';
import { ESP32BaseCodeService } from './esp32-base-code.service';
import { MqttSensorController } from './mqtt-sensor.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SensoresModule } from '../../sensores/sensores.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertasAvanzadasModule } from '../../alertas/alertas-avanzadas.module';
import { WebSocketsModule } from '../../websockets/websockets.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    SensoresModule,
    AlertasAvanzadasModule,
    WebSocketsModule,
  ],
  providers: [MqttSensorService, EmqxApiService, ESP32AutoConfigService, ESP32BaseCodeService, PrismaService],
  controllers: [MqttSensorController],
  exports: [MqttSensorService, EmqxApiService, ESP32BaseCodeService],
})
export class MqttSensorModule {}