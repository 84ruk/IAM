import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SMSWebhookService } from './services/sms-webhook.service';
import { SMSDeliveryStatus, SMSWebhookDto } from './dto/sms-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';

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

@Controller('sms-webhook')
export class SMSWebhookController {
  private readonly logger = new Logger(SMSWebhookController.name);

  constructor(private readonly smsWebhookService: SMSWebhookService) {}

  // Endpoint público para recibir webhooks de proveedores SMS
  @Post('webhook')
  async procesarWebhook(@Body() webhookData: SMSWebhookDto) {
    try {
      // Extraer empresaId del webhook (esto dependerá de tu implementación)
      const empresaId = 1; // Por ahora hardcodeado, deberías extraerlo del webhook
      
      await this.smsWebhookService.procesarWebhook(webhookData, empresaId);
      
      return {
        success: true,
        message: 'Webhook procesado correctamente',
      };
    } catch (error) {
      this.logger.error('Error procesando webhook:', error);
      throw new BadRequestException('Error procesando webhook');
    }
  }

  // Endpoint protegido para obtener logs de entrega
  @UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
  @EmpresaRequired()
  @Get('logs')
  async obtenerLogsEntrega(
    @Request() req,
    @Query('status') status?: SMSDeliveryStatus,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('limit') limit?: string,
  ): Promise<SMSDeliveryLog[]> {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    const filtros = {
      status,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
      limit: limit ? parseInt(limit) : 50,
    };

    return this.smsWebhookService.obtenerLogsEntrega(user.empresaId, filtros);
  }

  // Endpoint protegido para obtener estadísticas
  @UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
  @EmpresaRequired()
  @Get('estadisticas')
  async obtenerEstadisticas(@Request() req): Promise<Record<string, unknown>> {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    return this.smsWebhookService.obtenerEstadisticasEntrega(user.empresaId);
  }

  // Endpoint para simular webhooks (solo en desarrollo)
  @UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
  @EmpresaRequired()
  @Post('simular/:status')
  async simularWebhook(
    @Param('status') status: SMSDeliveryStatus,
    @Body() data: { messageId: string },
    @Request() req,
  ): Promise<Record<string, unknown>> {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    if (!Object.values(SMSDeliveryStatus).includes(status)) {
      throw new BadRequestException('Estado de entrega inválido');
    }

    await this.smsWebhookService.simularWebhook(data.messageId, status, user.empresaId);
    
    return {
      success: true,
      message: `Webhook simulado con estado: ${status}`,
      messageId: data.messageId,
    };
  }
} 