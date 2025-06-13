import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  getKpis(@Req() req: any) {
    return this.dashboardService.getKpis(req.user.empresaId);
  }

  @Get('stock-chart')
  getStockChart(@Req() req: any) {
    return this.dashboardService.getStockChart(req.user.empresaId);
  }
}
