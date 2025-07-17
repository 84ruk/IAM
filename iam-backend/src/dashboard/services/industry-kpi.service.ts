import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheStrategiesService } from '../../common/services/cache-strategies.service';
import { KPIErrorHandler } from '../../common/services/kpi-error-handler.service';
import { 
  getIndustriaConfig, 
  getKPIsByIndustria, 
  getAlertasByIndustria,
  getSensoresByIndustria,
  validateProductoByIndustria,
  getIndustriaColors
} from '../../config/industria.config';
import { TipoIndustria } from '@prisma/client';

export interface IndustryKPISummary {
  industria: string;
  configuracion: any;
  kpisDisponibles: string[];
  alertasActivas: string[];
  sensoresConfigurados: string[];
  colores: {
    primary: string;
    secondary: string;
    accent: string;
  };
  metricasPrincipales: {
    totalProductos: number;
    valorInventario: number;
    eficiencia: number;
    alertas: number;
  };
}

@Injectable()
export class IndustryKPIService {
  private readonly logger = new Logger(IndustryKPIService.name);

  constructor(
    private prisma: PrismaService,
    private cacheStrategies: CacheStrategiesService,
    private kpiErrorHandler: KPIErrorHandler,
  ) {}

  /**
   * Obtiene un resumen completo de KPIs por industria
   */
  async getIndustryKPISummary(empresaId: number): Promise<IndustryKPISummary> {
    try {
      return await this.cacheStrategies.refreshAhead(
        `industry-kpi-summary:${empresaId}`,
        async () => {
          const empresa = await this.prisma.empresa.findUnique({
            where: { id: empresaId },
            select: { TipoIndustria: true, nombre: true }
          });

          if (!empresa) {
            throw new Error(`Empresa ${empresaId} no encontrada`);
          }

          const config = getIndustriaConfig(empresa.TipoIndustria);
          const kpisDisponibles = getKPIsByIndustria(empresa.TipoIndustria);
          const alertasActivas = getAlertasByIndustria(empresa.TipoIndustria);
          const sensoresConfigurados = getSensoresByIndustria(empresa.TipoIndustria);
          const colores = getIndustriaColors(empresa.TipoIndustria);

          // Obtener métricas básicas
          const [productos, movimientos, sensores] = await Promise.all([
            this.prisma.producto.findMany({
              where: { empresaId, estado: 'ACTIVO' }
            }),
            this.prisma.movimientoInventario.findMany({
              where: {
                empresaId,
                fecha: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
              }
            }),
            this.prisma.sensorLectura.findMany({
              where: {
                producto: { empresaId },
                fecha: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
              }
            })
          ]);

          const totalProductos = productos.length;
          const valorInventario = productos.reduce((total, p) => total + (p.stock * p.precioCompra), 0);
          const eficiencia = this.calculateEficiencia(productos, movimientos, empresa.TipoIndustria);
          const alertas = this.calculateAlertas(productos, sensores, empresa.TipoIndustria);

          return {
            industria: config.nombre,
            configuracion: {
              descripcion: config.descripcion,
              camposRequeridos: config.camposRequeridos,
              validaciones: config.validaciones
            },
            kpisDisponibles,
            alertasActivas,
            sensoresConfigurados,
            colores,
            metricasPrincipales: {
              totalProductos,
              valorInventario: Math.round(valorInventario * 100) / 100,
              eficiencia: Math.round(eficiencia * 100) / 100,
              alertas
            }
          };
        },
        'dynamic'
      );
    } catch (error) {
      this.logger.error(`Error getting industry KPI summary for empresa ${empresaId}:`, error);
      return this.kpiErrorHandler.handleKPIError(error, 'getIndustryKPISummary', empresaId);
    }
  }

  /**
   * Valida productos según la configuración de la industria
   */
  async validateProductosByIndustria(empresaId: number): Promise<{
    validos: number;
    invalidos: number;
    errores: Array<{ productoId: number; nombre: string; errores: string[] }>;
  }> {
    try {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { TipoIndustria: true }
      });

      if (!empresa) {
        throw new Error(`Empresa ${empresaId} no encontrada`);
      }

      const productos = await this.prisma.producto.findMany({
        where: { empresaId, estado: 'ACTIVO' }
      });

