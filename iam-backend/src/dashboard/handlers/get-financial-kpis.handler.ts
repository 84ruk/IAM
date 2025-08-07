import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KPICacheService } from '../../common/services/kpi-cache.service';
import { KPIErrorHandler } from '../../common/services/kpi-error-handler.service';
import { GetFinancialKpisQuery } from '../queries/get-financial-kpis.query';
import { FinancialKPIs } from '../interfaces/financial-kpis.interface';

@Injectable()
export class GetFinancialKpisHandler {
  private readonly logger = new Logger(GetFinancialKpisHandler.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: KPICacheService,
    private errorHandler: KPIErrorHandler,
  ) {}

  async execute(query: GetFinancialKpisQuery): Promise<FinancialKPIs> {
    const cacheKey = `financial-kpis:${query.empresaId}:${query.period || 'month'}:${query.userRole || 'all'}`;
    
    try {
      // Si forceRefresh es true, invalidar cache y recalcular
      if (query.forceRefresh) {
        await this.cacheService.invalidate(cacheKey);
      }

      // Usar getOrSet para manejar cache automáticamente
      const financialKpis = await this.cacheService.getOrSet(
        cacheKey,
        () => this.calculateFinancialKPIs(query.empresaId, query.period),
        600 // 10 minutos TTL
      );
      
      this.logger.log('KPIs financieros calculados exitosamente', { 
        empresaId: query.empresaId,
        period: query.period 
      });
      
      return financialKpis;
    } catch (error) {
      return this.errorHandler.handleKPIError(
        error,
        'Error calculando KPIs financieros',
        query.empresaId
      );
    }
  }

  private async calculateFinancialKPIs(empresaId: number, period?: string): Promise<FinancialKPIs> {
    const [
      margenBruto,
      margenNeto,
      roiInventario,
      rotacionInventario,
      diasInventario,
      capitalTrabajo,
      costoAlmacenamiento,
      costoOportunidad,
      eficienciaOperativa
    ] = await Promise.all([
      this.calculateMargenBruto(empresaId),
      this.calculateMargenNeto(empresaId),
      this.calculateROIInventario(empresaId),
      this.calculateRotacionInventario(empresaId),
      this.calculateDiasInventario(empresaId),
      this.calculateCapitalTrabajo(empresaId),
      this.calculateCostoAlmacenamiento(empresaId),
      this.calculateCostoOportunidad(empresaId),
      this.calculateEficienciaOperativa(empresaId)
    ]);

    return {
      margenBruto,
      margenNeto,
      roiInventario,
      rotacionInventario,
      diasInventario,
      capitalTrabajo,
      costoAlmacenamiento,
      costoOportunidad,
      eficienciaOperativa
    };
  }

