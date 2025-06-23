import { Controller, Post, Body, UseGuards, Req, Get, Param, Query } from '@nestjs/common';
import { MovimientoService } from './movimiento.service';
import { CrearMovimientoDto } from './dto/crear-movimiento.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtUser } from 'src/auth/interfaces/jwt-user.interface';
import { TipoMovimiento } from '@prisma/client';

@UseGuards(AuthGuard('jwt'))
@Controller('movimientos')
export class MovimientoController {
  constructor(private readonly movimientoService: MovimientoService) {}


  @Get()
  async listar(
    @CurrentUser() user: JwtUser,
    @Query('tipo') tipo?: TipoMovimiento
  ) {
    return this.movimientoService.findAll(user.empresaId, tipo);
  }


  @Post()
  crear(@Body() dto: CrearMovimientoDto, @CurrentUser() user: JwtUser) {
    return this.movimientoService.registrar(dto, user.empresaId);
  }


  @Get('producto/:id')
  async obtenerPorProducto(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.movimientoService.obtenerPorProducto(Number(id), user.empresaId);
  }
}
