import { Controller, Post, Body, Req, Get, UseGuards } from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { CrearPedidoDto } from './dto/crear-pedido.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { EmpresaRequiredGuard } from 'src/auth/guards/empresa-required.guard';
import { EmpresaRequired } from 'src/auth/decorators/empresa-required.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard, EmpresaRequiredGuard)
@EmpresaRequired()
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
