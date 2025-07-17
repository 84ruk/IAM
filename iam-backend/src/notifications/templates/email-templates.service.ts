import { Injectable } from '@nestjs/common';
const mjml2html = require('mjml');

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
  getPasswordResetTemplate(resetUrl: string, nombre: string): EmailTemplate {
    
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
   * 📊 Plantilla de reporte semanal del dashboard
   */
  getWeeklyDashboardReportTemplate(data: {
    empresa: string;
    periodo: string;
    kpis: {
      valorInventario: number;
      valorVentas: number;
      margenPromedio: number;
      productosCriticos: number;
      productosSinStock: number;
      productosConStockBajo: number;
      productosConStockOptimo: number;
      productosConStockAlto: number;
    };
    topProductos: Array<{
      nombre: string;
      stock: number;
      stockMinimo: number;
      precioVenta: number;
      movimientos: number;
    }>;
    alertas: Array<{
      tipo: string;
      mensaje: string;
      severidad: 'ALTA' | 'MEDIA' | 'BAJA';
    }>;
  }): EmailTemplate {
    const dashboardUrl = `${this.baseUrl}/dashboard`;
    
    const getSeverityColor = (severidad: string) => {
      switch (severidad) {
        case 'ALTA': return '#dc2626';
        case 'MEDIA': return '#f59e0b';
        case 'BAJA': return '#10b981';
        default: return '#6b7280';
      }
    };

    const getSeverityBgColor = (severidad: string) => {
      switch (severidad) {
        case 'ALTA': return '#fef2f2';
        case 'MEDIA': return '#fffbeb';
        case 'BAJA': return '#f0fdf4';
        default: return '#f8fafc';
      }
    };

    const content = `
      <mj-text font-size="28px" font-weight="700" color="#1e293b" padding-bottom="10px">
        📊 Reporte Semanal - ${data.empresa}
      </mj-text>
      
      <mj-text font-size="16px" color="#64748b" padding-bottom="30px">
        ${data.periodo} | Resumen completo de tu inventario
      </mj-text>

      <!-- KPIs Principales -->
      <mj-section background-color="#ffffff" border-radius="12px" padding="24px" margin="20px 0">
        <mj-column>
          <mj-text font-size="20px" font-weight="600" color="#1e293b" padding-bottom="20px">
            📈 KPIs Principales
          </mj-text>
          
          <mj-table>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 0; width: 50%;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; background-color: #dbeafe; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 20px;">📦</span>
                  </div>
                  <div>
                    <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Valor del Inventario</div>
                    <div style="font-size: 24px; font-weight: 700; color: #1e293b;">$${data.kpis.valorInventario.toLocaleString()}</div>
                  </div>
                </div>
              </td>
              <td style="padding: 12px 0; width: 50%;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; background-color: #dcfce7; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 20px;">📈</span>
                  </div>
                  <div>
                    <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Ventas del Período</div>
                    <div style="font-size: 24px; font-weight: 700; color: #1e293b;">$${data.kpis.valorVentas.toLocaleString()}</div>
                  </div>
                </div>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 0; width: 50%;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; background-color: #f3e8ff; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 20px;">💎</span>
                  </div>
                  <div>
                    <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Margen Promedio</div>
                    <div style="font-size: 24px; font-weight: 700; color: #1e293b;">${data.kpis.margenPromedio.toFixed(1)}%</div>
                  </div>
                </div>
              </td>
              <td style="padding: 12px 0; width: 50%;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; background-color: #fef2f2; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 20px;">⚠️</span>
                  </div>
                  <div>
                    <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Productos Críticos</div>
                    <div style="font-size: 24px; font-weight: 700; color: #1e293b;">${data.kpis.productosCriticos}</div>
                  </div>
                </div>
              </td>
            </tr>
          </mj-table>
        </mj-column>
      </mj-section>

      <!-- Estado del Stock -->
      <mj-section background-color="#ffffff" border-radius="12px" padding="24px" margin="20px 0">
        <mj-column>
          <mj-text font-size="20px" font-weight="600" color="#1e293b" padding-bottom="20px">
            📊 Estado del Stock
          </mj-text>
          
          <mj-table>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Estado</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Cantidad</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Color</th>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 12px; height: 12px; background-color: #dc2626; border-radius: 50%;"></div>
                  <span style="font-weight: 500;">Sin Stock</span>
                </div>
              </td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${data.kpis.productosSinStock}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                <span style="background-color: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">Crítico</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 12px; height: 12px; background-color: #f59e0b; border-radius: 50%;"></div>
                  <span style="font-weight: 500;">Stock Bajo</span>
                </div>
              </td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${data.kpis.productosConStockBajo}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                <span style="background-color: #fffbeb; color: #f59e0b; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">Atención</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 12px; height: 12px; background-color: #10b981; border-radius: 50%;"></div>
                  <span style="font-weight: 500;">Stock Óptimo</span>
                </div>
              </td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${data.kpis.productosConStockOptimo}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                <span style="background-color: #f0fdf4; color: #10b981; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">Bueno</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 12px; height: 12px; background-color: #3b82f6; border-radius: 50%;"></div>
                  <span style="font-weight: 500;">Stock Alto</span>
                </div>
              </td>
              <td style="padding: 12px; text-align: center; font-weight: 600;">${data.kpis.productosConStockAlto}</td>
              <td style="padding: 12px; text-align: center;">
                <span style="background-color: #eff6ff; color: #3b82f6; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">Excelente</span>
              </td>
            </tr>
          </mj-table>
        </mj-column>
      </mj-section>

      <!-- Productos que requieren atención -->
      ${data.topProductos.length > 0 ? `
        <mj-section background-color="#ffffff" border-radius="12px" padding="24px" margin="20px 0">
          <mj-column>
            <mj-text font-size="20px" font-weight="600" color="#1e293b" padding-bottom="20px">
              ⚠️ Productos que Requieren Atención
            </mj-text>
            
            ${data.topProductos.slice(0, 5).map(producto => `
              <mj-section padding="12px 0" border-bottom="1px solid #f1f5f9">
                <mj-column>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${producto.nombre}</div>
                      <div style="font-size: 14px; color: #64748b;">
                        Stock: ${producto.stock} | Mínimo: ${producto.stockMinimo} | Movimientos: ${producto.movimientos}
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: 600; color: #1e293b;">$${producto.precioVenta}</div>
                      <div style="font-size: 12px; color: #64748b;">precio unitario</div>
                    </div>
                  </div>
                </mj-column>
              </mj-section>
            `).join('')}
          </mj-column>
        </mj-section>
      ` : ''}

      <!-- Alertas -->
      ${data.alertas.length > 0 ? `
        <mj-section background-color="#ffffff" border-radius="12px" padding="24px" margin="20px 0">
          <mj-column>
            <mj-text font-size="20px" font-weight="600" color="#1e293b" padding-bottom="20px">
              🚨 Alertas Activas
            </mj-text>
            
            ${data.alertas.map(alerta => `
              <mj-section padding="12px 0" border-bottom="1px solid #f1f5f9">
                <mj-column>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 8px; height: 8px; background-color: ${getSeverityColor(alerta.severidad)}; border-radius: 50%;"></div>
                    <span style="font-weight: 500; color: #1e293b;">${alerta.mensaje}</span>
                  </div>
                </mj-column>
              </mj-section>
            `).join('')}
          </mj-column>
        </mj-section>
      ` : ''}

      <!-- CTA -->
      <mj-section background-color="#f8fafc" border-radius="12px" padding="32px" margin="30px 0">
        <mj-column>
          <mj-text font-size="18px" font-weight="600" color="#1e293b" padding-bottom="12px" align="center">
            ¿Quieres ver más detalles?
          </mj-text>
          <mj-text font-size="14px" color="#64748b" padding-bottom="24px" align="center">
            Accede a tu dashboard para ver análisis completos, gráficos y más métricas
          </mj-text>
          
          <mj-button background-color="#8E94F2" color="white" href="${dashboardUrl}" 
                     font-size="16px" font-weight="600" padding="16px 32px" border-radius="8px"
                     align="center">
            Ver Dashboard Completo
          </mj-button>
        </mj-column>
      </mj-section>
    `;

    return {
      nombre: 'weekly-dashboard-report',
      asunto: `📊 Reporte Semanal - ${data.empresa} | ${data.periodo}`,
      contenidoHtml: this.getBaseTemplate(content),
      contenidoTexto: this.getTextVersion('weekly-dashboard-report', data),
      variables: ['empresa', 'periodo', 'kpis', 'topProductos', 'alertas']
    };
  }

  /**
   * 🎨 Plantilla de alerta de stock mejorada con diseño del dashboard
   */
  getEnhancedStockAlertTemplate(producto: any, empresa: string, alertasRelacionadas?: any[]): EmailTemplate {
    const dashboardUrl = `${this.baseUrl}/dashboard`;
    const productoUrl = `${this.baseUrl}/productos/${producto.id}`;
    
    const getStockStatus = (stock: number, stockMinimo: number) => {
      if (stock === 0) return { status: 'Sin Stock', color: '#dc2626', bgColor: '#fef2f2' };
      if (stock <= stockMinimo) return { status: 'Stock Crítico', color: '#f59e0b', bgColor: '#fffbeb' };
      return { status: 'Stock Bajo', color: '#10b981', bgColor: '#f0fdf4' };
    };

    const stockStatus = getStockStatus(producto.stock, producto.stockMinimo);
    
    const content = `
      <mj-text font-size="28px" font-weight="700" color="#1e293b" padding-bottom="10px">
        ⚠️ Alerta de Stock - ${empresa}
      </mj-text>
      
      <mj-text font-size="16px" color="#64748b" padding-bottom="30px">
        Se ha detectado una situación crítica en tu inventario
      </mj-text>

      <!-- Producto Crítico -->
      <mj-section background-color="#ffffff" border-radius="12px" padding="24px" margin="20px 0">
        <mj-column>
          <mj-text font-size="20px" font-weight="600" color="#1e293b" padding-bottom="20px">
            📦 Producto Afectado
          </mj-text>
          
          <mj-section background-color="${stockStatus.bgColor}" border-radius="8px" padding="20px" margin="20px 0">
            <mj-column>
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 60px; height: 60px; background-color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <span style="font-size: 24px;">📦</span>
                </div>
                <div style="flex: 1;">
                  <div style="font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 8px;">${producto.nombre}</div>
                  <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">
                    Código: ${producto.codigoBarras || 'N/A'} | Proveedor: ${producto.proveedor?.nombre || 'No asignado'}
                  </div>
                  <div style="font-size: 14px; color: #64748b;">
                    Precio: $${producto.precioVenta} | Categoría: ${producto.etiqueta || 'Sin categoría'}
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="background-color: ${stockStatus.color}; color: white; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                    ${stockStatus.status}
                  </span>
                </div>
              </div>
            </mj-column>
          </mj-section>

          <!-- Métricas del Producto -->
          <mj-table>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Métrica</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Valor Actual</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Mínimo Recomendado</th>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">Stock Disponible</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: ${producto.stock <= producto.stockMinimo ? '#dc2626' : '#10b981'};">${producto.stock} unidades</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${producto.stockMinimo} unidades</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">Valor en Inventario</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600;">$${(producto.stock * producto.precioVenta).toLocaleString()}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600;">$${(producto.stockMinimo * producto.precioVenta).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: 500;">Últimos Movimientos</td>
              <td style="padding: 12px; text-align: center; font-weight: 600;">${producto.movimientos || 0} salidas</td>
              <td style="padding: 12px; text-align: center; font-weight: 600;">-</td>
            </tr>
          </mj-table>
        </mj-column>
      </mj-section>

      <!-- Recomendaciones -->
      <mj-section background-color="#f0fdf4" border-radius="12px" padding="24px" margin="20px 0">
        <mj-column>
          <mj-text font-size="18px" font-weight="600" color="#1e293b" padding-bottom="16px">
            💡 Recomendaciones
          </mj-text>
          
          <mj-text font-size="14px" color="#374151" line-height="20px" padding-bottom="12px">
            • <strong>Reabastecimiento urgente:</strong> Contacta a tu proveedor para solicitar ${producto.stockMinimo - producto.stock} unidades adicionales
          </mj-text>
          
          <mj-text font-size="14px" color="#374151" line-height="20px" padding-bottom="12px">
            • <strong>Revisa la demanda:</strong> Analiza si necesitas ajustar el stock mínimo basado en las ventas recientes
          </mj-text>
          
          <mj-text font-size="14px" color="#374151" line-height="20px" padding-bottom="12px">
            • <strong>Monitoreo:</strong> Activa alertas automáticas para este producto
          </mj-text>
        </mj-column>
      </mj-section>

      ${alertasRelacionadas && alertasRelacionadas.length > 0 ? `
        <!-- Otras Alertas -->
        <mj-section background-color="#ffffff" border-radius="12px" padding="24px" margin="20px 0">
          <mj-column>
            <mj-text font-size="18px" font-weight="600" color="#1e293b" padding-bottom="16px">
              🔍 Otras Alertas Relacionadas
            </mj-text>
            
            ${alertasRelacionadas.slice(0, 3).map(alerta => `
              <mj-section padding="8px 0" border-bottom="1px solid #f1f5f9">
                <mj-column>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 8px; height: 8px; background-color: #f59e0b; border-radius: 50%;"></div>
                    <span style="font-size: 14px; color: #374151;">${alerta.mensaje}</span>
                  </div>
                </mj-column>
              </mj-section>
            `).join('')}
          </mj-column>
        </mj-section>
      ` : ''}

      <!-- Acciones -->
      <mj-section background-color="#f8fafc" border-radius="12px" padding="32px" margin="30px 0">
        <mj-column>
          <mj-text font-size="18px" font-weight="600" color="#1e293b" padding-bottom="12px" align="center">
            Acciones Rápidas
          </mj-text>
          
          <mj-button background-color="#8E94F2" color="white" href="${productoUrl}" 
                     font-size="16px" font-weight="600" padding="16px 32px" border-radius="8px"
                     align="center" margin-bottom="16px">
            Ver Detalles del Producto
          </mj-button>
          
          <mj-button background-color="#10b981" color="white" href="${dashboardUrl}" 
                     font-size="16px" font-weight="600" padding="16px 32px" border-radius="8px"
                     align="center">
            Ir al Dashboard
          </mj-button>
        </mj-column>
      </mj-section>
    `;

    return {
      nombre: 'enhanced-stock-alert',
      asunto: `⚠️ Alerta de Stock: ${producto.nombre} - ${empresa}`,
      contenidoHtml: this.getBaseTemplate(content),
      contenidoTexto: this.getTextVersion('enhanced-stock-alert', { producto, empresa }),
      variables: ['producto', 'empresa', 'alertasRelacionadas']
    };
  }

  /**
   * 📈 Plantilla de reporte de inventario mensual
   */
  getInventoryReportTemplate(data: {
    empresa: string;
    mes: string;
    resumen: {
      totalProductos: number;
      productosActivos: number;
      productosInactivos: number;
      valorTotalInventario: number;
      productosConStockBajo: number;
      productosSinStock: number;
    };
    topProductos: Array<{
      nombre: string;
      stock: number;
      precioVenta: number;
      valorInventario: number;
      movimientos: number;
    }>;
    categorias: Array<{
      nombre: string;
      cantidad: number;
      valor: number;
      porcentaje: number;
    }>;
    tendencias: Array<{
      fecha: string;
      valor: number;
    }>;
  }): EmailTemplate {
    const dashboardUrl = `${this.baseUrl}/dashboard`;
    
    const content = `
      <mj-text font-size="28px" font-weight="700" color="#1e293b" padding-bottom="10px">
        📈 Reporte de Inventario - ${data.empresa}
      </mj-text>
      
      <mj-text font-size="16px" color="#64748b" padding-bottom="30px">
        ${data.mes} | Análisis completo del inventario
      </mj-text>

      <!-- Resumen Ejecutivo -->
      <mj-section background-color="#ffffff" border-radius="12px" padding="24px" margin="20px 0">
        <mj-column>
          <mj-text font-size="20px" font-weight="600" color="#1e293b" padding-bottom="20px">
            📊 Resumen Ejecutivo
          </mj-text>
          
          <mj-table>
            <tr>
              <td style="padding: 12px 0; width: 50%;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; background-color: #dbeafe; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 20px;">📦</span>
                  </div>
                  <div>
                    <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Total Productos</div>
                    <div style="font-size: 24px; font-weight: 700; color: #1e293b;">${data.resumen.totalProductos}</div>
                  </div>
                </div>
              </td>
              <td style="padding: 12px 0; width: 50%;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; background-color: #dcfce7; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 20px;">💰</span>
                  </div>
                  <div>
                    <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Valor Total</div>
                    <div style="font-size: 24px; font-weight: 700; color: #1e293b;">$${data.resumen.valorTotalInventario.toLocaleString()}</div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; width: 50%;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; background-color: #fef2f2; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 20px;">⚠️</span>
                  </div>
                  <div>
                    <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Stock Bajo</div>
                    <div style="font-size: 24px; font-weight: 700; color: #1e293b;">${data.resumen.productosConStockBajo}</div>
                  </div>
                </div>
              </td>
              <td style="padding: 12px 0; width: 50%;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; background-color: #fef3c7; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 20px;">❌</span>
                  </div>
                  <div>
                    <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Sin Stock</div>
                    <div style="font-size: 24px; font-weight: 700; color: #1e293b;">${data.resumen.productosSinStock}</div>
                  </div>
                </div>
              </td>
            </tr>
          </mj-table>
        </mj-column>
      </mj-section>

      <!-- Top Productos por Valor -->
      <mj-section background-color="#ffffff" border-radius="12px" padding="24px" margin="20px 0">
        <mj-column>
          <mj-text font-size="20px" font-weight="600" color="#1e293b" padding-bottom="20px">
            🏆 Top Productos por Valor en Inventario
          </mj-text>
          
          ${data.topProductos.slice(0, 5).map((producto, index) => `
            <mj-section padding="12px 0" border-bottom="1px solid #f1f5f9">
              <mj-column>
                <div style="display: flex; align-items: center; gap: 16px;">
                  <div style="width: 32px; height: 32px; background-color: ${index < 3 ? '#fbbf24' : '#e5e7eb'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">
                    ${index + 1}
                  </div>
                  <div style="flex: 1;">
                    <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${producto.nombre}</div>
                    <div style="font-size: 14px; color: #64748b;">
                      Stock: ${producto.stock} | Precio: $${producto.precioVenta} | Movimientos: ${producto.movimientos}
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-weight: 600; color: #1e293b; font-size: 18px;">$${producto.valorInventario.toLocaleString()}</div>
                    <div style="font-size: 12px; color: #64748b;">valor total</div>
                  </div>
                </div>
              </mj-column>
            </mj-section>
          `).join('')}
        </mj-column>
      </mj-section>

      <!-- Distribución por Categorías -->
      <mj-section background-color="#ffffff" border-radius="12px" padding="24px" margin="20px 0">
        <mj-column>
          <mj-text font-size="20px" font-weight="600" color="#1e293b" padding-bottom="20px">
            📂 Distribución por Categorías
          </mj-text>
          
          ${data.categorias.slice(0, 6).map(categoria => `
            <mj-section padding="12px 0" border-bottom="1px solid #f1f5f9">
              <mj-column>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${categoria.nombre}</div>
                    <div style="font-size: 14px; color: #64748b;">${categoria.cantidad} productos</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-weight: 600; color: #1e293b;">$${categoria.valor.toLocaleString()}</div>
                    <div style="font-size: 12px; color: #64748b;">${categoria.porcentaje.toFixed(1)}% del total</div>
                  </div>
                </div>
              </mj-column>
            </mj-section>
          `).join('')}
        </mj-column>
      </mj-section>

      <!-- CTA -->
      <mj-section background-color="#f8fafc" border-radius="12px" padding="32px" margin="30px 0">
        <mj-column>
          <mj-text font-size="18px" font-weight="600" color="#1e293b" padding-bottom="12px" align="center">
            ¿Necesitas más detalles?
          </mj-text>
          <mj-text font-size="14px" color="#64748b" padding-bottom="24px" align="center">
            Accede a tu dashboard para ver gráficos interactivos, tendencias y análisis avanzados
          </mj-text>
          
          <mj-button background-color="#8E94F2" color="white" href="${dashboardUrl}" 
                     font-size="16px" font-weight="600" padding="16px 32px" border-radius="8px"
                     align="center">
            Ver Dashboard Completo
          </mj-button>
        </mj-column>
      </mj-section>
    `;

    return {
      nombre: 'inventory-report',
      asunto: `📈 Reporte de Inventario - ${data.empresa} | ${data.mes}`,
      contenidoHtml: this.getBaseTemplate(content),
      contenidoTexto: this.getTextVersion('inventory-report', data),
      variables: ['empresa', 'mes', 'resumen', 'topProductos', 'categorias', 'tendencias']
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
      
      case 'weekly-dashboard-report':
        return `Hola,\n\nAdjunto el reporte semanal de tu inventario para el período ${variables.periodo} en ${variables.empresa}.\n\nKPIs Principales:\nValor del Inventario: $${variables.kpis.valorInventario.toLocaleString()}\nVentas del Período: $${variables.kpis.valorVentas.toLocaleString()}\nMargen Promedio: ${variables.kpis.margenPromedio.toFixed(1)}%\nProductos Críticos: ${variables.kpis.productosCriticos}\n\nEstado del Stock:\nSin Stock: ${variables.kpis.productosSinStock}\nStock Bajo: ${variables.kpis.productosConStockBajo}\nStock Óptimo: ${variables.kpis.productosConStockOptimo}\nStock Alto: ${variables.kpis.productosConStockAlto}\n\nProductos que requieren atención:\n${variables.topProductos.map(p => `- ${p.nombre}: Stock ${p.stock}, Mínimo ${p.stockMinimo}, Movimientos ${p.movimientos}`).join('\n')}\n\nAlertas Activas:\n${variables.alertas.map(a => `- ${a.mensaje} (Severidad: ${a.severidad})`).join('\n')}\n\nAccede a tu dashboard para ver más detalles: ${variables.dashboardUrl}\n\nSaludos,\nEquipo IAM Inventario`;
      
      case 'enhanced-stock-alert':
        return `ALERTA DE STOCK MEJORADA\n\nProducto: ${variables.producto.nombre}\nEmpresa: ${variables.empresa}\n\nStock Disponible: ${variables.producto.stock} unidades\nValor en Inventario: $${(variables.producto.stock * variables.producto.precioVenta).toLocaleString()}\n\nRecomendaciones:\n- Reabastecimiento urgente: Contacta a tu proveedor para solicitar ${variables.producto.stockMinimo - variables.producto.stock} unidades adicionales\n- Revisa la demanda: Analiza si necesitas ajustar el stock mínimo basado en las ventas recientes\n- Monitoreo: Activa alertas automáticas para este producto\n\nOtras Alertas Relacionadas:\n${variables.alertasRelacionadas ? variables.alertasRelacionadas.map(a => `- ${a.mensaje}`).join('\n') : 'Ninguna'}`;
      
      case 'inventory-report':
        return `Hola,\n\nAdjunto el reporte de inventario mensual de ${variables.empresa} para el mes de ${variables.mes}.\n\nResumen Ejecutivo:\nTotal Productos: ${variables.resumen.totalProductos}\nValor Total: $${variables.resumen.valorTotalInventario.toLocaleString()}\nStock Bajo: ${variables.resumen.productosConStockBajo}\nSin Stock: ${variables.resumen.productosSinStock}\n\nTop Productos por Valor:\n${variables.topProductos.map((p, i) => `${i + 1}. ${p.nombre}: Stock ${p.stock}, Precio $${p.precioVenta}, Movimientos ${p.movimientos}, Valor Total $${p.valorInventario.toLocaleString()}`).join('\n')}\n\nDistribución por Categorías:\n${variables.categorias.map(c => `${c.nombre}: ${c.cantidad} productos, $${c.valor.toLocaleString()}, ${c.porcentaje.toFixed(1)}% del total`).join('\n')}\n\nTendencias:\n${variables.tendencias.map(t => `${t.fecha}: ${t.valor}`).join('\n')}\n\nAccede a tu dashboard para ver gráficos interactivos, tendencias y análisis avanzados: ${variables.dashboardUrl}\n\nSaludos,\nEquipo IAM Inventario`;
      
      default:
        return 'Plantilla no encontrada';
    }
  }
} 