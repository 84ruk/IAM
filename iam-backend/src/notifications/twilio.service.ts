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
  private client: TwilioType | null = null;
  private readonly logger = new Logger(TwilioService.name);
  private isInitialized = false;
  private accountSid: string | null = null;

  constructor(private readonly configService: ConfigService, private readonly prisma: PrismaService) {
    this.initializeTwilio();
  }

  private initializeTwilio(): void {
    try {
      const apiKeySid = this.configService.get<string>('TWILIO_API_SID'); // API Key SID (SK...)
      const apiSecret = this.configService.get<string>('TWILIO_SECRET');
      const realAccountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID'); // Account SID real (AC...)
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN'); // Fallback

      // Verificar configuración mínima
      if (!realAccountSid) {
        this.logger.warn('TWILIO_ACCOUNT_SID no configurado. Twilio no estará disponible.');
        return;
      }

      // Verificar formato del Account SID
      if (!realAccountSid.startsWith('AC')) {
        this.logger.error('TWILIO_ACCOUNT_SID debe comenzar con "AC"');
        return;
      }

      // Priorizar Auth Token ya que el API Key no está funcionando
      if (authToken) {
        // Usar Auth Token (método que funciona)
        this.client = new TwilioClient(realAccountSid, authToken);
        this.accountSid = realAccountSid;
        this.logger.log('Twilio inicializado correctamente con Auth Token');
      } else if (apiSecret && apiKeySid) {
        // Intentar con API Key como respaldo
        try {
          this.client = new TwilioClient(apiKeySid, apiSecret, { accountSid: realAccountSid });
          this.accountSid = realAccountSid;
          this.logger.log('Twilio inicializado correctamente con API Key');
        } catch (error) {
          this.logger.error('Error con API Key, usando Auth Token: ', error.message);
          if (authToken) {
            this.client = new TwilioClient(realAccountSid, authToken);
            this.accountSid = realAccountSid;
            this.logger.log('Twilio inicializado con Auth Token (fallback)');
          } else {
            throw new Error('No se pudo inicializar con API Key ni Auth Token');
          }
        }
      } else {
        this.logger.error(`
          Configuración de Twilio incompleta. Necesitas:
          
          Para Auth Token (recomendado - funciona):
          - TWILIO_ACCOUNT_SID=AC... (ya tienes: ${realAccountSid})
          - TWILIO_AUTH_TOKEN=... (ya tienes: ${authToken ? '✅' : '❌'})
          
          Para API Key (opcional - no funciona actualmente):
          - TWILIO_API_SID=SK... (ya tienes: ${apiKeySid ? '✅' : '❌'})
          - TWILIO_SECRET=... (ya tienes: ${apiSecret ? '✅' : '❌'})
          - TWILIO_ACCOUNT_SID=AC... (ya tienes: ${realAccountSid})
        `);
        return;
      }

      this.isInitialized = true;
    } catch (error) {
      this.logger.error('Error al inicializar Twilio:', error);
      this.client = null;
      this.isInitialized = false;
    }
  }

  /**
   * Verifica si Twilio está disponible
   */
  isAvailable(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Obtiene el Account SID real
   */
  getAccountSid(): string | null {
    return this.accountSid;
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
    if (!this.isAvailable()) {
      const error = 'Twilio no está configurado o disponible';
      this.logger.error(error);
      return { success: false, error };
    }

    const messagingServiceSid = this.configService.get<string>('TWILIO_MESSAGING_SERVICE_SID');
    const from = this.configService.get<string>('TWILIO_PHONE_NUMBER') || this.configService.get<string>('TWILIO_FROM');
    const options: SendSmsOptions = { to, body };
    
    if (messagingServiceSid) {
      options.messagingServiceSid = messagingServiceSid;
    } else if (from) {
      options.from = from;
    } else {
      const error = 'No se ha configurado ni messagingServiceSid ni TWILIO_PHONE_NUMBER para Twilio';
      this.logger.error(error);
      return { success: false, error };
    }

    let attempt = 0;
    let lastError: any = null;
    let messageId: string | undefined = undefined;
    
    while (attempt < maxRetries) {
      try {
        const result = await this.client!.messages.create(options);
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
        if (attempt < maxRetries - 1) {
          const delay = 500 * Math.pow(2, attempt);
          this.logger.log(`Esperando ${delay}ms antes de reintentar...`);
          await new Promise(res => setTimeout(res, delay));
        }
      }
      attempt++;
    }
    
    return { success: false, error: lastError?.message };
  }
}

