import { SeveridadAlerta } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailTemplatesService, EmailTemplate } from './templates/email-templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendGridService, SendGridResult } from './sendgrid.service';

export interface NotificationData {
  tipo: 'password-reset' | 'welcome' | 'stock-critical' | 'stockout-prediction' | 'sensor-alert' | 'expiry-alert' | 'kpi-alert';
  destinatarios: string[];
  variables: any;
  empresaId?: number;
  empresaNombre?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  destinatarios: string[];
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly prisma: PrismaService,
    private readonly sendGridService: SendGridService,
  ) {}

  async sendSensorAlert(
    dataOrSensor: NotificationData | any,
    empresaId?: number,
    empresaNombre?: string
  ): Promise<NotificationResult> {
    try {
      let destinatarios: string[];
      let variables: any;

      if ('destinatarios' in dataOrSensor) {
        // Caso 1: Se proporciona NotificationData
        destinatarios = dataOrSensor.destinatarios;
        variables = dataOrSensor.variables;
      } else {
        // Caso 2: Se proporciona sensor y empresa
        destinatarios = await this.getAlertDestinatarios(empresaId!, 'sensor-alert');
        variables = {
          tipoAlerta: dataOrSensor.tipo || 'Sensor Alert',
          mensaje: `Alerta del sensor ${dataOrSensor.nombre || dataOrSensor.id}`
        };
      }

      if (destinatarios.length === 0) {
        return {
          success: false,
          error: 'No recipients configured',
          destinatarios: [],
        };
      }

      const result = await this.sendGridService.sendEmail({
        to: destinatarios,
        subject: `Alerta: ${variables.tipoAlerta}`,
        text: variables.mensaje,
        html: variables.mensaje.replace(/\n/g, '<br>'),
        categories: ['sensor-alert'],
      });

      return {
        success: result.success,
        messageId: result.messageId,
        destinatarios
      };
    } catch (error) {
      this.logger.error('Failed to send sensor alert:', error);
      return {
        success: false,
        error: error.message,
        destinatarios: 'destinatarios' in dataOrSensor ? dataOrSensor.destinatarios : []
      };
    }
  }

  /**
   * 📧 Enviar email de recuperación de contraseña
   */
  async sendPasswordResetEmail(email: string, nombre: string, resetUrl: string): Promise<NotificationResult> {
    try {
      const template = this.emailTemplates.getPasswordResetTemplate(resetUrl, nombre);
      
      const result = await this.sendGridService.sendEmail({
        to: email,
        subject: template.asunto,
        html: template.contenidoHtml,
        text: template.contenidoTexto,
        categories: ['password-reset'],
        customArgs: {
          email_type: 'password_reset',
          user_name: nombre,
        },
      });

      this.logger.log(`Password reset email sent to ${email}: ${result.messageId}`);

      return {
        success: result.success,
        messageId: result.messageId,
        destinatarios: [email],
      };
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      return {
        success: false,
        error: error.message,
        destinatarios: [email],
      };
    }
  }

  /**
   * 🎉 Enviar email de bienvenida
   */
  async sendWelcomeEmail(email: string, nombre: string, empresa: string): Promise<NotificationResult> {
    try {
      const result = await this.sendGridService.sendWelcomeEmail(email, nombre, empresa);

      this.logger.log(`Welcome email sent to ${email}: ${result.messageId}`);

      return {
        success: result.success,
        messageId: result.messageId,
        destinatarios: [email],
      };
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      return {
        success: false,
        error: error.message,
        destinatarios: [email],
      };
    }
  }

  /**
   * 🎉 Enviar email de bienvenida automático para nuevos usuarios
   */
  async sendWelcomeEmailForNewUser(userId: number, empresaId?: number): Promise<NotificationResult> {
    try {
      // Obtener información del usuario y empresa
      const user = await this.prisma.usuario.findUnique({
        where: { id: userId },
        include: {
          empresa: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error(`Usuario no encontrado: ${userId}`);
      }

      // Enviar email de bienvenida
      const result = await this.sendWelcomeEmail(user.email, user.nombre, user.empresa?.nombre || 'Nueva Empresa');
      
      this.logger.log(`Welcome email sent automatically to new user ${user.email}: ${result.messageId}`);

      return result;
    } catch (error) {
      this.logger.error(`Failed to send automatic welcome email for user ${userId}:`, error);
      return {
        success: false,
        error: error.message,
        destinatarios: [],
      };
    }
  }

  /**
   * 🚨 Enviar alerta de stock crítico
   */
  async sendStockCriticalAlert(producto: any, empresaId: number, empresaNombre: string): Promise<NotificationResult> {
    try {
      // Obtener destinatarios configurados para esta empresa
      const destinatarios = await this.getAlertDestinatarios(empresaId, 'stock-critical');
      
      if (destinatarios.length === 0) {
        this.logger.warn(`No recipients configured for stock critical alerts in empresa ${empresaId}`);
        return {
          success: false,
          error: 'No recipients configured',
          destinatarios: [],
        };
      }

      const result = await this.sendGridService.sendStockCriticalAlert(producto, empresaId, empresaNombre, destinatarios);

      this.logger.log(`Stock critical alert sent to ${destinatarios.length} recipients: ${result.messageId}`);

      // Registrar en el historial
      await this.recordAlertaHistorial({
        empresaId,
        tipo: 'STOCK_CRITICO',
        severidad: 'ALTA',
        titulo: `🚨 Stock Crítico: ${producto.nombre} - ${empresaNombre}`,
        mensaje: `Stock crítico detectado para ${producto.nombre}`,
        productoId: producto.id,
        productoNombre: producto.nombre,
        destinatarios,
        condicionActivacion: { stock: producto.stock, stockMinimo: producto.stockMinimo },
        emailEnviado: result.success,
      });

      return {
        success: result.success,
        messageId: result.messageId,
        destinatarios,
      };
    } catch (error) {
      this.logger.error(`Failed to send stock critical alert:`, error);
      return {
        success: false,
        error: error.message,
        destinatarios: [],
      };
    }
  }

  /**
   * 🔮 Enviar alerta de predicción de quiebre
   */
  async sendStockoutPredictionAlert(prediccion: any, empresaId: number, empresaNombre: string): Promise<NotificationResult> {
    try {
      const destinatarios = await this.getAlertDestinatarios(empresaId, 'stockout-prediction');
      
      if (destinatarios.length === 0) {
        return {
          success: false,
          error: 'No recipients configured',
          destinatarios: [],
        };
      }

      const template = this.emailTemplates.getStockoutPredictionTemplate(prediccion, empresaNombre);
      
      const result = await this.mailerService.sendMail({
        to: destinatarios,
        subject: template.asunto,
        html: template.contenidoHtml,
        text: template.contenidoTexto,
      });

      this.logger.log(`Stockout prediction alert sent to ${destinatarios.length} recipients: ${result.messageId}`);

      // Registrar en el historial
      await this.recordAlertaHistorial({
        empresaId,
        tipo: 'QUIEBRE_PREDICHO',
        severidad: prediccion.severidad,
        titulo: template.asunto,
        mensaje: `Predicción de quiebre para ${prediccion.nombre}`,
        productoId: prediccion.productoId,
        productoNombre: prediccion.nombre,
        destinatarios,
        condicionActivacion: { 
          diasRestantes: prediccion.diasRestantes, 
          probabilidadQuiebre: prediccion.probabilidadQuiebre 
        },
        emailEnviado: true,
      });

      return {
        success: true,
        messageId: result.messageId,
        destinatarios,
      };
    } catch (error) {
      this.logger.error(`Failed to send stockout prediction alert:`, error);
      return {
        success: false,
        error: error.message,
        destinatarios: [],
      };
    }
  }

  // Esta implementación se ha combinado con la función principal sendSensorAlert

  /**
   * ⏰ Enviar alerta de producto por caducar
   */
  async sendExpiryAlert(producto: any, diasRestantes: number, empresaId: number, empresaNombre: string): Promise<NotificationResult> {
    try {
      const destinatarios = await this.getAlertDestinatarios(empresaId, 'expiry-alert');
      
      if (destinatarios.length === 0) {
        return {
          success: false,
          error: 'No recipients configured',
          destinatarios: [],
        };
      }

      const template = this.emailTemplates.getExpiryAlertTemplate(producto, diasRestantes, empresaNombre);
      
      const result = await this.mailerService.sendMail({
        to: destinatarios,
        subject: template.asunto,
        html: template.contenidoHtml,
        text: template.contenidoTexto,
      });

      this.logger.log(`Expiry alert sent to ${destinatarios.length} recipients: ${result.messageId}`);

      // Registrar en el historial
      await this.recordAlertaHistorial({
        empresaId,
        tipo: 'VENCIMIENTO_PROXIMO',
        severidad: diasRestantes <= 3 ? 'CRITICA' : diasRestantes <= 7 ? 'ALTA' : 'MEDIA',
        titulo: template.asunto,
        mensaje: `Producto por caducar: ${producto.nombre}`,
        productoId: producto.id,
        productoNombre: producto.nombre,
        destinatarios,
        condicionActivacion: { diasRestantes },
        emailEnviado: true,
      });

      return {
        success: true,
        messageId: result.messageId,
        destinatarios,
      };
    } catch (error) {
      this.logger.error(`Failed to send expiry alert:`, error);
      return {
        success: false,
        error: error.message,
        destinatarios: [],
      };
    }
  }

  /**
   * 📊 Enviar alerta de KPI fuera de rango
   */
  async sendKPIAlert(kpi: any, empresaId: number, empresaNombre: string): Promise<NotificationResult> {
    try {
      const destinatarios = await this.getAlertDestinatarios(empresaId, 'kpi-alert');
      
      if (destinatarios.length === 0) {
        return {
          success: false,
          error: 'No recipients configured',
          destinatarios: [],
        };
      }

      const template = this.emailTemplates.getKPIAlertTemplate(kpi, empresaNombre);
      
      const result = await this.mailerService.sendMail({
        to: destinatarios,
        subject: template.asunto,
        html: template.contenidoHtml,
        text: template.contenidoTexto,
      });

      this.logger.log(`KPI alert sent to ${destinatarios.length} recipients: ${result.messageId}`);

      // Registrar en el historial
      await this.recordAlertaHistorial({
        empresaId,
        tipo: 'KPI_FUERA_RANGO',
        severidad: 'MEDIA',
        titulo: template.asunto,
        mensaje: `KPI fuera de rango: ${kpi.nombre}`,
        destinatarios,
        condicionActivacion: { 
          nombre: kpi.nombre, 
          valorActual: kpi.valorActual, 
          rangoEsperado: kpi.rangoEsperado 
        },
        emailEnviado: true,
      });

      return {
        success: true,
        messageId: result.messageId,
        destinatarios,
      };
    } catch (error) {
      this.logger.error(`Failed to send KPI alert:`, error);
      return {
        success: false,
        error: error.message,
        destinatarios: [],
      };
    }
  }

  /**
   * 📊 Enviar reporte semanal del dashboard
   */
  async sendWeeklyDashboardReport(empresaId: number, periodo: string): Promise<NotificationResult> {
    try {
      // Obtener datos de la empresa
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { id: true, nombre: true }
      });

      if (!empresa) {
        throw new Error(`Empresa no encontrada: ${empresaId}`);
      }

      // Obtener KPIs del dashboard
      const productos = await this.prisma.producto.findMany({
        where: { 
          empresaId,
          estado: 'ACTIVO'
        },
        include: {
          movimientos: {
            where: {
              tipo: 'SALIDA',
              fecha: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
              }
            }
          },
          proveedor: {
            select: { nombre: true }
          }
        }
      });

      // Calcular KPIs
      const valorInventario = productos.reduce((acc, p) => acc + (p.stock * p.precioVenta), 0);
      const valorVentas = productos.reduce((acc, p) => {
        const ventasProducto = p.movimientos.reduce((sum, m) => sum + m.cantidad, 0);
        return acc + (ventasProducto * p.precioVenta);
      }, 0);
      
      const productosConMargen = productos.filter(p => p.precioCompra > 0);
      const margenPromedio = productosConMargen.length > 0 
        ? productosConMargen.reduce((acc, p) => acc + ((p.precioVenta - p.precioCompra) / p.precioCompra * 100), 0) / productosConMargen.length
        : 0;

      const productosCriticos = productos.filter(p => p.stock <= p.stockMinimo).length;
      const productosSinStock = productos.filter(p => p.stock === 0).length;
      const productosConStockBajo = productos.filter(p => p.stock > 0 && p.stock <= p.stockMinimo).length;
      const productosConStockOptimo = productos.filter(p => p.stock > p.stockMinimo && p.stock <= p.stockMinimo * 2).length;
      const productosConStockAlto = productos.filter(p => p.stock > p.stockMinimo * 2).length;

      // Obtener productos que requieren atención
      const topProductos = productos
        .filter(p => p.stock <= p.stockMinimo)
        .map(p => ({
          nombre: p.nombre,
          stock: p.stock,
          stockMinimo: p.stockMinimo,
          precioVenta: p.precioVenta,
          movimientos: p.movimientos.length
        }))
        .sort((a, b) => (a.stock / a.stockMinimo) - (b.stock / b.stockMinimo))
        .slice(0, 5);

      // Generar alertas
      const alertas: Array<{
        tipo: string;
        mensaje: string;
        severidad: 'ALTA' | 'MEDIA' | 'BAJA';
      }> = [];
      if (productosCriticos > 0) {
        alertas.push({
          tipo: 'stock-critical',
          mensaje: `${productosCriticos} productos con stock crítico`,
          severidad: 'ALTA'
        });
      }
      if (productosSinStock > 0) {
        alertas.push({
          tipo: 'stockout',
          mensaje: `${productosSinStock} productos sin stock`,
          severidad: 'ALTA'
        });
      }
      if (valorVentas < valorInventario * 0.1) {
        alertas.push({
          tipo: 'low-sales',
          mensaje: 'Ventas bajas en comparación con el inventario',
          severidad: 'MEDIA'
        });
      }

      // Obtener destinatarios
      const destinatarios = await this.getAlertDestinatarios(empresaId, 'weekly-report');
      
      if (destinatarios.length === 0) {
        this.logger.warn(`No recipients configured for weekly reports in empresa ${empresaId}`);
        return {
          success: false,
          error: 'No recipients configured',
          destinatarios: [],
        };
      }

      const template = this.emailTemplates.getWeeklyDashboardReportTemplate({
        empresa: empresa.nombre,
        periodo,
        kpis: {
          valorInventario,
          valorVentas,
          margenPromedio,
          productosCriticos,
          productosSinStock,
          productosConStockBajo,
          productosConStockOptimo,
          productosConStockAlto
        },
        topProductos,
        alertas
      });

      const result = await this.sendGridService.sendEmail({
        to: destinatarios,
        subject: template.asunto,
        html: template.contenidoHtml,
        text: template.contenidoTexto,
        categories: ['weekly-report'],
        customArgs: {
          email_type: 'weekly_dashboard_report',
          empresa_id: empresaId.toString(),
          periodo,
        },
      });

      this.logger.log(`Weekly dashboard report sent to ${destinatarios.length} recipients: ${result.messageId}`);

      return {
        success: result.success,
        messageId: result.messageId,
        destinatarios,
      };
    } catch (error) {
      this.logger.error(`Failed to send weekly dashboard report:`, error);
      return {
        success: false,
        error: error.message,
        destinatarios: [],
      };
    }
  }

  /**
   * 🎨 Enviar alerta de stock mejorada
   */
  async sendEnhancedStockAlert(producto: any, empresaId: number, empresaNombre: string): Promise<NotificationResult> {
    try {
      // Obtener alertas relacionadas
      const alertasRelacionadas = await this.prisma.producto.findMany({
        where: {
          empresaId,
          estado: 'ACTIVO',
          stock: {
            lte: this.prisma.producto.fields.stockMinimo
          },
          id: {
            not: producto.id
          }
        },
        take: 3,
        select: {
          nombre: true,
          stock: true,
          stockMinimo: true
        }
      });

      const alertasRelacionadasFormateadas = alertasRelacionadas.map(p => ({
        mensaje: `${p.nombre}: Stock ${p.stock}/${p.stockMinimo}`
      }));

      // Obtener destinatarios
      const destinatarios = await this.getAlertDestinatarios(empresaId, 'stock-critical');
      
      if (destinatarios.length === 0) {
        this.logger.warn(`No recipients configured for stock critical alerts in empresa ${empresaId}`);
        return {
          success: false,
          error: 'No recipients configured',
          destinatarios: [],
        };
      }

      const template = this.emailTemplates.getEnhancedStockAlertTemplate(producto, empresaNombre, alertasRelacionadasFormateadas);

      const result = await this.sendGridService.sendEmail({
        to: destinatarios,
        subject: template.asunto,
        html: template.contenidoHtml,
        text: template.contenidoTexto,
        categories: ['stock-alert'],
        customArgs: {
          email_type: 'enhanced_stock_alert',
          empresa_id: empresaId.toString(),
          producto_id: producto.id.toString(),
        },
      });

      this.logger.log(`Enhanced stock alert sent to ${destinatarios.length} recipients: ${result.messageId}`);

      // Registrar en el historial
      await this.recordAlertaHistorial({
        empresaId,
        tipo: 'STOCK_CRITICO_MEJORADO',
        severidad: 'ALTA',
        titulo: `⚠️ Alerta de Stock Mejorada: ${producto.nombre} - ${empresaNombre}`,
        mensaje: `Stock crítico detectado para ${producto.nombre} con recomendaciones`,
        productoId: producto.id,
        productoNombre: producto.nombre,
        destinatarios,
        condicionActivacion: { stock: producto.stock, stockMinimo: producto.stockMinimo },
        emailEnviado: result.success,
      });

      return {
        success: result.success,
        messageId: result.messageId,
        destinatarios,
      };
    } catch (error) {
      this.logger.error(`Failed to send enhanced stock alert:`, error);
      return {
        success: false,
        error: error.message,
        destinatarios: [],
      };
    }
  }

  /**
   * 📈 Enviar reporte de inventario mensual
   */
  async sendInventoryReport(empresaId: number, mes: string): Promise<NotificationResult> {
    try {
      // Obtener datos de la empresa
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { id: true, nombre: true }
      });

      if (!empresa) {
        throw new Error(`Empresa no encontrada: ${empresaId}`);
      }

      // Obtener productos con información completa
      const productos = await this.prisma.producto.findMany({
        where: { 
          empresaId,
          estado: 'ACTIVO'
        },
        include: {
          movimientos: {
            where: {
              fecha: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Desde inicio del mes
              }
            }
          }
        }
      });

      // Calcular resumen
      const totalProductos = productos.length;
      const productosActivos = productos.filter(p => p.estado === 'ACTIVO').length;
      const productosInactivos = productos.filter(p => p.estado === 'INACTIVO').length;
      const valorTotalInventario = productos.reduce((acc, p) => acc + (p.stock * p.precioVenta), 0);
      const productosConStockBajo = productos.filter(p => p.stock > 0 && p.stock <= p.stockMinimo).length;
      const productosSinStock = productos.filter(p => p.stock === 0).length;

      // Top productos por valor en inventario
      const topProductos = productos
        .map(p => ({
          nombre: p.nombre,
          stock: p.stock,
          precioVenta: p.precioVenta,
          valorInventario: p.stock * p.precioVenta,
          movimientos: p.movimientos.length
        }))
        .sort((a, b) => b.valorInventario - a.valorInventario)
        .slice(0, 5);

      // Distribución por categorías (etiquetas)
      const categoriasMap = new Map<string, { cantidad: number; valor: number }>();
      productos.forEach(p => {
        const categoria = p.etiquetas.length > 0 ? p.etiquetas[0] : 'Sin categoría';
        const valor = p.stock * p.precioVenta;
        
        if (categoriasMap.has(categoria)) {
          const current = categoriasMap.get(categoria)!;
          current.cantidad += 1;
          current.valor += valor;
        } else {
          categoriasMap.set(categoria, { cantidad: 1, valor });
        }
      });

      const categorias = Array.from(categoriasMap.entries())
        .map(([nombre, data]) => ({
          nombre,
          cantidad: data.cantidad,
          valor: data.valor,
          porcentaje: (data.valor / valorTotalInventario) * 100
        }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 6);

      // Simular tendencias (en un caso real, esto vendría de datos históricos)
      const tendencias = [
        { fecha: '01', valor: valorTotalInventario * 0.95 },
        { fecha: '05', valor: valorTotalInventario * 0.98 },
        { fecha: '10', valor: valorTotalInventario * 1.02 },
        { fecha: '15', valor: valorTotalInventario * 0.99 },
        { fecha: '20', valor: valorTotalInventario * 1.05 },
        { fecha: '25', valor: valorTotalInventario * 1.01 },
        { fecha: '30', valor: valorTotalInventario }
      ];

      // Obtener destinatarios
      const destinatarios = await this.getAlertDestinatarios(empresaId, 'monthly-report');
      
      if (destinatarios.length === 0) {
        this.logger.warn(`No recipients configured for monthly reports in empresa ${empresaId}`);
        return {
          success: false,
          error: 'No recipients configured',
          destinatarios: [],
        };
      }

      const template = this.emailTemplates.getInventoryReportTemplate({
        empresa: empresa.nombre,
        mes,
        resumen: {
          totalProductos,
          productosActivos,
          productosInactivos,
          valorTotalInventario,
          productosConStockBajo,
          productosSinStock
        },
        topProductos,
        categorias,
        tendencias
      });

      const result = await this.sendGridService.sendEmail({
        to: destinatarios,
        subject: template.asunto,
        html: template.contenidoHtml,
        text: template.contenidoTexto,
        categories: ['monthly-report'],
        customArgs: {
          email_type: 'inventory_report',
          empresa_id: empresaId.toString(),
          mes,
        },
      });

      this.logger.log(`Inventory report sent to ${destinatarios.length} recipients: ${result.messageId}`);

      return {
        success: result.success,
        messageId: result.messageId,
        destinatarios,
      };
    } catch (error) {
      this.logger.error(`Failed to send inventory report:`, error);
      return {
        success: false,
        error: error.message,
        destinatarios: [],
      };
    }
  }

  /**
   * 🔧 Obtener destinatarios configurados para un tipo de alerta
   */
  private async getAlertDestinatarios(empresaId: number, tipoAlerta: string): Promise<string[]> {
    try {
      // Buscar configuración específica para este tipo de alerta
      const config = await this.prisma.configuracionAlerta.findFirst({
        where: {
          empresaId,
          tipoAlerta,
          activo: true,
        },
        include: {
          destinatarios: {
            select: {
              destinatario: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

      let destinatarios: string[] = [];

      // Si hay configuración específica, usar esos destinatarios
      if (config && config.destinatarios && config.destinatarios.length > 0) {
        destinatarios = config.destinatarios.map(d => d.destinatario.email);
      }

      // Si no hay configuración o está vacía, obtener usuarios admin de la empresa
      if (destinatarios.length === 0) {
        const usuarios = await this.prisma.usuario.findMany({
          where: {
            empresaId,
            rol: { in: ['ADMIN', 'SUPERADMIN'] }, // Incluir tanto ADMIN como SUPERADMIN
            activo: true,
          },
          select: {
            email: true,
            nombre: true,
          },
          orderBy: {
            createdAt: 'asc', // Priorizar usuarios más antiguos
          },
        });

        destinatarios = usuarios.map(u => u.email);
        
        this.logger.log(`Auto-configurando alertas para empresa ${empresaId}: ${destinatarios.length} usuarios admin encontrados`);
      }

      // Si aún no hay destinatarios, buscar cualquier usuario activo de la empresa
      if (destinatarios.length === 0) {
        const usuarios = await this.prisma.usuario.findMany({
          where: {
            empresaId,
            activo: true,
          },
          select: {
            email: true,
            nombre: true,
          },
          take: 5, // Máximo 5 usuarios
        });

        destinatarios = usuarios.map(u => u.email);
        
        this.logger.log(`Usando usuarios generales para empresa ${empresaId}: ${destinatarios.length} usuarios encontrados`);
      }

      return destinatarios;
    } catch (error) {
      this.logger.error(`Error getting alert recipients for empresa ${empresaId}:`, error);
      return [];
    }
  }

  /**
   * 📝 Registrar alerta en el historial
   */
  private async recordAlertaHistorial(data: {
    empresaId: number;
    tipo: string;
    severidad: SeveridadAlerta;
    titulo: string;
    mensaje: string;
    productoId?: number;
    productoNombre?: string;
    destinatarios: string[];
    condicionActivacion?: any;
    emailEnviado: boolean;
  }): Promise<void> {
    try {
      await this.prisma.alertaHistorial.create({
        data: {
          empresaId: data.empresaId,
          tipo: data.tipo,
          severidad: data.severidad,
          titulo: data.titulo,
          mensaje: data.mensaje,
          productoId: data.productoId,
          productoNombre: data.productoNombre,
          destinatarios: data.destinatarios,
          condicionActivacion: data.condicionActivacion,
          emailEnviado: data.emailEnviado,
        },
      });
    } catch (error) {
      this.logger.error(`Error recording alert history:`, error);
    }
  }

  /**
   * 📊 Obtener estadísticas de notificaciones
   */
  async getNotificationStats(empresaId: number, days: number = 30): Promise<{
    totalEnviadas: number;
    exitosas: number;
    fallidas: number;
    porTipo: Record<string, number>;
  }> {
    try {
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - days);

      const alertas = await this.prisma.alertaHistorial.findMany({
        where: {
          empresaId,
          fechaEnvio: {
            gte: fechaInicio,
          },
        },
        select: {
          emailEnviado: true,
          tipo: true,
        },
      });

      const totalEnviadas = alertas.length;
      const exitosas = alertas.filter(a => a.emailEnviado).length;
      const fallidas = totalEnviadas - exitosas;

      const porTipo = alertas.reduce((acc, alerta) => {
        acc[alerta.tipo] = (acc[alerta.tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEnviadas,
        exitosas,
        fallidas,
        porTipo,
      };
    } catch (error) {
      this.logger.error(`Failed to get notification stats:`, error);
      return {
        totalEnviadas: 0,
        exitosas: 0,
        fallidas: 0,
        porTipo: {},
      };
    }
  }
}