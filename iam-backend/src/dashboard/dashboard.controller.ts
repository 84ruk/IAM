import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { IndustryKPIService } from './services/industry-kpi.service';
import { PredictionService } from './services/prediction.service';
import { AlertService } from './services/alert.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly industryKPIService: IndustryKPIService,
    private readonly predictionService: PredictionService,
    private readonly alertService: AlertService,
  ) {}

  @Get('kpis')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN, Rol.EMPLEADO)
  async getKpis(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.dashboardService.getKpis(user.empresaId!, user.rol);
  }

  @Get('financial-kpis')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async getFinancialKPIs(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.dashboardService.getFinancialKPIs(user.empresaId!, user.rol);
  }

  @Get('data')
  async getDashboardData(@Request() req) {
    const user = req.user as JwtUser;
    return this.dashboardService.getDashboardData(user.empresaId!);
  }

  @Get('productos-kpi')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN, Rol.EMPLEADO)
  async getProductosKPI(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.dashboardService.getProductosKPI(user.empresaId!, user.rol);
  }

  @Get('movimientos-por-producto')
  async getMovimientosPorProducto(@Request() req) {
    const user = req.user as JwtUser;
    // EmpresaGuard ya valida que empresaId existe
    return this.dashboardService.getMovimientosPorProducto(user.empresaId!);
  }

  @Get('advanced-kpis')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN, Rol.EMPLEADO)
  async getAdvancedKPIs(@Request() req) {
    const user = req.user as JwtUser;
    return this.dashboardService.getAdvancedKPIs(user.empresaId!);
  }

  // 🍎 NUEVOS KPIs ESPECÍFICOS POR INDUSTRIA

  @Get('industry-kpis')
  async getIndustryKPIs(@Request() req, @Query('industry') industry?: string) {
    const user = req.user as JwtUser;
    return this.dashboardService.getIndustryKPIs(user.empresaId!, industry);
  }

  @Get('alimentos-kpis')
  async getAlimentosKPIs(@Request() req) {
    const user = req.user as JwtUser;
    return this.dashboardService.getAlimentosKPIs(user.empresaId!);
  }

  @Get('farmacia-kpis')
  async getFarmaciaKPIs(@Request() req) {
    const user = req.user as JwtUser;
    return this.dashboardService.getFarmaciaKPIs(user.empresaId!);
  }

  @Get('ropa-kpis')
  async getRopaKPIs(@Request() req) {
    const user = req.user as JwtUser;
    return this.dashboardService.getRopaKPIs(user.empresaId!);
  }

  @Get('electronica-kpis')
  async getElectronicaKPIs(@Request() req) {
    const user = req.user as JwtUser;
    return this.dashboardService.getElectronicaKPIs(user.empresaId!);
  }

  // 📊 KPIs OPERACIONALES MEJORADOS

  @Get('operational-kpis')
  async getOperationalKPIs(@Request() req) {
    const user = req.user as JwtUser;
    return this.dashboardService.getOperationalKPIs(user.empresaId!);
  }

  @Get('supplier-kpis')
  async getSupplierKPIs(@Request() req) {
    const user = req.user as JwtUser;
    return this.dashboardService.getSupplierKPIs(user.empresaId!);
  }

  @Get('profitability-kpis')
  async getProfitabilityKPIs(@Request() req) {
    const user = req.user as JwtUser;
    return this.dashboardService.getProfitabilityKPIs(user.empresaId!);
  }

  @Get('sensor-kpis')
  async getSensorKPIs(@Request() req) {
    const user = req.user as JwtUser;
    return this.dashboardService.getSensorKPIs(user.empresaId!);
  }

  // 🔮 KPIs PREDICTIVOS

  @Get('predictive-kpis')
  async getPredictiveKPIs(@Request() req) {
    const user = req.user as JwtUser;
    return this.dashboardService.getPredictiveKPIs(user.empresaId!);
  }

  @Get('demand-forecast')
  async getDemandForecast(@Request() req, @Query('days') days: string = '30') {
    const user = req.user as JwtUser;
    return this.dashboardService.getDemandForecast(user.empresaId!, parseInt(days));
  }

  @Get('expiry-alerts')
  async getExpiryAlerts(@Request() req, @Query('days') days: string = '30') {
    const user = req.user as JwtUser;
    return this.dashboardService.getExpiryAlerts(user.empresaId!, parseInt(days));
  }

  // 🏭 NUEVOS ENDPOINTS PARA SERVICIOS DE INDUSTRIA

  @Get('industry-summary')
  async getIndustrySummary(@Request() req) {
    const user = req.user as JwtUser;
    return this.industryKPIService.getIndustryKPISummary(user.empresaId!);
  }

  @Get('industry-validation')
  async getIndustryValidation(@Request() req) {
    const user = req.user as JwtUser;
    return this.industryKPIService.validateProductosByIndustria(user.empresaId!);
  }

  @Get('industry-recommendations')
  async getIndustryRecommendations(@Request() req) {
    const user = req.user as JwtUser;
    return this.industryKPIService.getIndustryRecommendations(user.empresaId!);
  }

  // 🔮 NUEVOS ENDPOINTS DE PREDICCIÓN

  @Get('predictions/demand')
  async getDemandPredictions(@Request() req, @Query('days') days: string = '30') {
    const user = req.user as JwtUser;
    return this.predictionService.predictDemand(user.empresaId!, parseInt(days));
  }

  @Get('predictions/stockouts')
  async getStockoutPredictions(@Request() req) {
    const user = req.user as JwtUser;
    return this.predictionService.predictStockouts(user.empresaId!);
  }

  @Get('predictions/forecast/:productoId')
  async getDetailedForecast(
    @Request() req, 
    @Query('productoId') productoId: string,
    @Query('days') days: string = '30'
  ) {
    const user = req.user as JwtUser;
    return this.predictionService.getDetailedForecast(user.empresaId!, parseInt(productoId), parseInt(days));
  }

  // 🚨 NUEVOS ENDPOINTS DE ALERTAS

  @Get('alerts/visual')
  async getVisualAlerts(@Request() req) {
    const user = req.user as JwtUser;
    return this.alertService.getVisualAlerts(user.empresaId!);
  }

  @Get('alerts/dashboard')
  async getAlertDashboard(@Request() req) {
    const user = req.user as JwtUser;
    return this.alertService.getAlertDashboard(user.empresaId!);
  }

  @Get('alerts/products-at-risk')
  async getProductosEnRiesgo(@Request() req) {
    const user = req.user as JwtUser;
    return this.alertService.getProductosEnRiesgo(user.empresaId!);
  }

  @Get('alerts/trends')
  async getAlertTrends(@Request() req, @Query('days') days: string = '7') {
    const user = req.user as JwtUser;
    return this.alertService.getAlertTrends(user.empresaId!, parseInt(days));
  }
}
