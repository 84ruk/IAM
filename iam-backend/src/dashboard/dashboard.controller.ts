import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtUser } from 'src/auth/interfaces/jwt-user.interface';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @Roles(Rol.ADMIN, Rol.EMPLEADO, Rol.SUPERADMIN)
  async getKpis(@CurrentUser() user: JwtUser) {
    return this.dashboardService.getKpis(user.empresaId);
  }

  @Get('data')
  @Roles(Rol.ADMIN, Rol.EMPLEADO, Rol.SUPERADMIN)
  async getDashboardData(@CurrentUser() user: JwtUser) {
    return this.dashboardService.getDashboardData(user.empresaId);
  }
}
