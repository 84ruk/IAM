import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorHandlerService } from '../common/services/error-handler.service';
import { KPICacheService } from '../common/services/kpi-cache.service';
import { KPIErrorHandler } from '../common/services/kpi-error-handler.service';
import { CacheStrategiesService } from '../common/services/cache-strategies.service';

export interface KPIData {
  totalProductos: number;
  productosStockBajo: number;
  movimientosUltimoMes: number;
  valorTotalInventario: number;
  margenPromedio: number;
  rotacionInventario: number;
  timestamp: string;
}

export interface FinancialKPIs {
  margenBruto: number;
  margenNeto: number;
  roiInventario: number;
  rotacionInventario: number;
  diasInventario: number;
  capitalTrabajo: number;
  costoAlmacenamiento: number;
  costoOportunidad: number;
  eficienciaOperativa: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlerService,
    private cacheService: KPICacheService,
    private kpiErrorHandler: KPIErrorHandler,
    private cacheStrategies: CacheStrategiesService
  ) {}

  async getKpis(empresaId: number): Promise<KPIData> {
    try {
      // 🔄 Usar Refresh-Ahead para KPIs que necesitan estar siempre disponibles
      return await this.cacheStrategies.refreshAhead(
        `kpis:${empresaId}`,
        () => this.calculateKPIs(empresaId),
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting KPIs for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getKpis', empresaId);
    }
  }

  async getFinancialKPIs(empresaId: number): Promise<FinancialKPIs> {
    try {
      // 🔄 Usar Refresh-Ahead para KPIs financieros que necesitan estar siempre disponibles
      return await this.cacheStrategies.refreshAhead(
        `financial-kpis:${empresaId}`,
        () => this.calculateFinancialKPIs(empresaId),
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting Financial KPIs for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getFinancialKPIs', empresaId);
        }
  }

  private async calculateKPIs(empresaId: number): Promise<KPIData> {
    try {
      // ✅ CONSULTA OPTIMIZADA CON SQL RAW
      const result = await this.prisma.$queryRaw<Array<{
        total_productos: number;
        productos_stock_bajo: number;
        valor_inventario: number;
        margen_promedio: number;
        movimientos_ultimo_mes: number;
      }>>`
        WITH productos_stats AS (
          SELECT 
            COUNT(*) as total_productos,
            COUNT(CASE WHEN stock <= stock_minimo THEN 1 END) as productos_stock_bajo,
            SUM(stock * precio_compra) as valor_inventario,
            AVG(CASE WHEN precio_compra > 0 THEN 
              ((precio_venta - precio_compra) / precio_compra * 100) 
            END) as margen_promedio
          FROM producto 
          WHERE empresa_id = ${empresaId} AND estado = 'ACTIVO'
        ),
        movimientos_mes AS (
          SELECT COUNT(*) as total_movimientos
          FROM movimiento_inventario 
          WHERE empresa_id = ${empresaId} 
            AND fecha >= date_trunc('month', CURRENT_DATE)
        )
        SELECT 
          ps.total_productos,
          ps.productos_stock_bajo,
          ps.valor_inventario,
          ps.margen_promedio,
          mm.total_movimientos as movimientos_ultimo_mes
        FROM productos_stats ps
        CROSS JOIN movimientos_mes mm;
      `;

      const kpiData = result[0];
      
      // Calcular rotación de inventario
      const rotacionInventario = await this.calculateRotacionInventario(empresaId);

      const kpis: KPIData = {
        totalProductos: Number(kpiData.total_productos) || 0,
        productosStockBajo: Number(kpiData.productos_stock_bajo) || 0,
        movimientosUltimoMes: Number(kpiData.movimientos_ultimo_mes) || 0,
        valorTotalInventario: Number(kpiData.valor_inventario) || 0,
        margenPromedio: Number(kpiData.margen_promedio) || 0,
        rotacionInventario,
        timestamp: new Date().toISOString()
      };

      // Validar datos antes de retornar
      if (!this.kpiErrorHandler.validateKPIData(kpis)) {
        this.logger.warn(`Invalid KPI data for empresa ${empresaId}`);
        return this.getBasicKPIs(empresaId);
      }

      return kpis;
    } catch (error) {
      this.logger.error(`Error calculating KPIs for empresa ${empresaId}:`, error);
      throw error;
        }
  }

  private async calculateFinancialKPIs(empresaId: number): Promise<FinancialKPIs> {
    try {
      // Obtener datos financieros optimizados
      const result = await this.prisma.$queryRaw<Array<{
        valor_inventario: number;
        costo_ventas: number;
        ingresos_ventas: number;
        dias_inventario: number;
        capital_trabajo: number;
      }>>`
        WITH ventas_mes AS (
          SELECT 
            SUM(cantidad * p.precio_venta) as ingresos_ventas,
            SUM(cantidad * p.precio_compra) as costo_ventas
          FROM movimiento_inventario m
          JOIN producto p ON m.producto_id = p.id
          WHERE m.empresa_id = ${empresaId} 
            AND m.tipo = 'SALIDA'
            AND m.fecha >= date_trunc('month', CURRENT_DATE)
        ),
        inventario_actual AS (
          SELECT 
            SUM(stock * precio_compra) as valor_inventario,
            SUM(stock * precio_venta) as valor_venta_inventario
          FROM producto 
          WHERE empresa_id = ${empresaId} AND estado = 'ACTIVO'
        )
        SELECT 
          ia.valor_inventario,
          vm.costo_ventas,
          vm.ingresos_ventas,
          CASE 
            WHEN vm.costo_ventas > 0 THEN (ia.valor_inventario / vm.costo_ventas) * 30
            ELSE 0 
          END as dias_inventario,
          (ia.valor_venta_inventario - ia.valor_inventario) as capital_trabajo
        FROM inventario_actual ia
        CROSS JOIN ventas_mes vm;
      `;

      const data = result[0];
      const valorInventario = Number(data.valor_inventario) || 0;
      const costoVentas = Number(data.costo_ventas) || 0;
      const ingresosVentas = Number(data.ingresos_ventas) || 0;
      const diasInventario = Number(data.dias_inventario) || 0;
      const capitalTrabajo = Number(data.capital_trabajo) || 0;

      // Calcular métricas financieras
      const margenBruto = ingresosVentas > 0 ? ((ingresosVentas - costoVentas) / ingresosVentas) * 100 : 0;
      const margenNeto = margenBruto * 0.7; // Estimación del margen neto
      const roiInventario = valorInventario > 0 ? (margenBruto / valorInventario) * 100 : 0;
      const rotacionInventario = diasInventario > 0 ? 365 / diasInventario : 0;
      const costoAlmacenamiento = valorInventario * 0.02; // 2% del valor del inventario
      const costoOportunidad = valorInventario * 0.08; // 8% de costo de oportunidad
      const eficienciaOperativa = rotacionInventario > 0 ? Math.min(rotacionInventario * 10, 100) : 0;

      return {
        margenBruto: Math.round(margenBruto * 100) / 100,
        margenNeto: Math.round(margenNeto * 100) / 100,
        roiInventario: Math.round(roiInventario * 100) / 100,
        rotacionInventario: Math.round(rotacionInventario * 100) / 100,
        diasInventario: Math.round(diasInventario),
        capitalTrabajo: Math.round(capitalTrabajo * 100) / 100,
        costoAlmacenamiento: Math.round(costoAlmacenamiento * 100) / 100,
        costoOportunidad: Math.round(costoOportunidad * 100) / 100,
        eficienciaOperativa: Math.round(eficienciaOperativa)
      };
    } catch (error) {
      this.logger.error(`Error calculating Financial KPIs for empresa ${empresaId}:`, error);
      throw error;
    }
  }

  private async calculateRotacionInventario(empresaId: number): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<Array<{ rotacion: number }>>`
        WITH ventas_mes AS (
          SELECT SUM(cantidad) as unidades_vendidas
          FROM movimiento_inventario 
          WHERE empresa_id = ${empresaId} 
            AND tipo = 'SALIDA'
            AND fecha >= date_trunc('month', CURRENT_DATE)
        ),
        stock_promedio AS (
          SELECT AVG(stock) as stock_promedio
          FROM producto 
          WHERE empresa_id = ${empresaId} AND estado = 'ACTIVO'
        )
        SELECT 
          CASE 
            WHEN sp.stock_promedio > 0 THEN (vm.unidades_vendidas / sp.stock_promedio) * 12
            ELSE 0 
          END as rotacion
        FROM ventas_mes vm
        CROSS JOIN stock_promedio sp;
      `;

      return Number(result[0]?.rotacion) || 0;
    } catch (error) {
      this.logger.error(`Error calculating inventory rotation for empresa ${empresaId}:`, error);
      return 0;
    }
  }

  // ✅ AÑADIDO: método público para KPIs básicos
  getBasicKPIs(empresaId: number): KPIData {
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

  async getProductosKPI(empresaId: number) {
    try {
      // 🔥 Usar Cache-Aside para productos que se leen frecuentemente
      return await this.cacheStrategies.cacheAside(
        `productos-kpi:${empresaId}`,
        async () => {
          // Obtener productos con movimientos recientes
          const productosConMovimientos = await this.prisma.producto.findMany({
            where: {
              empresaId,
              estado: { in: ['ACTIVO', 'INACTIVO'] } 
            },
            include: {
              movimientos: {
                where: {
                  fecha: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
                  }
                },
                orderBy: {
                  fecha: 'desc'
                },
                take: 5
              }
            },
            orderBy: {
              movimientos: {
                _count: 'desc'
              }
            },
            take: 10
          });

          return productosConMovimientos.map(producto => ({
            id: producto.id,
            nombre: producto.nombre,
            stock: producto.stock,
            stockMinimo: producto.stockMinimo,
            precioCompra: producto.precioCompra,
            precioVenta: producto.precioVenta,
            unidad: producto.unidad,
            etiquetas: producto.etiquetas,
            movimientosRecientes: producto.movimientos.length,
            ultimoMovimiento: producto.movimientos[0]?.fecha || null
          }));
        },
        'producto'
      );
    } catch (error) {
      this.errorHandler.handlePrismaError(error, 'getProductosKPI', `empresaId: ${empresaId}`);
    }
  }

  async getMovimientosPorProducto(empresaId: number) {
    try {
      // 🔥 Usar Cache-Aside para movimientos que se leen frecuentemente
      return await this.cacheStrategies.cacheAside(
        `movimientos-producto:${empresaId}`,
        async () => {
          const movimientos = await this.prisma.movimientoInventario.findMany({
            where: {
              empresaId
            },
            include: {
              producto: {
                select: {
                  nombre: true,
                  etiquetas: true
                }
              }
            },
            orderBy: {
              fecha: 'desc'
            },
            take: 50
          });

          return movimientos.map(movimiento => ({
            id: movimiento.id,
            fecha: movimiento.fecha,
            tipo: movimiento.tipo,
            cantidad: movimiento.cantidad,
            motivo: movimiento.motivo,
            descripcion: movimiento.descripcion,
            producto: {
              nombre: movimiento.producto.nombre,
              etiquetas: movimiento.producto.etiquetas
            }
          }));
        },
        'dynamic'
      );
    } catch (error) {
      this.errorHandler.handlePrismaError(error, 'getMovimientosPorProducto', `empresaId: ${empresaId}`);
    }
  }

  async getDashboardData(empresaId: number) {
    try {
      // Calcular el primer día del mes actual
      const primerDiaDelMes = new Date();
      primerDiaDelMes.setDate(1);
      primerDiaDelMes.setHours(0, 0, 0, 0);

      // Productos activos e inactivos (excluir eliminados)
      const productos = await this.prisma.producto.findMany({
        where: { empresaId, estado: { in: ['ACTIVO', 'INACTIVO'] } },
        select: { stock: true, precioVenta: true, precioCompra: true, id: true, nombre: true }
      });

      // Stock final actual
      const stockFinal = productos.reduce((acc, p) => acc + p.stock, 0);

      // Movimientos de salida del mes
      const movimientosDelMes = await this.prisma.movimientoInventario.findMany({
        where: {
          empresaId,
          tipo: 'SALIDA',
          fecha: { gte: primerDiaDelMes }
        },
        select: { cantidad: true, productoId: true }
      });
      const unidadesVendidas = movimientosDelMes.reduce((acc, m) => acc + m.cantidad, 0);

      // Stock inicial estimado (stock final + unidades vendidas del mes)
      const stockInicial = stockFinal + unidadesVendidas;

      // Margen promedio
      const margenes = productos
        .filter(p => p.precioCompra > 0)
        .map(p => ((p.precioVenta - p.precioCompra) / p.precioCompra) * 100);
      const margenPromedio = margenes.length > 0 ? margenes.reduce((a, b) => a + b, 0) / margenes.length : 0;

      // Rotación
      const rotacion = stockInicial > 0 ? (unidadesVendidas / stockInicial) * 100 : 0;

      // Producto de mayor rotación
      const rotacionPorProducto: Record<number, number> = {};
      movimientosDelMes.forEach(m => {
        rotacionPorProducto[m.productoId] = (rotacionPorProducto[m.productoId] || 0) + m.cantidad;
      });
      let productoMayorRotacion: { nombre: string; movimientos: number } | null = null;
      if (Object.keys(rotacionPorProducto).length > 0) {
        const [idMayor, cantidadMayor] = Object.entries(rotacionPorProducto).sort((a, b) => b[1] - a[1])[0];
        const producto = productos.find(p => p.id === Number(idMayor));
        if (producto) {
          productoMayorRotacion = {
            nombre: producto.nombre,
            movimientos: cantidadMayor
          };
        }
      }

      // Obtener datos para el dashboard
      const [
        totalProductos,
        productosStockBajo,
        movimientosUltimoMes,
        productosConMovimientos,
        movimientosRecientes
      ] = await Promise.all([
        this.prisma.producto.count({
          where: { 
            empresaId,
            estado: { in: ['ACTIVO', 'INACTIVO'] } // Excluir eliminados
          }
        }),
        this.prisma.producto.count({
          where: {
            empresaId,
            estado: 'ACTIVO',
            stock: {
              lte: 10
            }
          }
        }),
        this.prisma.movimientoInventario.count({
          where: {
            empresaId,
            fecha: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        this.getProductosKPI(empresaId),
        this.getMovimientosPorProducto(empresaId)
      ]);

      // Calcular valor total del inventario
      const productosConPrecio = await this.prisma.producto.findMany({
        where: {
          empresaId,
          estado: 'ACTIVO' // Solo productos activos para el valor del inventario
        },
        select: {
          stock: true,
          precioCompra: true
        }
      });

      const valorTotalInventario = productosConPrecio.reduce(
        (total, producto) => total + (producto.stock * producto.precioCompra),
        0
      );

      // Obtener productos con stock crítico
      const stockCritico = await this.prisma.producto.findMany({
        where: {
          empresaId,
          estado: 'ACTIVO',
          stock: {
            lte: 10
          }
        },
        select: {
          nombre: true,
          stock: true,
          stockMinimo: true
        }
      });

      // Obtener ventas por día (últimos 14 días)
      const ventasPorDia = await this.prisma.movimientoInventario.groupBy({
        by: ['fecha'],
        where: {
          empresaId,
          tipo: 'SALIDA',
          fecha: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: {
          cantidad: true
        },
        orderBy: {
          fecha: 'asc'
        }
      });

      // Obtener estadísticas por categoría
              const productosPorEtiqueta = await this.prisma.producto.groupBy({
          by: ['etiquetas'],
        where: {
          empresaId,
          estado: { in: ['ACTIVO', 'INACTIVO'] } 
        },
        _count: {
          id: true
        }
      });

      // Obtener movimientos por tipo en el último mes
      const movimientosPorTipo = await this.prisma.movimientoInventario.groupBy({
        by: ['tipo'],
        where: {
          empresaId,
          fecha: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _count: {
          id: true
        }
      });

//PRUEBA
      const diasGraficos: Array<{
        fecha: string;
        stock: number;
        ventas: number;
        eficiencia: number;
      }> = [];
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 13);
      
      for (let i = 0; i < 14; i++) {
        const fecha = new Date(fechaInicio);
        fecha.setDate(fechaInicio.getDate() + i);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        const ventasDelDia = ventasPorDia.find(v => 
          v.fecha.toISOString().split('T')[0] === fechaStr
        );
        
        diasGraficos.push({
          fecha: fechaStr,
          stock: Math.floor(Math.random() * 100) + 50, // Simulado por ahora
          ventas: ventasDelDia?._sum.cantidad || 0,
          eficiencia: Math.floor(Math.random() * 100)
        });
      }

      return {
        kpis: {
          stockInicial,
          unidadesVendidas,
          stockFinal,
          rotacion,
          margenPromedio,
          productoMayorRotacion,
          totalProductos,
          productosStockBajo,
          movimientosUltimoMes,
          valorTotalInventario: Math.round(valorTotalInventario * 100) / 100
        },
        ventasPorDia: ventasPorDia.map(v => ({
          fecha: v.fecha,
          cantidad: v._sum.cantidad || 0
        })),
        stockCritico: stockCritico.map(p => ({
          nombre: p.nombre,
          stock: p.stock,
          stockMinimo: p.stockMinimo
        })),
        productos: (productosConMovimientos || []).map(p => ({
          ...p,
          movimientos: rotacionPorProducto[p.id] || 0
        })),
        movimientos: movimientosRecientes,
        diasGraficos,
        estadisticas: {
          productosPorEtiqueta,
          movimientosPorTipo
        }
      };
    } catch (error) {
      this.errorHandler.handlePrismaError(error, 'getDashboardData', `empresaId: ${empresaId}`);
    }
  }
}
