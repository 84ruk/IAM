import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { MovimientoService } from './movimiento.service';
import { CrearMovimientoDto } from './dto/crear-movimiento.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtUser } from 'src/auth/interfaces/jwt-user.interface';
import { TipoMovimiento } from '@prisma/client';
import { CrearMovimientoPorCodigoBarrasDto } from './dto/crear-movimiento-por-codigo-barras.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UnifiedEmpresaGuard } from 'src/auth/guards/unified-empresa.guard';
import { EmpresaRequired } from 'src/auth/decorators/empresa-required.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
@Controller('movimientos')
export class MovimientoController {
  constructor(private readonly movimientoService: MovimientoService) {}

  @Get()
  async listar(
    @CurrentUser() user: JwtUser,
    @Query('tipo') tipo?: TipoMovimiento,
  ) {
    return this.movimientoService.findAll(user.empresaId, tipo);
  }

  @Post()
  crear(@Body() dto: CrearMovimientoDto, @CurrentUser() user: JwtUser) {
    return this.movimientoService.registrar(dto, user.empresaId);
  }

  @Post('codigo-barras')
  async crearPorCodigoBarras(
    @Body() dto: CrearMovimientoPorCodigoBarrasDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.movimientoService.registrarPorCodigoBarras(dto, user.empresaId);
  }

  @Get('producto/:id')
  async obtenerPorProducto(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.movimientoService.obtenerPorProducto(
      Number(id),
      user.empresaId,
    );
  }

  @Get('eliminados')
  async obtenerEliminados(@CurrentUser() user: JwtUser) {
    return this.movimientoService.obtenerEliminados(user.empresaId);
  }

  @Get('eliminados/:id')
  async obtenerEliminadoPorId(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.movimientoService.findOneEliminado(Number(id), user.empresaId);
  }

  @Get(':id')
  async obtenerUno(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.movimientoService.findOne(Number(id), user.empresaId);
  }

  @Patch(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() data: { motivo?: string | null; descripcion?: string | null },
    @CurrentUser() user: JwtUser,
  ) {
    return this.movimientoService.update(Number(id), user.empresaId, data);
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.movimientoService.remove(Number(id), user.empresaId);
  }

  @Delete(':id/permanent')
  async eliminarPermanentemente(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.movimientoService.removePermanentemente(
      Number(id),
      user.empresaId,
    );
  }

  @Patch(':id/restaurar')
  async restaurar(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.movimientoService.restaurar(Number(id), user.empresaId);
  }
}
