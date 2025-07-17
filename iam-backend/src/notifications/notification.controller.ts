import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmpresaGuard } from '../auth/guards/empresa.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';

export interface CreateAlertConfigurationDto {
  tipoAlerta: string;
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
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
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
  async getAlertHistory(
    @CurrentUser() user: JwtUser,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('tipo') tipo?: string,
    @Query('severidad') severidad?: string,
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
      this.prisma.alertHistory.findMany({
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
      this.prisma.alertHistory.count({ where }),
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

    const configuraciones = await this.prisma.alertConfiguration.findMany({
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
          this.prisma.alertConfiguration.create({
            data: {
              empresaId,
              tipoAlerta: tipo,
              destinatarios: [],
              activo: false,
              frecuencia: 'INMEDIATA',
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
    const existing = await this.prisma.alertConfiguration.findFirst({
      where: {
        empresaId,
        tipoAlerta: dto.tipoAlerta,
      },
    });

    if (existing) {
      throw new Error(`Ya existe una configuración para el tipo de alerta: ${dto.tipoAlerta}`);
    }

    return await this.prisma.alertConfiguration.create({
      data: {
        empresaId,
        tipoAlerta: dto.tipoAlerta,
        destinatarios: dto.destinatarios,
        activo: dto.activo,
        frecuencia: dto.frecuencia || 'INMEDIATA',
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
    const existing = await this.prisma.alertConfiguration.findFirst({
      where: {
        id: configId,
        empresaId,
      },
    });

    if (!existing) {
      throw new Error('Configuración no encontrada');
    }

    return await this.prisma.alertConfiguration.update({
      where: { id: configId },
      data: {
        destinatarios: dto.destinatarios,
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
    const existing = await this.prisma.alertConfiguration.findFirst({
      where: {
        id: configId,
        empresaId,
      },
    });

    if (!existing) {
      throw new Error('Configuración no encontrada');
    }

    await this.prisma.alertConfiguration.delete({
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

    const alertas = await this.prisma.alertHistory.findMany({
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
} 