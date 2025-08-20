import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UnifiedEmpresaGuard } from '../../auth/guards/unified-empresa.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import { ConfiguracionSensorAlertasService } from '../services/configuracion-sensor-alertas.service';
import { ConfiguracionAlertaDto, DestinatarioDto } from '../dto/configuracion-alerta.dto';

@Controller('sensores/alertas/config')
@UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
export class ConfiguracionSensorAlertasController {
  constructor(
    private readonly configService: ConfiguracionSensorAlertasService,
  ) {}

  @Get(':sensorId')
  async obtenerConfiguracion(
    @Param('sensorId') sensorId: string,
    @CurrentUser() currentUser: JwtUser,
  ) {
    const id = parseInt(sensorId);
    if (isNaN(id)) {
      throw new Error('ID de sensor inválido');
    }
    return this.configService.obtenerConfiguracion(
      id,
      currentUser.empresaId!,
    );
  }

  @Put(':sensorId')
  async actualizarConfiguracion(
    @Param('sensorId') sensorId: string,
    @Body() config: ConfiguracionAlertaDto,
    @CurrentUser() currentUser: JwtUser,
  ) {
    const id = parseInt(sensorId);
    if (isNaN(id)) {
      throw new Error('ID de sensor inválido');
    }
    return this.configService.actualizarConfiguracion(
      id,
      currentUser.empresaId!,
      config,
    );
  }

  @Post(':sensorId/destinatarios')
  async agregarDestinatario(
    @Param('sensorId') sensorId: string,
    @Body() destinatario: DestinatarioDto,
    @CurrentUser() currentUser: JwtUser,
  ) {
    const id = parseInt(sensorId);
    if (isNaN(id)) {
      throw new Error('ID de sensor inválido');
    }
    return this.configService.agregarDestinatario(
      id,
      currentUser.empresaId!,
      destinatario,
    );
  }

  @Delete(':sensorId/destinatarios/:destinatarioId')
  async eliminarDestinatario(
    @Param('sensorId') sensorId: string,
    @Param('destinatarioId') destinatarioId: string,
    @CurrentUser() currentUser: JwtUser,
  ) {
    if (!currentUser.empresaId) {
      throw new Error('Usuario sin empresa asignada');
    }
    return this.configService.eliminarDestinatario(
      parseInt(sensorId),
      parseInt(destinatarioId),
      currentUser.empresaId,
    );
  }
}
