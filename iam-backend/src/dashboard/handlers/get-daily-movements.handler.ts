import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KPICacheService } from '../../common/services/kpi-cache.service';
import { KPIErrorHandler } from '../../common/services/kpi-error-handler.service';
import { GetDailyMovementsQuery } from '../queries/get-daily-movements.query';
import { DailyMovementsResponse, DailyMovementData, DailyMovementsSummary } from '../interfaces/daily-movements.interface';

@Injectable()
export class GetDailyMovementsHandler {
  private readonly logger = new Logger(GetDailyMovementsHandler.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: KPICacheService,
    private errorHandler: KPIErrorHandler,
  ) {}

  async execute(query: GetDailyMovementsQuery): Promise<DailyMovementsResponse> {
    const days = query.days || 7; // Default a 7 días
    const cacheKey = `daily-movements:${query.empresaId}:${days}:${query.userRole || 'all'}`;
    
    this.logger.log('🎯 Handler execute iniciado', { 
      empresaId: query.empresaId,
      days,
      userRole: query.userRole,
      forceRefresh: query.forceRefresh
    });
    
    // Validar parámetros de entrada ANTES del try-catch
    this.validateQuery(query);
    
    try {
      // Si forceRefresh es true, invalidar cache y recalcular
      if (query.forceRefresh) {
        this.logger.log('🔄 Invalidando cache por forceRefresh');
        await this.cacheService.invalidate(cacheKey);
      }

      this.logger.log('📊 Calculando movimientos diarios...');
      
      // Calcular directamente sin cache para debug
      const result = await this.calculateDailyMovements(query.empresaId, days);
      
      this.logger.log('✅ Movimientos diarios calculados exitosamente', { 
        empresaId: query.empresaId,
        days,
        userRole: query.userRole,
        totalRecords: result.data.length
      });
      
      return result;
    } catch (error) {
      this.logger.error('❌ Error en handler execute', error);
      throw error; // Lanzar el error directamente para ver qué está pasando
    }
  }

  private validateQuery(query: GetDailyMovementsQuery): void {
    if (query.empresaId <= 0) {
      throw new Error('empresaId debe ser un número positivo');
    }
    
    if (query.days && (query.days < 1 || query.days > 365)) {
      throw new Error('days debe estar entre 1 y 365');
    }
  }

  private async calculateDailyMovements(empresaId: number, days: number): Promise<DailyMovementsResponse> {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - days);

    this.logger.log(`Calculando movimientos para empresa ${empresaId}, días: ${days}, fecha límite: ${fechaLimite.toISOString()}`);

    // ✅ MEJORADO: Consulta más completa con información de productos y proveedores
    const movimientos = await this.prisma.$queryRaw<Array<{
      fecha: string;
      tipo: 'ENTRADA' | 'SALIDA';
      cantidad: number;
      valor: number;
      productoId: number;
      productoNombre: string;
      tipoProducto: string;
      proveedorNombre?: string;
      motivo?: string;
      precioCompra: number;
      precioVenta: number;
    }>>`
      SELECT 
        DATE(m.fecha) as fecha,
        m.tipo,
        CAST(SUM(m.cantidad) AS INTEGER) as cantidad,
        CAST(SUM(m.cantidad * p."precioVenta") AS DECIMAL(10,2)) as valor,
        CAST(p.id AS INTEGER) as "productoId",
        p.nombre as "productoNombre",
        p."tipoProducto" as "tipoProducto",
        pr.nombre as "proveedorNombre",
        m.motivo,
        CAST(p."precioCompra" AS DECIMAL(10,2)) as "precioCompra",
        CAST(p."precioVenta" AS DECIMAL(10,2)) as "precioVenta"
      FROM "MovimientoInventario" m
      INNER JOIN "Producto" p ON m."productoId" = p.id
      LEFT JOIN "Proveedor" pr ON p."proveedorId" = pr.id
      WHERE m."empresaId" = ${empresaId}
        AND m.fecha >= ${fechaLimite}
      GROUP BY DATE(m.fecha), m.tipo, p.id, p.nombre, p."tipoProducto", pr.nombre, m.motivo, p."precioCompra", p."precioVenta"
      ORDER BY fecha ASC, cantidad DESC
    `;

    // ✅ NUEVO: Obtener información adicional de productos y stock
    const productosInfo = await this.prisma.producto.findMany({
      where: { empresaId },
      select: {
        id: true,
        nombre: true,
        stock: true,
        stockMinimo: true,
        tipoProducto: true,
        precioCompra: true,
        precioVenta: true,
        proveedor: {
          select: { nombre: true }
        }
      }
    });

    // ✅ CORREGIDO: Log seguro sin JSON.stringify
    this.logger.log(`Movimientos obtenidos de la base de datos: ${movimientos.length} registros`);
    this.logger.log(`Productos en inventario: ${productosInfo.length}`);

    // Procesar datos y crear estructura por día
    const dailyData = this.processDailyData(movimientos, days, productosInfo);
    const summary = this.calculateSummary(dailyData, movimientos, productosInfo);

