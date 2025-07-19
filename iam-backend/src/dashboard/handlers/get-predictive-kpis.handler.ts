import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KPICacheService } from '../../common/services/kpi-cache.service';
import { KPIErrorHandler } from '../../common/services/kpi-error-handler.service';
import { GetPredictiveKpisQuery } from '../queries/get-predictive-kpis.query';
import { PredictiveKPIs } from '../interfaces/industry-kpis.interface';

@Injectable()
export class GetPredictiveKpisHandler {
  private readonly logger = new Logger(GetPredictiveKpisHandler.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: KPICacheService,
    private errorHandler: KPIErrorHandler,
  ) {}

  async execute(query: GetPredictiveKpisQuery): Promise<PredictiveKPIs> {
    const cacheKey = `predictive-kpis:${query.empresaId}:${query.days || 30}:${query.userRole || 'all'}`;
    
    try {
      // Si forceRefresh es true, invalidar cache y recalcular
      if (query.forceRefresh) {
        await this.cacheService.invalidate(cacheKey);
      }

      // Usar getOrSet para manejar cache automáticamente
      const predictiveKpis = await this.cacheService.getOrSet(
        cacheKey,
        () => this.calculatePredictiveKPIs(query.empresaId, query.days),
        1800 // 30 minutos TTL
      );
      
      this.logger.log('KPIs predictivos calculados exitosamente', { 
        empresaId: query.empresaId,
        days: query.days 
      });
      
      return predictiveKpis;
    } catch (error) {
      return this.errorHandler.handleKPIError(
        error,
        'Error calculando KPIs predictivos',
        query.empresaId
      );
    }
  }

  private async calculatePredictiveKPIs(empresaId: number, days: number = 30): Promise<PredictiveKPIs> {
    const [
      prediccionDemanda,
      prediccionQuiebres,
      tendenciasVentas,
      estacionalidad
    ] = await Promise.all([
      this.predictDemand(empresaId, days),
      this.predictStockouts(empresaId),
      this.analyzeSalesTrends(empresaId),
      this.calculateSeasonality(empresaId)
    ]);

    return {
      prediccionDemanda,
      prediccionQuiebres,
      tendenciasVentas,
      estacionalidad
    };
  }

  private async predictDemand(empresaId: number, days: number): Promise<Array<{
    productoId: number;
    nombre: string;
    demandaEstimada: number;
    confianza: number;
  }>> {
    // Algoritmo simple de predicción basado en promedio móvil
    const productos = await this.prisma.producto.findMany({
      where: {
        empresaId,
        estado: 'ACTIVO',
        
      },
      select: {
        id: true,
        nombre: true
      },
      take: 10 // Limitar a 10 productos para performance
    });

    const predicciones = await Promise.all(
      productos.map(async (producto) => {
        const demandaEstimada = await this.calculateProductDemand(producto.id, days);
        const confianza = await this.calculateConfidence(producto.id);
        
        return {
          productoId: producto.id,
          nombre: producto.nombre,
          demandaEstimada,
          confianza
        };
      })
    );

    return predicciones.sort((a, b) => b.demandaEstimada - a.demandaEstimada);
  }

