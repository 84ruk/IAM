import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailTemplatesService, EmailTemplate } from './templates/email-templates.service';
import { PrismaService } from '../prisma/prisma.service';

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
  ) {}

  /**
   * 📧 Enviar email de recuperación de contraseña
   */
  async sendPasswordResetEmail(email: string, token: string, nombre: string): Promise<NotificationResult> {
    try {
      const template = this.emailTemplates.getPasswordResetTemplate(token, nombre);
      
      const result = await this.mailerService.sendMail({
        to: email,
        subject: template.asunto,
        html: template.contenidoHtml,
        text: template.contenidoTexto,
      });

      this.logger.log(`Password reset email sent to ${email}: ${result.messageId}`);

      return {
        success: true,
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
      const template = this.emailTemplates.getWelcomeTemplate(nombre, empresa);
      
      const result = await this.mailerService.sendMail({
        to: email,
        subject: template.asunto,
        html: template.contenidoHtml,
        text: template.contenidoTexto,
      });

      this.logger.log(`Welcome email sent to ${email}: ${result.messageId}`);

      return {
        success: true,
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

      const template = this.emailTemplates.getStockCriticalTemplate(producto, empresaNombre);
      
      const result = await this.mailerService.sendMail({
        to: destinatarios,
        subject: template.asunto,
        html: template.contenidoHtml,
        text: template.contenidoTexto,
      });

      this.logger.log(`Stock critical alert sent to ${destinatarios.length} recipients: ${result.messageId}`);

      // Registrar en el historial
      await this.recordAlertHistory({
        empresaId,
        tipo: 'STOCK_CRITICO',
        severidad: 'ALTA',
        titulo: template.asunto,
        mensaje: `Stock crítico detectado para ${producto.nombre}`,
        productoId: producto.id,
        productoNombre: producto.nombre,
        destinatarios,
        condicionActivacion: { stock: producto.stock, stockMinimo: producto.stockMinimo },
        emailEnviado: true,
      });

      return {
        success: true,
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
      await this.recordAlertHistory({
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

  /**
   * 🌡️ Enviar alerta de sensor
   */
  async sendSensorAlert(sensor: any, empresaId: number, empresaNombre: string): Promise<NotificationResult> {
    try {
      const destinatarios = await this.getAlertDestinatarios(empresaId, 'sensor-alert');
      
      if (destinatarios.length === 0) {
        return {
          success: false,
          error: 'No recipients configured',
          destinatarios: [],
        };
      }

      const template = this.emailTemplates.getSensorAlertTemplate(sensor, empresaNombre);
      
      const result = await this.mailerService.sendMail({
        to: destinatarios,
        subject: template.asunto,
        html: template.contenidoHtml,
        text: template.contenidoTexto,
      });

      this.logger.log(`Sensor alert sent to ${destinatarios.length} recipients: ${result.messageId}`);

      // Registrar en el historial
      await this.recordAlertHistory({
        empresaId,
        tipo: 'SENSOR_ALERT',
        severidad: sensor.severidad,
        titulo: template.asunto,
        mensaje: `Alerta de sensor ${sensor.tipo}`,
        productoId: sensor.productoId,
        productoNombre: sensor.producto?.nombre,
        destinatarios,
        condicionActivacion: { 
          tipo: sensor.tipo, 
          valor: sensor.valor, 
          unidad: sensor.unidad 
        },
        emailEnviado: true,
      });

      return {
        success: true,
        messageId: result.messageId,
        destinatarios,
      };
    } catch (error) {
      this.logger.error(`Failed to send sensor alert:`, error);
      return {
        success: false,
        error: error.message,
        destinatarios: [],
      };
    }
  }

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
      await this.recordAlertHistory({
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
      await this.recordAlertHistory({
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
   * 🔧 Obtener destinatarios configurados para un tipo de alerta
   */
  private async getAlertDestinatarios(empresaId: number, tipoAlerta: string): Promise<string[]> {
    try {
      // Buscar configuración específica para este tipo de alerta
      const config = await this.prisma.alertConfiguration.findFirst({
        where: {
          empresaId,
          tipoAlerta,
          activo: true,
        },
      });

      if (config && config.destinatarios.length > 0) {
        return config.destinatarios;
      }

      // Si no hay configuración específica, obtener usuarios admin de la empresa
      const usuarios = await this.prisma.usuario.findMany({
        where: {
          empresaId,
          rol: 'ADMIN',
          activo: true,
        },
        select: {
          email: true,
        },
      });

      return usuarios.map(u => u.email);
    } catch (error) {
      this.logger.error(`Error getting alert recipients for empresa ${empresaId}:`, error);
      return [];
    }
  }

  /**
   * 📝 Registrar alerta en el historial
   */
  private async recordAlertHistory(data: {
    empresaId: number;
    tipo: string;
    severidad: string;
    titulo: string;
    mensaje: string;
    productoId?: number;
    productoNombre?: string;
    destinatarios: string[];
    condicionActivacion?: any;
    emailEnviado: boolean;
  }): Promise<void> {
    try {
      await this.prisma.alertHistory.create({
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

      const alertas = await this.prisma.alertHistory.findMany({
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
      this.logger.error(`Error getting notification stats:`, error);
      return {
        totalEnviadas: 0,
        exitosas: 0,
        fallidas: 0,
        porTipo: {},
      };
    }
  }
} 