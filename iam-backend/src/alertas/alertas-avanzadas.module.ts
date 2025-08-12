import { Module } from '@nestjs/common';
import { AlertasAvanzadasService } from './alertas-avanzadas.service';
import { AlertasAvanzadasController } from './alertas-avanzadas.controller';
import { SMSController } from './sms.controller';
import { SMSWebhookController } from './sms-webhook.controller';
import { SMSTemplateController } from './sms-template.controller';
import { SMSNotificationService } from './services/sms-notification.service';
import { SMSWebhookService } from './services/sms-webhook.service';
import { SMSTemplateService } from './services/sms-template.service';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SensorAlertsModule } from './sensor-alerts.module';

@Module({
  imports: [NotificationModule, PrismaModule, AuthModule, SensorAlertsModule],
  controllers: [
    AlertasAvanzadasController, 
    SMSController, 
    SMSWebhookController, 
    SMSTemplateController
  ],
  providers: [
    AlertasAvanzadasService, 
    SMSNotificationService, 
    SMSWebhookService, 
    SMSTemplateService
  ],
  exports: [
    AlertasAvanzadasService, 
    SMSNotificationService, 
    SMSWebhookService, 
    SMSTemplateService,
    SensorAlertsModule
  ],
})
export class AlertasAvanzadasModule {} 