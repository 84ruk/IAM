import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InventarioService } from './inventario.service';

@UseGuards(AuthGuard('jwt'))
@Controller('inventario')
export class InventarioController {
  constructor(private readonly service: InventarioService) {}

  
    @Get('kpis')
    async getKpis(@Req() req: any) {
        const empresaId = req.user.empresaId;
        return this.service.getKpis(empresaId);
    }

    @Get('alertas')
    async getAlertas(@Req() req: any) {
        const empresaId = req.user.empresaId;
        return this.service.getAlertas(empresaId);
    }

    @Get('fichas-compra')
    async getFichasCompra(@Req() req: any) {
        const empresaId = req.user.empresaId;
        return this.service.getFichasCompra(empresaId);
    }

}