  private async calculateMargenBruto(empresaId: number): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ margenBruto: number }]>`
      SELECT COALESCE(
        SUM((p."precioVenta" - p."precioCompra") * p.stock) / NULLIF(SUM(p."precioVenta" * p.stock), 0) * 100, 
        0
      ) as "margenBruto"
      FROM "Producto" p
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
        AND p."precioCompra" > 0
    `;
    return Number(result[0]?.margenBruto || 0);
  }

  private async calculateMargenNeto(empresaId: number): Promise<number> {
    // Margen neto = Margen bruto - Gastos operativos (estimado como 15% del margen bruto)
    const margenBruto = await this.calculateMargenBruto(empresaId);
    const gastosOperativos = margenBruto * 0.15;
    return Math.max(0, margenBruto - gastosOperativos);
  }

  private async calculateROIInventario(empresaId: number): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ roi: number }]>`
      WITH ventas_mes AS (
        SELECT 
          COALESCE(SUM(m.cantidad * p."precioVenta"), 0) as ventas_totales,
          COALESCE(SUM(m.cantidad * p."precioCompra"), 0) as costo_ventas
        FROM "MovimientoInventario" m
        JOIN "Producto" p ON m."productoId" = p.id
        WHERE m."empresaId" = ${empresaId}
          AND m.tipo = 'SALIDA'
          AND m."createdAt" >= NOW() - INTERVAL '30 days'
      ),
      inventario_total AS (
        SELECT COALESCE(SUM(p.stock * p."precioCompra"), 0) as inventario_total
        FROM "Producto" p
        WHERE p."empresaId" = ${empresaId}
          AND p.estado = 'ACTIVO'
      )
      SELECT COALESCE(
        ((vm.ventas_totales - vm.costo_ventas) / NULLIF(it.inventario_total, 0)) * 100,
        0
      ) as roi
      FROM ventas_mes vm, inventario_total it
    `;
    return Number(result[0]?.roi || 0);
  }

  private async calculateRotacionInventario(empresaId: number): Promise<number> {
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

  private async calculateDiasInventario(empresaId: number): Promise<number> {
    const rotacion = await this.calculateRotacionInventario(empresaId);
    return rotacion > 0 ? 365 / rotacion : 0;
  }

  private async calculateCapitalTrabajo(empresaId: number): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ capitalTrabajo: number }]>`
      SELECT COALESCE(SUM(p.stock * p."precioCompra"), 0) as "capitalTrabajo"
      FROM "Producto" p
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
    `;
    return Number(result[0]?.capitalTrabajo || 0);
  }

  private async calculateCostoAlmacenamiento(empresaId: number): Promise<number> {
    // Estimación: 2% del valor del inventario por mes
    const valorInventario = await this.calculateCapitalTrabajo(empresaId);
    return valorInventario * 0.02;
  }

  private async calculateCostoOportunidad(empresaId: number): Promise<number> {
    // Estimación: 8% anual del capital de trabajo
    const capitalTrabajo = await this.calculateCapitalTrabajo(empresaId);
    return capitalTrabajo * 0.08 / 12; // Mensual
  }

  private async calculateEficienciaOperativa(empresaId: number): Promise<number> {
    this.logger.log('🔧 Calculando eficiencia operativa (versión corregida)');
    try {
      // Obtener métricas básicas de productos
      const productosResult = await this.prisma.$queryRaw<[{ 
        total_productos: bigint;
        productos_stock_bajo: bigint;
        productos_sin_stock: bigint;
      }]>`
        SELECT 
          COUNT(DISTINCT p.id)::integer as total_productos,
          COUNT(CASE WHEN p.stock <= p."stockMinimo" THEN 1 END)::integer as productos_stock_bajo,
          COUNT(CASE WHEN p.stock = 0 THEN 1 END)::integer as productos_sin_stock
        FROM "Producto" p
        WHERE p."empresaId" = ${empresaId}
          AND p.estado = 'ACTIVO'
      `;

      // Obtener métricas de movimientos del último mes
      const movimientosResult = await this.prisma.$queryRaw<[{
        total_movimientos: bigint;
        salidas: bigint;
        rotacion_inventario: number;
      }]>`
        WITH movimientos_mes AS (
          SELECT 
            COUNT(*)::integer as total_movimientos,
            COUNT(CASE WHEN tipo = 'SALIDA' THEN 1 END)::integer as salidas,
            COALESCE(SUM(CASE WHEN tipo = 'SALIDA' THEN cantidad ELSE 0 END), 0) as total_vendido
          FROM "MovimientoInventario"
          WHERE "empresaId" = ${empresaId}
            AND "createdAt" >= NOW() - INTERVAL '30 days'
        ),
        stock_total AS (
          SELECT COALESCE(SUM(stock), 0) as inventario_total
          FROM "Producto"
          WHERE "empresaId" = ${empresaId}
            AND estado = 'ACTIVO'
        )
        SELECT 
          mm.total_movimientos,
          mm.salidas,
          CASE 
            WHEN st.inventario_total > 0 THEN (mm.total_vendido::float / st.inventario_total::float) * 12
            ELSE 0
          END as rotacion_inventario
        FROM movimientos_mes mm, stock_total st
      `;

      const productos = productosResult[0];
      const movimientos = movimientosResult[0];

      // Convertir BigInt a number
      const totalProductos = Number(productos.total_productos);
      const productosStockBajo = Number(productos.productos_stock_bajo);
      const productosSinStock = Number(productos.productos_sin_stock);
      const totalMovimientos = Number(movimientos.total_movimientos);
      const salidas = Number(movimientos.salidas);
      const rotacionInventario = Number(movimientos.rotacion_inventario);

      // Si no hay productos, eficiencia es 0
      if (totalProductos === 0) return 0;

      // Calcular eficiencia operativa mejorada (múltiples factores)
      
      // Factor 1: Gestión de stock (40% del peso)
      const factorStock = ((totalProductos - productosStockBajo - productosSinStock) / totalProductos) * 100;
      
      // Factor 2: Actividad de movimientos (30% del peso)
      const factorActividad = Math.min(totalMovimientos * 1.5, 50); // Max 50%
      
      // Factor 3: Rotación de inventario (30% del peso)
      const factorRotacion = Math.min(rotacionInventario * 8, 50); // Max 50%

      // Eficiencia operativa ponderada
      const eficienciaOperativa = (factorStock * 0.4) + (factorActividad * 0.3) + (factorRotacion * 0.3);

      return Math.round(eficienciaOperativa * 100) / 100; // Redondear a 2 decimales
      
    } catch (error) {
      this.logger.error(`Error calculating eficiencia operativa for empresa ${empresaId}:`, error);
      return 0;
    }
  }

  private getBasicFinancialKPIs(): FinancialKPIs {
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
} 