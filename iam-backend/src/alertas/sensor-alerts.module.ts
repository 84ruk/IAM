import { Module, forwardRef } from '@nestjs/common';
import { SensorAlertManagerService } from './services/sensor-alert-manager.service';
import { SensorAlertsController } from './controllers/sensor-alerts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notifications/notification.module';
import { AlertasAvanzadasModule } from './alertas-avanzadas.module';
import { AlertasConfigController } from './controllers/alertas-config.controller';

@Module({
  imports: [PrismaModule, AuthModule, NotificationModule, forwardRef(() => AlertasAvanzadasModule)],
  controllers: [SensorAlertsController, AlertasConfigController],
  providers: [SensorAlertManagerService],
  exports: [SensorAlertManagerService],
})
export class SensorAlertsModule {}
