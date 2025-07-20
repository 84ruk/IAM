import { Injectable, Logger } from '@nestjs/common';
import { GetKpisHandler } from './handlers/get-kpis.handler';
import { GetFinancialKpisHandler } from './handlers/get-financial-kpis.handler';
import { GetIndustryKpisHandler } from './handlers/get-industry-kpis.handler';
import { GetPredictiveKpisHandler } from './handlers/get-predictive-kpis.handler';
import { GetDailyMovementsHandler } from './handlers/get-daily-movements.handler';
import { GetKpisQuery } from './queries/get-kpis.query';
import { GetFinancialKpisQuery } from './queries/get-financial-kpis.query';
import { GetIndustryKpisQuery } from './queries/get-industry-kpis.query';
import { GetPredictiveKpisQuery } from './queries/get-predictive-kpis.query';
import { GetDailyMovementsQuery } from './queries/get-daily-movements.query';
import { KPIData } from './interfaces/kpi-data.interface';
import { FinancialKPIs } from './interfaces/financial-kpis.interface';
import { DailyMovementsResponse } from './interfaces/daily-movements.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardCQRSService {
  private readonly logger = new Logger(DashboardCQRSService.name);

  constructor(
    private readonly getKpisHandler: GetKpisHandler,
    private readonly getFinancialKpisHandler: GetFinancialKpisHandler,
    private readonly getIndustryKpisHandler: GetIndustryKpisHandler,
    private readonly getPredictiveKpisHandler: GetPredictiveKpisHandler,
    private readonly getDailyMovementsHandler: GetDailyMovementsHandler,
    private readonly prisma: PrismaService,
  ) {}

  // QUERIES - Operaciones de lectura
  async getKpis(empresaId: number, userRole?: string, forceRefresh?: boolean): Promise<KPIData> {
    const query = new GetKpisQuery(empresaId, userRole, forceRefresh);
    return this.getKpisHandler.execute(query);
  }

  async getFinancialKPIs(empresaId: number, userRole?: string, period?: string, forceRefresh?: boolean): Promise<FinancialKPIs> {
    const query = new GetFinancialKpisQuery(empresaId, userRole, period, forceRefresh);
    return this.getFinancialKpisHandler.execute(query);
  }

  async getIndustryKPIs(empresaId: number, industry?: string, userRole?: string, forceRefresh?: boolean): Promise<any> {
    const query = new GetIndustryKpisQuery(empresaId, industry, userRole, forceRefresh);
    return this.getIndustryKpisHandler.execute(query);
  }

  async getPredictiveKPIs(empresaId: number, days?: number, userRole?: string, forceRefresh?: boolean): Promise<any> {
    const query = new GetPredictiveKpisQuery(empresaId, days, userRole, forceRefresh);
    return this.getPredictiveKpisHandler.execute(query);
  }

  async getDailyMovements(empresaId: number, days?: number, userRole?: string, forceRefresh?: boolean): Promise<DailyMovementsResponse> {
    this.logger.log('🎯 Servicio getDailyMovements llamado', { empresaId, days, userRole, forceRefresh });
    
    try {
      const query = new GetDailyMovementsQuery(empresaId, userRole, days, forceRefresh);
      this.logger.log('✅ Query creada', { 
        empresaId: query.empresaId,
        userRole: query.userRole,
        days: query.days,
        forceRefresh: query.forceRefresh
      });
      
      this.logger.log('🚀 Ejecutando handler...');
      const result = await this.getDailyMovementsHandler.execute(query);
      this.logger.log('✅ Resultado obtenido del handler', { 
        dataLength: result.data?.length,
        summary: result.summary,
        meta: result.meta
      });
      
      return result;
    } catch (error) {
      this.logger.error('❌ Error en servicio getDailyMovements', error);
      throw error;
    }
  }

  async getFilterOptions(empresaId: number) {
    this.logger.log('Obteniendo opciones de filtro', { empresaId });
    
    try {
      // Obtener productos activos
      const products = await this.prisma.producto.findMany({
        where: { 
          empresaId, 
          estado: 'ACTIVO'
        },
        select: {
          id: true,
          nombre: true,
          etiquetas: true
        },
        orderBy: { nombre: 'asc' }
      });

      // Obtener proveedores activos
      const suppliers = await this.prisma.proveedor.findMany({
        where: { 
          empresaId, 
          estado: 'ACTIVO'
        },
        select: {
          id: true,
          nombre: true
        },
        orderBy: { nombre: 'asc' }
      });

      // Obtener usuarios activos
      const users = await this.prisma.usuario.findMany({
        where: { 
          empresaId, 
          activo: true
        },
        select: {
          id: true,
          nombre: true,
          email: true
        },
        orderBy: { nombre: 'asc' }
      });

      // Obtener categorías únicas de productos
      const categories = await this.prisma.producto.findMany({
        where: { 
          empresaId, 
          estado: 'ACTIVO'
        },
        select: {
          etiquetas: true
        }
      });

      // Obtener motivos únicos de movimientos
      const reasons = await this.prisma.movimientoInventario.findMany({
        where: { 
          empresaId,
          estado: 'ACTIVO'
        },
        select: {
          motivo: true
        },
        distinct: ['motivo']
      });

      // Procesar categorías (etiquetas)
      const uniqueCategories = new Set<string>();
      categories.forEach(product => {
        if (product.etiquetas && Array.isArray(product.etiquetas)) {
          product.etiquetas.forEach(tag => uniqueCategories.add(tag));
        }
      });

      // Rangos de fechas predefinidos
      const dateRanges = [
        { value: '7d', label: 'Últimos 7 días' },
        { value: '15d', label: 'Últimos 15 días' },
        { value: '30d', label: 'Últimos 30 días' },
        { value: '60d', label: 'Últimos 60 días' },
        { value: '90d', label: 'Últimos 90 días' },
        { value: 'custom', label: 'Período personalizado' }
      ];

      return {
        products: products.map(p => ({
          value: p.id.toString(),
          label: p.nombre,
          count: 0 // Se puede calcular si es necesario
        })),
        suppliers: suppliers.map(s => ({
          value: s.id.toString(),
          label: s.nombre,
          count: 0
        })),
        categories: Array.from(uniqueCategories).map(cat => ({
          value: cat,
          label: cat,
          count: 0
        })),
        tags: Array.from(uniqueCategories).map(cat => ({
          value: cat,
          label: cat,
          count: 0
        })),
        reasons: reasons
          .filter(r => r.motivo)
          .map(r => ({
            value: r.motivo!,
            label: r.motivo!,
            count: 0
          })),
        users: users.map(u => ({
          value: u.id.toString(),
          label: u.nombre,
          count: 0
        })),
        dateRanges: dateRanges.map(dr => ({
          value: dr.value,
          label: dr.label,
          count: 0
        }))
      };
    } catch (error) {
      this.logger.error('Error obteniendo opciones de filtro', error);
      throw error;
    }
  }

  async getDashboardData(empresaId: number, userRole?: string): Promise<{
    kpis: KPIData;
    financialKpis: FinancialKPIs;
    industryKpis?: any;
    predictiveKpis?: any;
  }> {
    this.logger.log('Obteniendo datos completos del dashboard', { empresaId, userRole });

    // Usar Promise.allSettled para manejar errores individuales
    const results = await Promise.allSettled([
      this.getKpis(empresaId, userRole),
      this.getFinancialKPIs(empresaId, userRole),
      this.getIndustryKPIs(empresaId, undefined, userRole),
      this.getPredictiveKPIs(empresaId, 30, userRole)
    ]);

    const [kpisResult, financialKpisResult, industryKpisResult, predictiveKpisResult] = results;

    return {
      kpis: kpisResult.status === 'fulfilled' ? kpisResult.value : this.getDefaultKPIs(),
      financialKpis: financialKpisResult.status === 'fulfilled' ? financialKpisResult.value : this.getDefaultFinancialKPIs(),
      industryKpis: industryKpisResult.status === 'fulfilled' ? industryKpisResult.value : this.getDefaultIndustryKPIs(),
      predictiveKpis: predictiveKpisResult.status === 'fulfilled' ? predictiveKpisResult.value : this.getDefaultPredictiveKPIs()
    };
  }

  // Método para invalidar cache específico
  async invalidateCache(empresaId: number, cacheType?: string): Promise<void> {
    this.logger.log('Invalidando cache del dashboard', { empresaId, cacheType });
    
    // Aquí se implementaría la lógica de invalidación de cache
    // Por ahora es un placeholder para futuras implementaciones
  }

  // Método para obtener estadísticas de cache
  async getCacheStats(): Promise<{
    totalCachedItems: number;
    cacheHitRate: number;
    averageResponseTime: number;
  }> {
    // Placeholder para estadísticas de cache
    return {
      totalCachedItems: 0,
      cacheHitRate: 0,
      averageResponseTime: 0
    };
  }

  // Métodos de fallback para manejo de errores
  private getDefaultKPIs(): KPIData {
    return {
      totalProductos: 0,
      productosStockBajo: 0,
      movimientosUltimoMes: 0,
      valorTotalInventario: 0,
      margenPromedio: 0,
      rotacionInventario: 0,
      timestamp: new Date().toISOString()
    };
  }

  private getDefaultFinancialKPIs(): FinancialKPIs {
    return {
      margenBruto: 0,
      margenNeto: 0,
      roiInventario: 0,
      rotacionInventario: 0,
      diasInventario: 0,
      capitalTrabajo: 0,
      costoAlmacenamiento: 0,
      costoOportunidad: 0,
      eficienciaOperativa: 0
    };
  }

  private getDefaultIndustryKPIs(): any {
    return {
      totalProductos: 0,
      productosStockBajo: 0,
      valorInventario: 0,
      rotacionPromedio: 0
    };
  }

  private getDefaultPredictiveKPIs(): any {
    return {
      prediccionDemanda: [],
      prediccionQuiebres: [],
      tendenciasVentas: {
        tendencia: 'ESTABLE' as const,
        porcentajeCambio: 0,
        periodo: '30 días'
      },
      estacionalidad: []
    };
  }
} 