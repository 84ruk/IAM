import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { DashboardCQRSService } from './dashboard-cqrs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';

@Controller('dashboard-cqrs')
@UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
export class DashboardCQRSController {
  constructor(
    private readonly dashboardCQRSService: DashboardCQRSService,
  ) {}

  @Get('kpis')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN, Rol.EMPLEADO)
  async getKpis(
    @Request() req,
    @Query('forceRefresh') forceRefresh?: string
  ) {
    const user = req.user as JwtUser;
    return this.dashboardCQRSService.getKpis(
      user.empresaId!,
      user.rol,
      forceRefresh === 'true'
    );
  }

  @Get('financial-kpis')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async getFinancialKPIs(
    @Request() req,
    @Query('period') period?: string,
    @Query('forceRefresh') forceRefresh?: string
  ) {
    const user = req.user as JwtUser;
    return this.dashboardCQRSService.getFinancialKPIs(
      user.empresaId!,
      user.rol,
      period,
      forceRefresh === 'true'
    );
  }

  @Get('industry-kpis')
  async getIndustryKPIs(
    @Request() req,
    @Query('industry') industry?: string,
    @Query('forceRefresh') forceRefresh?: string
  ) {
    const user = req.user as JwtUser;
    return this.dashboardCQRSService.getIndustryKPIs(
      user.empresaId!,
      industry,
      user.rol,
      forceRefresh === 'true'
    );
  }

  @Get('predictive-kpis')
  async getPredictiveKPIs(
    @Request() req,
    @Query('days') days?: string,
    @Query('forceRefresh') forceRefresh?: string
  ) {
    const user = req.user as JwtUser;
    return this.dashboardCQRSService.getPredictiveKPIs(
      user.empresaId!,
      days ? parseInt(days) : 30,
      user.rol,
      forceRefresh === 'true'
    );
  }

  @Get('data')
  async getDashboardData(@Request() req) {
    const user = req.user as JwtUser;
    return this.dashboardCQRSService.getDashboardData(user.empresaId!, user.rol);
  }

  @Get('cache/stats')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async getCacheStats() {
    return this.dashboardCQRSService.getCacheStats();
  }

  @Get('cache/invalidate')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async invalidateCache(
    @Request() req,
    @Query('cacheType') cacheType?: string
  ) {
    const user = req.user as JwtUser;
    await this.dashboardCQRSService.invalidateCache(user.empresaId!, cacheType);
    return { message: 'Cache invalidado exitosamente' };
  }
} 