import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DestinatarioAlertaService } from '../services/destinatario-alerta.service';
import { CreateDestinatarioAlertaDto } from '../dto/create-destinatario-alerta.dto';
import { UpdateDestinatarioAlertaDto } from '../dto/update-destinatario-alerta.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import { Rol } from '@prisma/client';
import { EmpresaRequired } from '../../auth/decorators/empresa-required.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('destinatarios-alerta')
export class DestinatarioAlertaController {
  constructor(private readonly destinatarioService: DestinatarioAlertaService) {}

  @Post()
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @EmpresaRequired()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateDestinatarioAlertaDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.destinatarioService.create(createDto, user.rol, user.empresaId || 0);
  }

  @Get()
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @EmpresaRequired()
  async findAll(@CurrentUser() user: JwtUser) {
    return this.destinatarioService.findAll(user.rol, user.empresaId ?? 0);
  }

  @Patch(':id')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @EmpresaRequired()
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDestinatarioAlertaDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.destinatarioService.update(Number(id), updateDto, user.rol, user.empresaId || 0);
  }

  @Delete(':id')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @EmpresaRequired()
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.destinatarioService.remove(Number(id), user.rol, user.empresaId || 0);
  }
}
