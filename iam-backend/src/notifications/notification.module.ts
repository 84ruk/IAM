import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EmailTemplatesService } from './templates/email-templates.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || 'apikey',
            pass: process.env.SENDGRID_API_KEY,
          },
        },
        defaults: {
          from: `"IAM Inventario" <${process.env.FROM_EMAIL || 'noreply@iaminventario.com'}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    PrismaModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, EmailTemplatesService],
  exports: [NotificationService, EmailTemplatesService],
})
export class NotificationModule {} 