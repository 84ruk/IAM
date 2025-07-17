import { Injectable } from '@nestjs/common';
import mjml2html from 'mjml';

export interface EmailTemplate {
  nombre: string;
  asunto: string;
  contenidoHtml: string;
  contenidoTexto: string;
  variables: string[];
}

@Injectable()
export class EmailTemplatesService {
  private readonly baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  /**
   * 🎨 Plantilla base con branding IAM
   */
  private getBaseTemplate(content: string): string {
    return mjml2html(`
      <mjml>
        <mj-head>
          <mj-title>IAM Inventario</mj-title>
          <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
          <mj-attributes>
            <mj-all font-family="Inter, Arial, sans-serif" />
          </mj-attributes>
        </mj-head>
        <mj-body background-color="#f8fafc">
          <!-- Header con logo -->
          <mj-section background-color="#ffffff" padding="20px">
            <mj-column>
              <mj-image src="${this.baseUrl}/images/iam-logo.png" alt="IAM Inventario" width="120px" />
              <mj-text font-size="14px" color="#64748b" align="center" padding-top="10px">
                Sistema de Gestión de Inventarios
              </mj-text>
            </mj-column>
          </mj-section>

          <!-- Contenido principal -->
          <mj-section background-color="#ffffff" padding="20px">
            <mj-column>
              ${content}
            </mj-column>
          </mj-section>

          <!-- Footer -->
          <mj-section background-color="#f1f5f9" padding="20px">
            <mj-column>
              <mj-text font-size="12px" color="#64748b" align="center">
                © 2024 IAM Inventario. Todos los derechos reservados.
              </mj-text>
              <mj-text font-size="12px" color="#64748b" align="center">
                Este email fue enviado automáticamente. No responda a este mensaje.
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `).html;
  }

  /**
   * 📧 Plantilla de recuperación de contraseña
   */
  getPasswordResetTemplate(token: string, nombre: string): EmailTemplate {
    const resetUrl = `${this.baseUrl}/reset-password?token=${token}`;
    
    const content = `
      <mj-text font-size="24px" font-weight="600" color="#1e293b" padding-bottom="20px">
        Recupera tu contraseña
      </mj-text>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="20px">
        Hola ${nombre},
      </mj-text>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="20px">
        Hemos recibido una solicitud para restablecer tu contraseña en IAM Inventario. 
        Si no realizaste esta solicitud, puedes ignorar este email.
      </mj-text>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="30px">
        Para restablecer tu contraseña, haz clic en el botón de abajo:
      </mj-text>
      
      <mj-button background-color="#10b981" color="white" href="${resetUrl}" 
                 font-size="16px" font-weight="500" padding="15px 30px" border-radius="8px">
        Restablecer Contraseña
      </mj-button>
      
      <mj-text font-size="14px" color="#64748b" padding-top="20px">
        Este enlace expirará en 1 hora por seguridad.
      </mj-text>
      
      <mj-text font-size="14px" color="#64748b" padding-top="10px">
        Si el botón no funciona, copia y pega este enlace en tu navegador:
      </mj-text>
      
      <mj-text font-size="12px" color="#94a3b8" padding-top="5px">
        ${resetUrl}
      </mj-text>
    `;

    return {
      nombre: 'password-reset',
      asunto: 'Recupera tu contraseña - IAM Inventario',
      contenidoHtml: this.getBaseTemplate(content),
      contenidoTexto: this.getTextVersion('password-reset', { nombre, resetUrl }),
      variables: ['token', 'nombre']
    };
  }

