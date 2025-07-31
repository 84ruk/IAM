import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorHandlerService } from '../common/services/error-handler.service';
import { KPICacheService } from '../common/services/kpi-cache.service';
import { KPIErrorHandler } from '../common/services/kpi-error-handler.service';
import { CacheStrategiesService } from '../common/services/cache-strategies.service';
import { FinancialDataFilterService, FinancialDataFilterOptions } from './services/financial-data-filter.service';
import { Rol } from '@prisma/client';

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

export interface AdvancedKPIs {
  // KPIs de Impacto
  eficienciaOperativa: number;
  costoOportunidad: number;
  riesgoQuiebre: number;
  tendenciaVentas: 'CRECIENTE' | 'ESTABLE' | 'DECRECIENTE';
  
  // Predicciones
  demandaEstimada: number;
  stockOptimo: number;
  quiebrePredicho: Date | null;
  
  // Alertas
  alertasActivas: Alert[];
  productosCriticos: ProductoCritico[];
}

export interface Alert {
  id: string;
  tipo: 'STOCK_BAJO' | 'TEMPERATURA_ALTA' | 'HUMEDAD_CRITICA' | 'QUIEBRE_PREDICHO';
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  mensaje: string;
  productoId?: number;
  productoNombre?: string;
  fecha: Date;
  resuelto: boolean;
}

export interface ProductoCritico {
  id: number;
  nombre: string;
  stock: number;
  stockMinimo: number;
  diasRestantes: number;
  riesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
}

// 🍎 NUEVAS INTERFACES PARA KPIs ESPECÍFICOS POR INDUSTRIA

export interface AlimentosKPIs {
  productosPerecederos: number;
  productosCaducidadProxima: number;
  productosFIFO: number;
  alertasTemperatura: number;
  alertasHumedad: number;
  tiempoPromedioAlmacen: number;
  productosCaducados: number;
  eficienciaFIFO: number;
  condicionesOptimas: {
    temperatura: number;
    humedad: number;
  };
}

export interface FarmaciaKPIs {
  medicamentosControlados: number;
  medicamentosVencimientoProximo: number;
  lotesActivos: number;
  trazabilidadCompleta: number;
  cumplimientoNormativo: number;
  medicamentosCaducados: number;
  alertasVencimiento: number;
  rotacionMedicamentos: number;
  controlLotes: {
    totalLotes: number;
    lotesVigentes: number;
    lotesVencidos: number;
  };
}

export interface RopaKPIs {
  productosPorTemporada: {
    actual: number;
    anterior: number;
    siguiente: number;
  };
  tallasMasVendidas: Array<{
    talla: string;
    cantidad: number;
    porcentaje: number;
  }>;
  coloresMasVendidos: Array<{
    color: string;
    cantidad: number;
    porcentaje: number;
  }>;
  rotacionPorTemporada: number;
  stockPorTemporada: {
    actual: number;
    anterior: number;
    siguiente: number;
  };
  margenPorColeccion: number;
}

export interface ElectronicaKPIs {
  productosConSKU: number;
  productosConSerie: number;
  rotacionGadgets: number;
  productosDiscontinuados: number;
  controlCalidad: number;
  garantiasActivas: number;
  productosRetornados: number;
  eficienciaSKU: number;
  controlInventario: {
    totalSKUs: number;
    SKUsActivos: number;
    SKUsDiscontinuados: number;
  };
}

export interface OperationalKPIs {
  eficienciaAlmacen: number;
  tiempoPromedioMovimiento: number;
  productosMasMovidos: number;
  rutasMasEficientes: number;
  sobrestock: number;
  quiebresStock: number;
  precisionInventario: number;
  automatizacion: number;
  metricasOperativas: {
    movimientosPorHora: number;
    productosPorUbicacion: number;
    tiempoPromedioProcesamiento: number;
  };
}

export interface SupplierKPIs {
  proveedoresActivos: number;
  cumplimientoProveedores: number;
  precioPromedioProveedor: number;
  tiempoEntregaPromedio: number;
  calidadProveedores: number;
  proveedoresCriticos: number;
  metricasProveedor: Array<{
    proveedorId: number;
    nombre: string;
    productos: number;
    precioPromedio: number;
    cumplimiento: number;
    tiempoEntrega: number;
  }>;
}

export interface ProfitabilityKPIs {
  margenBrutoTotal: number;
  margenNetoTotal: number;
  rentabilidadPorProducto: Array<{
    productoId: number;
    nombre: string;
    margenBruto: number;
    margenNeto: number;
    rentabilidad: number;
  }>;
  rentabilidadPorCategoria: Array<{
    categoria: string;
    margenBruto: number;
    margenNeto: number;
    rentabilidad: number;
  }>;
  productosMasRentables: Array<{
    productoId: number;
    nombre: string;
    rentabilidad: number;
  }>;
  productosMenosRentables: Array<{
    productoId: number;
    nombre: string;
    rentabilidad: number;
  }>;
}

export interface SensorKPIs {
  sensoresActivos: number;
  alertasActivas: number;
  condicionesOptimas: number;
  sensoresTemperatura: number;
  sensoresHumedad: number;
  sensoresPresion: number;
  sensoresPeso: number;
  metricasSensores: {
    temperaturaPromedio: number;
    humedadPromedio: number;
    presionPromedio: number;
    pesoPromedio: number;
  };
  alertasPorTipo: {
    temperatura: number;
    humedad: number;
    presion: number;
    peso: number;
  };
}

export interface PredictiveKPIs {
  prediccionDemanda: Array<{
    productoId: number;
    nombre: string;
    demandaEstimada: number;
    confianza: number;
  }>;
  prediccionQuiebres: Array<{
    productoId: number;
    nombre: string;
    fechaPrediccion: Date;
    probabilidad: number;
  }>;
  tendenciasVentas: {
    tendencia: 'CRECIENTE' | 'ESTABLE' | 'DECRECIENTE';
    porcentajeCambio: number;
    periodo: string;
  };
  estacionalidad: Array<{
    mes: string;
    factorEstacional: number;
  }>;
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

export interface ExpiryAlert {
  productoId: number;
  nombre: string;
  fechaCaducidad: Date;
  diasRestantes: number;
  stock: number;
  valorStock: number;
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  recomendacion: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlerService,
    private cacheService: KPICacheService,
    private kpiErrorHandler: KPIErrorHandler,
    private cacheStrategies: CacheStrategiesService,
    private financialDataFilter: FinancialDataFilterService,
  ) {}

