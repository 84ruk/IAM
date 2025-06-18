import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtUser } from 'src/auth/interfaces/jwt-user.interface';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  getKpis(@CurrentUser() user: JwtUser) {
    return this.dashboardService.getKpis(user.empresaId);
  }

  @Get('stock-chart')
  getStockChart(@CurrentUser() user: JwtUser) {
    return this.dashboardService.getDashboardData(user.empresaId);
  }
}