  /**
   * 🎉 Plantilla de registro exitoso
   */
  getWelcomeTemplate(nombre: string, empresa: string): EmailTemplate {
    const dashboardUrl = `${this.baseUrl}/dashboard`;
    
    const content = `
      <mj-text font-size="24px" font-weight="600" color="#1e293b" padding-bottom="20px">
        ¡Bienvenido a IAM Inventario!
      </mj-text>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="20px">
        Hola ${nombre},
      </mj-text>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="20px">
        ¡Tu cuenta ha sido creada exitosamente! Ya puedes comenzar a gestionar el inventario 
        de ${empresa} con todas las herramientas que IAM Inventario tiene para ofrecerte.
      </mj-text>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="30px">
        Accede a tu dashboard para comenzar:
      </mj-text>
      
      <mj-button background-color="#10b981" color="white" href="${dashboardUrl}" 
                 font-size="16px" font-weight="500" padding="15px 30px" border-radius="8px">
        Ir al Dashboard
      </mj-button>
      
      <mj-text font-size="14px" color="#64748b" padding-top="20px">
        Si tienes alguna pregunta, no dudes en contactarnos.
      </mj-text>
    `;

    return {
      nombre: 'welcome',
      asunto: '¡Bienvenido a IAM Inventario!',
      contenidoHtml: this.getBaseTemplate(content),
      contenidoTexto: this.getTextVersion('welcome', { nombre, empresa, dashboardUrl }),
      variables: ['nombre', 'empresa']
    };
  }

  /**
   * 🚨 Plantilla de stock crítico
   */
  getStockCriticalTemplate(producto: any, empresa: string): EmailTemplate {
    const dashboardUrl = `${this.baseUrl}/dashboard`;
    const productoUrl = `${this.baseUrl}/productos/${producto.id}`;
    
    const content = `
      <mj-text font-size="24px" font-weight="600" color="#dc2626" padding-bottom="20px">
        ⚠️ Stock Crítico Detectado
      </mj-text>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="20px">
        Se ha detectado que el producto <strong>${producto.nombre}</strong> 
        tiene un stock crítico en ${empresa}.
      </mj-text>
      
      <mj-section background-color="#fef2f2" border-radius="8px" padding="20px" margin="20px 0">
        <mj-column>
          <mj-text font-size="16px" font-weight="600" color="#dc2626" padding-bottom="10px">
            Detalles del Producto:
          </mj-text>
          <mj-text font-size="14px" color="#475569" line-height="20px">
            • <strong>Stock actual:</strong> ${producto.stock} unidades<br/>
            • <strong>Stock mínimo:</strong> ${producto.stockMinimo} unidades<br/>
            • <strong>Código:</strong> ${producto.codigoBarras || 'N/A'}<br/>
            • <strong>Proveedor:</strong> ${producto.proveedor?.nombre || 'No asignado'}
          </mj-text>
        </mj-column>
      </mj-section>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="30px">
        Te recomendamos reabastecer este producto lo antes posible para evitar quiebres de stock.
      </mj-text>
      
      <mj-button background-color="#dc2626" color="white" href="${productoUrl}" 
                 font-size="16px" font-weight="500" padding="15px 30px" border-radius="8px">
        Ver Producto
      </mj-button>
      
      <mj-text font-size="14px" color="#64748b" padding-top="20px">
        Esta alerta se resolverá automáticamente cuando el stock se reabastezca.
      </mj-text>
    `;

    return {
      nombre: 'stock-critical',
      asunto: `🚨 Stock Crítico: ${producto.nombre} - ${empresa}`,
      contenidoHtml: this.getBaseTemplate(content),
      contenidoTexto: this.getTextVersion('stock-critical', { producto, empresa, productoUrl }),
      variables: ['producto', 'empresa']
    };
  }

