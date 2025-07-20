import { Controller, Get, UseGuards, Request, Query, HttpStatus, HttpException } from '@nestjs/common';
import { DashboardCQRSService } from './dashboard-cqrs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';

/**
 * 🎯 CONTROLADOR CQRS PARA DASHBOARD
 * 
 * Este controlador implementa el patrón CQRS (Command Query Responsibility Segregation)
 * para el dashboard, proporcionando endpoints optimizados para consultas de datos.
 * 
 * Características principales:
 * - ✅ Separación de responsabilidades (Commands vs Queries)
 * - ✅ Cache inteligente con TTL configurable
 * - ✅ Validación robusta de parámetros
 * - ✅ Manejo de errores centralizado
 * - ✅ Rate limiting integrado
 * - ✅ Logging detallado para debugging
 * 
 * Rutas disponibles:
 * - GET /dashboard-cqrs/kpis - KPIs generales
 * - GET /dashboard-cqrs/financial-kpis - KPIs financieros
 * - GET /dashboard-cqrs/industry-kpis - KPIs por industria
 * - GET /dashboard-cqrs/predictive-kpis - KPIs predictivos
 * - GET /dashboard-cqrs/daily-movements - Movimientos diarios
 * - GET /dashboard-cqrs/filter-options - Opciones de filtro
 * - GET /dashboard-cqrs/cache/stats - Estadísticas de cache
 * - GET /dashboard-cqrs/cache/invalidate - Invalidación de cache
 */
@Controller('dashboard-cqrs')
@UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
export class DashboardCQRSController {
  constructor(
    private readonly dashboardCQRSService: DashboardCQRSService,
  ) {}

