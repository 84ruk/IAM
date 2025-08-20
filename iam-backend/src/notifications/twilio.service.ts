import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio, Twilio as TwilioClient, Twilio as TwilioType } from 'twilio';
import { PrismaService } from '../prisma/prisma.service';

export interface SendSmsOptions {
  to: string;
  body: string;
  messagingServiceSid?: string;
  from?: string;
}

@Injectable()
export class TwilioService {
  private client: TwilioType;
  private readonly logger = new Logger(TwilioService.name);

  constructor(private readonly configService: ConfigService, private readonly prisma: PrismaService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.client = new TwilioClient(accountSid, authToken);
  }

  /**
   * Envía un SMS con reintentos y logging en la base de datos
   */
  async sendSmsWithRetry(
    to: string,
    body: string,
    empresaId: number,
    alertaId?: number,
    maxRetries = 3
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const messagingServiceSid = this.configService.get<string>('TWILIO_MESSAGING_SERVICE_SID');
    const from = this.configService.get<string>('TWILIO_FROM');
    const options: SendSmsOptions = { to, body };
    if (messagingServiceSid) {
      options.messagingServiceSid = messagingServiceSid;
    } else if (from) {
      options.from = from;
    } else {
      throw new Error('No se ha configurado ni messagingServiceSid ni from para Twilio');
    }

    let attempt = 0;
    let lastError: any = null;
    let messageId: string | undefined = undefined;
    while (attempt < maxRetries) {
      try {
        const result = await this.client.messages.create(options);
        messageId = result.sid;
        this.logger.log(`SMS enviado a ${to} (intento ${attempt + 1})`);
        // Registrar éxito en la base de datos
        await this.prisma.sMSDeliveryLog.create({
          data: {
            messageId: result.sid,
            to,
            status: 'ENVIADO',
            provider: 'Twilio',
            empresaId,
            alertaId,
            timestamp: new Date(),
          },
        });
        return { success: true, messageId };
      } catch (error) {
        lastError = error;
        this.logger.error(`Error enviando SMS a ${to} (intento ${attempt + 1}): ${error.message}`);
        // Registrar fallo en la base de datos
        await this.prisma.sMSDeliveryLog.create({
          data: {
            messageId: messageId || '',
            to,
            status: 'FALLIDO',
            errorCode: error.code ? String(error.code) : undefined,
            errorMessage: error.message,
            provider: 'Twilio',
            empresaId,
            alertaId,
            timestamp: new Date(),
          },
        });
        // Esperar antes de reintentar (backoff exponencial)
        await new Promise(res => setTimeout(res, 500 * Math.pow(2, attempt)));
      }
      attempt++;
    }
    return { success: false, error: lastError?.message };
  }
}

