import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { MqttSensorService } from './mqtt-sensor.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';

interface ToggleMqttDto {
  enabled: boolean;
}

@Controller('mqtt-sensor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MqttSensorController {
  constructor(private readonly mqttSensorService: MqttSensorService) {}

  @Get('status')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  getStatus() {
    return this.mqttSensorService.getStatus();
  }

  @Post('toggle')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async toggleMqtt(@Body() toggleDto: ToggleMqttDto) {
    await this.mqttSensorService.toggleMqtt(toggleDto.enabled);
    return {
      message: `MQTT ${toggleDto.enabled ? 'habilitado' : 'deshabilitado'} exitosamente`,
      status: this.mqttSensorService.getStatus(),
    };
  }
} 