      let validos = 0;
      let invalidos = 0;
      const errores: Array<{ productoId: number; nombre: string; errores: string[] }> = [];

      for (const producto of productos) {
        const validacion = validateProductoByIndustria(empresa.TipoIndustria, producto);
        
        if (validacion.isValid) {
          validos++;
        } else {
          invalidos++;
          errores.push({
            productoId: producto.id,
            nombre: producto.nombre,
            errores: validacion.errors
          });
        }
      }

      return { validos, invalidos, errores };
    } catch (error) {
      this.logger.error(`Error validating productos by industry for empresa ${empresaId}:`, error);
      return { validos: 0, invalidos: 0, errores: [] };
    }
  }

  /**
   * Obtiene recomendaciones específicas por industria
   */
  async getIndustryRecommendations(empresaId: number): Promise<Array<{
    tipo: 'MEJORA' | 'ALERTA' | 'OPORTUNIDAD';
    titulo: string;
    descripcion: string;
    prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
    accion: string;
  }>> {
    try {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { TipoIndustria: true }
      });

      if (!empresa) {
        throw new Error(`Empresa ${empresaId} no encontrada`);
      }

      const config = getIndustriaConfig(empresa.TipoIndustria);
      const recomendaciones: Array<{
        tipo: 'MEJORA' | 'ALERTA' | 'OPORTUNIDAD';
        titulo: string;
        descripcion: string;
        prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
        accion: string;
      }> = [];

      // Recomendaciones específicas por industria
      switch (empresa.TipoIndustria) {
        case 'ALIMENTOS':
          recomendaciones.push(
            {
              tipo: 'MEJORA',
              titulo: 'Optimizar control de temperatura',
              descripcion: 'Implementar monitoreo continuo de temperatura para productos perecederos',
              prioridad: 'ALTA',
              accion: 'Configurar alertas de temperatura'
            },
            {
              tipo: 'OPORTUNIDAD',
              titulo: 'Implementar FIFO',
              descripcion: 'Mejorar la rotación de inventario con sistema FIFO',
              prioridad: 'MEDIA',
              accion: 'Configurar sistema FIFO'
            }
          );
          break;

        case 'FARMACIA':
          recomendaciones.push(
            {
              tipo: 'ALERTA',
              titulo: 'Control de vencimientos',
              descripcion: 'Implementar sistema de alertas para medicamentos próximos a vencer',
              prioridad: 'ALTA',
              accion: 'Configurar alertas de vencimiento'
            },
            {
              tipo: 'MEJORA',
              titulo: 'Trazabilidad completa',
              descripcion: 'Asegurar trazabilidad completa de lotes de medicamentos',
              prioridad: 'ALTA',
              accion: 'Verificar códigos de barras y RFID'
            }
          );
          break;

        case 'ROPA':
          recomendaciones.push(
            {
              tipo: 'OPORTUNIDAD',
              titulo: 'Análisis de temporadas',
              descripcion: 'Analizar tendencias por temporada para optimizar inventario',
              prioridad: 'MEDIA',
              accion: 'Revisar datos de temporadas anteriores'
            },
            {
              tipo: 'MEJORA',
              titulo: 'Gestión de tallas',
              descripcion: 'Optimizar stock por tallas según demanda histórica',
              prioridad: 'MEDIA',
              accion: 'Analizar ventas por talla'
            }
          );
          break;

        case 'ELECTRONICA':
          recomendaciones.push(
            {
              tipo: 'MEJORA',
              titulo: 'Control de SKU',
              descripcion: 'Implementar control estricto de SKU para productos electrónicos',
              prioridad: 'ALTA',
              accion: 'Verificar SKUs únicos'
            },
            {
              tipo: 'OPORTUNIDAD',
              titulo: 'Gestión de garantías',
              descripcion: 'Implementar sistema de control de garantías activas',
              prioridad: 'MEDIA',
              accion: 'Configurar sistema de garantías'
            }
          );
          break;

        default:
          recomendaciones.push(
            {
              tipo: 'MEJORA',
              titulo: 'Optimización general',
              descripcion: 'Revisar y optimizar procesos de inventario',
              prioridad: 'MEDIA',
              accion: 'Auditar procesos actuales'
            }
          );
      }

      return recomendaciones;
    } catch (error) {
      this.logger.error(`Error getting industry recommendations for empresa ${empresaId}:`, error);
      return [];
    }
  }

  /**
   * Calcula eficiencia según el tipo de industria
   */
  private calculateEficiencia(productos: any[], movimientos: any[], tipoIndustria: TipoIndustria): number {
    const config = getIndustriaConfig(tipoIndustria);
    
    let eficiencia = 0;
    const totalProductos = productos.length;

    if (totalProductos === 0) return 0;

    switch (tipoIndustria) {
      case 'ALIMENTOS':
        // Eficiencia basada en control de temperatura y rotación
        const productosConSensores = productos.filter(p => p.temperaturaOptima || p.humedadOptima).length;
        const rotacionAlimentos = movimientos.filter(m => m.tipo === 'SALIDA').length;
        eficiencia = ((productosConSensores / totalProductos) * 0.6 + (rotacionAlimentos / totalProductos) * 0.4) * 100;
        break;

      case 'FARMACIA':
        // Eficiencia basada en trazabilidad y control de lotes
        const productosConCodigo = productos.filter(p => p.codigoBarras && p.rfid).length;
        const medicamentosSinVencer = productos.length; // Simulado
        eficiencia = ((productosConCodigo / totalProductos) * 0.7 + (medicamentosSinVencer / totalProductos) * 0.3) * 100;
        break;

      case 'ROPA':
        // Eficiencia basada en gestión de tallas y colores
        const productosConTallaColor = productos.filter(p => p.talla && p.color).length;
        const rotacionRopa = movimientos.filter(m => m.tipo === 'SALIDA').length;
        eficiencia = ((productosConTallaColor / totalProductos) * 0.5 + (rotacionRopa / totalProductos) * 0.5) * 100;
        break;

      case 'ELECTRONICA':
        // Eficiencia basada en control de SKU y series
        const productosConSKU = productos.filter(p => p.sku && p.rfid).length;
        const controlCalidad = 95; // Simulado
        eficiencia = ((productosConSKU / totalProductos) * 0.6 + (controlCalidad / 100) * 0.4) * 100;
        break;

      default:
        // Eficiencia general
        const rotacionGeneral = movimientos.filter(m => m.tipo === 'SALIDA').length;
        eficiencia = (rotacionGeneral / totalProductos) * 100;
    }

    return Math.min(100, Math.max(0, eficiencia));
  }

  /**
   * Calcula alertas según el tipo de industria
   */
  private calculateAlertas(productos: any[], sensores: any[], tipoIndustria: TipoIndustria): number {
    let alertas = 0;

    switch (tipoIndustria) {
      case 'ALIMENTOS':
        // Alertas de temperatura y humedad
        const alertasTemperatura = sensores.filter(s => s.tipo === 'TEMPERATURA').length * 0.1;
        const alertasHumedad = sensores.filter(s => s.tipo === 'HUMEDAD').length * 0.1;
        const productosStockBajo = productos.filter(p => p.stock <= p.stockMinimo).length;
        alertas = alertasTemperatura + alertasHumedad + productosStockBajo;
        break;

      case 'FARMACIA':
        // Alertas de vencimiento y trazabilidad
        const medicamentosVencimiento = productos.length * 0.15; // Simulado
        const productosSinCodigo = productos.filter(p => !p.codigoBarras).length;
        alertas = medicamentosVencimiento + productosSinCodigo;
        break;

      case 'ROPA':
        // Alertas de tallas y colores agotados
        const tallasAgotadas = productos.filter(p => p.stock === 0 && p.talla).length;
        const coloresAgotados = productos.filter(p => p.stock === 0 && p.color).length;
        alertas = tallasAgotadas + coloresAgotados;
        break;

      case 'ELECTRONICA':
        // Alertas de SKU y control de calidad
        const productosSinSKU = productos.filter(p => !p.sku).length;
        const productosDiscontinuados = productos.length * 0.1; // Simulado
        alertas = productosSinSKU + productosDiscontinuados;
        break;

      default:
        // Alertas generales
        alertas = productos.filter(p => p.stock <= p.stockMinimo).length;
    }

    return Math.round(alertas);
  }
} 