  /**
   * 🔮 Plantilla de predicción de quiebre
   */
  getStockoutPredictionTemplate(prediccion: any, empresa: string): EmailTemplate {
    const dashboardUrl = `${this.baseUrl}/dashboard`;
    const productoUrl = `${this.baseUrl}/productos/${prediccion.productoId}`;
    
    const content = `
      <mj-text font-size="24px" font-weight="600" color="#ea580c" padding-bottom="20px">
        🔮 Predicción de Quiebre de Stock
      </mj-text>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="20px">
        Nuestro sistema ha detectado que el producto <strong>${prediccion.nombre}</strong> 
        podría agotarse pronto en ${empresa}.
      </mj-text>
      
      <mj-section background-color="#fff7ed" border-radius="8px" padding="20px" margin="20px 0">
        <mj-column>
          <mj-text font-size="16px" font-weight="600" color="#ea580c" padding-bottom="10px">
            Análisis de Predicción:
          </mj-text>
          <mj-text font-size="14px" color="#475569" line-height="20px">
            • <strong>Stock actual:</strong> ${prediccion.stock} unidades<br/>
            • <strong>Días restantes:</strong> ${prediccion.diasRestantes} días<br/>
            • <strong>Probabilidad de quiebre:</strong> ${Math.round(prediccion.probabilidadQuiebre * 100)}%<br/>
            • <strong>Fecha estimada de quiebre:</strong> ${prediccion.fechaEstimadaQuiebre.toLocaleDateString()}
          </mj-text>
        </mj-column>
      </mj-section>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="20px">
        <strong>Recomendaciones:</strong>
      </mj-text>
      
      <mj-text font-size="14px" color="#475569" line-height="20px" padding-bottom="30px">
        ${prediccion.recomendaciones.map(rec => `• ${rec}`).join('<br/>')}
      </mj-text>
      
      <mj-button background-color="#ea580c" color="white" href="${productoUrl}" 
                 font-size="16px" font-weight="500" padding="15px 30px" border-radius="8px">
        Ver Producto
      </mj-button>
      
      <mj-text font-size="14px" color="#64748b" padding-top="20px">
        Esta predicción se actualiza automáticamente según los movimientos de inventario.
      </mj-text>
    `;

    return {
      nombre: 'stockout-prediction',
      asunto: `🔮 Predicción de Quiebre: ${prediccion.nombre} - ${empresa}`,
      contenidoHtml: this.getBaseTemplate(content),
      contenidoTexto: this.getTextVersion('stockout-prediction', { prediccion, empresa, productoUrl }),
      variables: ['prediccion', 'empresa']
    };
  }

  /**
   * 🌡️ Plantilla de alerta de sensor
   */
  getSensorAlertTemplate(sensor: any, empresa: string): EmailTemplate {
    const dashboardUrl = `${this.baseUrl}/dashboard`;
    
    const getSeverityColor = (severidad: string) => {
      switch (severidad) {
        case 'CRITICA': return '#dc2626';
        case 'ALTA': return '#ea580c';
        case 'MEDIA': return '#d97706';
        default: return '#059669';
      }
    };

    const getSeverityIcon = (tipo: string) => {
      switch (tipo) {
        case 'TEMPERATURA': return '🌡️';
        case 'HUMEDAD': return '💧';
        case 'PRESION': return '📊';
        case 'PESO': return '⚖️';
        default: return '⚠️';
      }
    };
    
    const content = `
      <mj-text font-size="24px" font-weight="600" color="${getSeverityColor(sensor.severidad)}" padding-bottom="20px">
        ${getSeverityIcon(sensor.tipo)} Alerta de Sensor
      </mj-text>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="20px">
        Se ha detectado una condición anómala en el sensor de ${sensor.tipo.toLowerCase()} 
        en ${empresa}.
      </mj-text>
      
      <mj-section background-color="#fef2f2" border-radius="8px" padding="20px" margin="20px 0">
        <mj-column>
          <mj-text font-size="16px" font-weight="600" color="${getSeverityColor(sensor.severidad)}" padding-bottom="10px">
            Detalles de la Alerta:
          </mj-text>
          <mj-text font-size="14px" color="#475569" line-height="20px">
            • <strong>Tipo de sensor:</strong> ${sensor.tipo}<br/>
            • <strong>Valor actual:</strong> ${sensor.valor} ${sensor.unidad}<br/>
            • <strong>Producto afectado:</strong> ${sensor.producto?.nombre || 'N/A'}<br/>
            • <strong>Severidad:</strong> ${sensor.severidad}<br/>
            • <strong>Fecha de detección:</strong> ${new Date().toLocaleString()}
          </mj-text>
        </mj-column>
      </mj-section>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="30px">
        Te recomendamos verificar las condiciones del almacén y tomar las medidas necesarias.
      </mj-text>
      
      <mj-button background-color="${getSeverityColor(sensor.severidad)}" color="white" href="${dashboardUrl}" 
                 font-size="16px" font-weight="500" padding="15px 30px" border-radius="8px">
        Ver Dashboard
      </mj-button>
      
      <mj-text font-size="14px" color="#64748b" padding-top="20px">
        Esta alerta se enviará cada hora mientras persista la condición anómala.
      </mj-text>
    `;

    return {
      nombre: 'sensor-alert',
      asunto: `${getSeverityIcon(sensor.tipo)} Alerta de ${sensor.tipo}: ${empresa}`,
      contenidoHtml: this.getBaseTemplate(content),
      contenidoTexto: this.getTextVersion('sensor-alert', { sensor, empresa, dashboardUrl }),
      variables: ['sensor', 'empresa']
    };
  }

