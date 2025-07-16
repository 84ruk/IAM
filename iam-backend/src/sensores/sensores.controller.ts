import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { SensoresService } from './sensores.service';
import { CreateSensorLecturaDto } from './dto/create-sensor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sensores')
export class SensoresController {
  constructor(private readonly sensoresService: SensoresService) {}

  @Post('lectura')
  async recibirLectura(@Body() dto: CreateSensorLecturaDto, @Request() req) {
    const user = req.user as JwtUser;
    return this.sensoresService.registrarLectura(dto, user.empresaId!);
  }

  @Get('lecturas')
  async obtenerLecturas(@Request() req, @Query() query: any) {
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
}
