import { Module } from '@nestjs/common';
import { MqttSensorService } from './mqtt-sensor.service';
import { MqttSensorController } from './mqtt-sensor.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SensoresModule } from '../../sensores/sensores.module';

@Module({
  imports: [
    ConfigModule,
    SensoresModule,
  ],
  providers: [MqttSensorService],
  controllers: [MqttSensorController],
})
export class MqttSensorModule {}