  async getKpis(empresaId: number, userRole?: Rol): Promise<KPIData> {
    try {
      // 🔄 Usar Refresh-Ahead para KPIs que necesitan estar siempre disponibles
      const kpis = await this.cacheStrategies.refreshAhead(
        `kpis:${empresaId}`,
        () => this.calculateKPIs(empresaId),
        'dynamic',
      );

      // Aplicar filtros de datos financieros si se especifica rol
      if (userRole) {
        const accessLevel = this.getAccessLevel(userRole);
        const filterOptions = this.financialDataFilter.getFilterOptions(userRole, accessLevel);
        return this.financialDataFilter.filterFinancialKPIs(kpis, filterOptions) as KPIData;
      }

      return kpis;
    } catch (error) {
      this.logger.error(`Error getting KPIs for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getKpis', empresaId);
    }
  }

  async getFinancialKPIs(empresaId: number, userRole?: Rol): Promise<FinancialKPIs> {
    try {
      // 🔄 Usar Refresh-Ahead para KPIs financieros que necesitan estar siempre disponibles
      const financialKPIs = await this.cacheStrategies.refreshAhead(
        `financial-kpis:${empresaId}`,
        () => this.calculateFinancialKPIs(empresaId),
        'dynamic',
      );

      // Aplicar filtros de datos financieros si se especifica rol
      if (userRole) {
        const accessLevel = this.getAccessLevel(userRole);
        const filterOptions = this.financialDataFilter.getFilterOptions(userRole, accessLevel);
        return this.financialDataFilter.filterFinancialKPIs(financialKPIs, filterOptions) as FinancialKPIs;
      }

      return financialKPIs;
    } catch (error) {
      this.logger.error(
        `Error getting Financial KPIs for empresa ${empresaId}:`,
        error,
      );
      return this.kpiErrorHandler.handleKPIError(
        error,
        'getFinancialKPIs',
        empresaId,
      );
    }
  }

  async getAdvancedKPIs(empresaId: number): Promise<AdvancedKPIs> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `advanced-kpis:${empresaId}`,
        () => this.calculateAdvancedKPIs(empresaId),
        'dynamic',
      );
    } catch (error) {
      this.logger.error(`Error getting Advanced KPIs for empresa ${empresaId}:`, error);
      return this.getBasicAdvancedKPIs(empresaId);
    }
  }

  private async calculateKPIs(empresaId: number): Promise<KPIData> {
    try {
      // ✅ CONSULTA OPTIMIZADA CON SQL RAW
      const result = await this.prisma.$queryRaw<
        Array<{
          total_productos: number;
          productos_stock_bajo: number;
          valor_inventario: number;
          margen_promedio: number;
          movimientos_ultimo_mes: number;
        }>
      >`
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
      const rotacionInventario =
        await this.calculateRotacionInventario(empresaId);

      const kpis: KPIData = {
        totalProductos: Number(kpiData.total_productos) || 0,
        productosStockBajo: Number(kpiData.productos_stock_bajo) || 0,
        movimientosUltimoMes: Number(kpiData.movimientos_ultimo_mes) || 0,
        valorTotalInventario: Number(kpiData.valor_inventario) || 0,
        margenPromedio: Number(kpiData.margen_promedio) || 0,
        rotacionInventario,
        timestamp: new Date().toISOString(),
      };

      // Validar datos antes de retornar
      if (!this.kpiErrorHandler.validateKPIData(kpis)) {
        this.logger.warn(`Invalid KPI data for empresa ${empresaId}`);
        return this.getBasicKPIs(empresaId);
      }

      return kpis;
    } catch (error) {
      this.logger.error(
        `Error calculating KPIs for empresa ${empresaId}:`,
        error,
      );
      throw error;
    }
  }

  private async calculateFinancialKPIs(
    empresaId: number,
  ): Promise<FinancialKPIs> {
    try {
      // Obtener datos financieros optimizados
      const result = await this.prisma.$queryRaw<
        Array<{
          valor_inventario: number;
          costo_ventas: number;
          ingresos_ventas: number;
          dias_inventario: number;
          capital_trabajo: number;
        }>
      >`
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
      const margenBruto =
        ingresosVentas > 0
          ? ((ingresosVentas - costoVentas) / ingresosVentas) * 100
          : 0;
      const margenNeto = margenBruto * 0.7; // Estimación del margen neto
      const roiInventario =
        valorInventario > 0 ? (margenBruto / valorInventario) * 100 : 0;
      const rotacionInventario = diasInventario > 0 ? 365 / diasInventario : 0;
      const costoAlmacenamiento = valorInventario * 0.02; // 2% del valor del inventario
      const costoOportunidad = valorInventario * 0.08; // 8% de costo de oportunidad
      const eficienciaOperativa =
        rotacionInventario > 0 ? Math.min(rotacionInventario * 10, 100) : 0;

      return {
        margenBruto: Math.round(margenBruto * 100) / 100,
        margenNeto: Math.round(margenNeto * 100) / 100,
        roiInventario: Math.round(roiInventario * 100) / 100,
        rotacionInventario: Math.round(rotacionInventario * 100) / 100,
        diasInventario: Math.round(diasInventario),
        capitalTrabajo: Math.round(capitalTrabajo * 100) / 100,
        costoAlmacenamiento: Math.round(costoAlmacenamiento * 100) / 100,
        costoOportunidad: Math.round(costoOportunidad * 100) / 100,
        eficienciaOperativa: Math.round(eficienciaOperativa),
      };
    } catch (error) {
      this.logger.error(
        `Error calculating Financial KPIs for empresa ${empresaId}:`,
        error,
      );
      throw error;
    }
  }

  private async calculateAdvancedKPIs(empresaId: number): Promise<AdvancedKPIs> {
    try {
      // Obtener datos de productos y movimientos
      const [productos, movimientos, sensores] = await Promise.all([
        this.prisma.producto.findMany({
          where: { empresaId, estado: 'ACTIVO' },
          include: {
            movimientos: {
              where: {
                fecha: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
                },
              },
              orderBy: { fecha: 'desc' },
            },
            sensores: {
              where: {
                fecha: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
                },
              },
              orderBy: { fecha: 'desc' },
            },
          },
        }),
        this.prisma.movimientoInventario.findMany({
          where: {
            empresaId,
            fecha: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Últimos 90 días
            },
          },
          orderBy: { fecha: 'desc' },
        }),
        this.prisma.sensorLectura.findMany({
          where: {
            producto: { empresaId },
            fecha: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
            },
          },
          orderBy: { fecha: 'desc' },
        }),
      ]);

      // Calcular eficiencia operativa
      const eficienciaOperativa = this.calculateEficienciaOperativa(productos, movimientos);
      
      // Calcular costo de oportunidad
      const costoOportunidad = this.calculateCostoOportunidad(productos);
      
      // Calcular riesgo de quiebre
      const riesgoQuiebre = this.calculateRiesgoQuiebre(productos, movimientos);
      
      // Determinar tendencia de ventas
      const tendenciaVentas = this.calculateTendenciaVentas(movimientos);
      
      // Calcular demanda estimada
      const demandaEstimada = this.calculateDemandaEstimada(movimientos);
      
      // Calcular stock óptimo
      const stockOptimo = this.calculateStockOptimo(productos, movimientos);
      
      // Predecir quiebre
      const quiebrePredicho = this.predecirQuiebre(productos, movimientos);
      
      // Generar alertas
      const alertasActivas = this.generateAlertas(productos, sensores);
      
      // Identificar productos críticos
      const productosCriticos = this.identificarProductosCriticos(productos, movimientos);

      return {
        eficienciaOperativa,
        costoOportunidad,
        riesgoQuiebre,
        tendenciaVentas,
        demandaEstimada,
        stockOptimo,
        quiebrePredicho,
        alertasActivas,
        productosCriticos,
      };
    } catch (error) {
      this.logger.error(`Error calculating Advanced KPIs:`, error);
      throw error;
    }
  }

  private calculateEficienciaOperativa(productos: any[], movimientos: any[]): number {
    if (productos.length === 0) return 0;
    
    const productosConMovimientos = productos.filter(p => p.movimientos.length > 0);
    const eficienciaPorProducto = productosConMovimientos.map(producto => {
      const movimientosProducto = movimientos.filter(m => m.productoId === producto.id);
      const salidas = movimientosProducto.filter(m => m.tipo === 'SALIDA').length;
      const entradas = movimientosProducto.filter(m => m.tipo === 'ENTRADA').length;
      
      if (entradas === 0) return 0;
      return (salidas / entradas) * 100;
    });
    
    return eficienciaPorProducto.reduce((acc, val) => acc + val, 0) / eficienciaPorProducto.length;
  }

  private calculateCostoOportunidad(productos: any[]): number {
    return productos.reduce((total, producto) => {
      const stockExcedente = Math.max(0, producto.stock - producto.stockMinimo * 2);
      const costoUnitario = producto.precioCompra;
      const tasaOportunidad = 0.12; // 12% anual
      
      return total + (stockExcedente * costoUnitario * tasaOportunidad / 12); // Mensual
    }, 0);
  }

  private calculateRiesgoQuiebre(productos: any[], movimientos: any[]): number {
    const productosEnRiesgo = productos.filter(p => p.stock <= p.stockMinimo);
    const movimientosRecientes = movimientos.filter(m => 
      m.fecha >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Última semana
    );
    
    const salidasRecientes = movimientosRecientes.filter(m => m.tipo === 'SALIDA').length;
    const velocidadVentas = salidasRecientes / 7; // Ventas por día
    
    const riesgoTotal = productosEnRiesgo.reduce((total, producto) => {
      const diasRestantes = producto.stock / velocidadVentas;
      const riesgo = diasRestantes < 3 ? 100 : diasRestantes < 7 ? 70 : diasRestantes < 14 ? 40 : 10;
      return total + riesgo;
    }, 0);
    
    return Math.min(100, riesgoTotal / productos.length);
  }

  private calculateTendenciaVentas(movimientos: any[]): 'CRECIENTE' | 'ESTABLE' | 'DECRECIENTE' {
    const movimientosSalida = movimientos.filter(m => m.tipo === 'SALIDA');
    
    if (movimientosSalida.length < 10) return 'ESTABLE';
    
    const mitad = Math.floor(movimientosSalida.length / 2);
    const primeraMitad = movimientosSalida.slice(0, mitad);
    const segundaMitad = movimientosSalida.slice(mitad);
    
    const promedioPrimera = primeraMitad.reduce((sum, m) => sum + m.cantidad, 0) / primeraMitad.length;
    const promedioSegunda = segundaMitad.reduce((sum, m) => sum + m.cantidad, 0) / segundaMitad.length;
    
    const diferencia = ((promedioSegunda - promedioPrimera) / promedioPrimera) * 100;
    
    if (diferencia > 10) return 'CRECIENTE';
    if (diferencia < -10) return 'DECRECIENTE';
    return 'ESTABLE';
  }

  private calculateDemandaEstimada(movimientos: any[]): number {
    const movimientosSalida = movimientos.filter(m => m.tipo === 'SALIDA');
    if (movimientosSalida.length === 0) return 0;
    
    const promedioDiario = movimientosSalida.reduce((sum, m) => sum + m.cantidad, 0) / 30; // Últimos 30 días
    return Math.round(promedioDiario * 30); // Estimación mensual
  }

  private calculateStockOptimo(productos: any[], movimientos: any[]): number {
    if (productos.length === 0) return 0;
    
    const stockOptimoPorProducto = productos.map(producto => {
      const movimientosProducto = movimientos.filter(m => m.productoId === producto.id);
      const salidas = movimientosProducto.filter(m => m.tipo === 'SALIDA');
      
      if (salidas.length === 0) return producto.stockMinimo * 1.5;
      
      const promedioSalidas = salidas.reduce((sum, m) => sum + m.cantidad, 0) / salidas.length;
      const diasCobertura = 14; // 2 semanas de cobertura
      
      return Math.max(producto.stockMinimo * 1.5, promedioSalidas * diasCobertura / 30);
    });
    
    return Math.round(stockOptimoPorProducto.reduce((sum, val) => sum + val, 0));
  }

  private predecirQuiebre(productos: any[], movimientos: any[]): Date | null {
    const productosCriticos = productos.filter(p => p.stock <= p.stockMinimo);
    
    if (productosCriticos.length === 0) return null;
    
    const movimientosRecientes = movimientos.filter(m => 
      m.fecha >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    const salidasRecientes = movimientosRecientes.filter(m => m.tipo === 'SALIDA').length;
    const velocidadVentas = salidasRecientes / 7;
    
    if (velocidadVentas === 0) return null;
    
    const productoMasCritico = productosCriticos.reduce((min, p) => 
      p.stock < min.stock ? p : min
    );
    
    const diasRestantes = productoMasCritico.stock / velocidadVentas;
    const fechaQuiebre = new Date();
    fechaQuiebre.setDate(fechaQuiebre.getDate() + Math.floor(diasRestantes));
    
    return fechaQuiebre;
  }

  private generateAlertas(productos: any[], sensores: any[]): Alert[] {
    const alertas: Alert[] = [];
    
    // Alertas de stock bajo
    productos.forEach(producto => {
      if (producto.stock <= producto.stockMinimo) {
        alertas.push({
          id: `stock-${producto.id}`,
          tipo: 'STOCK_BAJO',
          severidad: producto.stock === 0 ? 'CRITICA' : producto.stock <= producto.stockMinimo / 2 ? 'ALTA' : 'MEDIA',
          mensaje: `Stock bajo en ${producto.nombre}: ${producto.stock} unidades`,
          productoId: producto.id,
          productoNombre: producto.nombre,
          fecha: new Date(),
          resuelto: false,
        });
      }
    });
    
    // Alertas de sensores
    sensores.forEach(sensor => {
      if (sensor.tipo === 'TEMPERATURA' && sensor.valor > 30) {
        alertas.push({
          id: `temp-${sensor.id}`,
          tipo: 'TEMPERATURA_ALTA',
          severidad: sensor.valor > 40 ? 'CRITICA' : 'ALTA',
          mensaje: `Temperatura alta detectada: ${sensor.valor}°C`,
          productoId: sensor.productoId,
          fecha: new Date(),
          resuelto: false,
        });
      }
      
      if (sensor.tipo === 'HUMEDAD' && sensor.valor > 80) {
        alertas.push({
          id: `hum-${sensor.id}`,
          tipo: 'HUMEDAD_CRITICA',
          severidad: sensor.valor > 90 ? 'CRITICA' : 'ALTA',
          mensaje: `Humedad crítica detectada: ${sensor.valor}%`,
          productoId: sensor.productoId,
          fecha: new Date(),
          resuelto: false,
        });
      }
    });
    
    return alertas;
  }

  private identificarProductosCriticos(productos: any[], movimientos: any[]): ProductoCritico[] {
    return productos
      .filter(p => p.stock <= p.stockMinimo * 1.5)
      .map(producto => {
        const movimientosProducto = movimientos.filter(m => m.productoId === producto.id);
        const salidas = movimientosProducto.filter(m => m.tipo === 'SALIDA');
        
        const promedioSalidas = salidas.length > 0 
          ? salidas.reduce((sum, m) => sum + m.cantidad, 0) / salidas.length 
          : 1;
        
        const diasRestantes = producto.stock / promedioSalidas;
        
        let riesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
        if (diasRestantes <= 1) riesgo = 'CRITICO';
        else if (diasRestantes <= 3) riesgo = 'ALTO';
        else if (diasRestantes <= 7) riesgo = 'MEDIO';
        else riesgo = 'BAJO';
        
        return {
          id: producto.id,
          nombre: producto.nombre,
          stock: producto.stock,
          stockMinimo: producto.stockMinimo,
          diasRestantes: Math.floor(diasRestantes),
          riesgo,
        };
      })
      .sort((a, b) => {
        const riesgoOrder = { 'CRITICO': 4, 'ALTO': 3, 'MEDIO': 2, 'BAJO': 1 };
        return riesgoOrder[b.riesgo] - riesgoOrder[a.riesgo];
      });
  }

  private async calculateRotacionInventario(
    empresaId: number,
  ): Promise<number> {
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
      this.logger.error(
        `Error calculating inventory rotation for empresa ${empresaId}:`,
        error,
      );
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
      timestamp: new Date().toISOString(),
    };
  }

  getBasicAdvancedKPIs(empresaId: number): AdvancedKPIs {
    return {
      eficienciaOperativa: 0,
      costoOportunidad: 0,
      riesgoQuiebre: 0,
      tendenciaVentas: 'ESTABLE',
      demandaEstimada: 0,
      stockOptimo: 0,
      quiebrePredicho: null,
      alertasActivas: [],
      productosCriticos: [],
    };
  }

  async getProductosKPI(empresaId: number, userRole?: Rol) {
    try {
      // 🔥 Usar Cache-Aside para productos que se leen frecuentemente
      const productos = await this.cacheStrategies.cacheAside(
        `productos-kpi:${empresaId}`,
        async () => {
          // Obtener productos con movimientos recientes
          const productosConMovimientos = await this.prisma.producto.findMany({
            where: {
              empresaId,
              estado: { in: ['ACTIVO', 'INACTIVO'] },
            },
            include: {
              movimientos: {
                where: {
                  fecha: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
                  },
                },
                orderBy: {
                  fecha: 'desc',
                },
                take: 5,
              },
            },
            orderBy: {
              movimientos: {
                _count: 'desc',
              },
            },
            take: 10,
          });

          return productosConMovimientos.map((producto) => ({
            id: producto.id,
            nombre: producto.nombre,
            stock: producto.stock,
            stockMinimo: producto.stockMinimo,
            precioCompra: producto.precioCompra,
            precioVenta: producto.precioVenta,
            unidad: producto.unidad,
            etiquetas: producto.etiquetas,
            movimientosRecientes: producto.movimientos.length,
            ultimoMovimiento: producto.movimientos[0]?.fecha || null,
          }));
        },
        'producto',
      );

      // Aplicar filtros de datos financieros si se especifica rol
      if (userRole) {
        const accessLevel = this.getAccessLevel(userRole);
        const filterOptions = this.financialDataFilter.getFilterOptions(userRole, accessLevel);
        return productos.map(producto => 
          this.financialDataFilter.filterProductData(producto, filterOptions)
        );
      }

      return productos;
    } catch (error) {
      this.errorHandler.handlePrismaError(
        error,
        'getProductosKPI',
        `empresaId: ${empresaId}`,
      );
    }
  }

  async getMovimientosPorProducto(empresaId: number) {
    try {
      // 🔥 Usar Cache-Aside para movimientos que se leen frecuentemente
      return await this.cacheStrategies.cacheAside(
        `movimientos-producto:${empresaId}`,
        async () => {
          // Primero obtener movimientos sin include para evitar errores de relaciones
          const movimientos = await this.prisma.movimientoInventario.findMany({
            where: {
              empresaId,
            },
            select: {
              id: true,
              fecha: true,
              tipo: true,
              cantidad: true,
              motivo: true,
              descripcion: true,
              productoId: true,
            },
            orderBy: {
              fecha: 'desc',
            },
            take: 50,
          });

          // Luego obtener los productos correspondientes de forma segura
          const movimientosConProductos = await Promise.all(
            movimientos.map(async (movimiento) => {
              try {
                const producto = await this.prisma.producto.findUnique({
                  where: {
                    id: movimiento.productoId,
                    empresaId,
                    estado: 'ACTIVO',
                  },
                  select: {
                    nombre: true,
                    etiquetas: true,
                  },
                });

                return {
                  id: movimiento.id,
                  fecha: movimiento.fecha,
                  tipo: movimiento.tipo,
                  cantidad: movimiento.cantidad,
                  motivo: movimiento.motivo,
                  descripcion: movimiento.descripcion,
                  producto: producto ? {
                    nombre: producto.nombre,
                    etiquetas: producto.etiquetas,
                  } : {
                    nombre: `Producto ID ${movimiento.productoId} (no encontrado)`,
                    etiquetas: [],
                  },
                };
              } catch (error) {
                // Si hay error al obtener el producto, devolver información básica
                this.logger.warn(`Error obteniendo producto ${movimiento.productoId} para movimiento ${movimiento.id}: ${error.message}`);
                return {
                  id: movimiento.id,
                  fecha: movimiento.fecha,
                  tipo: movimiento.tipo,
                  cantidad: movimiento.cantidad,
                  motivo: movimiento.motivo,
                  descripcion: movimiento.descripcion,
                  producto: {
                    nombre: `Producto ID ${movimiento.productoId} (error)`,
                    etiquetas: [],
                  },
                };
              }
            })
          );

          return movimientosConProductos;
        },
        'dynamic',
      );
    } catch (error) {
      this.errorHandler.handlePrismaError(
        error,
        'getMovimientosPorProducto',
        `empresaId: ${empresaId}`,
      );
    }
  }

  async getDashboardData(empresaId: number, userRole?: Rol) {
    try {
      // Calcular el primer día del mes actual
      const primerDiaDelMes = new Date();
      primerDiaDelMes.setDate(1);
      primerDiaDelMes.setHours(0, 0, 0, 0);

      // Productos activos e inactivos (excluir eliminados)
      const productos = await this.prisma.producto.findMany({
        where: { empresaId, estado: { in: ['ACTIVO', 'INACTIVO'] } },
        select: {
          stock: true,
          precioVenta: true,
          precioCompra: true,
          id: true,
          nombre: true,
        },
      });

      // Stock final actual
      const stockFinal = productos.reduce((acc, p) => acc + p.stock, 0);

      // Movimientos de salida del mes
      const movimientosDelMes = await this.prisma.movimientoInventario.findMany(
        {
          where: {
            empresaId,
            tipo: 'SALIDA',
            fecha: { gte: primerDiaDelMes },
          },
          select: { cantidad: true, productoId: true },
        },
      );
      const unidadesVendidas = movimientosDelMes.reduce(
        (acc, m) => acc + m.cantidad,
        0,
      );

      // Stock inicial estimado (stock final + unidades vendidas del mes)
      const stockInicial = stockFinal + unidadesVendidas;

      // Margen promedio
      const margenes = productos
        .filter((p) => p.precioCompra > 0)
        .map((p) => ((p.precioVenta - p.precioCompra) / p.precioCompra) * 100);
      const margenPromedio =
        margenes.length > 0
          ? margenes.reduce((a, b) => a + b, 0) / margenes.length
          : 0;

      // Rotación
      const rotacion =
        stockInicial > 0 ? (unidadesVendidas / stockInicial) * 100 : 0;

      // Producto de mayor rotación
      const rotacionPorProducto: Record<number, number> = {};
      movimientosDelMes.forEach((m) => {
        rotacionPorProducto[m.productoId] =
          (rotacionPorProducto[m.productoId] || 0) + m.cantidad;
      });
      let productoMayorRotacion: {
        nombre: string;
        movimientos: number;
      } | null = null;
      if (Object.keys(rotacionPorProducto).length > 0) {
        const [idMayor, cantidadMayor] = Object.entries(
          rotacionPorProducto,
        ).sort((a, b) => b[1] - a[1])[0];
        const producto = productos.find((p) => p.id === Number(idMayor));
        if (producto) {
          productoMayorRotacion = {
            nombre: producto.nombre,
            movimientos: cantidadMayor,
          };
        }
      }

      // Obtener datos para el dashboard
      const [
        totalProductos,
        productosStockBajo,
        movimientosUltimoMes,
        productosConMovimientos,
        movimientosRecientes,
      ] = await Promise.all([
        this.prisma.producto.count({
          where: {
            empresaId,
            estado: { in: ['ACTIVO', 'INACTIVO'] }, // Excluir eliminados
          },
        }),
        this.prisma.producto.count({
          where: {
            empresaId,
            estado: 'ACTIVO',
            stock: {
              lte: 10,
            },
          },
        }),
        this.prisma.movimientoInventario.count({
          where: {
            empresaId,
            fecha: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        this.getProductosKPI(empresaId),
        this.getMovimientosPorProducto(empresaId),
      ]);

      // Calcular valor total del inventario
      const productosConPrecio = await this.prisma.producto.findMany({
        where: {
          empresaId,
          estado: 'ACTIVO', // Solo productos activos para el valor del inventario
        },
        select: {
          stock: true,
          precioCompra: true,
        },
      });

      const valorTotalInventario = productosConPrecio.reduce(
        (total, producto) => total + producto.stock * producto.precioCompra,
        0,
      );

      // Obtener productos con stock crítico
      const stockCritico = await this.prisma.producto.findMany({
        where: {
          empresaId,
          estado: 'ACTIVO',
          stock: {
            lte: 10,
          },
        },
        select: {
          nombre: true,
          stock: true,
          stockMinimo: true,
        },
      });

      // Obtener ventas por día (últimos 14 días)
      const ventasPorDia = await this.prisma.movimientoInventario.groupBy({
        by: ['fecha'],
        where: {
          empresaId,
          tipo: 'SALIDA',
          fecha: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: {
          cantidad: true,
        },
        orderBy: {
          fecha: 'asc',
        },
      });

      // Obtener estadísticas por categoría
      const productosPorEtiqueta = await this.prisma.producto.groupBy({
        by: ['etiquetas'],
        where: {
          empresaId,
          estado: { in: ['ACTIVO', 'INACTIVO'] },
        },
        _count: {
          id: true,
        },
      });

      // Obtener movimientos por tipo en el último mes
      const movimientosPorTipo = await this.prisma.movimientoInventario.groupBy(
        {
          by: ['tipo'],
          where: {
            empresaId,
            fecha: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          _count: {
            id: true,
          },
        },
      );

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

        const ventasDelDia = ventasPorDia.find(
          (v) => v.fecha.toISOString().split('T')[0] === fechaStr,
        );

        diasGraficos.push({
          fecha: fechaStr,
          stock: Math.floor(Math.random() * 100) + 50, // Simulado por ahora
          ventas: ventasDelDia?._sum.cantidad || 0,
          eficiencia: Math.floor(Math.random() * 100),
        });
      }

      const dashboardData = {
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
          valorTotalInventario: Math.round(valorTotalInventario * 100) / 100,
        },
        ventasPorDia: ventasPorDia.map((v) => ({
          fecha: v.fecha,
          cantidad: v._sum.cantidad || 0,
        })),
        stockCritico: stockCritico.map((p) => ({
          nombre: p.nombre,
          stock: p.stock,
          stockMinimo: p.stockMinimo,
        })),
        productos: (productosConMovimientos || []).map((p) => ({
          ...p,
          movimientos: rotacionPorProducto[p.id] || 0,
        })),
        movimientos: movimientosRecientes,
        diasGraficos,
        estadisticas: {
          productosPorEtiqueta,
          movimientosPorTipo,
        },
      };

      // Aplicar filtros de datos financieros si se especifica rol
      if (userRole) {
        const accessLevel = this.getAccessLevel(userRole);
        const filterOptions = this.financialDataFilter.getFilterOptions(userRole, accessLevel);
        return this.financialDataFilter.filterDashboardData(dashboardData, filterOptions);
      }

      return dashboardData;
    } catch (error) {
      this.errorHandler.handlePrismaError(
        error,
        'getDashboardData',
        `empresaId: ${empresaId}`,
      );
    }
  }

  // 🍎 NUEVOS MÉTODOS PARA KPIs ESPECÍFICOS POR INDUSTRIA

  async getIndustryKPIs(empresaId: number, industry?: string): Promise<any> {
    try {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { TipoIndustria: true }
      });

      const tipoIndustria = industry || empresa?.TipoIndustria || 'GENERICA';

      switch (tipoIndustria) {
        case 'ALIMENTOS':
          return await this.getAlimentosKPIs(empresaId);
        case 'FARMACIA':
          return await this.getFarmaciaKPIs(empresaId);
        case 'ROPA':
          return await this.getRopaKPIs(empresaId);
        case 'ELECTRONICA':
          return await this.getElectronicaKPIs(empresaId);
        default:
          return await this.getGenericKPIs(empresaId);
      }
    } catch (error) {
      this.logger.error(`Error getting industry KPIs for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getIndustryKPIs', empresaId);
    }
  }

  async getAlimentosKPIs(empresaId: number): Promise<AlimentosKPIs> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `alimentos-kpis:${empresaId}`,
        async () => {
          // Obtener productos de alimentos con sensores
          const productosAlimentos = await this.prisma.producto.findMany({
            where: {
              empresaId,
              estado: 'ACTIVO',
              tipoProducto: 'ALIMENTO'
            },
            include: {
              sensores: {
                where: {
                  fecha: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
                  }
                },
                orderBy: { fecha: 'desc' }
              }
            }
          });

          // Calcular métricas específicas de alimentos
          const productosPerecederos = productosAlimentos.length;
          const productosCaducidadProxima = productosAlimentos.filter(p => 
            p.temperaturaOptima !== null || p.humedadOptima !== null
          ).length;

          // Calcular alertas de temperatura y humedad
          const alertasTemperatura = productosAlimentos.reduce((total, producto) => {
            const sensoresTemp = producto.sensores.filter(s => s.tipo === 'TEMPERATURA');
            return total + sensoresTemp.filter(s => 
              producto.temperaturaOptima && 
              Math.abs(s.valor - producto.temperaturaOptima) > 5
            ).length;
          }, 0);

          const alertasHumedad = productosAlimentos.reduce((total, producto) => {
            const sensoresHum = producto.sensores.filter(s => s.tipo === 'HUMEDAD');
            return total + sensoresHum.filter(s => 
              producto.humedadOptima && 
              Math.abs(s.valor - producto.humedadOptima) > 10
            ).length;
          }, 0);

          // Calcular tiempo promedio en almacén (simulado)
          const tiempoPromedioAlmacen = productosAlimentos.length > 0 ? 
            productosAlimentos.reduce((total, p) => total + (p.stock * 2), 0) / productosAlimentos.length : 0;

          // Calcular eficiencia FIFO (simulado)
          const eficienciaFIFO = productosAlimentos.length > 0 ? 
            Math.min(95, 85 + Math.random() * 10) : 0;

          return {
            productosPerecederos,
            productosCaducidadProxima,
            productosFIFO: productosPerecederos,
            alertasTemperatura,
            alertasHumedad,
            tiempoPromedioAlmacen: Math.round(tiempoPromedioAlmacen * 100) / 100,
            productosCaducados: 0, // Implementar lógica de caducidad
            eficienciaFIFO: Math.round(eficienciaFIFO * 100) / 100,
            condicionesOptimas: {
              temperatura: 4, // Temperatura promedio óptima
              humedad: 60 // Humedad promedio óptima
            }
          };
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting Alimentos KPIs for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getAlimentosKPIs', empresaId);
    }
  }

  async getFarmaciaKPIs(empresaId: number): Promise<FarmaciaKPIs> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `farmacia-kpis:${empresaId}`,
        async () => {
          // Obtener productos de farmacia
          const productosFarmacia = await this.prisma.producto.findMany({
            where: {
              empresaId,
              estado: 'ACTIVO',
              tipoProducto: 'GENERICO' // Asumiendo que medicamentos son genéricos
            }
          });

          // Calcular métricas específicas de farmacia
          const medicamentosControlados = productosFarmacia.length;
          const medicamentosVencimientoProximo = productosFarmacia.length * 0.15; // 15% simulado
          const lotesActivos = productosFarmacia.length * 1.2; // Promedio 1.2 lotes por producto
          const trazabilidadCompleta = productosFarmacia.length;
          const cumplimientoNormativo = 98.5; // Porcentaje simulado
          const medicamentosCaducados = productosFarmacia.length * 0.02; // 2% simulado
          const alertasVencimiento = productosFarmacia.length * 0.1; // 10% simulado
          const rotacionMedicamentos = productosFarmacia.length > 0 ? 
            productosFarmacia.reduce((total, p) => total + p.stock, 0) / productosFarmacia.length : 0;

          return {
            medicamentosControlados,
            medicamentosVencimientoProximo: Math.round(medicamentosVencimientoProximo),
            lotesActivos: Math.round(lotesActivos),
            trazabilidadCompleta,
            cumplimientoNormativo,
            medicamentosCaducados: Math.round(medicamentosCaducados),
            alertasVencimiento: Math.round(alertasVencimiento),
            rotacionMedicamentos: Math.round(rotacionMedicamentos * 100) / 100,
            controlLotes: {
              totalLotes: Math.round(lotesActivos),
              lotesVigentes: Math.round(lotesActivos * 0.95),
              lotesVencidos: Math.round(lotesActivos * 0.05)
            }
          };
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting Farmacia KPIs for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getFarmaciaKPIs', empresaId);
    }
  }

  async getRopaKPIs(empresaId: number): Promise<RopaKPIs> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `ropa-kpis:${empresaId}`,
        async () => {
          // Obtener productos de ropa
          const productosRopa = await this.prisma.producto.findMany({
            where: {
              empresaId,
              estado: 'ACTIVO',
              tipoProducto: 'ROPA'
            }
          });

          // Calcular métricas específicas de ropa
          const productosPorTemporada = {
            actual: productosRopa.length * 0.4,
            anterior: productosRopa.length * 0.3,
            siguiente: productosRopa.length * 0.3
          };

          // Simular tallas más vendidas
          const tallasMasVendidas = [
            { talla: 'M', cantidad: 150, porcentaje: 35 },
            { talla: 'L', cantidad: 120, porcentaje: 28 },
            { talla: 'S', cantidad: 100, porcentaje: 23 },
            { talla: 'XL', cantidad: 60, porcentaje: 14 }
          ];

          // Simular colores más vendidos
          const coloresMasVendidos = [
            { color: 'Negro', cantidad: 200, porcentaje: 40 },
            { color: 'Azul', cantidad: 150, porcentaje: 30 },
            { color: 'Blanco', cantidad: 100, porcentaje: 20 },
            { color: 'Gris', cantidad: 50, porcentaje: 10 }
          ];

          const rotacionPorTemporada = productosRopa.length > 0 ? 
            productosRopa.reduce((total, p) => total + p.stock, 0) / productosRopa.length : 0;

          const stockPorTemporada = {
            actual: productosRopa.length * 0.5,
            anterior: productosRopa.length * 0.3,
            siguiente: productosRopa.length * 0.2
          };

          const margenPorColeccion = productosRopa.length > 0 ? 
            productosRopa.reduce((total, p) => {
              const margen = p.precioVenta > p.precioCompra ? 
                ((p.precioVenta - p.precioCompra) / p.precioCompra) * 100 : 0;
              return total + margen;
            }, 0) / productosRopa.length : 0;

          return {
            productosPorTemporada,
            tallasMasVendidas,
            coloresMasVendidos,
            rotacionPorTemporada: Math.round(rotacionPorTemporada * 100) / 100,
            stockPorTemporada,
            margenPorColeccion: Math.round(margenPorColeccion * 100) / 100
          };
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting Ropa KPIs for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getRopaKPIs', empresaId);
    }
  }

  async getElectronicaKPIs(empresaId: number): Promise<ElectronicaKPIs> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `electronica-kpis:${empresaId}`,
        async () => {
          // Obtener productos de electrónica
          const productosElectronica = await this.prisma.producto.findMany({
            where: {
              empresaId,
              estado: 'ACTIVO',
              tipoProducto: 'ELECTRONICO'
            }
          });

          // Calcular métricas específicas de electrónica
          const productosConSKU = productosElectronica.filter(p => p.sku).length;
          const productosConSerie = productosElectronica.filter(p => p.rfid).length;
          const rotacionGadgets = productosElectronica.length > 0 ? 
            productosElectronica.reduce((total, p) => total + p.stock, 0) / productosElectronica.length : 0;
          const productosDiscontinuados = productosElectronica.length * 0.1; // 10% simulado
          const controlCalidad = 99.5; // Porcentaje simulado
          const garantiasActivas = productosElectronica.length * 0.8; // 80% simulado
          const productosRetornados = productosElectronica.length * 0.05; // 5% simulado
          const eficienciaSKU = productosConSKU > 0 ? (productosConSKU / productosElectronica.length) * 100 : 0;

          return {
            productosConSKU,
            productosConSerie,
            rotacionGadgets: Math.round(rotacionGadgets * 100) / 100,
            productosDiscontinuados: Math.round(productosDiscontinuados),
            controlCalidad,
            garantiasActivas: Math.round(garantiasActivas),
            productosRetornados: Math.round(productosRetornados),
            eficienciaSKU: Math.round(eficienciaSKU * 100) / 100,
            controlInventario: {
              totalSKUs: productosConSKU,
              SKUsActivos: Math.round(productosConSKU * 0.9),
              SKUsDiscontinuados: Math.round(productosConSKU * 0.1)
            }
          };
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting Electronica KPIs for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getElectronicaKPIs', empresaId);
    }
  }

  async getGenericKPIs(empresaId: number): Promise<any> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `generic-kpis:${empresaId}`,
        async () => {
          const productos = await this.prisma.producto.findMany({
            where: {
              empresaId,
              estado: 'ACTIVO'
            }
          });

          return {
            totalProductos: productos.length,
            productosActivos: productos.length,
            valorInventario: productos.reduce((total, p) => total + (p.stock * p.precioCompra), 0),
            rotacionPromedio: productos.length > 0 ? 
              productos.reduce((total, p) => total + p.stock, 0) / productos.length : 0,
            margenPromedio: productos.length > 0 ? 
              productos.reduce((total, p) => {
                const margen = p.precioVenta > p.precioCompra ? 
                  ((p.precioVenta - p.precioCompra) / p.precioCompra) * 100 : 0;
                return total + margen;
              }, 0) / productos.length : 0
          };
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting Generic KPIs for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getGenericKPIs', empresaId);
    }
  }

  // 📊 KPIs OPERACIONALES MEJORADOS

  async getOperationalKPIs(empresaId: number): Promise<OperationalKPIs> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `operational-kpis:${empresaId}`,
        async () => {
          const [productos, movimientos] = await Promise.all([
            this.prisma.producto.findMany({
              where: { empresaId, estado: 'ACTIVO' }
            }),
            this.prisma.movimientoInventario.findMany({
              where: {
                empresaId,
                fecha: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
              }
            })
          ]);

          const eficienciaAlmacen = productos.length > 0 ? 
            Math.min(95, 80 + Math.random() * 15) : 0;
          const tiempoPromedioMovimiento = movimientos.length > 0 ? 
            movimientos.reduce((total, m) => total + 1, 0) / movimientos.length : 0;
          const productosMasMovidos = movimientos.length > 0 ? 
            new Set(movimientos.map(m => m.productoId)).size : 0;
          const rutasMasEficientes = productos.length > 0 ? 
            Math.min(90, 70 + Math.random() * 20) : 0;
          const sobrestock = productos.filter(p => p.stock > p.stockMinimo * 2).length;
          const quiebresStock = productos.filter(p => p.stock <= p.stockMinimo).length;
          const precisionInventario = 98.5; // Porcentaje simulado
          const automatizacion = productos.filter(p => p.rfid).length / productos.length * 100;

          return {
            eficienciaAlmacen: Math.round(eficienciaAlmacen * 100) / 100,
            tiempoPromedioMovimiento: Math.round(tiempoPromedioMovimiento * 100) / 100,
            productosMasMovidos,
            rutasMasEficientes: Math.round(rutasMasEficientes * 100) / 100,
            sobrestock,
            quiebresStock,
            precisionInventario,
            automatizacion: Math.round(automatizacion * 100) / 100,
            metricasOperativas: {
              movimientosPorHora: Math.round(movimientos.length / 30 / 24), // Último mes
              productosPorUbicacion: productos.length,
              tiempoPromedioProcesamiento: 2.5 // Minutos simulado
            }
          };
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting Operational KPIs for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getOperationalKPIs', empresaId);
    }
  }

  async getSupplierKPIs(empresaId: number): Promise<SupplierKPIs> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `supplier-kpis:${empresaId}`,
        async () => {
          const [proveedores, productos] = await Promise.all([
            this.prisma.proveedor.findMany({
              where: { empresaId, estado: 'ACTIVO' }
            }),
            this.prisma.producto.findMany({
              where: { empresaId, estado: 'ACTIVO' },
              include: { proveedor: true }
            })
          ]);

          const proveedoresActivos = proveedores.length;
          const cumplimientoProveedores = 92.5; // Porcentaje simulado
          const precioPromedioProveedor = productos.length > 0 ? 
            productos.reduce((total, p) => total + p.precioCompra, 0) / productos.length : 0;
          const tiempoEntregaPromedio = 3.5; // Días simulado
          const calidadProveedores = 94.8; // Porcentaje simulado
          const proveedoresCriticos = proveedores.length * 0.2; // 20% simulado

          const metricasProveedor = proveedores.map(proveedor => {
            const productosProveedor = productos.filter(p => p.proveedorId === proveedor.id);
            const precioPromedio = productosProveedor.length > 0 ? 
              productosProveedor.reduce((total, p) => total + p.precioCompra, 0) / productosProveedor.length : 0;
            
            return {
              proveedorId: proveedor.id,
              nombre: proveedor.nombre,
              productos: productosProveedor.length,
              precioPromedio: Math.round(precioPromedio * 100) / 100,
              cumplimiento: Math.round(85 + Math.random() * 15), // 85-100%
              tiempoEntrega: Math.round(2 + Math.random() * 4) // 2-6 días
            };
          });

          return {
            proveedoresActivos,
            cumplimientoProveedores,
            precioPromedioProveedor: Math.round(precioPromedioProveedor * 100) / 100,
            tiempoEntregaPromedio,
            calidadProveedores,
            proveedoresCriticos: Math.round(proveedoresCriticos),
            metricasProveedor
          };
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting Supplier KPIs for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getSupplierKPIs', empresaId);
    }
  }

  async getProfitabilityKPIs(empresaId: number): Promise<ProfitabilityKPIs> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `profitability-kpis:${empresaId}`,
        async () => {
          const productos = await this.prisma.producto.findMany({
            where: { empresaId, estado: 'ACTIVO' }
          });

          const margenBrutoTotal = productos.reduce((total, p) => {
            const margenBruto = p.precioVenta > p.precioCompra ? 
              (p.precioVenta - p.precioCompra) * p.stock : 0;
            return total + margenBruto;
          }, 0);

          const margenNetoTotal = margenBrutoTotal * 0.85; // 85% del margen bruto

          const rentabilidadPorProducto = productos.map(producto => {
            const margenBruto = producto.precioVenta > producto.precioCompra ? 
              ((producto.precioVenta - producto.precioCompra) / producto.precioCompra) * 100 : 0;
            const margenNeto = margenBruto * 0.85;
            const rentabilidad = margenNeto * producto.stock;

            return {
              productoId: producto.id,
              nombre: producto.nombre,
              margenBruto: Math.round(margenBruto * 100) / 100,
              margenNeto: Math.round(margenNeto * 100) / 100,
              rentabilidad: Math.round(rentabilidad * 100) / 100
            };
          });

          const rentabilidadPorCategoria = [
            {
              categoria: 'Alimentos',
              margenBruto: 25.5,
              margenNeto: 21.7,
              rentabilidad: 15000
            },
            {
              categoria: 'Electrónicos',
              margenBruto: 35.2,
              margenNeto: 29.9,
              rentabilidad: 25000
            },
            {
              categoria: 'Ropa',
              margenBruto: 45.8,
              margenNeto: 38.9,
              rentabilidad: 18000
            }
          ];

          const productosMasRentables = rentabilidadPorProducto
            .sort((a, b) => b.rentabilidad - a.rentabilidad)
            .slice(0, 5);

          const productosMenosRentables = rentabilidadPorProducto
            .sort((a, b) => a.rentabilidad - b.rentabilidad)
            .slice(0, 5);

          return {
            margenBrutoTotal: Math.round(margenBrutoTotal * 100) / 100,
            margenNetoTotal: Math.round(margenNetoTotal * 100) / 100,
            rentabilidadPorProducto,
            rentabilidadPorCategoria,
            productosMasRentables,
            productosMenosRentables
          };
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting Profitability KPIs for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getProfitabilityKPIs', empresaId);
    }
  }

  async getSensorKPIs(empresaId: number): Promise<SensorKPIs> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `sensor-kpis:${empresaId}`,
        async () => {
          const sensores = await this.prisma.sensorLectura.findMany({
            where: {
              producto: { empresaId },
              fecha: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
          });

          const sensoresActivos = new Set(sensores.map(s => s.productoId)).size;
          const alertasActivas = sensores.length * 0.1; // 10% simulado
          const condicionesOptimas = sensores.length * 0.85; // 85% simulado

          const sensoresTemperatura = sensores.filter(s => s.tipo === 'TEMPERATURA').length;
          const sensoresHumedad = sensores.filter(s => s.tipo === 'HUMEDAD').length;
          const sensoresPresion = sensores.filter(s => s.tipo === 'PRESION').length;
          const sensoresPeso = sensores.filter(s => s.tipo === 'PESO').length;

          const metricasSensores = {
            temperaturaPromedio: sensoresTemperatura > 0 ? 
              sensores.filter(s => s.tipo === 'TEMPERATURA')
                .reduce((total, s) => total + s.valor, 0) / sensoresTemperatura : 0,
            humedadPromedio: sensoresHumedad > 0 ? 
              sensores.filter(s => s.tipo === 'HUMEDAD')
                .reduce((total, s) => total + s.valor, 0) / sensoresHumedad : 0,
            presionPromedio: sensoresPresion > 0 ? 
              sensores.filter(s => s.tipo === 'PRESION')
                .reduce((total, s) => total + s.valor, 0) / sensoresPresion : 0,
            pesoPromedio: sensoresPeso > 0 ? 
              sensores.filter(s => s.tipo === 'PESO')
                .reduce((total, s) => total + s.valor, 0) / sensoresPeso : 0
          };

          const alertasPorTipo = {
            temperatura: sensoresTemperatura * 0.15,
            humedad: sensoresHumedad * 0.12,
            presion: sensoresPresion * 0.08,
            peso: sensoresPeso * 0.05
          };

          return {
            sensoresActivos,
            alertasActivas: Math.round(alertasActivas),
            condicionesOptimas: Math.round(condicionesOptimas),
            sensoresTemperatura,
            sensoresHumedad,
            sensoresPresion,
            sensoresPeso,
            metricasSensores: {
              temperaturaPromedio: Math.round(metricasSensores.temperaturaPromedio * 100) / 100,
              humedadPromedio: Math.round(metricasSensores.humedadPromedio * 100) / 100,
              presionPromedio: Math.round(metricasSensores.presionPromedio * 100) / 100,
              pesoPromedio: Math.round(metricasSensores.pesoPromedio * 100) / 100
            },
            alertasPorTipo: {
              temperatura: Math.round(alertasPorTipo.temperatura),
              humedad: Math.round(alertasPorTipo.humedad),
              presion: Math.round(alertasPorTipo.presion),
              peso: Math.round(alertasPorTipo.peso)
            }
          };
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting Sensor KPIs for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getSensorKPIs', empresaId);
    }
  }

  /**
   * Determina el nivel de acceso basado en el rol del usuario
   */
  private getAccessLevel(userRole: Rol): 'full' | 'limited' {
    switch (userRole) {
      case 'SUPERADMIN':
      case 'ADMIN':
        return 'full';
      case 'EMPLEADO':
        return 'limited';
      case 'PROVEEDOR':
        return 'limited';
      default:
        return 'limited';
    }
  }

  // 🔮 KPIs PREDICTIVOS

  async getPredictiveKPIs(empresaId: number): Promise<PredictiveKPIs> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `predictive-kpis:${empresaId}`,
        async () => {
          const productos = await this.prisma.producto.findMany({
            where: { empresaId, estado: 'ACTIVO' }
          });

          const prediccionDemanda = productos.slice(0, 10).map(producto => ({
            productoId: producto.id,
            nombre: producto.nombre,
            demandaEstimada: Math.round(producto.stock * (0.8 + Math.random() * 0.4)), // ±20%
            confianza: Math.round(75 + Math.random() * 20) // 75-95%
          }));

          const prediccionQuiebres = productos
            .filter(p => p.stock <= p.stockMinimo * 1.5)
            .slice(0, 5)
            .map(producto => ({
              productoId: producto.id,
              nombre: producto.nombre,
              fechaPrediccion: new Date(Date.now() + (producto.stock * 24 * 60 * 60 * 1000)),
              probabilidad: Math.round(60 + Math.random() * 35) // 60-95%
            }));

          const tendenciasVentas = {
            tendencia: ['CRECIENTE', 'ESTABLE', 'DECRECIENTE'][Math.floor(Math.random() * 3)] as any,
            porcentajeCambio: Math.round((Math.random() - 0.5) * 20), // -10% a +10%
            periodo: 'Último mes'
          };

          const estacionalidad = [
            { mes: 'Enero', factorEstacional: 0.8 },
            { mes: 'Febrero', factorEstacional: 0.9 },
            { mes: 'Marzo', factorEstacional: 1.1 },
            { mes: 'Abril', factorEstacional: 1.2 },
            { mes: 'Mayo', factorEstacional: 1.0 },
            { mes: 'Junio', factorEstacional: 0.9 },
            { mes: 'Julio', factorEstacional: 0.8 },
            { mes: 'Agosto', factorEstacional: 0.7 },
            { mes: 'Septiembre', factorEstacional: 0.9 },
            { mes: 'Octubre', factorEstacional: 1.1 },
            { mes: 'Noviembre', factorEstacional: 1.3 },
            { mes: 'Diciembre', factorEstacional: 1.4 }
          ];

          return {
            prediccionDemanda,
            prediccionQuiebres,
            tendenciasVentas,
            estacionalidad
          };
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting Predictive KPIs for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getPredictiveKPIs', empresaId);
    }
  }

  async getDemandForecast(empresaId: number, days: number = 30): Promise<DemandForecast[]> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `demand-forecast:${empresaId}:${days}`,
        async () => {
          const productos = await this.prisma.producto.findMany({
            where: { empresaId, estado: 'ACTIVO' },
            take: 5 // Limitar a 5 productos para el ejemplo
          });

          return productos.map(producto => {
            // Generar histórico simulado
            const historico = Array.from({ length: 30 }, (_, i) => ({
              fecha: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              demanda: Math.round(producto.stock * (0.1 + Math.random() * 0.2)) // 10-30% del stock
            }));

            // Generar predicción
            const prediccion = Array.from({ length: days }, (_, i) => ({
              fecha: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              demandaEstimada: Math.round(producto.stock * (0.15 + Math.random() * 0.25)), // 15-40% del stock
              intervaloConfianza: {
                minimo: Math.round(producto.stock * 0.1),
                maximo: Math.round(producto.stock * 0.5)
              }
            }));

            return {
              productoId: producto.id,
              nombre: producto.nombre,
              historico,
              prediccion,
              metricas: {
                errorPromedio: Math.round((Math.random() * 10 + 5) * 100) / 100, // 5-15%
                precision: Math.round((85 + Math.random() * 10) * 100) / 100, // 85-95%
                tendencia: ['CRECIENTE', 'ESTABLE', 'DECRECIENTE'][Math.floor(Math.random() * 3)]
              }
            };
          });
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting Demand Forecast for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getDemandForecast', empresaId);
    }
  }

  async getExpiryAlerts(empresaId: number, days: number = 30): Promise<ExpiryAlert[]> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `expiry-alerts:${empresaId}:${days}`,
        async () => {
          const productos = await this.prisma.producto.findMany({
            where: { empresaId, estado: 'ACTIVO' }
          });

          // Simular productos con fechas de caducidad
          return productos.slice(0, 10).map(producto => {
            const diasRestantes = Math.floor(Math.random() * days);
            const fechaCaducidad = new Date(Date.now() + diasRestantes * 24 * 60 * 60 * 1000);
            const valorStock = producto.stock * producto.precioCompra;

            let severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
            if (diasRestantes <= 7) severidad = 'CRITICA';
            else if (diasRestantes <= 15) severidad = 'ALTA';
            else if (diasRestantes <= 30) severidad = 'MEDIA';
            else severidad = 'BAJA';

            let recomendacion: string;
            switch (severidad) {
              case 'CRITICA':
                recomendacion = 'Vender inmediatamente o descartar';
                break;
              case 'ALTA':
                recomendacion = 'Priorizar venta en próximos días';
                break;
              case 'MEDIA':
                recomendacion = 'Incluir en promociones';
                break;
              default:
                recomendacion = 'Monitorear regularmente';
            }

            return {
              productoId: producto.id,
              nombre: producto.nombre,
              fechaCaducidad,
              diasRestantes,
              stock: producto.stock,
              valorStock: Math.round(valorStock * 100) / 100,
              severidad,
              recomendacion
            };
          }).sort((a, b) => a.diasRestantes - b.diasRestantes);
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting Expiry Alerts for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getExpiryAlerts', empresaId);
    }
  }
}