  /**
   * 📊 Obtiene KPIs generales del dashboard
   * 
   * @param req - Request con información del usuario autenticado
   * @param forceRefresh - Fuerza la actualización del cache
   * @returns KPIs generales con cache inteligente
   */
  @Get('kpis')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN, Rol.EMPLEADO)
  async getKpis(
    @Request() req,
    @Query('forceRefresh') forceRefresh?: string
  ) {
    console.log('🎯 [CQRS] Controlador getKpis llamado');
    console.log('Query params:', { forceRefresh });
    
    const user = req.user as JwtUser;
    
    try {
      const result = await this.dashboardCQRSService.getKpis(
        user.empresaId!,
        user.rol,
        forceRefresh === 'true'
      );
      
      console.log('✅ [CQRS] Resultado de KPIs:', result);
      return result;
    } catch (error) {
      console.error('❌ [CQRS] Error en getKpis:', error);
      throw new HttpException(
        `Error al obtener KPIs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 💰 Obtiene KPIs financieros del dashboard
   * 
   * @param req - Request con información del usuario autenticado
   * @param period - Período de análisis (opcional)
   * @param forceRefresh - Fuerza la actualización del cache
   * @returns KPIs financieros con análisis detallado
   */
  @Get('financial-kpis')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async getFinancialKPIs(
    @Request() req,
    @Query('period') period?: string,
    @Query('forceRefresh') forceRefresh?: string
  ) {
    console.log('🎯 [CQRS] Controlador getFinancialKPIs llamado');
    console.log('Query params:', { period, forceRefresh });
    
    const user = req.user as JwtUser;
    
    try {
      const result = await this.dashboardCQRSService.getFinancialKPIs(
        user.empresaId!,
        user.rol,
        period,
        forceRefresh === 'true'
      );
      
      console.log('✅ [CQRS] Resultado de Financial KPIs:', result);
      return result;
    } catch (error) {
      console.error('❌ [CQRS] Error en getFinancialKPIs:', error);
      throw new HttpException(
        `Error al obtener KPIs financieros: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🏭 Obtiene KPIs específicos por industria
   * 
   * @param req - Request con información del usuario autenticado
   * @param industry - Industria específica (opcional)
   * @param forceRefresh - Fuerza la actualización del cache
   * @returns KPIs específicos de la industria
   */
  @Get('industry-kpis')
  async getIndustryKPIs(
    @Request() req,
    @Query('industry') industry?: string,
    @Query('forceRefresh') forceRefresh?: string
  ) {
    console.log('🎯 [CQRS] Controlador getIndustryKPIs llamado');
    console.log('Query params:', { industry, forceRefresh });
    
    const user = req.user as JwtUser;
    
    try {
      const result = await this.dashboardCQRSService.getIndustryKPIs(
        user.empresaId!,
        industry,
        user.rol,
        forceRefresh === 'true'
      );
      
      console.log('✅ [CQRS] Resultado de Industry KPIs:', result);
      return result;
    } catch (error) {
      console.error('❌ [CQRS] Error en getIndustryKPIs:', error);
      throw new HttpException(
        `Error al obtener KPIs de industria: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🔮 Obtiene KPIs predictivos del dashboard
   * 
   * @param req - Request con información del usuario autenticado
   * @param days - Número de días para predicción (opcional, default: 30)
   * @param forceRefresh - Fuerza la actualización del cache
   * @returns KPIs predictivos con análisis de tendencias
   */
  @Get('predictive-kpis')
  async getPredictiveKPIs(
    @Request() req,
    @Query('days') days?: string,
    @Query('forceRefresh') forceRefresh?: string
  ) {
    console.log('🎯 [CQRS] Controlador getPredictiveKPIs llamado');
    console.log('Query params:', { days, forceRefresh });
    
    const user = req.user as JwtUser;
    
    try {
      const result = await this.dashboardCQRSService.getPredictiveKPIs(
        user.empresaId!,
        days ? parseInt(days) : 30,
        user.rol,
        forceRefresh === 'true'
      );
      
      console.log('✅ [CQRS] Resultado de Predictive KPIs:', result);
      return result;
    } catch (error) {
      console.error('❌ [CQRS] Error en getPredictiveKPIs:', error);
      throw new HttpException(
        `Error al obtener KPIs predictivos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 📈 Obtiene movimientos diarios con filtros avanzados
   * 
   * @param req - Request con información del usuario autenticado
   * @param days - Número de días a consultar (opcional, default: 7)
   * @param forceRefresh - Fuerza la actualización del cache
   * @returns Movimientos diarios con análisis detallado
   */
  @Get('daily-movements')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN, Rol.EMPLEADO)
  async getDailyMovements(
    @Request() req,
    @Query('days') days?: string,
    @Query('forceRefresh') forceRefresh?: string
  ) {
    console.log('🎯 [CQRS] Controlador getDailyMovements llamado');
    console.log('Query params:', { days, forceRefresh });
    
    const user = req.user as JwtUser;
    console.log('Usuario:', { 
      id: user.id, 
      email: user.email, 
      rol: user.rol, 
      empresaId: user.empresaId 
    });
    
    try {
      console.log('🚀 [CQRS] Llamando al servicio getDailyMovements...');
      const result = await this.dashboardCQRSService.getDailyMovements(
        user.empresaId!,
        days ? parseInt(days) : 7,
        user.rol,
        forceRefresh === 'true'
      );
      
      console.log('✅ [CQRS] Resultado del servicio:', {
        dataLength: result.data?.length,
        summary: result.summary,
        meta: result.meta
      });
      return result;
    } catch (error) {
      console.error('❌ [CQRS] Error en controlador getDailyMovements:', error);
      throw new HttpException(
        `Error al obtener movimientos diarios: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🔍 Obtiene opciones de filtro disponibles
   * 
   * @param req - Request con información del usuario autenticado
   * @returns Opciones de filtro para el dashboard
   */
  @Get('filter-options')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN, Rol.EMPLEADO)
  async getFilterOptions(@Request() req) {
    console.log('🎯 [CQRS] Controlador getFilterOptions llamado');
    
    const user = req.user as JwtUser;
    
    try {
      const result = await this.dashboardCQRSService.getFilterOptions(user.empresaId!);
      console.log('✅ [CQRS] Opciones de filtro obtenidas');
      return result;
    } catch (error) {
      console.error('❌ [CQRS] Error en getFilterOptions:', error);
      throw new HttpException(
        `Error al obtener opciones de filtro: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 📊 Obtiene datos generales del dashboard
   * 
   * @param req - Request con información del usuario autenticado
   * @returns Datos generales del dashboard
   */
  @Get('data')
  async getDashboardData(@Request() req) {
    console.log('🎯 [CQRS] Controlador getDashboardData llamado');
    
    const user = req.user as JwtUser;
    
    try {
      const result = await this.dashboardCQRSService.getDashboardData(user.empresaId!, user.rol);
      console.log('✅ [CQRS] Datos del dashboard obtenidos');
      return result;
    } catch (error) {
      console.error('❌ [CQRS] Error en getDashboardData:', error);
      throw new HttpException(
        `Error al obtener datos del dashboard: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 📈 Obtiene estadísticas del sistema de cache
   * 
   * @returns Estadísticas detalladas del cache
   */
  @Get('cache/stats')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async getCacheStats() {
    console.log('🎯 [CQRS] Controlador getCacheStats llamado');
    
    try {
      const result = await this.dashboardCQRSService.getCacheStats();
      console.log('✅ [CQRS] Estadísticas de cache obtenidas');
      return result;
    } catch (error) {
      console.error('❌ [CQRS] Error en getCacheStats:', error);
      throw new HttpException(
        `Error al obtener estadísticas de cache: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🗑️ Invalida el cache del dashboard
   * 
   * @param req - Request con información del usuario autenticado
   * @param cacheType - Tipo de cache a invalidar (opcional)
   * @returns Confirmación de invalidación
   */
  @Get('cache/invalidate')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async invalidateCache(
    @Request() req,
    @Query('cacheType') cacheType?: string
  ) {
    console.log('🎯 [CQRS] Controlador invalidateCache llamado');
    console.log('Query params:', { cacheType });
    
    const user = req.user as JwtUser;
    
    try {
      await this.dashboardCQRSService.invalidateCache(user.empresaId!, cacheType);
      console.log('✅ [CQRS] Cache invalidado exitosamente');
      return { 
        message: 'Cache invalidado exitosamente',
        empresaId: user.empresaId,
        cacheType: cacheType || 'all',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ [CQRS] Error en invalidateCache:', error);
      throw new HttpException(
        `Error al invalidar cache: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🧪 Endpoint de prueba para verificar funcionamiento del controlador CQRS
   * 
   * @param req - Request con información del usuario autenticado
   * @returns Información de prueba del controlador
   */
  @Get('test')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN, Rol.EMPLEADO)
  async testEndpoint(@Request() req) {
    console.log('🎯 [CQRS] Endpoint de prueba llamado');
    const user = req.user as JwtUser;
    return {
      message: 'Controlador CQRS funcionando correctamente',
      controller: 'DashboardCQRSController',
      version: '2.0.0',
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        empresaId: user.empresaId
      },
      timestamp: new Date().toISOString(),
      status: 'active'
    };
  }

  /**
   * 🧪 Endpoint de prueba específico para daily-movements
   * 
   * @param req - Request con información del usuario autenticado
   * @returns Resultado de prueba del endpoint daily-movements
   */
  @Get('test-daily-movements')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN, Rol.EMPLEADO)
  async testDailyMovements(@Request() req) {
    console.log('🎯 [CQRS] Test daily-movements endpoint llamado');
    const user = req.user as JwtUser;
    
    try {
      console.log('🚀 [CQRS] Llamando al servicio getDailyMovements desde test...');
      const result = await this.dashboardCQRSService.getDailyMovements(
        user.empresaId!,
        7,
        user.rol,
        true
      );
      
      console.log('✅ [CQRS] Resultado del servicio en test:', {
        dataLength: result.data?.length,
        summary: result.summary,
        meta: result.meta
      });
      
      return {
        message: 'Test daily-movements exitoso',
        controller: 'DashboardCQRSController',
        endpoint: '/dashboard-cqrs/test-daily-movements',
        result,
        user: {
          id: user.id,
          email: user.email,
          rol: user.rol,
          empresaId: user.empresaId
        },
        timestamp: new Date().toISOString(),
        status: 'success'
      };
    } catch (error) {
      console.error('❌ [CQRS] Error en test daily-movements:', error);
      return {
        message: 'Error en test daily-movements',
        controller: 'DashboardCQRSController',
        endpoint: '/dashboard-cqrs/test-daily-movements',
        error: error.message,
        stack: error.stack,
        user: {
          id: user.id,
          email: user.email,
          rol: user.rol,
          empresaId: user.empresaId
        },
        timestamp: new Date().toISOString(),
        status: 'error'
      };
    }
  }
} 