  /**
   * ⏰ Plantilla de producto por caducar
   */
  getExpiryAlertTemplate(producto: any, diasRestantes: number, empresa: string): EmailTemplate {
    const dashboardUrl = `${this.baseUrl}/dashboard`;
    const productoUrl = `${this.baseUrl}/productos/${producto.id}`;
    
    const content = `
      <mj-text font-size="24px" font-weight="600" color="#d97706" padding-bottom="20px">
        ⏰ Producto por Caducar
      </mj-text>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="20px">
        El producto <strong>${producto.nombre}</strong> en ${empresa} 
        está próximo a caducar.
      </mj-text>
      
      <mj-section background-color="#fffbeb" border-radius="8px" padding="20px" margin="20px 0">
        <mj-column>
          <mj-text font-size="16px" font-weight="600" color="#d97706" padding-bottom="10px">
            Información del Producto:
          </mj-text>
          <mj-text font-size="14px" color="#475569" line-height="20px">
            • <strong>Stock actual:</strong> ${producto.stock} unidades<br/>
            • <strong>Días restantes:</strong> ${diasRestantes} días<br/>
            • <strong>Valor del stock:</strong> $${(producto.stock * producto.precioCompra).toFixed(2)}<br/>
            • <strong>Código:</strong> ${producto.codigoBarras || 'N/A'}
          </mj-text>
        </mj-column>
      </mj-section>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="20px">
        <strong>Recomendaciones:</strong>
      </mj-text>
      
      <mj-text font-size="14px" color="#475569" line-height="20px" padding-bottom="30px">
        • Priorizar la venta de este producto<br/>
        • Considerar descuentos para acelerar la rotación<br/>
        • Verificar si se puede devolver al proveedor<br/>
        • Revisar políticas de caducidad
      </mj-text>
      
      <mj-button background-color="#d97706" color="white" href="${productoUrl}" 
                 font-size="16px" font-weight="500" padding="15px 30px" border-radius="8px">
        Ver Producto
      </mj-button>
      
      <mj-text font-size="14px" color="#64748b" padding-top="20px">
        Esta alerta se enviará diariamente hasta que el producto se venda o caduque.
      </mj-text>
    `;

    return {
      nombre: 'expiry-alert',
      asunto: `⏰ Producto por Caducar: ${producto.nombre} - ${empresa}`,
      contenidoHtml: this.getBaseTemplate(content),
      contenidoTexto: this.getTextVersion('expiry-alert', { producto, diasRestantes, empresa, productoUrl }),
      variables: ['producto', 'diasRestantes', 'empresa']
    };
  }

