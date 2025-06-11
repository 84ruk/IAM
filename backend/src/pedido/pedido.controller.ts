import { Controller, Post, Body, Req, Get, UseGuards } from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { CrearPedidoDto } from './dto/crear-pedido.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('pedidos')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Post()
  async crearPedido(@Body() dto: CrearPedidoDto, @Req() req: any) {
    const empresaId = req.user.empresaId;
    return this.pedidoService.generarPedido(dto.productoId, dto.proveedorId, dto.cantidad, empresaId);
  }

  @Get()
  async obtenerPedidos(@Req() req: any) {
    const empresaId = req.user.empresaId;
    return this.pedidoService.obtenerPedidosPorEmpresa(empresaId);
  }
}
