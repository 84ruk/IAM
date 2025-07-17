import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheStrategiesService } from '../../common/services/cache-strategies.service';
import { PredictionService } from './prediction.service';

export interface VisualAlert {
  id: string;
  tipo: 'STOCK_CRITICO' | 'QUIEBRE_PREDICHO' | 'TEMPERATURA_ALTA' | 'HUMEDAD_CRITICA' | 'VENCIMIENTO_PROXIMO' | 'DEMANDA_ALTA';
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  titulo: string;
  mensaje: string;
  productoId?: number;
  productoNombre?: string;
  fecha: Date;
  resuelto: boolean;
  accionRequerida: boolean;
  icono: string;
  color: string;
  prioridad: number;
}

export interface ProductoEnRiesgo {
  id: number;
  nombre: string;
  stock: number;
  stockMinimo: number;
  diasRestantes: number;
  probabilidadQuiebre: number;
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  alertas: VisualAlert[];
  recomendaciones: string[];
  ultimaActualizacion: Date;
}

export interface AlertDashboard {
  alertasActivas: VisualAlert[];
  productosEnRiesgo: ProductoEnRiesgo[];
  resumen: {
    totalAlertas: number;
    alertasCriticas: number;
    alertasAltas: number;
    productosCriticos: number;
    productosEnRiesgo: number;
  };
  tendencias: {
    alertasUltimas24h: number;
    alertasUltimaSemana: number;
    tendencia: 'CRECIENTE' | 'ESTABLE' | 'DECRECIENTE';
  };
}

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    private prisma: PrismaService,
    private cacheStrategies: CacheStrategiesService,
    private predictionService: PredictionService,
  ) {}

  /**
   * 🚨 Obtiene todas las alertas visuales activas
   */
  async getVisualAlerts(empresaId: number): Promise<VisualAlert[]> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `visual-alerts:${empresaId}`,
        async () => {
          const alertas: VisualAlert[] = [];

          // 1. Alertas de stock crítico
          const alertasStock = await this.generateStockAlerts(empresaId);
          alertas.push(...alertasStock);

          // 2. Alertas de quiebres predichos
          const alertasQuiebre = await this.generateStockoutAlerts(empresaId);
          alertas.push(...alertasQuiebre);

          // 3. Alertas de sensores (temperatura, humedad)
          const alertasSensores = await this.generateSensorAlerts(empresaId);
          alertas.push(...alertasSensores);

          // 4. Alertas de vencimiento
          const alertasVencimiento = await this.generateExpiryAlerts(empresaId);
          alertas.push(...alertasVencimiento);

          // 5. Alertas de demanda alta
          const alertasDemanda = await this.generateDemandAlerts(empresaId);
          alertas.push(...alertasDemanda);

          // Ordenar por prioridad (críticas primero)
          return alertas.sort((a, b) => b.prioridad - a.prioridad);
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting visual alerts for empresa ${empresaId}:`, error);
      return [];
    }
  }

  /**
   * 📊 Dashboard completo de alertas
   */
  async getAlertDashboard(empresaId: number): Promise<AlertDashboard> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `alert-dashboard:${empresaId}`,
        async () => {
          const [alertasActivas, productosEnRiesgo] = await Promise.all([
            this.getVisualAlerts(empresaId),
            this.getProductosEnRiesgo(empresaId)
          ]);

          const resumen = this.calculateAlertSummary(alertasActivas, productosEnRiesgo);
          const tendencias = await this.calculateAlertTrends(empresaId);

          return {
            alertasActivas,
            productosEnRiesgo,
            resumen,
            tendencias
          };
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting alert dashboard for empresa ${empresaId}:`, error);
      throw error;
    }
  }

  /**
   * 🎯 Productos en riesgo con análisis detallado
   */
  async getProductosEnRiesgo(empresaId: number): Promise<ProductoEnRiesgo[]> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `productos-riesgo:${empresaId}`,
        async () => {
          const productos = await this.prisma.producto.findMany({
            where: {
              empresaId,
              estado: 'ACTIVO',
              stock: { lte: 50 } // Solo productos con stock bajo
            }
          });

          const productosEnRiesgo: ProductoEnRiesgo[] = [];

          for (const producto of productos) {
            // Obtener movimientos recientes
            const movimientos = await this.prisma.movimientoInventario.findMany({
              where: {
                productoId: producto.id,
                tipo: 'SALIDA',
                fecha: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              },
              orderBy: { fecha: 'desc' },
              select: { cantidad: true, fecha: true }
            });

            if (movimientos.length === 0) continue;

            // Calcular métricas de riesgo
            const velocidadConsumo = this.calculateConsumptionRate(movimientos);
            const diasRestantes = velocidadConsumo > 0 ? Math.floor(producto.stock / velocidadConsumo) : 999;
            const probabilidadQuiebre = this.calculateStockoutProbability(
              producto.stock,
              producto.stockMinimo,
              velocidadConsumo,
              diasRestantes
            );

            // Determinar severidad
            const severidad = this.determineSeverity(diasRestantes, probabilidadQuiebre);

            // Generar alertas específicas del producto
            const alertas = this.generateProductAlerts(producto, diasRestantes, probabilidadQuiebre);

            // Generar recomendaciones
            const recomendaciones = this.generateProductRecommendations(
              producto,
              velocidadConsumo,
              diasRestantes
            );

            productosEnRiesgo.push({
              id: producto.id,
              nombre: producto.nombre,
              stock: producto.stock,
              stockMinimo: producto.stockMinimo,
              diasRestantes,
              probabilidadQuiebre: Math.round(probabilidadQuiebre * 100) / 100,
              severidad,
              alertas,
              recomendaciones,
              ultimaActualizacion: new Date()
            });
          }

          // Ordenar por probabilidad de quiebre (más críticos primero)
          return productosEnRiesgo.sort((a, b) => b.probabilidadQuiebre - a.probabilidadQuiebre);
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting productos en riesgo for empresa ${empresaId}:`, error);
      return [];
    }
  }

  /**
   * 🔔 Marcar alerta como resuelta
   */
  async resolveAlert(empresaId: number, alertId: string): Promise<void> {
    try {
      // En una implementación real, esto se guardaría en la base de datos
      this.logger.log(`Alert ${alertId} marked as resolved for empresa ${empresaId}`);
      
      // Invalidar cache relacionado
      await this.cacheStrategies.invalidateRelatedData('producto', parseInt(alertId), empresaId);
    } catch (error) {
      this.logger.error(`Error resolving alert ${alertId}:`, error);
      throw error;
    }
  }

  /**
   * 📈 Obtener tendencias de alertas
   */
  async getAlertTrends(empresaId: number, days: number = 7): Promise<Array<{
    fecha: string;
    alertasCriticas: number;
    alertasAltas: number;
    alertasMedias: number;
    alertasBajas: number;
  }>> {
    try {
      return await this.cacheStrategies.cacheAside(
        `alert-trends:${empresaId}:${days}`,
        async () => {
          const tendencias: Array<{
            fecha: string;
            alertasCriticas: number;
            alertasAltas: number;
            alertasMedias: number;
            alertasBajas: number;
          }> = [];
          const fechaInicio = new Date();
          fechaInicio.setDate(fechaInicio.getDate() - days);

          for (let i = 0; i < days; i++) {
            const fecha = new Date(fechaInicio);
            fecha.setDate(fechaInicio.getDate() + i);
            tendencias.push({
              fecha: fecha.toISOString().split('T')[0],
              alertasCriticas: Math.floor(Math.random() * 5),
              alertasAltas: Math.floor(Math.random() * 10),
              alertasMedias: Math.floor(Math.random() * 15),
              alertasBajas: Math.floor(Math.random() * 20)
            });
          }
          return tendencias;
        },
        'analytics'
      );
    } catch (error) {
      this.logger.error(`Error getting alert trends for empresa ${empresaId}:`, error);
      return [];
    }
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Genera alertas de stock crítico
   */
  private async generateStockAlerts(empresaId: number): Promise<VisualAlert[]> {
    const productos = await this.prisma.producto.findMany({
      where: {
        empresaId,
        estado: 'ACTIVO',
        stock: { lte: 10 }
      }
    });

    return productos.map(producto => {
      const severidad = producto.stock === 0 ? 'CRITICA' : 
                       producto.stock <= producto.stockMinimo ? 'ALTA' : 'MEDIA';
      
      return {
        id: `stock-${producto.id}`,
        tipo: 'STOCK_CRITICO',
        severidad,
        titulo: producto.stock === 0 ? 'Producto sin stock' : 'Stock crítico',
        mensaje: producto.stock === 0 
          ? `${producto.nombre} está agotado`
          : `${producto.nombre} tiene stock crítico (${producto.stock} unidades)`,
        productoId: producto.id,
        productoNombre: producto.nombre,
        fecha: new Date(),
        resuelto: false,
        accionRequerida: true,
        icono: '📦',
        color: this.getSeverityColor(severidad),
        prioridad: this.getSeverityPriority(severidad)
      };
    });
  }

  /**
   * Genera alertas de quiebres predichos
   */
  private async generateStockoutAlerts(empresaId: number): Promise<VisualAlert[]> {
    const predicciones = await this.predictionService.predictStockouts(empresaId);
    
    return predicciones
      .filter(p => p.probabilidadQuiebre >= 0.7) // Solo alertas con alta probabilidad
      .map(prediccion => ({
        id: `stockout-${prediccion.productoId}`,
        tipo: 'QUIEBRE_PREDICHO',
        severidad: prediccion.severidad,
        titulo: 'Quiebre de stock predicho',
        mensaje: `${prediccion.nombre} podría agotarse en ${prediccion.diasRestantes} días (${Math.round(prediccion.probabilidadQuiebre * 100)}% probabilidad)`,
        productoId: prediccion.productoId,
        productoNombre: prediccion.nombre,
        fecha: new Date(),
        resuelto: false,
        accionRequerida: true,
        icono: '🚨',
        color: this.getSeverityColor(prediccion.severidad),
        prioridad: this.getSeverityPriority(prediccion.severidad)
      }));
  }

  /**
   * Genera alertas de sensores
   */
  private async generateSensorAlerts(empresaId: number): Promise<VisualAlert[]> {
    const sensores = await this.prisma.sensorLectura.findMany({
      where: {
        producto: { empresaId },
        fecha: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      },
      include: {
        producto: true
      }
    });

    const alertas: VisualAlert[] = [];

    // Simular alertas de temperatura y humedad
    const alertasTemperatura = sensores.filter(s => s.tipo === 'TEMPERATURA').slice(0, 3);
    const alertasHumedad = sensores.filter(s => s.tipo === 'HUMEDAD').slice(0, 2);

    alertasTemperatura.forEach(sensor => {
      if (sensor.producto) {
        alertas.push({
          id: `temp-${sensor.id}`,
          tipo: 'TEMPERATURA_ALTA',
          severidad: 'MEDIA',
          titulo: 'Temperatura fuera de rango',
          mensaje: `Temperatura alta detectada en ${sensor.producto.nombre}`,
          productoId: sensor.productoId ?? undefined,
          productoNombre: sensor.producto.nombre,
          fecha: new Date(),
          resuelto: false,
          accionRequerida: false,
          icono: '🌡️',
          color: this.getSeverityColor('MEDIA'),
          prioridad: this.getSeverityPriority('MEDIA')
        });
      }
    });

    alertasHumedad.forEach(sensor => {
      if (sensor.producto) {
        alertas.push({
          id: `hum-${sensor.id}`,
          tipo: 'HUMEDAD_CRITICA',
          severidad: 'ALTA',
          titulo: 'Humedad crítica',
          mensaje: `Humedad crítica detectada en ${sensor.producto.nombre}`,
          productoId: sensor.productoId ?? undefined,
          productoNombre: sensor.producto.nombre,
          fecha: new Date(),
          resuelto: false,
          accionRequerida: true,
          icono: '💧',
          color: this.getSeverityColor('ALTA'),
          prioridad: this.getSeverityPriority('ALTA')
        });
      }
    });

    return alertas;
  }

  /**
   * Genera alertas de vencimiento
   */
  private async generateExpiryAlerts(empresaId: number): Promise<VisualAlert[]> {
    // Simular productos con vencimiento próximo
    const productos = await this.prisma.producto.findMany({
      where: { empresaId, estado: 'ACTIVO' },
      take: 5
    });

    return productos.map(producto => {
      const diasRestantes = Math.floor(Math.random() * 30);
      const severidad = diasRestantes <= 7 ? 'CRITICA' : 
                       diasRestantes <= 15 ? 'ALTA' : 'MEDIA';

      return {
        id: `expiry-${producto.id}`,
        tipo: 'VENCIMIENTO_PROXIMO',
        severidad,
        titulo: 'Vencimiento próximo',
        mensaje: `${producto.nombre} vence en ${diasRestantes} días`,
        productoId: producto.id,
        productoNombre: producto.nombre,
        fecha: new Date(),
        resuelto: false,
        accionRequerida: true,
        icono: '⏰',
        color: this.getSeverityColor(severidad),
        prioridad: this.getSeverityPriority(severidad)
      };
    });
  }

  /**
   * Genera alertas de demanda alta
   */
  private async generateDemandAlerts(empresaId: number): Promise<VisualAlert[]> {
    const predicciones = await this.predictionService.predictDemand(empresaId);
    
    return predicciones
      .filter(p => p.confianza >= 80 && p.demandaEstimada > 100) // Solo productos con alta confianza y demanda alta
      .slice(0, 3) // Limitar a 3 alertas
      .map(prediccion => ({
        id: `demand-${prediccion.productoId}`,
        tipo: 'DEMANDA_ALTA',
        severidad: 'MEDIA',
        titulo: 'Demanda alta detectada',
        mensaje: `Demanda alta predicha para ${prediccion.nombre} (${prediccion.demandaEstimada} unidades)`,
        productoId: prediccion.productoId,
        productoNombre: prediccion.nombre,
        fecha: new Date(),
        resuelto: false,
        accionRequerida: false,
        icono: '📈',
        color: this.getSeverityColor('MEDIA'),
        prioridad: this.getSeverityPriority('MEDIA')
      }));
  }

  /**
   * Genera alertas específicas de un producto
   */
  private generateProductAlerts(producto: any, diasRestantes: number, probabilidadQuiebre: number): VisualAlert[] {
    const alertas: VisualAlert[] = [];

    if (producto.stock === 0) {
      alertas.push({
        id: `product-stock-${producto.id}`,
        tipo: 'STOCK_CRITICO',
        severidad: 'CRITICA',
        titulo: 'Producto agotado',
        mensaje: `${producto.nombre} está completamente agotado`,
        productoId: producto.id,
        productoNombre: producto.nombre,
        fecha: new Date(),
        resuelto: false,
        accionRequerida: true,
        icono: '🚫',
        color: this.getSeverityColor('CRITICA'),
        prioridad: this.getSeverityPriority('CRITICA')
      });
    } else if (diasRestantes <= 3) {
      alertas.push({
        id: `product-quiebre-${producto.id}`,
        tipo: 'QUIEBRE_PREDICHO',
        severidad: 'ALTA',
        titulo: 'Quiebre inminente',
        mensaje: `${producto.nombre} podría agotarse en ${diasRestantes} días`,
        productoId: producto.id,
        productoNombre: producto.nombre,
        fecha: new Date(),
        resuelto: false,
        accionRequerida: true,
        icono: '⚠️',
        color: this.getSeverityColor('ALTA'),
        prioridad: this.getSeverityPriority('ALTA')
      });
    }

    return alertas;
  }

  /**
   * Genera recomendaciones para un producto
   */
  private generateProductRecommendations(producto: any, velocidadConsumo: number, diasRestantes: number): string[] {
    const recomendaciones: string[] = [];

    if (producto.stock === 0) {
      recomendaciones.push('🚨 Reabastecer URGENTE');
    } else if (diasRestantes <= 1) {
      recomendaciones.push('⚠️ Reabastecer en las próximas 24h');
    } else if (diasRestantes <= 3) {
      recomendaciones.push('📦 Planificar reabastecimiento inmediato');
    } else if (diasRestantes <= 7) {
      recomendaciones.push('📋 Revisar stock mínimo');
    }

    if (velocidadConsumo > producto.stockMinimo / 7) {
      recomendaciones.push('📈 Considerar aumentar stock mínimo');
    }

    return recomendaciones;
  }

  /**
   * Calcula resumen de alertas
   */
  private calculateAlertSummary(alertas: VisualAlert[], productosEnRiesgo: ProductoEnRiesgo[]): {
    totalAlertas: number;
    alertasCriticas: number;
    alertasAltas: number;
    productosCriticos: number;
    productosEnRiesgo: number;
  } {
    const alertasCriticas = alertas.filter(a => a.severidad === 'CRITICA').length;
    const alertasAltas = alertas.filter(a => a.severidad === 'ALTA').length;
    const productosCriticos = productosEnRiesgo.filter(p => p.severidad === 'CRITICA').length;

    return {
      totalAlertas: alertas.length,
      alertasCriticas,
      alertasAltas,
      productosCriticos,
      productosEnRiesgo: productosEnRiesgo.length
    };
  }

  /**
   * Calcula tendencias de alertas
   */
  private async calculateAlertTrends(empresaId: number): Promise<{
    alertasUltimas24h: number;
    alertasUltimaSemana: number;
    tendencia: 'CRECIENTE' | 'ESTABLE' | 'DECRECIENTE';
  }> {
    // Simular datos de tendencias
    const alertasUltimas24h = Math.floor(Math.random() * 10) + 5;
    const alertasUltimaSemana = Math.floor(Math.random() * 50) + 20;
    
    const tendencia = alertasUltimas24h > alertasUltimaSemana / 7 ? 'CRECIENTE' :
                     alertasUltimas24h < alertasUltimaSemana / 7 ? 'DECRECIENTE' : 'ESTABLE';

    return {
      alertasUltimas24h,
      alertasUltimaSemana,
      tendencia
    };
  }

  // ===== MÉTODOS AUXILIARES =====

  private calculateConsumptionRate(movimientos: any[]): number {
    if (movimientos.length === 0) return 0;
    const totalConsumo = movimientos.reduce((sum, m) => sum + m.cantidad, 0);
    const dias = Math.max(1, (Date.now() - movimientos[movimientos.length - 1].fecha.getTime()) / (1000 * 60 * 60 * 24));
    return totalConsumo / dias;
  }

  private calculateStockoutProbability(stock: number, stockMinimo: number, velocidadConsumo: number, diasRestantes: number): number {
    if (velocidadConsumo === 0) return 0;
    if (diasRestantes <= 0) return 1;
    
    const factorRiesgo = stock / stockMinimo;
    const factorTiempo = Math.max(0, 1 - (diasRestantes / 30));
    return Math.min(1, (1 - factorRiesgo) * 0.7 + factorTiempo * 0.3);
  }

  private determineSeverity(diasRestantes: number, probabilidad: number): 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' {
    if (diasRestantes <= 1 || probabilidad >= 0.9) return 'CRITICA';
    if (diasRestantes <= 3 || probabilidad >= 0.7) return 'ALTA';
    if (diasRestantes <= 7 || probabilidad >= 0.5) return 'MEDIA';
    return 'BAJA';
  }

  private getSeverityColor(severidad: string): string {
    switch (severidad) {
      case 'CRITICA': return '#dc2626'; // red-600
      case 'ALTA': return '#ea580c'; // orange-600
      case 'MEDIA': return '#d97706'; // amber-600
      case 'BAJA': return '#059669'; // emerald-600
      default: return '#6b7280'; // gray-500
    }
  }

  private getSeverityPriority(severidad: string): number {
    switch (severidad) {
      case 'CRITICA': return 4;
      case 'ALTA': return 3;
      case 'MEDIA': return 2;
      case 'BAJA': return 1;
      default: return 0;
    }
  }
} 