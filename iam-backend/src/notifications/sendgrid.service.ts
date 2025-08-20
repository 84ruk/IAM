import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

export interface SendGridEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
  templateId?: string;
  dynamicTemplateData?: any;
  categories?: string[];
  customArgs?: Record<string, string>;
}

export interface SendGridResult {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
  headers?: any;
}

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeSendGrid();
  }

  private initializeSendGrid() {
    try {
      const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
      
      if (!apiKey) {
        this.logger.warn('SENDGRID_API_KEY no configurada. SendGrid no estará disponible.');
        return;
      }

      // Validar formato de API key (debe empezar con "SG.")
      if (!apiKey.startsWith('SG.')) {
        this.logger.warn('API key does not start with "SG.". SendGrid no estará disponible.');
        return;
      }

      sgMail.setApiKey(apiKey);
      
      // Configurar región si es necesario (EU, etc.)
      const dataResidency = this.configService.get<string>('SENDGRID_DATA_RESIDENCY');
      if (dataResidency) {
        // Nota: setDataResidency puede no estar disponible en todas las versiones
        // Se puede configurar manualmente en el dashboard de SendGrid
        this.logger.log(`SendGrid configurado. Para región ${dataResidency}, configura manualmente en el dashboard.`);
      }

      this.isInitialized = true;
      this.logger.log('SendGrid inicializado correctamente');
      
    } catch (error) {
      this.logger.error('Error al inicializar SendGrid:', error);
    }
  }

  /**
   * 📧 Enviar email usando SendGrid
   */
  async sendEmail(options: SendGridEmailOptions): Promise<SendGridResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'SendGrid no está inicializado. Verifica SENDGRID_API_KEY.',
      };
    }

    try {
      const fromEmail = options.from || this.configService.get<string>('SENDGRID_FROM_EMAIL');
      const fromName = options.fromName || this.configService.get<string>('SENDGRID_FROM_NAME');
      
      if (!fromEmail) {
        throw new Error('Email remitente no configurado. Configura SENDGRID_FROM_EMAIL.');
      }

      const msg: any = {
        to: options.to,
        from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
        subject: options.subject,
        html: options.html,
      };

      // Agregar texto plano si está disponible
      if (options.text) {
        msg.text = options.text;
      }

      // Agregar plantilla si está especificada
      if (options.templateId) {
        msg.templateId = options.templateId;
        if (options.dynamicTemplateData) {
          msg.dynamicTemplateData = options.dynamicTemplateData;
        }
      }

      // Agregar adjuntos si están disponibles
      if (options.attachments && options.attachments.length > 0) {
        msg.attachments = options.attachments;
      }

      // Agregar categorías para tracking
      if (options.categories && options.categories.length > 0) {
        msg.categories = options.categories;
      }

      // Agregar argumentos personalizados
      if (options.customArgs) {
        msg.customArgs = options.customArgs;
      }

      // Configurar tracking
      msg.trackingSettings = {
        clickTracking: {
          enable: true,
          enableText: true,
        },
        openTracking: {
          enable: true,
        },
        subscriptionTracking: {
          enable: false,
        },
      };

      this.logger.debug(`Enviando email a: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
      
      const response = await sgMail.send(msg);
      
      this.logger.log(`Email enviado exitosamente: ${response[0]?.headers['x-message-id'] || 'N/A'}`);
      
      return {
        success: true,
        messageId: response[0]?.headers['x-message-id'],
        statusCode: response[0]?.statusCode,
        headers: response[0]?.headers,
      };

    } catch (error) {
      this.logger.error('Error al enviar email con SendGrid:', error);
      
      let errorMessage = 'Error desconocido';
      let statusCode = 500;

      if (error.response) {
        const { body } = error.response;
        errorMessage = body?.errors?.[0]?.message || body?.message || error.message;
        statusCode = error.response.statusCode;
        
        this.logger.error(`SendGrid API Error: ${statusCode} - ${JSON.stringify(body)}`);
      } else {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        statusCode,
      };
    }
  }

  /**
   * 📧 Enviar email de bienvenida
   */
  async sendWelcomeEmail(email: string, nombre: string, empresa: string): Promise<SendGridResult> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1>🎉 ¡Bienvenido a IAM!</h1>
          <p>Sistema de Gestión de Inventarios</p>
        </div>
        <div style="padding: 20px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
          <h2>¡Hola ${nombre}!</h2>
          <p>Te damos la bienvenida a <strong>${empresa}</strong> en el sistema IAM.</p>
          <p>Tu cuenta ha sido creada exitosamente y ya puedes comenzar a gestionar tu inventario.</p>
          <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>🚀 Próximos pasos:</h3>
            <ul>
              <li>Configura tu perfil de usuario</li>
              <li>Agrega tus primeros productos</li>
              <li>Configura alertas y configuracionNotificaciones</li>
              <li>Explora el dashboard</li>
            </ul>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/dashboard" 
               style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ir al Dashboard
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: '🎉 ¡Bienvenido a IAM Sistema de Inventarios!',
      html,
      categories: ['welcome', 'onboarding'],
      customArgs: {
        email_type: 'welcome',
        user_name: nombre,
        empresa: empresa,
      },
    });
  }

  /**
   * 🚨 Enviar alerta de stock crítico
   */
  async sendStockCriticalAlert(
    producto: any, 
    empresaId: number, 
    empresaNombre: string,
    destinatarios: string[]
  ): Promise<SendGridResult> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1>🚨 Alerta de Stock Crítico</h1>
          <p>${empresaNombre}</p>
        </div>
        <div style="padding: 20px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
          <h2>Stock Bajo Detectado</h2>
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3>📦 ${producto.nombre}</h3>
            <p><strong>Stock actual:</strong> ${producto.stock} unidades</p>
            <p><strong>Stock mínimo:</strong> ${producto.stockMinimo} unidades</p>
            <p><strong>Código:</strong> ${producto.codigoBarras || 'N/A'}</p>
            ${producto.proveedor ? `<p><strong>Proveedor:</strong> ${producto.proveedor.nombre}</p>` : ''}
          </div>
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3>🔧 Acciones Recomendadas:</h3>
            <ul>
              <li>Contactar al proveedor para reabastecimiento</li>
              <li>Revisar demanda histórica del producto</li>
              <li>Considerar ajustar el stock mínimo</li>
              <li>Evaluar productos sustitutos</li>
            </ul>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/dashboard/productos" 
               style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ver Productos
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: destinatarios,
      subject: `🚨 Stock Crítico: ${producto.nombre} - ${empresaNombre}`,
      html,
      categories: ['alert', 'stock-critical'],
      customArgs: {
        email_type: 'stock_critical',
        producto_id: producto.id.toString(),
        empresa_id: empresaId.toString(),
        stock_actual: producto.stock.toString(),
        stock_minimo: producto.stockMinimo.toString(),
      },
    });
  }

  /**
   * 🔮 Enviar alerta de predicción de quiebre
   */
  async sendStockoutPredictionAlert(
    prediccion: any,
    empresaId: number,
    empresaNombre: string,
    destinatarios: string[]
  ): Promise<SendGridResult> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1>🔮 Predicción de Quiebre</h1>
          <p>${empresaNombre}</p>
        </div>
        <div style="padding: 20px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
          <h2>Análisis Predictivo</h2>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3>📊 ${prediccion.nombre}</h3>
            <p><strong>Stock actual:</strong> ${prediccion.stock} unidades</p>
            <p><strong>Días restantes:</strong> ${prediccion.diasRestantes} días</p>
            <p><strong>Probabilidad de quiebre:</strong> ${(prediccion.probabilidadQuiebre * 100).toFixed(1)}%</p>
            <p><strong>Fecha estimada:</strong> ${prediccion.fechaEstimadaQuiebre.toLocaleDateString()}</p>
            <p><strong>Severidad:</strong> ${prediccion.severidad}</p>
          </div>
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3>💡 Recomendaciones:</h3>
            <ul>
              ${prediccion.recomendaciones.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/dashboard/predicciones" 
               style="background: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ver Predicciones
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: destinatarios,
      subject: `🔮 Predicción: ${prediccion.nombre} - ${empresaNombre}`,
      html,
      categories: ['alert', 'prediction'],
      customArgs: {
        email_type: 'stockout_prediction',
        producto_id: prediccion.productoId.toString(),
        empresa_id: empresaId.toString(),
        dias_restantes: prediccion.diasRestantes.toString(),
        probabilidad: prediccion.probabilidadQuiebre.toString(),
      },
    });
  }

  /**
   * 📊 Enviar alerta de KPI
   */
  async sendKPIAlert(
    kpi: any,
    empresaId: number,
    empresaNombre: string,
    destinatarios: string[]
  ): Promise<SendGridResult> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1>📊 Alerta de KPI</h1>
          <p>${empresaNombre}</p>
        </div>
        <div style="padding: 20px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
          <h2>KPI Fuera de Rango</h2>
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3>📈 ${kpi.nombre}</h3>
            <p><strong>Valor actual:</strong> ${kpi.valorActual}</p>
            <p><strong>Rango esperado:</strong> ${kpi.rangoEsperado}</p>
            <p><strong>Desviación:</strong> ${kpi.desviacion}</p>
            <p><strong>Impacto:</strong> ${kpi.impacto}</p>
          </div>
          <div style="background: #e2e3e5; border: 1px solid #d6d8db; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3>🎯 Acciones Sugeridas:</h3>
            <ul>
              ${kpi.recomendaciones.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/dashboard/kpis" 
               style="background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ver KPIs
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: destinatarios,
      subject: `📊 KPI Alert: ${kpi.nombre} - ${empresaNombre}`,
      html,
      categories: ['alert', 'kpi'],
      customArgs: {
        email_type: 'kpi_alert',
        kpi_name: kpi.nombre,
        empresa_id: empresaId.toString(),
        valor_actual: kpi.valorActual.toString(),
        impacto: kpi.impacto,
      },
    });
  }

  /**
   * 🔍 Verificar estado de SendGrid
   */
  async checkStatus(): Promise<{ initialized: boolean; apiKey: boolean; fromEmail: boolean }> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');

    return {
      initialized: this.isInitialized,
      apiKey: !!apiKey,
      fromEmail: !!fromEmail,
    };
  }
} 