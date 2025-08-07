import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { SMSNotificationService, SMSMessage } from './services/sms-notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';

export class EnviarSMSDto {
  to: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export class EnviarBulkSMSDto {
  messages: {
    to: string;
    message: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }[];
}

@UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
@Controller('sms')
export class SMSController {
  constructor(private readonly smsService: SMSNotificationService) {}

  @Post('enviar')
  async enviarSMS(
    @Body() dto: EnviarSMSDto,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    if (!this.smsService.validatePhoneNumber(dto.to)) {
      throw new BadRequestException('Número de teléfono inválido');
    }

    const message: SMSMessage = {
      to: this.smsService.formatPhoneNumber(dto.to),
      message: dto.message,
      priority: dto.priority || 'normal',
    };

    const success = await this.smsService.sendSMS(message);
    
    return {
      success,
      message: success ? 'SMS enviado correctamente' : 'Error enviando SMS',
      to: message.to,
    };
  }

  @Post('enviar-bulk')
  async enviarBulkSMS(
    @Body() dto: EnviarBulkSMSDto,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    // Validar números de teléfono
    const invalidNumbers = dto.messages.filter(msg => !this.smsService.validatePhoneNumber(msg.to));
    if (invalidNumbers.length > 0) {
      throw new BadRequestException(`Números inválidos: ${invalidNumbers.map(m => m.to).join(', ')}`);
    }

    const messages: SMSMessage[] = dto.messages.map(msg => ({
      to: this.smsService.formatPhoneNumber(msg.to),
      message: msg.message,
      priority: msg.priority || 'normal',
    }));

    const result = await this.smsService.sendBulkSMS(messages);
    
    return {
      success: result.success,
      failed: result.failed,
      total: messages.length,
      message: `Enviados: ${result.success}, Fallidos: ${result.failed}`,
    };
  }

  @Post('validar-numero')
  async validarNumero(@Body() data: { phoneNumber: string }) {
    const isValid = this.smsService.validatePhoneNumber(data.phoneNumber);
    const formatted = isValid ? this.smsService.formatPhoneNumber(data.phoneNumber) : null;
    
    return {
      isValid,
      formatted,
      original: data.phoneNumber,
    };
  }

  @Get('configuracion')
  async obtenerConfiguracion(@Request() req) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    // Retornar configuración del proveedor SMS (sin datos sensibles)
    return {
      provider: process.env.SMS_PROVIDER || 'twilio',
      hasConfig: !!(process.env.TWILIO_ACCOUNT_SID || process.env.AWS_ACCESS_KEY_ID || process.env.SMS_CUSTOM_ENDPOINT),
    };
  }
} 