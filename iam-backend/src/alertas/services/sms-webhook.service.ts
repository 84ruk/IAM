import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SMSDeliveryStatus, SMSWebhookDto } from '../dto/sms-webhook.dto';
import { SensoresGateway } from '../../websockets/sensores/sensores.gateway';

interface SMSDeliveryLog {
  id: number;
  messageId: string;
  to: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  provider: string;
  empresaId: number;
  alertaId?: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  alerta?: {
    id: number;
    tipo: string;
    mensaje: string;
  } | null;
}

interface FiltrosLogs {
  status?: SMSDeliveryStatus;
  desde?: Date;
  hasta?: Date;
  limit?: number;
}

@Injectable()
export class SMSWebhookService {
  private readonly logger = new Logger(SMSWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly sensoresGateway?: SensoresGateway,
  ) {}

  async procesarWebhook(webhookData: SMSWebhookDto, empresaId: number): Promise<void> {
    try {
      // Registrar el log de entrega
      await this.prisma.sMSDeliveryLog.create({
        data: {
          messageId: webhookData.messageId,
          to: webhookData.to || '',
          status: webhookData.status,
          errorCode: webhookData.errorCode,
          errorMessage: webhookData.errorMessage,
          provider: webhookData.provider || 'unknown',
          empresaId,
        },
      });

      this.logger.log(`Webhook SMS procesado: ${webhookData.messageId} - ${webhookData.status}`);

      // Emitir evento WebSocket si está disponible
      await this.emitirEventoWebSocket(webhookData, empresaId);

      // Si hay error, registrar para análisis
      if (webhookData.status === SMSDeliveryStatus.FAILED && webhookData.errorMessage) {
        this.logger.warn(`SMS fallido: ${webhookData.messageId} - ${webhookData.errorMessage}`);
      }
    } catch (error) {
      this.logger.error('Error procesando webhook SMS:', error);
      throw error;
    }
  }

  private async emitirEventoWebSocket(webhookData: SMSWebhookDto, empresaId: number): Promise<void> {
    try {
      if (this.sensoresGateway) {
        await this.sensoresGateway.emitirEstadoSensores({
          tipo: 'sms_webhook',
          data: {
            messageId: webhookData.messageId,
            status: webhookData.status,
            timestamp: new Date(),
          },
        }, empresaId);
      }
    } catch (error) {
      this.logger.error('Error emitiendo evento WebSocket:', error);
    }
  }

  async obtenerLogsEntrega(empresaId: number, filtros?: FiltrosLogs): Promise<SMSDeliveryLog[]> {
    const where: Record<string, unknown> = { empresaId };

    if (filtros?.status) {
      where.status = filtros.status;
    }

    if (filtros?.desde || filtros?.hasta) {
      where.timestamp = {};
      if (filtros.desde) {
        (where.timestamp as Record<string, unknown>).gte = filtros.desde;
      }
      if (filtros.hasta) {
        (where.timestamp as Record<string, unknown>).lte = filtros.hasta;
      }
    }

    const logs = await this.prisma.sMSDeliveryLog.findMany({
      where,
      include: {
        alerta: {
          select: {
            id: true,
            tipo: true,
            mensaje: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: filtros?.limit || 50,
    });

    return logs as SMSDeliveryLog[];
  }

  async obtenerEstadisticasEntrega(empresaId: number): Promise<Record<string, unknown>> {
    const logs = await this.prisma.sMSDeliveryLog.findMany({
      where: { empresaId },
      select: { status: true, timestamp: true },
    });

    const total = logs.length;
    const exitosos = logs.filter(log => log.status === 'DELIVERED').length;
    const fallidos = logs.filter(log => log.status === 'FAILED').length;
    const pendientes = logs.filter(log => log.status === 'PENDING').length;

    // Estadísticas por día (últimos 7 días)
    const sieteDiasAtras = new Date();
    sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);

    const logsRecientes = logs.filter(log => log.timestamp >= sieteDiasAtras);
    const porDia = logsRecientes.reduce((acc, log) => {
      const fecha = log.timestamp.toISOString().split('T')[0];
      acc[fecha] = (acc[fecha] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      exitosos,
      fallidos,
      pendientes,
      tasaExito: total > 0 ? (exitosos / total) * 100 : 0,
      porDia,
    };
  }

  async simularWebhook(messageId: string, status: SMSDeliveryStatus, empresaId: number): Promise<void> {
    const webhookData: SMSWebhookDto = {
      messageId,
      to: '+1234567890',
      status,
      provider: 'twilio',
      timestamp: new Date().toISOString(),
      errorCode: status === SMSDeliveryStatus.FAILED ? 'SIMULATED_ERROR' : undefined,
      errorMessage: status === SMSDeliveryStatus.FAILED ? 'Error simulado para pruebas' : undefined,
    };

    await this.procesarWebhook(webhookData, empresaId);
  }
} 