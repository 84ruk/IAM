import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
  Patch,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { AlertasAvanzadasService } from './alertas-avanzadas.service';
import { ConfigurarAlertaDto } from './dto/configurar-alerta.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { SensorLectura } from './interfaces/sensor-lectura.interface';
import { AlertaConfiguracion, AlertaGenerada } from '../types/alertas';

@UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
@Controller('alertas-avanzadas')
export class AlertasAvanzadasController {
  constructor(private readonly alertasAvanzadasService: AlertasAvanzadasService) {}

  @Post('configurar')
  async configurarAlerta(
    @Body() configurarAlertaDto: ConfigurarAlertaDto,
    @Request() req,
  ): Promise<AlertaConfiguracion> {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }
    return this.alertasAvanzadasService.configurarAlerta(configurarAlertaDto, user.empresaId);
  }

  @Get('configuraciones')
  async obtenerConfiguracionesAlertas(
    @Request() req,
    @Query('ubicacionId') ubicacionId?: string,
  ): Promise<AlertaConfiguracion[]> {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }
    const ubicacionIdNum = ubicacionId ? parseInt(ubicacionId) : undefined;
    // Ya no usamos ubicacionId ya que las alertas están asociadas directamente a los sensores
    return this.alertasAvanzadasService.obtenerConfiguracionesAlertas(user.empresaId);
  }

  @Patch('configuracion/:id')
  async actualizarConfiguracionAlerta(
    @Param('id') id: string,
    @Body() updateData: Partial<ConfigurarAlertaDto>,
    @Request() req,
  ): Promise<AlertaConfiguracion> {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }
    return this.alertasAvanzadasService.actualizarConfiguracionAlerta(+id, updateData, user.empresaId);
  }

  @Delete('configuracion/:id')
  async eliminarConfiguracionAlerta(@Param('id') id: string, @Request() req): Promise<void> {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }
    return this.alertasAvanzadasService.eliminarConfiguracionAlerta(+id, user.empresaId);
  }

  @Post('verificar-lectura')
  async verificarAlertasPorLectura(
    @Body() lectura: SensorLectura,
    @Request() req,
  ): Promise<AlertaGenerada[]> {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }
    return this.alertasAvanzadasService.verificarAlertasPorLectura(lectura, user.empresaId);
  }

  @Post(':id/destinatarios')
  async asociarDestinatarios(
    @Param('id') id: string,
    @Body('destinatarios') destinatarios: number[],
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }
    return this.alertasAvanzadasService.asociarDestinatarios(+id, destinatarios, user.empresaId);
  }

  @Delete(':id/destinatarios/:destinatarioId')
  async desasociarDestinatario(
    @Param('id') id: string,
    @Param('destinatarioId') destinatarioId: string,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }
    return this.alertasAvanzadasService.desasociarDestinatario(+id, +destinatarioId, user.empresaId);
  }

  @Patch(':id/destinatarios')
  async editarDestinatarios(
    @Param('id') id: string,
    @Body('destinatarios') destinatarios: number[],
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }
    return this.alertasAvanzadasService.editarDestinatarios(+id, destinatarios, user.empresaId);
  }
} 