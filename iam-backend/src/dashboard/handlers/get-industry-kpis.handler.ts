import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KPICacheService } from '../../common/services/kpi-cache.service';
import { KPIErrorHandler } from '../../common/services/kpi-error-handler.service';
import { GetIndustryKpisQuery } from '../queries/get-industry-kpis.query';

export interface IndustryKPIs {
  totalProductos: number;
  productosStockBajo: number;
  valorInventario: number;
  rotacionPromedio: number;
}

@Injectable()
export class GetIndustryKpisHandler {
  private readonly logger = new Logger(GetIndustryKpisHandler.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: KPICacheService,
    private errorHandler: KPIErrorHandler,
  ) {}

  async execute(query: GetIndustryKpisQuery): Promise<IndustryKPIs> {
    const cacheKey = `industry-kpis:${query.empresaId}:${query.industry || 'all'}:${query.userRole || 'all'}`;
    
    try {
      // Si forceRefresh es true, invalidar cache y recalcular
      if (query.forceRefresh) {
        await this.cacheService.invalidate(cacheKey);
      }

      // Obtener industria de la empresa
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: query.empresaId },
        select: { TipoIndustria: true }
      });

      const industry = query.industry || empresa?.TipoIndustria || 'GENERICA';
      
      // Usar getOrSet para manejar cache automáticamente
      const kpis = await this.cacheService.getOrSet(
        cacheKey,
        () => this.calculateIndustryKPIs(query.empresaId, industry),
        600 // 10 minutos TTL
      );
      
      this.logger.log('KPIs de industria calculados exitosamente', { 
        empresaId: query.empresaId,
        industry 
      });
      
      return kpis;
    } catch (error) {
      return this.errorHandler.handleKPIError(
        error,
        'Error calculando KPIs de industria',
        query.empresaId
      );
    }
  }

  private async calculateIndustryKPIs(empresaId: number, industry: string): Promise<IndustryKPIs> {
    const [
      totalProductos,
      productosStockBajo,
      valorInventario,
      rotacionPromedio
    ] = await Promise.all([
      this.getTotalProductos(empresaId),
      this.getProductosStockBajo(empresaId),
      this.getValorInventario(empresaId),
      this.getRotacionPromedio(empresaId)
    ]);

    return {
      totalProductos,
      productosStockBajo,
      valorInventario,
      rotacionPromedio
    };
  }

  private async getTotalProductos(empresaId: number): Promise<number> {
    return this.prisma.producto.count({
      where: { empresaId, estado: 'ACTIVO' }
    });
  }

  private async getProductosStockBajo(empresaId: number): Promise<number> {
    return this.prisma.producto.count({
      where: {
        empresaId,
        estado: 'ACTIVO',
        stock: { lte: this.prisma.producto.fields.stockMinimo }
      }
    });
  }

  private async getValorInventario(empresaId: number): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ valor: number }]>`
      SELECT COALESCE(SUM(p.stock * p."precioVenta"), 0) as valor
      FROM "Producto" p
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
    `;
    return Number(result[0]?.valor || 0);
  }

  private async getRotacionPromedio(empresaId: number): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ rotacion: number }]>`
      WITH ventas_mes AS (
        SELECT 
          p.id,
          COALESCE(SUM(m.cantidad), 0) as ventas
        FROM "Producto" p
        LEFT JOIN "MovimientoInventario" m ON p.id = m."productoId"
          AND m.tipo = 'SALIDA'
          AND m."createdAt" >= NOW() - INTERVAL '30 days'
        WHERE p."empresaId" = ${empresaId}
          AND p.estado = 'ACTIVO'
        GROUP BY p.id
      )
      SELECT COALESCE(AVG(
        CASE 
          WHEN p.stock > 0 THEN vm.ventas / p.stock
          ELSE 0
        END
      ), 0) as rotacion
      FROM "Producto" p
      LEFT JOIN ventas_mes vm ON p.id = vm.id
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
    `;
    return Number(result[0]?.rotacion || 0);
  }
} 