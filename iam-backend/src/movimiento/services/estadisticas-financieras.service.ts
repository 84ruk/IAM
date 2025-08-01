import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EstadisticasFinancierasService {
  private readonly logger = new Logger(EstadisticasFinancierasService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calcula estadísticas financieras completas para una empresa
   */
  async calcularEstadisticasFinancieras(empresaId: number) {
    try {
      // Obtener todos los movimientos (sin filtro de precioTotal por ahora)
      const movimientos = await this.prisma.movimientoInventario.findMany({
        where: {
          empresaId,
          estado: 'ACTIVO',
        },
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              stock: true,
              precioCompra: true,
              precioVenta: true,
            },
          },
        },
        orderBy: { fecha: 'desc' },
      });

      // Obtener productos actuales para valor de inventario
      const productos = await this.prisma.producto.findMany({
        where: {
          empresaId,
          estado: 'ACTIVO',
        },
        select: {
          id: true,
          nombre: true,
          stock: true,
          precioCompra: true,
          precioVenta: true,
        },
      });

      // Calcular estadísticas
      const estadisticas = this.calcularEstadisticas(movimientos, productos);

      this.logger.log(`Estadísticas financieras calculadas para empresa ${empresaId}`, {
        totalMovimientos: movimientos.length,
        totalProductos: productos.length,
        valorInventario: estadisticas.valorInventario,
        ingresosTotales: estadisticas.ingresosTotales,
        costosTotales: estadisticas.costosTotales,
      });

      return estadisticas;
    } catch (error) {
      this.logger.error(`Error calculando estadísticas financieras para empresa ${empresaId}:`, error);
      throw error;
    }
  }

  /**
   * Calcula estadísticas financieras por período
   */
  async calcularEstadisticasPorPeriodo(
    empresaId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ) {
    try {
      const movimientos = await this.prisma.movimientoInventario.findMany({
        where: {
          empresaId,
          estado: 'ACTIVO',
          fecha: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              stock: true,
              precioCompra: true,
              precioVenta: true,
            },
          },
        },
        orderBy: { fecha: 'desc' },
      });

      const productos = await this.prisma.producto.findMany({
        where: {
          empresaId,
          estado: 'ACTIVO',
        },
        select: {
          id: true,
          nombre: true,
          stock: true,
          precioCompra: true,
          precioVenta: true,
        },
      });

      return this.calcularEstadisticas(movimientos, productos);
    } catch (error) {
      this.logger.error(`Error calculando estadísticas por período para empresa ${empresaId}:`, error);
      throw error;
    }
  }

  /**
   * Calcula estadísticas financieras por producto
   */
  async calcularEstadisticasPorProducto(empresaId: number, productoId: number) {
    try {
      const movimientos = await this.prisma.movimientoInventario.findMany({
        where: {
          empresaId,
          productoId,
          estado: 'ACTIVO',
        },
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              stock: true,
              precioCompra: true,
              precioVenta: true,
            },
          },
        },
        orderBy: { fecha: 'desc' },
      });

      const producto = await this.prisma.producto.findFirst({
        where: {
          id: productoId,
          empresaId,
          estado: 'ACTIVO',
        },
        select: {
          id: true,
          nombre: true,
          stock: true,
          precioCompra: true,
          precioVenta: true,
        },
      });

      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      return this.calcularEstadisticas(movimientos, [producto]);
    } catch (error) {
      this.logger.error(`Error calculando estadísticas por producto ${productoId}:`, error);
      throw error;
    }
  }

  /**
   * Calcula estadísticas financieras detalladas
   */
  private calcularEstadisticas(movimientos: any[], productos: any[]) {
    // Calcular valores de movimientos usando precios del producto
    const entradas = movimientos.filter(m => m.tipo === 'ENTRADA');
    const salidas = movimientos.filter(m => m.tipo === 'SALIDA');

    // Calcular valores usando precios del producto (fallback hasta que se implementen los campos de precio)
    const valorEntradas = entradas.reduce((acc, m) => {
      const precioUnitario = m.producto?.precioCompra || 0;
      return acc + (m.cantidad * precioUnitario);
    }, 0);

    const valorSalidas = salidas.reduce((acc, m) => {
      const precioUnitario = m.producto?.precioVenta || 0;
      return acc + (m.cantidad * precioUnitario);
    }, 0);

    // Calcular valor de inventario actual
    const valorInventario = productos.reduce((acc, p) => {
      // Usar precio de compra para valor de inventario (costo)
      return acc + (p.stock * p.precioCompra);
    }, 0);

    // Calcular costos e ingresos (usando precios del producto por ahora)
    const costosTotales = entradas.reduce((acc, m) => {
      const precioUnitario = m.producto?.precioCompra || 0;
      return acc + (m.cantidad * precioUnitario);
    }, 0);

    const ingresosTotales = salidas.reduce((acc, m) => {
      const precioUnitario = m.producto?.precioVenta || 0;
      return acc + (m.cantidad * precioUnitario);
    }, 0);

    // Calcular margen promedio
    const productosConPrecios = productos.filter(p => p.precioCompra > 0 && p.precioVenta > 0);
    const margenPromedio = productosConPrecios.length > 0
      ? productosConPrecios.reduce((acc, p) => {
          const margen = ((p.precioVenta - p.precioCompra) / p.precioCompra) * 100;
          return acc + margen;
        }, 0) / productosConPrecios.length
      : 0;

    // Calcular costo promedio por unidad
    const totalUnidades = productos.reduce((acc, p) => acc + p.stock, 0);
    const costoPromedio = totalUnidades > 0 ? valorInventario / totalUnidades : 0;

    return {
      valorInventario: Math.round(valorInventario * 100) / 100,
      valorEntradas: Math.round(valorEntradas * 100) / 100,
      valorSalidas: Math.round(valorSalidas * 100) / 100,
      margenPromedio: Math.round(margenPromedio * 100) / 100,
      costoPromedio: Math.round(costoPromedio * 100) / 100,
      ingresosTotales: Math.round(ingresosTotales * 100) / 100,
      costosTotales: Math.round(costosTotales * 100) / 100,
      utilidadBruta: Math.round((ingresosTotales - costosTotales) * 100) / 100,
      margenUtilidad: ingresosTotales > 0 
        ? Math.round(((ingresosTotales - costosTotales) / ingresosTotales * 100) * 100) / 100
        : 0,
      totalMovimientos: movimientos.length,
      totalEntradas: entradas.length,
      totalSalidas: salidas.length,
      totalProductos: productos.length,
    };
  }

  /**
   * Obtiene reporte de movimientos con análisis financiero
   */
  async obtenerReporteMovimientos(empresaId: number, fechaInicio?: Date, fechaFin?: Date) {
    try {
      const whereClause: any = {
        empresaId,
        estado: 'ACTIVO',
      };

      if (fechaInicio && fechaFin) {
        whereClause.fecha = {
          gte: fechaInicio,
          lte: fechaFin,
        };
      }

      const movimientos = await this.prisma.movimientoInventario.findMany({
        where: whereClause,
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              precioCompra: true,
              precioVenta: true,
            },
          },
        },
        orderBy: { fecha: 'desc' },
      });

      // Agrupar por tipo de movimiento y calcular totales
      const reporte = {
        entradas: {
          total: 0,
          cantidad: 0,
          movimientos: movimientos.filter(m => m.tipo === 'ENTRADA'),
        },
        salidas: {
          total: 0,
          cantidad: 0,
          movimientos: movimientos.filter(m => m.tipo === 'SALIDA'),
        },
        porTipoPrecio: {
          COMPRA: { total: 0, cantidad: 0 },
          VENTA: { total: 0, cantidad: 0 },
          AJUSTE: { total: 0, cantidad: 0 },
          TRANSFERENCIA: { total: 0, cantidad: 0 },
        },
      };

      // Calcular totales usando precios del producto
      movimientos.forEach(movimiento => {
        if (movimiento.tipo === 'ENTRADA') {
          const precioUnitario = movimiento.producto?.precioCompra || 0;
          const precioTotal = movimiento.cantidad * precioUnitario;
          reporte.entradas.total += precioTotal;
          reporte.entradas.cantidad += movimiento.cantidad;
        } else {
          const precioUnitario = movimiento.producto?.precioVenta || 0;
          const precioTotal = movimiento.cantidad * precioUnitario;
          reporte.salidas.total += precioTotal;
          reporte.salidas.cantidad += movimiento.cantidad;
        }

        // Por ahora, asignar por tipo de movimiento hasta que se implementen los campos de precio
        if (movimiento.tipo === 'ENTRADA') {
          const precioUnitario = movimiento.producto?.precioCompra || 0;
          const precioTotal = movimiento.cantidad * precioUnitario;
          reporte.porTipoPrecio.COMPRA.total += precioTotal;
          reporte.porTipoPrecio.COMPRA.cantidad += movimiento.cantidad;
        } else {
          const precioUnitario = movimiento.producto?.precioVenta || 0;
          const precioTotal = movimiento.cantidad * precioUnitario;
          reporte.porTipoPrecio.VENTA.total += precioTotal;
          reporte.porTipoPrecio.VENTA.cantidad += movimiento.cantidad;
        }
      });

      return {
        ...reporte,
        totalMovimientos: movimientos.length,
        periodo: fechaInicio && fechaFin ? { fechaInicio, fechaFin } : null,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo reporte de movimientos para empresa ${empresaId}:`, error);
      throw error;
    }
  }
} 