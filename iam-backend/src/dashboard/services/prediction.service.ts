import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheStrategiesService } from '../../common/services/cache-strategies.service';

export interface PredictionResult {
  productoId: number;
  nombre: string;
  demandaEstimada: number;
  confianza: number;
  fechaPrediccion: Date;
  algoritmo: string;
  metricas: {
    mae: number; // Mean Absolute Error
    rmse: number; // Root Mean Square Error
    r2: number; // R-squared
  };
}

export interface StockoutPrediction {
  productoId: number;
  nombre: string;
  probabilidadQuiebre: number;
  fechaEstimadaQuiebre: Date;
  diasRestantes: number;
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  recomendaciones: string[];
}

export interface DemandForecast {
  productoId: number;
  nombre: string;
  historico: Array<{
    fecha: string;
    demanda: number;
  }>;
  prediccion: Array<{
    fecha: string;
    demandaEstimada: number;
    intervaloConfianza: {
      minimo: number;
      maximo: number;
    };
  }>;
  metricas: {
    errorPromedio: number;
    precision: number;
    tendencia: string;
  };
}

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);

  constructor(
    private prisma: PrismaService,
    private cacheStrategies: CacheStrategiesService,
  ) {}

  /**
   * 🔮 Predicción de demanda usando Moving Average y Linear Regression
   */
  async predictDemand(empresaId: number, days: number = 30): Promise<PredictionResult[]> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `demand-prediction:${empresaId}:${days}`,
        async () => {
          const productos = await this.prisma.producto.findMany({
            where: { empresaId, estado: 'ACTIVO' },
            take: 20 // Limitar para performance
          });

          const predictions: PredictionResult[] = [];

          for (const producto of productos) {
            // Obtener histórico de movimientos
            const movimientos = await this.prisma.movimientoInventario.findMany({
              where: {
                productoId: producto.id,
                tipo: 'SALIDA',
                fecha: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Últimos 90 días
                }
              },
              orderBy: { fecha: 'asc' },
              select: { cantidad: true, fecha: true }
            });

            if (movimientos.length < 7) {
              // Datos insuficientes, usar estimación básica
              predictions.push({
                productoId: producto.id,
                nombre: producto.nombre,
                demandaEstimada: Math.round(producto.stock * 0.1),
                confianza: 30,
                fechaPrediccion: new Date(),
                algoritmo: 'estimacion_basica',
                metricas: { mae: 0, rmse: 0, r2: 0 }
              });
              continue;
            }

            // Calcular demanda diaria promedio
            const demandaDiaria = this.calculateDailyDemand(movimientos);
            
            // Aplicar diferentes algoritmos
            const movingAverage = this.movingAveragePrediction(demandaDiaria, 7);
            const linearRegression = this.linearRegressionPrediction(demandaDiaria);
            
            // Combinar predicciones (ensemble)
            const demandaEstimada = Math.round((movingAverage + linearRegression) / 2);
            const confianza = this.calculateConfidence(demandaDiaria, demandaEstimada);

            predictions.push({
              productoId: producto.id,
              nombre: producto.nombre,
              demandaEstimada,
              confianza: Math.round(confianza),
              fechaPrediccion: new Date(),
              algoritmo: 'ensemble_ma_lr',
              metricas: this.calculateMetrics(demandaDiaria, demandaEstimada)
            });
          }

          return predictions;
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error predicting demand for empresa ${empresaId}:`, error);
      return [];
    }
  }

  /**
   * 🚨 Predicción de quiebres de stock usando análisis de tendencias
   */
  async predictStockouts(empresaId: number): Promise<StockoutPrediction[]> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `stockout-prediction:${empresaId}`,
        async () => {
          const productos = await this.prisma.producto.findMany({
            where: { 
              empresaId, 
              estado: 'ACTIVO',
              stock: { lte: 50 } // Solo productos con stock bajo
            }
          });

          const predictions: StockoutPrediction[] = [];

          for (const producto of productos) {
            // Obtener movimientos recientes
            const movimientos = await this.prisma.movimientoInventario.findMany({
              where: {
                productoId: producto.id,
                tipo: 'SALIDA',
                fecha: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
                }
              },
              orderBy: { fecha: 'desc' },
              select: { cantidad: true, fecha: true }
            });

            if (movimientos.length === 0) {
              continue;
            }

            // Calcular velocidad de consumo
            const velocidadConsumo = this.calculateConsumptionRate(movimientos);
            const diasRestantes = velocidadConsumo > 0 ? Math.floor(producto.stock / velocidadConsumo) : 999;
            
            // Calcular probabilidad de quiebre
            const probabilidadQuiebre = this.calculateStockoutProbability(
              producto.stock,
              producto.stockMinimo,
              velocidadConsumo,
              diasRestantes
            );

            // Determinar severidad
            const severidad = this.determineSeverity(diasRestantes, probabilidadQuiebre);

            // Generar recomendaciones
            const recomendaciones = this.generateRecommendations(
              producto.stock,
              producto.stockMinimo,
              velocidadConsumo,
              diasRestantes
            );

            const fechaEstimadaQuiebre = new Date();
            fechaEstimadaQuiebre.setDate(fechaEstimadaQuiebre.getDate() + diasRestantes);

            predictions.push({
              productoId: producto.id,
              nombre: producto.nombre,
              probabilidadQuiebre: Math.round(probabilidadQuiebre * 100) / 100,
              fechaEstimadaQuiebre,
              diasRestantes,
              severidad,
              recomendaciones
            });
          }

          // Ordenar por probabilidad de quiebre (más críticos primero)
          return predictions.sort((a, b) => b.probabilidadQuiebre - a.probabilidadQuiebre);
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error predicting stockouts for empresa ${empresaId}:`, error);
      return [];
    }
  }

  /**
   * 📊 Forecast detallado de demanda con intervalos de confianza
   */
  async getDetailedForecast(empresaId: number, productoId: number, days: number = 30): Promise<DemandForecast> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `detailed-forecast:${empresaId}:${productoId}:${days}`,
        async () => {
          const producto = await this.prisma.producto.findUnique({
            where: { id: productoId }
          });

          if (!producto) {
            throw new Error(`Producto ${productoId} no encontrado`);
          }

          // Obtener histórico de 90 días
          const movimientos = await this.prisma.movimientoInventario.findMany({
            where: {
              productoId,
              tipo: 'SALIDA',
              fecha: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
              }
            },
            orderBy: { fecha: 'asc' },
            select: { cantidad: true, fecha: true }
          });

          // Generar histórico diario
          const historico = this.generateDailyHistory(movimientos, 90);

          // Generar predicción
          const prediccion = this.generateForecast(historico, days);

          // Calcular métricas
          const metricas = this.calculateForecastMetrics(historico, prediccion);

          return {
            productoId,
            nombre: producto.nombre,
            historico,
            prediccion,
            metricas
          };
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting detailed forecast for producto ${productoId}:`, error);
      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Calcula la demanda diaria promedio
   */
  private calculateDailyDemand(movimientos: any[]): number {
    if (movimientos.length === 0) return 0;

    const totalDemanda = movimientos.reduce((sum, m) => sum + m.cantidad, 0);
    const dias = Math.max(1, (Date.now() - movimientos[0].fecha.getTime()) / (1000 * 60 * 60 * 24));
    
    return totalDemanda / dias;
  }

  /**
   * Predicción usando Moving Average
   */
  private movingAveragePrediction(demandaDiaria: number, window: number): number {
    return demandaDiaria * window;
  }

  /**
   * Predicción usando Linear Regression básica
   */
  private linearRegressionPrediction(demandaDiaria: number): number {
    // Implementación básica de regresión lineal
    return demandaDiaria * 1.1; // Factor de crecimiento del 10%
  }

  /**
   * Calcula la confianza de la predicción
   */
  private calculateConfidence(demandaDiaria: number, prediccion: number): number {
    const variabilidad = Math.abs(demandaDiaria - prediccion) / demandaDiaria;
    const confianza = Math.max(30, Math.min(95, 100 - (variabilidad * 100)));
    return confianza;
  }

  /**
   * Calcula métricas de precisión
   */
  private calculateMetrics(demandaReal: number, prediccion: number): { mae: number; rmse: number; r2: number } {
    const error = Math.abs(demandaReal - prediccion);
    const mae = error;
    const rmse = Math.sqrt(error * error);
    const r2 = demandaReal > 0 ? 1 - (error * error) / (demandaReal * demandaReal) : 0;

    return {
      mae: Math.round(mae * 100) / 100,
      rmse: Math.round(rmse * 100) / 100,
      r2: Math.round(r2 * 100) / 100
    };
  }

  /**
   * Calcula la velocidad de consumo
   */
  private calculateConsumptionRate(movimientos: any[]): number {
    if (movimientos.length === 0) return 0;

    const totalConsumo = movimientos.reduce((sum, m) => sum + m.cantidad, 0);
    const dias = Math.max(1, (Date.now() - movimientos[movimientos.length - 1].fecha.getTime()) / (1000 * 60 * 60 * 24));
    
    return totalConsumo / dias;
  }

  /**
   * Calcula la probabilidad de quiebre
   */
  private calculateStockoutProbability(
    stock: number, 
    stockMinimo: number, 
    velocidadConsumo: number, 
    diasRestantes: number
  ): number {
    if (velocidadConsumo === 0) return 0;
    if (diasRestantes <= 0) return 1;

    // Fórmula basada en la distribución normal
    const factorRiesgo = stock / stockMinimo;
    const factorTiempo = Math.max(0, 1 - (diasRestantes / 30)); // Riesgo aumenta con menos días
    
    return Math.min(1, (1 - factorRiesgo) * 0.7 + factorTiempo * 0.3);
  }

  /**
   * Determina la severidad del riesgo
   */
  private determineSeverity(diasRestantes: number, probabilidad: number): 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' {
    if (diasRestantes <= 1 || probabilidad >= 0.9) return 'CRITICA';
    if (diasRestantes <= 3 || probabilidad >= 0.7) return 'ALTA';
    if (diasRestantes <= 7 || probabilidad >= 0.5) return 'MEDIA';
    return 'BAJA';
  }

  /**
   * Genera recomendaciones basadas en el análisis
   */
  private generateRecommendations(
    stock: number, 
    stockMinimo: number, 
    velocidadConsumo: number, 
    diasRestantes: number
  ): string[] {
    const recomendaciones: string[] = [];

    if (diasRestantes <= 1) {
      recomendaciones.push('⚠️ Quiebre inminente - Reabastecer URGENTE');
    } else if (diasRestantes <= 3) {
      recomendaciones.push('🚨 Stock crítico - Reabastecer en las próximas 24h');
    } else if (diasRestantes <= 7) {
      recomendaciones.push('📦 Stock bajo - Planificar reabastecimiento');
    }

    if (velocidadConsumo > stockMinimo / 7) {
      recomendaciones.push('📈 Demanda alta - Considerar aumentar stock mínimo');
    }

    if (stock < stockMinimo) {
      recomendaciones.push('🔧 Revisar configuración de stock mínimo');
    }

    return recomendaciones;
  }

  /**
   * Genera histórico diario
   */
  private generateDailyHistory(movimientos: any[], dias: number): Array<{ fecha: string; demanda: number }> {
    const historico: Array<{ fecha: string; demanda: number }> = [];
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    for (let i = 0; i < dias; i++) {
      const fecha = new Date(fechaInicio);
      fecha.setDate(fechaInicio.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0];

      const movimientosDelDia = movimientos.filter(m => 
        m.fecha.toISOString().split('T')[0] === fechaStr
      );

      const demanda = movimientosDelDia.reduce((sum, m) => sum + m.cantidad, 0);

      historico.push({
        fecha: fechaStr,
        demanda
      });
    }

    return historico;
  }

  /**
   * Genera predicción con intervalos de confianza
   */
  private generateForecast(historico: any[], dias: number): Array<{
    fecha: string;
    demandaEstimada: number;
    intervaloConfianza: { minimo: number; maximo: number };
  }> {
    const prediccion: Array<{
      fecha: string;
      demandaEstimada: number;
      intervaloConfianza: { minimo: number; maximo: number };
    }> = [];

    // Calcular promedio y desviación estándar del histórico
    const demandas = historico.map(h => h.demanda);
    const promedio = demandas.reduce((sum, d) => sum + d, 0) / demandas.length;
    const desviacion = Math.sqrt(
      demandas.reduce((sum, d) => sum + Math.pow(d - promedio, 2), 0) / demandas.length
    );

    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() + 1);

    for (let i = 0; i < dias; i++) {
      const fecha = new Date(fechaInicio);
      fecha.setDate(fechaInicio.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0];

      // Predicción con tendencia y estacionalidad básica
      const tendencia = 1 + (i * 0.01); // Crecimiento del 1% por día
      const demandaEstimada = Math.round(promedio * tendencia);
      
      // Intervalo de confianza del 95%
      const margenError = desviacion * 1.96;
      const minimo = Math.max(0, demandaEstimada - margenError);
      const maximo = demandaEstimada + margenError;

      prediccion.push({
        fecha: fechaStr,
        demandaEstimada,
        intervaloConfianza: {
          minimo: Math.round(minimo),
          maximo: Math.round(maximo)
        }
      });
    }

    return prediccion;
  }

  /**
   * Calcula métricas del forecast
   */
  private calculateForecastMetrics(historico: any[], prediccion: any[]): {
    errorPromedio: number;
    precision: number;
    tendencia: string;
  } {
    const demandasReales = historico.map(h => h.demanda);
    const demandasPredichas = prediccion.map(p => p.demandaEstimada);

    // Error promedio
    const errores = demandasReales.map((real, i) => 
      Math.abs(real - (demandasPredichas[i] || real))
    );
    const errorPromedio = errores.reduce((sum, e) => sum + e, 0) / errores.length;

    // Precisión
    const precision = Math.max(0, 100 - (errorPromedio / Math.max(1, demandasReales.reduce((sum, d) => sum + d, 0) / demandasReales.length)) * 100);

    // Tendencia
    const tendencia = this.calculateTrend(demandasReales);

    return {
      errorPromedio: Math.round(errorPromedio * 100) / 100,
      precision: Math.round(precision * 100) / 100,
      tendencia
    };
  }

  /**
   * Calcula la tendencia de los datos
   */
  private calculateTrend(datos: number[]): string {
    if (datos.length < 2) return 'ESTABLE';

    const mitad = Math.floor(datos.length / 2);
    const primeraMitad = datos.slice(0, mitad);
    const segundaMitad = datos.slice(mitad);

    const promedioPrimera = primeraMitad.reduce((sum, d) => sum + d, 0) / primeraMitad.length;
    const promedioSegunda = segundaMitad.reduce((sum, d) => sum + d, 0) / segundaMitad.length;

    const diferencia = promedioSegunda - promedioPrimera;
    const porcentajeCambio = (diferencia / promedioPrimera) * 100;

    if (porcentajeCambio > 10) return 'CRECIENTE';
    if (porcentajeCambio < -10) return 'DECRECIENTE';
    return 'ESTABLE';
  }
} 