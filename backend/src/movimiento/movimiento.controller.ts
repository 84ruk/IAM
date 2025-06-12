import { Controller, Post, Body, UseGuards, Req, Get, Param } from '@nestjs/common';
import { MovimientoService } from './movimiento.service';
import { CrearMovimientoDto } from './dto/crear-movimiento.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('movimientos')
export class MovimientoController {
  constructor(private readonly movimientoService: MovimientoService) {}

  @Post()
  crear(@Body() dto: CrearMovimientoDto, @Req() req: any) {
    return this.movimientoService.registrar(dto, req.user.empresaId);
  }

  @Get('producto/:id')
  obtenerPorProducto(@Param('id') id: string, @Req() req: any) {
    return this.movimientoService.obtenerPorProducto(Number(id), req.user.empresaId);
  }
}
