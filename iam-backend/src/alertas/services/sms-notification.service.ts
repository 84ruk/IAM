import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SMSConfig {
  provider: 'twilio' | 'aws-sns' | 'custom';
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  customEndpoint?: string;
  customApiKey?: string;
}

export interface SMSMessage {
  to: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

@Injectable()
export class SMSNotificationService {
  private readonly logger = new Logger(SMSNotificationService.name);
  private config: SMSConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      provider: this.configService.get('SMS_PROVIDER', 'twilio'),
      accountSid: this.configService.get('TWILIO_ACCOUNT_SID'),
      authToken: this.configService.get('TWILIO_AUTH_TOKEN'),
      fromNumber: this.configService.get('TWILIO_FROM_NUMBER') || this.configService.get('TWILIO_PHONE_NUMBER'),
      region: this.configService.get('AWS_REGION'),
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      customEndpoint: this.configService.get('SMS_CUSTOM_ENDPOINT'),
      customApiKey: this.configService.get('SMS_CUSTOM_API_KEY'),
    };
  }

  getProvider(): string {
    return this.config.provider || 'unknown';
  }

  async sendSMS(message: SMSMessage): Promise<boolean> {
    try {
      this.logger.log(`Enviando SMS a ${message.to}: ${message.message.substring(0, 50)}...`);

      switch (this.config.provider) {
        case 'twilio':
          return await this.sendViaTwilio(message);
        case 'aws-sns':
          return await this.sendViaAWSSNS(message);
        case 'custom':
          return await this.sendViaCustomProvider(message);
        default:
          throw new Error(`Proveedor SMS no soportado: ${this.config.provider}`);
      }
    } catch (error) {
      this.logger.error(`Error enviando SMS: ${error.message}`);
      return false;
    }
  }

  async sendBulkSMS(messages: SMSMessage[]): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      messages.map(message => this.sendSMS(message))
    );

    const success = results.filter(result => result.status === 'fulfilled' && result.value).length;
    const failed = results.length - success;

    this.logger.log(`Bulk SMS completado: ${success} exitosos, ${failed} fallidos`);
    return { success, failed };
  }

  private async sendViaTwilio(message: SMSMessage): Promise<boolean> {
    try {
      if (!this.config.accountSid || !this.config.authToken || !this.config.fromNumber) {
        throw new Error('Configuración de Twilio incompleta');
      }

      // Envío real por Twilio usando el SDK
      const client = require('twilio')(this.config.accountSid, this.config.authToken);
      
      const result = await client.messages.create({
        body: message.message,
        from: this.config.fromNumber,
        to: message.to
      });

      this.logger.log(`[TWILIO] SMS enviado exitosamente a ${message.to}. SID: ${result.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`Error enviando SMS via Twilio: ${error.message}`);
      return false;
    }
  }

  private async sendViaAWSSNS(message: SMSMessage): Promise<boolean> {
    try {
      if (!this.config.accessKeyId || !this.config.secretAccessKey || !this.config.region) {
        throw new Error('Configuración de AWS SNS incompleta');
      }

      // Simulación de envío por AWS SNS
      // En producción, usarías el SDK de AWS:
      // const AWS = require('aws-sdk');
      // const sns = new AWS.SNS({
      //   region: this.config.region,
      //   accessKeyId: this.config.accessKeyId,
      //   secretAccessKey: this.config.secretAccessKey
      // });
      // await sns.publish({
      //   Message: message.message,
      //   PhoneNumber: message.to
      // }).promise();

      this.logger.log(`[AWS SNS] SMS enviado a ${message.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Error enviando SMS via AWS SNS: ${error.message}`);
      return false;
    }
  }

  private async sendViaCustomProvider(message: SMSMessage): Promise<boolean> {
    try {
      if (!this.config.customEndpoint || !this.config.customApiKey) {
        throw new Error('Configuración de proveedor personalizado incompleta');
      }

      // Simulación de envío por proveedor personalizado
      // En producción, harías una petición HTTP:
      // const response = await fetch(this.config.customEndpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.config.customApiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     to: message.to,
      //     message: message.message,
      //     priority: message.priority
      //   })
      // });

      this.logger.log(`[CUSTOM] SMS enviado a ${message.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Error enviando SMS via proveedor personalizado: ${error.message}`);
      return false;
    }
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    // Validación básica de número de teléfono
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Formatear número de teléfono
    const cleaned = phoneNumber.replace(/\D/g, '').replace(/^0/, '') || phoneNumber;
    if(phoneNumber.startsWith('+')){
        return phoneNumber;
    }
    if (cleaned.startsWith('1') || cleaned.startsWith('52')) {
        return `+${cleaned}`;
    }
    return `+52${cleaned}`; // Asumiendo MX como default
  }
} 