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

    // Consulta optimizada para obtener movimientos diarios
    const movimientos = await this.prisma.$queryRaw<Array<{
      fecha: string;
      tipo: 'ENTRADA' | 'SALIDA';
      cantidad: number;
      valor: number;
    }>>`
      SELECT 
        DATE(m.fecha) as fecha,
        m.tipo,
        SUM(m.cantidad) as cantidad,
        SUM(m.cantidad * p."precioVenta") as valor
      FROM "MovimientoInventario" m
      INNER JOIN "Producto" p ON m."productoId" = p.id
      WHERE m."empresaId" = ${empresaId}
        AND m.fecha >= ${fechaLimite}
      GROUP BY DATE(m.fecha), m.tipo
      ORDER BY fecha ASC
    `;

    // ✅ CORREGIDO: Log seguro sin JSON.stringify
    this.logger.log(`Movimientos obtenidos de la base de datos: ${movimientos.length} registros`);
    if (movimientos.length > 0) {
      this.logger.log(`Primer movimiento: ${movimientos[0].fecha} - ${movimientos[0].tipo} - ${movimientos[0].cantidad}`);
    }

    // Procesar datos y crear estructura por día
    const dailyData = this.processDailyData(movimientos, days);
    const summary = this.calculateSummary(dailyData);

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
        totalDays: dailyData.length
      }
    };
  }

  private processDailyData(movimientos: any[], days: number): DailyMovementData[] {
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
        valorNeto: 0
      });
    }

    // Procesar movimientos reales
    movimientos.forEach(mov => {
      // Convertir la fecha del movimiento a string en formato YYYY-MM-DD
      const fechaMovimiento = typeof mov.fecha === 'string' 
        ? mov.fecha 
        : new Date(mov.fecha).toISOString().split('T')[0];
      
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

    // Convertir a array y ordenar por fecha
    return Array.from(dailyMap.values())
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  private calculateSummary(data: DailyMovementData[]): DailyMovementsSummary {
    if (data.length === 0) {
      return {
        avgEntradasDiarias: 0,
        avgSalidasDiarias: 0,
        diaMaxActividad: '',
        totalMovimientos: 0,
        tendencia: 'ESTABLE'
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
    const umbral = actividadPrimeraMitad * 0.1; // 10% de diferencia

    if (diferencia > umbral) {
      tendencia = 'CRECIENTE';
    } else if (diferencia < -umbral) {
      tendencia = 'DECRECIENTE';
    }

    return {
      avgEntradasDiarias: totalEntradas / data.length,
      avgSalidasDiarias: totalSalidas / data.length,
      diaMaxActividad,
      totalMovimientos,
      tendencia
    };
  }
} 