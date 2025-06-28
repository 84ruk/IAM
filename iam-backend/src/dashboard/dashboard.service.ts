import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorHandlerService } from '../common/services/error-handler.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlerService
  ) {}

  async getKpis(empresaId: number) {
    try {

      const totalProductos = await this.prisma.producto.count({
        where: { 
          empresaId,
          estado: { in: ['ACTIVO', 'INACTIVO'] } // Excluir eliminados
        }
      });


      const productosStockBajo = await this.prisma.producto.count({
        where: {
          empresaId,
          estado: 'ACTIVO', // Solo activos para stock bajo
          stock: {
            lte: 10 // Stock mínimo por defecto
          }
        }
      });

      // Obtener movimientos del último mes
      const unMesAtras = new Date();
      unMesAtras.setMonth(unMesAtras.getMonth() - 1);

      const movimientosUltimoMes = await this.prisma.movimientoInventario.count({
        where: {
          empresaId,
          fecha: {
            gte: unMesAtras
          }
        }
      });

      // Obtener valor total del inventario
      const productosConPrecio = await this.prisma.producto.findMany({
        where: {
          empresaId,
          estado: 'ACTIVO' 
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

      return {
        totalProductos,
        productosStockBajo,
        movimientosUltimoMes,
        valorTotalInventario: Math.round(valorTotalInventario * 100) / 100
      };
    } catch (error) {
      this.errorHandler.handlePrismaError(error, 'getKpis', `empresaId: ${empresaId}`);
    }
  }

  async getProductosKPI(empresaId: number) {
    try {
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
        etiqueta: producto.etiqueta,
        movimientosRecientes: producto.movimientos.length,
        ultimoMovimiento: producto.movimientos[0]?.fecha || null
      }));
    } catch (error) {
      this.errorHandler.handlePrismaError(error, 'getProductosKPI', `empresaId: ${empresaId}`);
    }
  }

  async getMovimientosPorProducto(empresaId: number) {
    try {
      const movimientos = await this.prisma.movimientoInventario.findMany({
        where: {
          empresaId
        },
        include: {
          producto: {
            select: {
              nombre: true,
              etiqueta: true
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
          etiqueta: movimiento.producto.etiqueta
        }
      }));
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
          by: ['etiqueta'],
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
