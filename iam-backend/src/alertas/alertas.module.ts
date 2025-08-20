import { Module } from '@nestjs/common';
import { AlertasController } from './controllers/alertas.controller';
import { ConfiguracionSensorAlertasController } from './controllers/configuracion-sensor-alertas.controller';
import { AlertasService } from './services/alertas.service';
import { ConfiguracionSensorAlertasService } from './services/configuracion-sensor-alertas.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notification.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule, NotificationModule],
  controllers: [
    AlertasController,
    ConfiguracionSensorAlertasController
  ],
  providers: [
    AlertasService,
    ConfiguracionSensorAlertasService
  ],
  exports: [
    AlertasService,
    ConfiguracionSensorAlertasService
  ],
})
export class AlertasModule {}