    // ✅ CORREGIDO: Log seguro sin JSON.stringify
    this.logger.log(`Datos procesados: ${dailyData.length} días con datos`);

    return {
      data: dailyData,
      summary,
      meta: {
        empresaId,
        source: 'cqrs',
        generatedAt: new Date().toISOString(),
        daysRequested: days,
        totalDays: dailyData.length,
        // ✅ NUEVO: Metadatos adicionales
        totalProductos: productosInfo.length,
        totalProveedores: new Set(productosInfo.map(p => p.proveedor?.nombre).filter(Boolean)).size,
        rangoFechas: {
          inicio: fechaLimite.toISOString().split('T')[0],
          fin: new Date().toISOString().split('T')[0]
        }
      }
    };
  }

  private processDailyData(movimientos: any[], days: number, productosInfo: any[]): DailyMovementData[] {
    const dailyMap = new Map<string, DailyMovementData>();
    
    // Inicializar todos los días con valores en cero
    for (let i = 0; i < days; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      dailyMap.set(fechaStr, {
        fecha: fechaStr,
        entradas: 0,
        salidas: 0,
        neto: 0,
        valorEntradas: 0,
        valorSalidas: 0,
        valorNeto: 0,
        // ✅ NUEVO: Campos adicionales
        productosUnicos: 0,
        proveedoresUnicos: 0,
        margenPromedio: 0,
        stockBajoCount: 0
      });
    }

    // Procesar movimientos reales
    const movimientosPorDia = new Map<string, any[]>();
    
    movimientos.forEach(mov => {
      // Convertir la fecha del movimiento a string en formato YYYY-MM-DD
      const fechaMovimiento = typeof mov.fecha === 'string' 
        ? mov.fecha 
        : new Date(mov.fecha).toISOString().split('T')[0];
      
      if (!movimientosPorDia.has(fechaMovimiento)) {
        movimientosPorDia.set(fechaMovimiento, []);
      }
      movimientosPorDia.get(fechaMovimiento)!.push(mov);
      
      const dayData = dailyMap.get(fechaMovimiento);
      if (dayData) {
        if (mov.tipo === 'ENTRADA') {
          dayData.entradas += Number(mov.cantidad);
          dayData.valorEntradas += Number(mov.valor);
        } else {
          dayData.salidas += Number(mov.cantidad);
          dayData.valorSalidas += Number(mov.valor);
        }
        
        dayData.neto = dayData.entradas - dayData.salidas;
        dayData.valorNeto = dayData.valorEntradas - dayData.valorSalidas;
      }
    });

    // ✅ NUEVO: Calcular métricas adicionales por día
    dailyMap.forEach((dayData, fecha) => {
      const movimientosDelDia = movimientosPorDia.get(fecha) || [];
      
      // Productos únicos del día
      const productosUnicos = new Set(movimientosDelDia.map(m => m.productoId));
      dayData.productosUnicos = productosUnicos.size;
      
      // Proveedores únicos del día
      const proveedoresUnicos = new Set(movimientosDelDia.map(m => m.proveedorNombre).filter(Boolean));
      dayData.proveedoresUnicos = proveedoresUnicos.size;
      
      // Margen promedio del día
      const margenes = movimientosDelDia.map(m => {
        const margen = m.precioVenta - m.precioCompra;
        return margen > 0 ? margen : 0;
      });
      dayData.margenPromedio = margenes.length > 0 ? margenes.reduce((a, b) => a + b, 0) / margenes.length : 0;
      
      // Productos con stock bajo
      const productosConStockBajo = productosInfo.filter(p => p.stock <= p.stockMinimo);
      dayData.stockBajoCount = productosConStockBajo.length;
    });

    // Convertir a array y ordenar por fecha
    return Array.from(dailyMap.values())
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  private calculateSummary(data: DailyMovementData[], movimientos: any[], productosInfo: any[]): DailyMovementsSummary {
    if (data.length === 0) {
      return {
        avgEntradasDiarias: 0,
        avgSalidasDiarias: 0,
        diaMaxActividad: '',
        totalMovimientos: 0,
        tendencia: 'ESTABLE',
        // ✅ NUEVO: Campos adicionales
        valorTotalInventario: 0,
        margenBrutoPromedio: 0,
        productosMasVendidos: [],
        proveedoresPrincipales: [],
        alertasStock: [],
        distribucionPorTipo: []
      };
    }

    const totalEntradas = data.reduce((sum, day) => sum + day.entradas, 0);
    const totalSalidas = data.reduce((sum, day) => sum + day.salidas, 0);
    const totalMovimientos = totalEntradas + totalSalidas;

    // Encontrar día con máxima actividad
    const diaMaxActividad = data.reduce((max, day) => 
      (day.entradas + day.salidas) > (max.entradas + max.salidas) ? day : max
    ).fecha;

    // Calcular tendencia (comparar primera mitad vs segunda mitad)
    const mitad = Math.floor(data.length / 2);
    const primeraMitad = data.slice(0, mitad);
    const segundaMitad = data.slice(mitad);

    const actividadPrimeraMitad = primeraMitad.reduce((sum, day) => sum + day.entradas + day.salidas, 0);
    const actividadSegundaMitad = segundaMitad.reduce((sum, day) => sum + day.entradas + day.salidas, 0);

    let tendencia: 'CRECIENTE' | 'DECRECIENTE' | 'ESTABLE' = 'ESTABLE';
    const diferencia = actividadSegundaMitad - actividadPrimeraMitad;
    const umbralCritico = actividadPrimeraMitad * 0.1; // 10% de diferencia

    if (diferencia > umbralCritico) {
      tendencia = 'CRECIENTE';
    } else if (diferencia < -umbralCritico) {
      tendencia = 'DECRECIENTE';
    }

    // ✅ NUEVO: Calcular métricas adicionales
    const valorTotalInventario = productosInfo.reduce((sum, p) => sum + (p.stock * p.precioVenta), 0);
    
    const margenBrutoPromedio = productosInfo.length > 0 
      ? productosInfo.reduce((sum, p) => sum + (p.precioVenta - p.precioCompra), 0) / productosInfo.length 
      : 0;

    // Productos más vendidos
    const productosVentas = new Map<number, { nombre: string; cantidad: number; valor: number }>();
    movimientos.forEach(mov => {
      if (mov.tipo === 'SALIDA') {
        const existing = productosVentas.get(mov.productoId) || { nombre: mov.productoNombre, cantidad: 0, valor: 0 };
        existing.cantidad += Number(mov.cantidad);
        existing.valor += Number(mov.valor);
        productosVentas.set(mov.productoId, existing);
      }
    });

    const productosMasVendidos = Array.from(productosVentas.entries())
      .map(([id, data]) => ({
        productoId: id,
        nombre: data.nombre,
        cantidadTotal: data.cantidad,
        valorTotal: Number(data.valor.toFixed(2)),
        porcentaje: Number(((data.cantidad / totalSalidas) * 100).toFixed(2))
      }))
      .sort((a, b) => b.cantidadTotal - a.cantidadTotal)
      .slice(0, 5);

    // Proveedores principales
    const proveedoresVentas = new Map<string, { cantidad: number; valor: number }>();
    movimientos.forEach(mov => {
      if (mov.tipo === 'ENTRADA' && mov.proveedorNombre) {
        const existing = proveedoresVentas.get(mov.proveedorNombre) || { cantidad: 0, valor: 0 };
        existing.cantidad += Number(mov.cantidad);
        existing.valor += Number(mov.valor);
        proveedoresVentas.set(mov.proveedorNombre, existing);
      }
    });

    const proveedoresPrincipales = Array.from(proveedoresVentas.entries())
      .map(([nombre, data]) => ({
        proveedorId: 0, // No tenemos ID del proveedor en la consulta
        nombre,
        cantidadTotal: data.cantidad,
        valorTotal: Number(data.valor.toFixed(2)),
        porcentaje: Number(((data.cantidad / totalEntradas) * 100).toFixed(2))
      }))
      .sort((a, b) => b.cantidadTotal - a.cantidadTotal)
      .slice(0, 5);

    // Alertas de stock
    const alertasStock = productosInfo
      .filter(p => p.stock <= p.stockMinimo)
      .map(p => ({
        productoId: p.id,
        nombre: p.nombre,
        stockActual: p.stock,
        stockMinimo: p.stockMinimo,
        diasRestantes: Math.floor(p.stock / (totalSalidas / data.length / productosInfo.length)),
        severidad: p.stock === 0 ? 'CRITICA' as const : p.stock <= p.stockMinimo * 0.5 ? 'ADVERTENCIA' as const : 'INFO' as const
      }))
      .sort((a, b) => a.stockActual - b.stockActual)
      .slice(0, 10);

    // Distribución por tipo de producto
    const distribucionPorTipo = new Map<string, { cantidad: number; valor: number }>();
    movimientos.forEach(mov => {
      const existing = distribucionPorTipo.get(mov.tipoProducto) || { cantidad: 0, valor: 0 };
      existing.cantidad += Number(mov.cantidad);
      existing.valor += Number(mov.valor);
      distribucionPorTipo.set(mov.tipoProducto, existing);
    });

    const totalCantidad = Array.from(distribucionPorTipo.values()).reduce((sum, d) => sum + d.cantidad, 0);
    const distribucionPorTipoArray = Array.from(distribucionPorTipo.entries())
      .map(([tipo, data]) => ({
        tipo,
        cantidad: data.cantidad,
        valor: Number(data.valor.toFixed(2)),
        porcentaje: Number(((data.cantidad / totalCantidad) * 100).toFixed(2))
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    return {
      avgEntradasDiarias: totalEntradas / data.length,
      avgSalidasDiarias: totalSalidas / data.length,
      diaMaxActividad,
      totalMovimientos,
      tendencia,
      // ✅ NUEVO: Métricas adicionales
      valorTotalInventario,
      margenBrutoPromedio,
      productosMasVendidos,
      proveedoresPrincipales,
      alertasStock,
      distribucionPorTipo: distribucionPorTipoArray
    };
  }
} 