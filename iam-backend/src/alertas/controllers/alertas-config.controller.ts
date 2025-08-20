import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UnifiedEmpresaGuard } from '../../auth/guards/unified-empresa.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { EmpresaRequired } from '../../auth/decorators/empresa-required.decorator';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import { AlertasConfigService } from '../services/alertas-config.service';
import { ConfiguracionSistemaAlertasDto } from '../dto/configuracion-sistema-alertas.dto';

@Controller('empresas')
@UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
export class AlertasConfigController {
  constructor(private readonly alertasConfigService: AlertasConfigService) {}

  /**
   * Obtiene la configuración de alertas para una empresa específica.
   */
  @Get(':empresaId/alertas/configuracion')
  @Roles('SUPERADMIN', 'ADMIN')
  @EmpresaRequired()
  @HttpCode(HttpStatus.OK)
  async obtener(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @CurrentUser() currentUser: JwtUser,
  ) {
    this.validarAccesoEmpresa(currentUser, empresaId);
    return this.alertasConfigService.obtenerConfiguracion(empresaId);
  }

  /**
   * Crea la configuración de alertas para la empresa del usuario autenticado.
   */
  @Post('alertas/configuracion')
  @Roles('SUPERADMIN', 'ADMIN')
  @EmpresaRequired()
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Body() config: ConfiguracionSistemaAlertasDto,
    @CurrentUser() currentUser: JwtUser,
  ) {
    this.validarEmpresaUsuario(currentUser);
    return this.alertasConfigService.crear(
      config,
      currentUser.rol,
      currentUser.empresaId!,
    );
  }

  /**
   * Actualiza la configuración de alertas para la empresa del usuario autenticado.
   */
  @Put('alertas/configuracion/:id')
  @Roles('SUPERADMIN', 'ADMIN')
  @EmpresaRequired()
  @HttpCode(HttpStatus.OK)
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() config: ConfiguracionSistemaAlertasDto,
    @CurrentUser() currentUser: JwtUser,
  ) {
    this.validarEmpresaUsuario(currentUser);
    return this.alertasConfigService.actualizar(
      id,
      config,
      currentUser.rol,
      currentUser.empresaId!,
    );
  }

  /**
   * Valida que el usuario tenga acceso a la empresa solicitada.
   */
  private validarAccesoEmpresa(user: JwtUser, empresaId: number) {
    if (user.rol !== 'SUPERADMIN' && user.empresaId !== empresaId) {
      throw new Error('No tienes permisos para acceder a esta empresa');
    }
  }

  /**
   * Valida que el usuario tenga una empresa asignada.
   */
  private validarEmpresaUsuario(user: JwtUser) {
    if (!user.empresaId) {
      throw new Error('El usuario no tiene una empresa asignada');
    }
  }
}