  /**
   * 📊 Plantilla de KPI fuera de rango
   */
  getKPIAlertTemplate(kpi: any, empresa: string): EmailTemplate {
    const dashboardUrl = `${this.baseUrl}/dashboard`;
    
    const content = `
      <mj-text font-size="24px" font-weight="600" color="#7c3aed" padding-bottom="20px">
        📊 KPI Fuera de Rango
      </mj-text>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="20px">
        Se ha detectado que el KPI <strong>${kpi.nombre}</strong> 
        está fuera del rango esperado en ${empresa}.
      </mj-text>
      
      <mj-section background-color="#f3f4f6" border-radius="8px" padding="20px" margin="20px 0">
        <mj-column>
          <mj-text font-size="16px" font-weight="600" color="#7c3aed" padding-bottom="10px">
            Detalles del KPI:
          </mj-text>
          <mj-text font-size="14px" color="#475569" line-height="20px">
            • <strong>Valor actual:</strong> ${kpi.valorActual}<br/>
            • <strong>Rango esperado:</strong> ${kpi.rangoEsperado}<br/>
            • <strong>Desviación:</strong> ${kpi.desviacion}<br/>
            • <strong>Impacto:</strong> ${kpi.impacto}
          </mj-text>
        </mj-column>
      </mj-section>
      
      <mj-text font-size="16px" color="#475569" line-height="24px" padding-bottom="20px">
        <strong>Recomendaciones:</strong>
      </mj-text>
      
      <mj-text font-size="14px" color="#475569" line-height="20px" padding-bottom="30px">
        ${kpi.recomendaciones.map(rec => `• ${rec}`).join('<br/>')}
      </mj-text>
      
      <mj-button background-color="#7c3aed" color="white" href="${dashboardUrl}" 
                 font-size="16px" font-weight="500" padding="15px 30px" border-radius="8px">
        Ver Dashboard
      </mj-button>
      
      <mj-text font-size="14px" color="#64748b" padding-top="20px">
        Esta alerta se enviará una vez por anomalía detectada.
      </mj-text>
    `;

    return {
      nombre: 'kpi-alert',
      asunto: `📊 KPI Fuera de Rango: ${kpi.nombre} - ${empresa}`,
      contenidoHtml: this.getBaseTemplate(content),
      contenidoTexto: this.getTextVersion('kpi-alert', { kpi, empresa, dashboardUrl }),
      variables: ['kpi', 'empresa']
    };
  }

  /**
   * 📄 Versión de texto plano para compatibilidad
   */
  private getTextVersion(templateName: string, variables: any): string {
    switch (templateName) {
      case 'password-reset':
        return `Hola ${variables.nombre},\n\nHemos recibido una solicitud para restablecer tu contraseña en IAM Inventario.\n\nPara restablecer tu contraseña, visita: ${variables.resetUrl}\n\nEste enlace expirará en 1 hora.\n\nSaludos,\nEquipo IAM Inventario`;
      
      case 'welcome':
        return `Hola ${variables.nombre},\n\n¡Bienvenido a IAM Inventario!\n\nTu cuenta ha sido creada exitosamente para ${variables.empresa}.\n\nAccede a tu dashboard: ${variables.dashboardUrl}\n\nSaludos,\nEquipo IAM Inventario`;
      
      case 'stock-critical':
        return `ALERTA: Stock Crítico\n\nProducto: ${variables.producto.nombre}\nStock actual: ${variables.producto.stock}\nStock mínimo: ${variables.producto.stockMinimo}\n\nVer producto: ${variables.productoUrl}\n\nEmpresa: ${variables.empresa}`;
      
      case 'stockout-prediction':
        return `PREDICCIÓN: Quiebre de Stock\n\nProducto: ${variables.prediccion.nombre}\nDías restantes: ${variables.prediccion.diasRestantes}\nProbabilidad: ${Math.round(variables.prediccion.probabilidadQuiebre * 100)}%\n\nVer producto: ${variables.productoUrl}\n\nEmpresa: ${variables.empresa}`;
      
      case 'sensor-alert':
        return `ALERTA DE SENSOR\n\nTipo: ${variables.sensor.tipo}\nValor: ${variables.sensor.valor} ${variables.sensor.unidad}\nProducto: ${variables.sensor.producto?.nombre || 'N/A'}\n\nVer dashboard: ${variables.dashboardUrl}\n\nEmpresa: ${variables.empresa}`;
      
      case 'expiry-alert':
        return `ALERTA: Producto por Caducar\n\nProducto: ${variables.producto.nombre}\nDías restantes: ${variables.diasRestantes}\nStock: ${variables.producto.stock}\n\nVer producto: ${variables.productoUrl}\n\nEmpresa: ${variables.empresa}`;
      
      case 'kpi-alert':
        return `ALERTA: KPI Fuera de Rango\n\nKPI: ${variables.kpi.nombre}\nValor actual: ${variables.kpi.valorActual}\nRango esperado: ${variables.kpi.rangoEsperado}\n\nVer dashboard: ${variables.dashboardUrl}\n\nEmpresa: ${variables.empresa}`;
      
      default:
        return 'Plantilla no encontrada';
    }
  }
} 