  private async calculateProductDemand(productoId: number, days: number): Promise<number> {
    // Obtener historial de ventas de los últimos 90 días
    const historialVentas = await this.prisma.movimientoInventario.findMany({
      where: {
        productoId,
        tipo: 'SALIDA',
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        cantidad: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (historialVentas.length === 0) {
      return 0;
    }

    // Calcular promedio diario de ventas
    const ventasPorDia = this.groupSalesByDay(historialVentas);
    const promedioDiario = this.calculateAverageDailySales(ventasPorDia);
    
    // Aplicar factor de crecimiento (simulación de tendencia)
    const factorCrecimiento = this.calculateGrowthFactor(ventasPorDia);
    
    // Predicción = Promedio diario * días * factor de crecimiento
    return Math.round(promedioDiario * days * factorCrecimiento);
  }

  private groupSalesByDay(movimientos: Array<{ cantidad: number; createdAt: Date }>): Map<string, number> {
    const ventasPorDia = new Map<string, number>();
    
    movimientos.forEach(movimiento => {
      const fecha = movimiento.createdAt.toISOString().split('T')[0];
      const ventaActual = ventasPorDia.get(fecha) || 0;
      ventasPorDia.set(fecha, ventaActual + movimiento.cantidad);
    });
    
    return ventasPorDia;
  }

  private calculateAverageDailySales(ventasPorDia: Map<string, number>): number {
    const totalVentas = Array.from(ventasPorDia.values()).reduce((sum, venta) => sum + venta, 0);
    const diasConVentas = ventasPorDia.size;
    
    return diasConVentas > 0 ? totalVentas / diasConVentas : 0;
  }

  private calculateGrowthFactor(ventasPorDia: Map<string, number>): number {
    const fechas = Array.from(ventasPorDia.keys()).sort();
    if (fechas.length < 2) return 1.0;
    
    // Dividir en dos períodos para calcular tendencia
    const mitad = Math.floor(fechas.length / 2);
    const primerPeriodo = fechas.slice(0, mitad);
    const segundoPeriodo = fechas.slice(mitad);
    
    const promedioPrimerPeriodo = this.calculatePeriodAverage(ventasPorDia, primerPeriodo);
    const promedioSegundoPeriodo = this.calculatePeriodAverage(ventasPorDia, segundoPeriodo);
    
    if (promedioPrimerPeriodo === 0) return 1.0;
    
    const factor = promedioSegundoPeriodo / promedioPrimerPeriodo;
    // Limitar el factor entre 0.5 y 2.0 para evitar predicciones extremas
    return Math.max(0.5, Math.min(2.0, factor));
  }

  private calculatePeriodAverage(ventasPorDia: Map<string, number>, fechas: string[]): number {
    const ventasPeriodo = fechas
      .map(fecha => ventasPorDia.get(fecha) || 0)
      .reduce((sum, venta) => sum + venta, 0);
    
    return fechas.length > 0 ? ventasPeriodo / fechas.length : 0;
  }

  private async calculateConfidence(productoId: number): Promise<number> {
    // Calcular confianza basada en la consistencia de los datos
    const movimientos = await this.prisma.movimientoInventario.count({
      where: {
        productoId,
        tipo: 'SALIDA',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    // Más movimientos = mayor confianza (hasta 95%)
    const confianza = Math.min(95, Math.max(50, movimientos * 2));
    return confianza;
  }

  private async predictStockouts(empresaId: number): Promise<Array<{
    productoId: number;
    nombre: string;
    fechaPrediccion: Date;
    probabilidad: number;
  }>> {
    const productosEnRiesgo = await this.prisma.producto.findMany({
      where: {
        empresaId,
        estado: 'ACTIVO',
        
        stock: {
          lte: this.prisma.producto.fields.stockMinimo
        }
      },
      select: {
        id: true,
        nombre: true,
        stock: true,
        stockMinimo: true
      }
    });

    const predicciones = await Promise.all(
      productosEnRiesgo.map(async (producto) => {
        const probabilidad = await this.calculateStockoutProbability(producto.id);
        const fechaPrediccion = this.calculateStockoutDate(producto.stock, producto.stockMinimo);
        
        return {
          productoId: producto.id,
          nombre: producto.nombre,
          fechaPrediccion,
          probabilidad
        };
      })
    );

    return predicciones
      .filter(p => p.probabilidad > 30) // Solo productos con alta probabilidad
      .sort((a, b) => b.probabilidad - a.probabilidad);
  }

  private async calculateStockoutProbability(productoId: number): Promise<number> {
    // Calcular probabilidad basada en stock actual vs demanda esperada
    const producto = await this.prisma.producto.findUnique({
      where: { id: productoId },
      select: { stock: true, stockMinimo: true }
    });

    if (!producto) return 0;

    const demandaDiaria = await this.calculateProductDemand(productoId, 1);
    const diasRestantes = producto.stock / demandaDiaria;
    
    // Probabilidad basada en días restantes
    if (diasRestantes <= 1) return 95;
    if (diasRestantes <= 3) return 80;
    if (diasRestantes <= 7) return 60;
    if (diasRestantes <= 14) return 40;
    if (diasRestantes <= 30) return 20;
    
    return 10;
  }

  private calculateStockoutDate(stock: number, stockMinimo: number): Date {
    // Calcular fecha estimada de quiebre de stock
    const diasRestantes = Math.ceil((stock - stockMinimo) / 2); // Estimación conservadora
    const fechaPrediccion = new Date();
    fechaPrediccion.setDate(fechaPrediccion.getDate() + diasRestantes);
    
    return fechaPrediccion;
  }

  private async analyzeSalesTrends(empresaId: number): Promise<{
    tendencia: 'CRECIENTE' | 'ESTABLE' | 'DECRECIENTE';
    porcentajeCambio: number;
    periodo: string;
  }> {
    // Analizar tendencia de ventas de los últimos 60 días vs 60 días anteriores
    const fechaActual = new Date();
    const fecha60DiasAtras = new Date(fechaActual.getTime() - 60 * 24 * 60 * 60 * 1000);
    const fecha120DiasAtras = new Date(fechaActual.getTime() - 120 * 24 * 60 * 60 * 1000);

    const [ventasRecientes, ventasAnteriores] = await Promise.all([
      this.getTotalSales(empresaId, fecha60DiasAtras, fechaActual),
      this.getTotalSales(empresaId, fecha120DiasAtras, fecha60DiasAtras)
    ]);

    const porcentajeCambio = ventasAnteriores > 0 
      ? ((ventasRecientes - ventasAnteriores) / ventasAnteriores) * 100 
      : 0;

    let tendencia: 'CRECIENTE' | 'ESTABLE' | 'DECRECIENTE';
    if (porcentajeCambio > 10) {
      tendencia = 'CRECIENTE';
    } else if (porcentajeCambio < -10) {
      tendencia = 'DECRECIENTE';
    } else {
      tendencia = 'ESTABLE';
    }

    return {
      tendencia,
      porcentajeCambio: Math.round(porcentajeCambio * 100) / 100,
      periodo: '60 días'
    };
  }

  private async getTotalSales(empresaId: number, fechaInicio: Date, fechaFin: Date): Promise<number> {
    const result = await this.prisma.movimientoInventario.aggregate({
      where: {
        empresaId,
        tipo: 'SALIDA',
        createdAt: {
          gte: fechaInicio,
          lt: fechaFin
        }
      },
      _sum: {
        cantidad: true
      }
    });

    return result._sum.cantidad || 0;
  }

  private async calculateSeasonality(empresaId: number): Promise<Array<{
    mes: string;
    factorEstacional: number;
  }>> {
    // Calcular factores estacionales por mes
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const factores = await Promise.all(
      meses.map(async (mes, index) => {
        const factor = await this.calculateMonthlyFactor(empresaId, index + 1);
        return {
          mes,
          factorEstacional: factor
        };
      })
    );

    return factores;
  }

  private async calculateMonthlyFactor(empresaId: number, mes: number): Promise<number> {
    // Obtener ventas del mes específico en el último año
    const fechaInicio = new Date(new Date().getFullYear() - 1, mes - 1, 1);
    const fechaFin = new Date(new Date().getFullYear() - 1, mes, 0);

    const ventasMes = await this.getTotalSales(empresaId, fechaInicio, fechaFin);
    
    // Obtener promedio de ventas mensuales del año
    const fechaInicioAno = new Date(new Date().getFullYear() - 1, 0, 1);
    const fechaFinAno = new Date(new Date().getFullYear() - 1, 11, 31);
    
    const ventasAno = await this.getTotalSales(empresaId, fechaInicioAno, fechaFinAno);
    const promedioMensual = ventasAno / 12;
    
    // Factor estacional = ventas del mes / promedio mensual
    return promedioMensual > 0 ? ventasMes / promedioMensual : 1.0;
  }

  private getBasicPredictiveKPIs(): PredictiveKPIs {
    return {
      prediccionDemanda: [],
      prediccionQuiebres: [],
      tendenciasVentas: {
        tendencia: 'ESTABLE',
        porcentajeCambio: 0,
        periodo: '30 días'
      },
      estacionalidad: []
    };
  }
} 