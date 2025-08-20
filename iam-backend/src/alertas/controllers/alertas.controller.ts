import { SeveridadAlerta } from '@prisma/client';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UnifiedEmpresaGuard } from '../../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../../auth/decorators/empresa-required.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import { AlertasService } from '../services/alertas.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CrearAlertaDto, ActualizarAlertaDto } from '../dto/alerta.dto';

@Controller('alertas')
@UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async crearAlerta(
    @Body() createAlertaDto: CrearAlertaDto,
    @CurrentUser() currentUser: JwtUser,
  ) {
    return this.alertasService.crear(
      createAlertaDto,
      currentUser.empresaId!
    );
  }

  @Get()
  async listarAlertas(
    @CurrentUser() currentUser: JwtUser,
    @Query('estado') estado?: string,
    @Query('tipo') tipo?: string,
    @Query('severidad') severidad?: SeveridadAlerta,
  ) {
    return this.alertasService.listar(
      currentUser.empresaId!,
      { estado, tipo, severidad }
    );
  }

  @Get('resumen')
  async obtenerResumen(@CurrentUser() currentUser: JwtUser) {
    return this.alertasService.obtenerResumen(currentUser.empresaId!);
  }

  @Get('configuraciones')
  @Roles('SUPERADMIN', 'ADMIN')
  async listarConfiguraciones(@CurrentUser() currentUser: JwtUser) {
    return this.alertasService.listarConfiguraciones(currentUser.empresaId!);
  }

  @Get(':id')
  async obtenerAlerta(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtUser,
  ) {
    return this.alertasService.obtenerPorId(
      Number(id),
      currentUser.empresaId!
    );
  }

  @Patch(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  async actualizarAlerta(
    @Param('id') id: string,
    @Body() actualizarAlertaDto: ActualizarAlertaDto,
    @CurrentUser() currentUser: JwtUser,
  ) {
    return this.alertasService.actualizar(
      Number(id),
      actualizarAlertaDto,
      currentUser.empresaId!
    );
  }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async eliminarAlerta(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtUser,
  ) {
    return this.alertasService.eliminar(
      Number(id),
      currentUser.empresaId!
    );
  }

  @Post('configuraciones')
  @Roles('SUPERADMIN', 'ADMIN')
  async guardarConfiguracion(
    @Body() configuracion: any,
    @CurrentUser() currentUser: JwtUser,
  ) {
    return this.alertasService.guardarConfiguracion(
      configuracion,
      currentUser.empresaId!
    );
  }

  @Patch('configuraciones/:id')
  @Roles('SUPERADMIN', 'ADMIN')
  async actualizarConfiguracion(
    @Param('id') id: string,
    @Body() configuracion: any,
    @CurrentUser() currentUser: JwtUser,
  ) {
    return this.alertasService.actualizarConfiguracion(
      Number(id),
      configuracion,
      currentUser.empresaId!
    );
  }

  @Delete('configuraciones/:id')
  @Roles('SUPERADMIN', 'ADMIN')
  async eliminarConfiguracion(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtUser,
  ) {
    return this.alertasService.eliminarConfiguracion(
      Number(id),
      currentUser.empresaId!
    );
  }
}
