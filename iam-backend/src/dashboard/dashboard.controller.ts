import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  async getKpis(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.dashboardService.getKpis(user.empresaId!);
  }

  @Get('financial-kpis')
  async getFinancialKPIs(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.dashboardService.getFinancialKPIs(user.empresaId!);
  }

  @Get('data')
  async getDashboardData(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.dashboardService.getDashboardData(user.empresaId!);
  }

  @Get('productos-kpi')
  async getProductosKPI(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.dashboardService.getProductosKPI(user.empresaId!);
  }

  @Get('movimientos-por-producto')
  async getMovimientosPorProducto(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.dashboardService.getMovimientosPorProducto(user.empresaId!);
  }

  @Get('advanced-kpis')
  async getAdvancedKPIs(@Request() req) {
    const user = req.user as JwtUser;
    return this.dashboardService.getAdvancedKPIs(user.empresaId!);
  }
}
