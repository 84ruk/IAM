import { Controller, Post, Get, Body, Query, UseGuards, Request, Param, Patch, Delete } from '@nestjs/common';
import { SensoresService } from './sensores.service';
import { CreateSensorLecturaDto } from './dto/create-sensor-lectura.dto';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { DashboardUbicacionTiempoRealDto, DashboardAlertasDto } from './dto/dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { SensorTipo } from '@prisma/client';

interface QueryFilters {
  tipo?: SensorTipo;
  productoId?: string;
  desde?: string;
  hasta?: string;
  limite?: string;
}

@UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
@Controller('sensores')
export class SensoresController {
  constructor(private readonly sensoresService: SensoresService) {}

  @Post('lectura')
  async recibirLectura(@Body() dto: CreateSensorLecturaDto, @Request() req) {
    const user = req.user as JwtUser;
    return this.sensoresService.registrarLectura(dto, user.empresaId!);
  }

  @Get('lecturas')
  async obtenerLecturas(@Request() req, @Query() query: QueryFilters) {
    const user = req.user as JwtUser;
    const filtros = {
      tipo: query.tipo,
      productoId: query.productoId ? parseInt(query.productoId) : undefined,
      desde: query.desde ? new Date(query.desde) : undefined,
      hasta: query.hasta ? new Date(query.hasta) : undefined,
      limite: query.limite ? parseInt(query.limite) : 100,
    };
    
    return this.sensoresService.obtenerLecturas(user.empresaId!, filtros);
  }

  @Get('analytics')
  async obtenerAnalytics(@Request() req) {
    const user = req.user as JwtUser;
    return this.sensoresService.obtenerAnalytics(user.empresaId!);
  }

  @Get('alertas')
  async obtenerAlertas(@Request() req) {
    const user = req.user as JwtUser;
    return this.sensoresService.obtenerAlertas(user.empresaId!);
  }

  @Post('simular')
  async simularLectura(@Request() req, @Body() data: { productoId?: number }) {
    const user = req.user as JwtUser;
    return this.sensoresService.simularLectura(user.empresaId!, data.productoId);
  }

  // Nuevos endpoints para gestión de sensores registrados
  @Post('registrar')
  async registrarSensor(@Body() createSensorDto: CreateSensorDto, @Request() req) {
    const user = req.user as JwtUser;
    return this.sensoresService.registrarSensor(createSensorDto, user.empresaId!);
  }

  @Get('listar')
  async obtenerSensores(@Request() req, @Query('ubicacionId') ubicacionId?: string) {
    const user = req.user as JwtUser;
    const ubicacionIdNum = ubicacionId ? parseInt(ubicacionId) : undefined;
    return this.sensoresService.obtenerSensores(user.empresaId!, ubicacionIdNum);
  }

  @Get('sensor/:id')
  async obtenerSensor(@Param('id') id: string, @Request() req) {
    const user = req.user as JwtUser;
    return this.sensoresService.obtenerSensor(+id, user.empresaId!);
  }

  @Patch('sensor/:id')
  async actualizarSensor(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateSensorDto>,
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    return this.sensoresService.actualizarSensor(+id, updateData, user.empresaId!);
  }

  @Delete('sensor/:id')
  async eliminarSensor(@Param('id') id: string, @Request() req) {
    const user = req.user as JwtUser;
    return this.sensoresService.eliminarSensor(+id, user.empresaId!);
  }

  // Endpoints del Dashboard
  @Get('dashboard/ubicaciones')
  async obtenerDashboardUbicaciones(@Request() req) {
    const user = req.user as JwtUser;
    return this.sensoresService.obtenerDashboardUbicaciones(user.empresaId!);
  }

  @Get('dashboard/ubicacion/:id/tiempo-real')
  async obtenerDashboardTiempoReal(
    @Param('id') id: string,
    @Request() req,
    @Query() query: DashboardUbicacionTiempoRealDto,
  ) {
    const user = req.user as JwtUser;
    const opciones = {
      desde: query.desde ? new Date(query.desde) : undefined,
      hasta: query.hasta ? new Date(query.hasta) : undefined,
      limite: query.limite,
    };
    return this.sensoresService.obtenerDashboardTiempoReal(+id, user.empresaId!, opciones);
  }

  @Get('dashboard/alertas')
  async obtenerDashboardAlertas(
    @Request() req,
    @Query() query: DashboardAlertasDto,
  ) {
    const user = req.user as JwtUser;
    const filtros = {
      ubicacionId: query.ubicacionId,
      tipo: query.tipo,
      desde: query.desde ? new Date(query.desde) : undefined,
      hasta: query.hasta ? new Date(query.hasta) : undefined,
    };
    return this.sensoresService.obtenerDashboardAlertas(user.empresaId!, filtros);
  }
}
