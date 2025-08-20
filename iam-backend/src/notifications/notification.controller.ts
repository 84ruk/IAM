import { SeveridadAlerta } from '@prisma/client';
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SimpleEmpresaGuard } from '../auth/guards/simple-empresa.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { EmailTemplatesService } from './templates/email-templates.service';
import { Logger } from '@nestjs/common';

export interface CreateAlertConfigurationDto {
  tipoAlerta: string;
  sensorId?: number;
  destinatarios: string[];
  activo: boolean;
  frecuencia?: string;
  horarioInicio?: string;
  horarioFin?: string;
}

export interface UpdateAlertConfigurationDto {
  destinatarios?: string[];
  activo?: boolean;
  frecuencia?: string;
  horarioInicio?: string;
  horarioFin?: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard, SimpleEmpresaGuard)
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
    private readonly emailTemplates: EmailTemplatesService,
  ) {}

  /**
   * 📊 Obtener estadísticas de notificaciones
   */
  @Get('stats')
  async getNotificationStats(
    @CurrentUser() user: JwtUser,
    @Query('days') days: string = '30',
  ) {
    const empresaId = user.empresaId;
    const daysNumber = parseInt(days) || 30;

    if (!empresaId) {
      throw new Error('Empresa ID no encontrado');
    }

    return await this.notificationService.getNotificationStats(empresaId, daysNumber);
  }

  /**
   * 📝 Obtener historial de alertas
   */
  @Get('history')
  async getAlertaHistorial(
    @CurrentUser() user: JwtUser,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('tipo') tipo?: string,
    @Query('severidad') severidad?: SeveridadAlerta,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const empresaId = user.empresaId;
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 20;
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {
      empresaId,
    };

    if (tipo) where.tipo = tipo;
    if (severidad) where.severidad = severidad;
    if (fechaInicio || fechaFin) {
      where.fechaEnvio = {};
      if (fechaInicio) where.fechaEnvio.gte = new Date(fechaInicio);
      if (fechaFin) where.fechaEnvio.lte = new Date(fechaFin);
    }

    const [alertas, total] = await Promise.all([
      this.prisma.alertaHistorial.findMany({
        where,
        orderBy: { fechaEnvio: 'desc' },
        skip,
        take: limitNumber,
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              codigoBarras: true,
            },
          },
        },
      }),
      this.prisma.alertaHistorial.count({ where }),
    ]);

    return {
      alertas,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    };
  }

  /**
   * ⚙️ Obtener configuración de alertas
   */
  @Get('config')
  async getAlertConfiguration(@CurrentUser() user: JwtUser) {
    const empresaId = user.empresaId;

    if (!empresaId) {
      throw new Error('Empresa ID no encontrado');
    }

    const configuraciones = await this.prisma.configuracionAlerta.findMany({
      where: { empresaId },
      orderBy: { tipoAlerta: 'asc' },
    });

    // Crear configuración por defecto si no existe
    const tiposAlerta = [
      'stock-critical',
      'stockout-prediction', 
      'sensor-alert',
      'expiry-alert',
      'kpi-alert',
    ];

    const configuracionesExistentes = configuraciones.map(c => c.tipoAlerta);
    const configuracionesFaltantes = tiposAlerta.filter(tipo => !configuracionesExistentes.includes(tipo));

    if (configuracionesFaltantes.length > 0) {
      const configuracionesPorDefecto = await Promise.all(
        configuracionesFaltantes.map(tipo =>
          this.prisma.configuracionAlerta.create({
            data: {
              empresaId,
              sensorId: 0, // Valor por defecto para configuraciones generales
              tipoAlerta: tipo,
              activo: false,
              frecuencia: 'INMEDIATA',
              umbral: {},
              notificacion: {},
            },
          })
        )
      );

      configuraciones.push(...configuracionesPorDefecto);
    }

    return configuraciones.sort((a, b) => a.tipoAlerta.localeCompare(b.tipoAlerta));
  }

  /**
   * ⚙️ Crear configuración de alerta
   */
  @Post('config')
  async createAlertConfiguration(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateAlertConfigurationDto,
  ) {
    const empresaId = user.empresaId;

    if (!empresaId) {
      throw new Error('Empresa ID no encontrado');
    }

    // Verificar que no exista ya una configuración para este tipo
    const existing = await this.prisma.configuracionAlerta.findFirst({
      where: {
        empresaId,
        tipoAlerta: dto.tipoAlerta,
      },
    });

    if (existing) {
      throw new Error(`Ya existe una configuración para el tipo de alerta: ${dto.tipoAlerta}`);
    }

    return await this.prisma.configuracionAlerta.create({
      data: {
        empresaId,
        sensorId: dto.sensorId || 0, // Usar 0 como valor por defecto para alertas generales
        tipoAlerta: dto.tipoAlerta,
        activo: dto.activo,
        frecuencia: dto.frecuencia || 'INMEDIATA',
        umbral: {},
        notificacion: {},
      },
    });
  }

  /**
   * ⚙️ Actualizar configuración de alerta
   */
  @Put('config/:id')
  async updateAlertConfiguration(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateAlertConfigurationDto,
  ) {
    const empresaId = user.empresaId;
    const configId = parseInt(id);

    if (!empresaId) {
      throw new Error('Empresa ID no encontrado');
    }

    // Verificar que la configuración pertenece a la empresa del usuario
    const existing = await this.prisma.configuracionAlerta.findFirst({
      where: {
        id: configId,
        empresaId,
      },
    });

    if (!existing) {
      throw new Error('Configuración no encontrada');
    }

    return await this.prisma.configuracionAlerta.update({
      where: { id: configId },
      data: {
        activo: dto.activo,
        frecuencia: dto.frecuencia,
      },
    });
  }

  /**
   * ⚙️ Eliminar configuración de alerta
   */
  @Delete('config/:id')
  async deleteAlertConfiguration(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
  ) {
    const empresaId = user.empresaId;
    const configId = parseInt(id);

    if (!empresaId) {
      throw new Error('Empresa ID no encontrado');
    }

    // Verificar que la configuración pertenece a la empresa del usuario
    const existing = await this.prisma.configuracionAlerta.findFirst({
      where: {
        id: configId,
        empresaId,
      },
    });

    if (!existing) {
      throw new Error('Configuración no encontrada');
    }

    await this.prisma.configuracionAlerta.delete({
      where: { id: configId },
    });

    return { message: 'Configuración eliminada exitosamente' };
  }

  /**
   * 📧 Enviar email de prueba
   */
  @Post('test-email')
  async sendTestEmail(
    @CurrentUser() user: JwtUser,
    @Body() body: { email: string; tipo: string },
  ) {
    const empresaId = user.empresaId;
    const { email, tipo } = body;

    // Verificar que el usuario tiene permisos de admin
    if (user.rol !== 'ADMIN' && user.rol !== 'SUPERADMIN') {
      throw new Error('No tienes permisos para enviar emails de prueba');
    }

    try {
      let result;

      switch (tipo) {
        case 'welcome':
          result = await this.notificationService.sendWelcomeEmail(
            email,
            'Usuario de Prueba',
            'Empresa de Prueba'
          );
          break;
        
        case 'stock-critical':
          const productoMock = {
            id: 1,
            nombre: 'Producto de Prueba',
            stock: 5,
            stockMinimo: 10,
            codigoBarras: '123456789',
            proveedor: { nombre: 'Proveedor de Prueba' },
          };
          result = await this.notificationService.sendStockCriticalAlert(
            productoMock,
            empresaId!,
            'Empresa de Prueba'
          );
          break;
        
        case 'stockout-prediction':
          const prediccionMock = {
            productoId: 1,
            nombre: 'Producto de Prueba',
            stock: 15,
            diasRestantes: 3,
            probabilidadQuiebre: 0.85,
            fechaEstimadaQuiebre: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            severidad: 'ALTA',
            recomendaciones: [
              'Reabastecer inmediatamente',
              'Contactar al proveedor',
              'Revisar demanda histórica',
            ],
          };
          result = await this.notificationService.sendStockoutPredictionAlert(
            prediccionMock,
            empresaId!,
            'Empresa de Prueba'
          );
          break;
        
        case 'sensor-alert':
          const sensorMock = {
            tipo: 'TEMPERATURA',
            valor: 35,
            unidad: '°C',
            severidad: 'ALTA',
            producto: { nombre: 'Producto Sensible' },
          };
          result = await this.notificationService.sendSensorAlert(
            sensorMock,
            empresaId!,
            'Empresa de Prueba'
          );
          break;
        
        case 'expiry-alert':
          const productoExpiryMock = {
            id: 1,
            nombre: 'Producto por Caducar',
            stock: 50,
            precioCompra: 10.50,
            codigoBarras: '987654321',
          };
          result = await this.notificationService.sendExpiryAlert(
            productoExpiryMock,
            5,
            empresaId!,
            'Empresa de Prueba'
          );
          break;
        
        case 'kpi-alert':
          const kpiMock = {
            nombre: 'Rotación de Inventario',
            valorActual: 2.5,
            rangoEsperado: '3.0 - 5.0',
            desviacion: '-0.5',
            impacto: 'Bajo',
            recomendaciones: [
              'Revisar políticas de reabastecimiento',
              'Analizar productos de baja rotación',
              'Optimizar niveles de stock',
            ],
          };
          result = await this.notificationService.sendKPIAlert(
            kpiMock,
            empresaId!,
            'Empresa de Prueba'
          );
          break;
        
        default:
          throw new Error(`Tipo de email no válido: ${tipo}`);
      }

      return {
        success: result.success,
        message: result.success ? 'Email de prueba enviado exitosamente' : result.error,
        messageId: result.messageId,
        destinatarios: result.destinatarios,
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al enviar email de prueba: ${error.message}`,
      };
    }
  }

  /**
   * 📊 Obtener resumen de alertas por tipo
   */
  @Get('summary')
  async getAlertSummary(
    @CurrentUser() user: JwtUser,
    @Query('days') days: string = '7',
  ) {
    const empresaId = user.empresaId;
    const daysNumber = parseInt(days) || 7;
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - daysNumber);

    if (!empresaId) {
      throw new Error('Empresa ID no encontrado');
    }

    const alertas = await this.prisma.alertaHistorial.findMany({
      where: {
        empresaId,
        fechaEnvio: {
          gte: fechaInicio,
        },
      },
      select: {
        tipo: true,
        severidad: true,
        emailEnviado: true,
        fechaEnvio: true,
      },
    });

    const resumen = {
      total: alertas.length,
      porTipo: {},
      porSeveridad: {},
      exitosas: alertas.filter(a => a.emailEnviado).length,
      fallidas: alertas.filter(a => !a.emailEnviado).length,
      ultimas24h: alertas.filter(a => {
        const hace24h = new Date();
        hace24h.setHours(hace24h.getHours() - 24);
        return a.fechaEnvio >= hace24h;
      }).length,
    };

    // Agrupar por tipo
    alertas.forEach(alerta => {
      resumen.porTipo[alerta.tipo] = (resumen.porTipo[alerta.tipo] || 0) + 1;
      resumen.porSeveridad[alerta.severidad] = (resumen.porSeveridad[alerta.severidad] || 0) + 1;
    });

    return resumen;
  }

  /**
   * 📊 Enviar reporte semanal del dashboard
   */
  @Post('weekly-report/:empresaId')
  @UseGuards(JwtAuthGuard, SimpleEmpresaGuard)
  async sendWeeklyReport(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() body: { periodo: string }
  ) {
    try {
      const result = await this.notificationService.sendWeeklyDashboardReport(empresaId, body.periodo);
      
      return {
        success: result.success,
        message: result.success 
          ? 'Reporte semanal enviado exitosamente' 
          : `Error al enviar reporte: ${result.error}`,
        messageId: result.messageId,
        destinatarios: result.destinatarios.length
      };
    } catch (error) {
      this.logger.error(`Error sending weekly report for empresa ${empresaId}:`, error);
      throw new BadRequestException('Error al enviar reporte semanal');
    }
  }

  /**
   * 🎨 Enviar alerta de stock mejorada
   */
  @Post('enhanced-stock-alert/:empresaId')
  @UseGuards(JwtAuthGuard, SimpleEmpresaGuard)
  async sendEnhancedStockAlert(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() body: { productoId: number }
  ) {
    try {
      // Obtener producto con información completa
      const producto = await this.prisma.producto.findUnique({
        where: { id: body.productoId },
        include: {
          proveedor: {
            select: { nombre: true }
          }
        }
      });

      if (!producto) {
        throw new BadRequestException('Producto no encontrado');
      }

      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { nombre: true }
      });

      if (!empresa) {
        throw new BadRequestException('Empresa no encontrada');
      }

      const result = await this.notificationService.sendEnhancedStockAlert(
        producto, 
        empresaId, 
        empresa.nombre
      );
      
      return {
        success: result.success,
        message: result.success 
          ? 'Alerta de stock mejorada enviada exitosamente' 
          : `Error al enviar alerta: ${result.error}`,
        messageId: result.messageId,
        destinatarios: result.destinatarios.length
      };
    } catch (error) {
      this.logger.error(`Error sending enhanced stock alert for empresa ${empresaId}:`, error);
      throw new BadRequestException('Error al enviar alerta de stock mejorada');
    }
  }

  /**
   * 📈 Enviar reporte de inventario mensual
   */
  @Post('inventory-report/:empresaId')
  @UseGuards(JwtAuthGuard, SimpleEmpresaGuard)
  async sendInventoryReport(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() body: { mes: string }
  ) {
    try {
      const result = await this.notificationService.sendInventoryReport(empresaId, body.mes);
      
      return {
        success: result.success,
        message: result.success 
          ? 'Reporte de inventario enviado exitosamente' 
          : `Error al enviar reporte: ${result.error}`,
        messageId: result.messageId,
        destinatarios: result.destinatarios.length
      };
    } catch (error) {
      this.logger.error(`Error sending inventory report for empresa ${empresaId}:`, error);
      throw new BadRequestException('Error al enviar reporte de inventario');
    }
  }

  /**
   * 🎨 Obtener preview de plantillas de email
   */
  @Get('preview/:templateType')
  @UseGuards(JwtAuthGuard)
  async getEmailPreview(
    @Param('templateType') templateType: string,
    @Query() query: any
  ) {
    try {
      let template: any;

      switch (templateType) {
        case 'weekly-dashboard-report':
          template = this.emailTemplates.getWeeklyDashboardReportTemplate({
            empresa: 'Empresa Demo',
            periodo: '1-7 Enero 2024',
            kpis: {
              valorInventario: 125000,
              valorVentas: 45000,
              margenPromedio: 25.5,
              productosCriticos: 3,
              productosSinStock: 1,
              productosConStockBajo: 2,
              productosConStockOptimo: 15,
              productosConStockAlto: 8
            },
            topProductos: [
              {
                nombre: 'Producto Crítico 1',
                stock: 2,
                stockMinimo: 10,
                precioVenta: 150,
                movimientos: 5
              },
              {
                nombre: 'Producto Crítico 2',
                stock: 0,
                stockMinimo: 5,
                precioVenta: 75,
                movimientos: 3
              }
            ],
            alertas: [
              {
                tipo: 'stock-critical',
                mensaje: '3 productos con stock crítico',
                severidad: 'ALTA'
              },
              {
                tipo: 'stockout',
                mensaje: '1 producto sin stock',
                severidad: 'ALTA'
              }
            ]
          });
          break;

        case 'enhanced-stock-alert':
          template = this.emailTemplates.getEnhancedStockAlertTemplate(
            {
              id: 1,
              nombre: 'Producto Demo',
              stock: 2,
              stockMinimo: 10,
              precioVenta: 150,
              codigoBarras: '123456789',
              etiquetas: ['Electrónicos'],
              proveedor: { nombre: 'Proveedor Demo' }
            },
            'Empresa Demo',
            [
              { mensaje: 'Producto Relacionado 1: Stock 3/8' },
              { mensaje: 'Producto Relacionado 2: Stock 1/5' }
            ]
          );
          break;

        case 'inventory-report':
          template = this.emailTemplates.getInventoryReportTemplate({
            empresa: 'Empresa Demo',
            mes: 'Enero 2024',
            resumen: {
              totalProductos: 45,
              productosActivos: 42,
              productosInactivos: 3,
              valorTotalInventario: 125000,
              productosConStockBajo: 5,
              productosSinStock: 2
            },
            topProductos: [
              {
                nombre: 'Producto Valioso 1',
                stock: 50,
                precioVenta: 500,
                valorInventario: 25000,
                movimientos: 12
              },
              {
                nombre: 'Producto Valioso 2',
                stock: 30,
                precioVenta: 300,
                valorInventario: 9000,
                movimientos: 8
              }
            ],
            categorias: [
              {
                nombre: 'Electrónicos',
                cantidad: 15,
                valor: 45000,
                porcentaje: 36.0
              },
              {
                nombre: 'Ropa',
                cantidad: 20,
                valor: 35000,
                porcentaje: 28.0
              }
            ],
            tendencias: [
              { fecha: '01', valor: 118750 },
              { fecha: '15', valor: 123750 },
              { fecha: '30', valor: 125000 }
            ]
          });
          break;

        default:
          throw new BadRequestException('Tipo de plantilla no válido');
      }

      return {
        success: true,
        template: {
          nombre: template.nombre,
          asunto: template.asunto,
          contenidoHtml: template.contenidoHtml,
          contenidoTexto: template.contenidoTexto
        }
      };
    } catch (error) {
      this.logger.error(`Error getting email preview for template ${templateType}:`, error);
      throw new BadRequestException('Error al obtener preview de plantilla');
    }
  }
} 