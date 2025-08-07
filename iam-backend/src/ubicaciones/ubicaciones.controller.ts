import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { UbicacionesService } from './ubicaciones.service';
import { CreateUbicacionDto } from './dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';

@UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
@Controller('ubicaciones')
export class UbicacionesController {
  constructor(private readonly ubicacionesService: UbicacionesService) {}

  @Post()
  async crearUbicacion(
    @Body() createUbicacionDto: CreateUbicacionDto,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.ubicacionesService.crearUbicacion(createUbicacionDto, user.empresaId);
  }

  @Get()
  async obtenerUbicaciones(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.ubicacionesService.obtenerUbicaciones(user.empresaId);
  }

  @Get(':id')
  async obtenerUbicacion(@Param('id') id: string, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.ubicacionesService.obtenerUbicacion(+id, user.empresaId);
  }

  @Get(':id/estadisticas')
  async obtenerEstadisticasUbicacion(@Param('id') id: string, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.ubicacionesService.obtenerEstadisticasUbicacion(+id, user.empresaId);
  }

  @Get(':id/sensores')
  async obtenerSensoresUbicacion(@Param('id') id: string, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.ubicacionesService.obtenerSensoresUbicacion(+id, user.empresaId);
  }

  @Patch(':id')
  async actualizarUbicacion(
    @Param('id') id: string,
    @Body() updateUbicacionDto: UpdateUbicacionDto,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.ubicacionesService.actualizarUbicacion(+id, updateUbicacionDto, user.empresaId);
  }

  @Delete(':id')
  async eliminarUbicacion(@Param('id') id: string, @Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.ubicacionesService.eliminarUbicacion(+id, user.empresaId);
  }
} 