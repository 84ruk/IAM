import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KPICacheService } from '../../common/services/kpi-cache.service';
import { KPIErrorHandler } from '../../common/services/kpi-error-handler.service';
import { GetKpisQuery } from '../queries/get-kpis.query';
import { KPIData } from '../interfaces/kpi-data.interface';

@Injectable()
export class GetKpisHandler {
  private readonly logger = new Logger(GetKpisHandler.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: KPICacheService,
    private errorHandler: KPIErrorHandler,
  ) {}

  async execute(query: GetKpisQuery): Promise<KPIData> {
    const cacheKey = `kpis:${query.empresaId}:${query.userRole || 'all'}`;
    
    try {
      // Si forceRefresh es true, invalidar cache y recalcular
      if (query.forceRefresh) {
        await this.cacheService.invalidate(cacheKey);
      }

      // Usar getOrSet para manejar cache automáticamente
      const kpis = await this.cacheService.getOrSet(
        cacheKey,
        () => this.calculateKPIs(query.empresaId, query.userRole),
        300 // 5 minutos TTL
      );
      
      this.logger.log('KPIs obtenidos exitosamente', { 
        empresaId: query.empresaId,
        userRole: query.userRole,
        fromCache: !query.forceRefresh
      });
      
      return kpis;
    } catch (error) {
      return this.errorHandler.handleKPIError(
        error,
        'Error calculando KPIs básicos',
        query.empresaId
      );
    }
  }

  private async calculateKPIs(empresaId: number, userRole?: string): Promise<KPIData> {
    const [
      totalProductos,
      productosStockBajo,
      movimientosUltimoMes,
      valorTotalInventario,
      margenPromedio,
      rotacionInventario
    ] = await Promise.all([
      this.getTotalProductos(empresaId),
      this.getProductosStockBajo(empresaId),
      this.getMovimientosUltimoMes(empresaId),
      this.getValorTotalInventario(empresaId),
      this.getMargenPromedio(empresaId),
      this.getRotacionInventario(empresaId)
    ]);

    return {
      totalProductos,
      productosStockBajo,
      movimientosUltimoMes,
      valorTotalInventario,
      margenPromedio,
      rotacionInventario,
      timestamp: new Date().toISOString()
    };
  }

  private async getTotalProductos(empresaId: number): Promise<number> {
    const result = await this.prisma.producto.count({
      where: { 
        empresaId, 
        estado: { in: ['ACTIVO', 'INACTIVO'] }
      }
    });
    return result;
  }

  private async getProductosStockBajo(empresaId: number): Promise<number> {
    const result = await this.prisma.producto.count({
      where: {
        empresaId,
        estado: 'ACTIVO',
        stock: {
          lte: this.prisma.producto.fields.stockMinimo
        }
      }
    });
    return result;
  }

  private async getMovimientosUltimoMes(empresaId: number): Promise<number> {
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() - 1);

    const result = await this.prisma.movimientoInventario.count({
      where: {
        empresaId,
        createdAt: {
          gte: fechaLimite
        }
      }
    });
    return result;
  }

  private async getValorTotalInventario(empresaId: number): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ total: number }]>`
      SELECT COALESCE(SUM(p.stock * p."precioVenta"), 0) as total
      FROM "Producto" p
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
    `;
    return Number(result[0]?.total || 0);
  }

  private async getMargenPromedio(empresaId: number): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ margen: number }]>`
      SELECT COALESCE(
        AVG(
          CASE 
            WHEN p."precioCompra" > 0 THEN 
              ((p."precioVenta" - p."precioCompra") / p."precioCompra") * 100
            ELSE 0 
          END
        ), 0
      ) as margen
      FROM "Producto" p
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
        AND p."precioCompra" > 0
    `;
    return Number(result[0]?.margen || 0);
  }

  private async getRotacionInventario(empresaId: number): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ rotacion: number }]>`
      WITH movimientos_salida AS (
        SELECT 
          p.id,
          p.stock,
          COALESCE(SUM(m.cantidad), 0) as ventas_mes
        FROM "Producto" p
        LEFT JOIN "MovimientoInventario" m ON p.id = m."productoId"
          AND m.tipo = 'SALIDA'
          AND m."createdAt" >= NOW() - INTERVAL '30 days'
        WHERE p."empresaId" = ${empresaId}
          AND p.estado = 'ACTIVO'
        GROUP BY p.id, p.stock
      )
      SELECT COALESCE(AVG(
        CASE 
          WHEN stock > 0 THEN ventas_mes / stock
          ELSE 0
        END
      ), 0) as rotacion
      FROM movimientos_salida
    `;
    return Number(result[0]?.rotacion || 0);
  }

  private getBasicKPIs(empresaId: number): KPIData {
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
} 