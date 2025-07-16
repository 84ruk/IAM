import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InventarioService } from './inventario.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UnifiedEmpresaGuard } from 'src/auth/guards/unified-empresa.guard';
import { EmpresaRequired } from 'src/auth/decorators/empresa-required.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
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

    @Get('prediccion-quiebre')
    async getPrediccion(@Req() req: any) {
        const empresaId = req.user.empresaId;
        return this.service.predecirQuiebre(empresaId);
    }

    @Get('serie-historica/:productoId')
    async getSerieHistorica(
    @Param('productoId') productoId: string,
    @Query('dias') dias: string,
    ) {
        const id = parseInt(productoId);
        const nDias = parseInt(dias || '30');
        return this.service.getSerieHistorica(id, nDias);
    }


}

