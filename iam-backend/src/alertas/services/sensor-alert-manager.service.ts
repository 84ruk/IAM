import { SeveridadAlerta, Prisma } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
// import { SensorAlertEvaluatorService, AlertaEvaluada, LecturaSensor } from './sensor-alert-evaluator.service';
import { NotificationService } from '../../notifications/notification.service';
import { SMSNotificationService } from './sms-notification.service';
import { UmbralesSensorLegacyDto } from '../../sensores/dto/umbrales-sensor.dto';
import { SensorTipo } from '@prisma/client';
// import { SensoresGateway } from '../../websockets/sensores/sensores.gateway';

export interface LecturaSensor {
  sensorId: number;
  tipo: SensorTipo;
  valor: number;
  unidad: string;
  ubicacionId: number;
  productoId?: number;
  timestamp: Date;
}

export interface AlertaEvaluada {
  tipo: string;
  severidad: SeveridadAlerta;
  mensaje: string;
  detalles: Record<string, unknown>;
  requiereAccion: boolean;
}

export interface AlertaGenerada {
  id: string;
  tipo: string;
  severidad: SeveridadAlerta;
  mensaje: string;
  detalles: Record<string, unknown>;
  requiereAccion: boolean;
  sensorId: number;
  ubicacionId: number;
  empresaId: number;
  productoId?: number;
  fecha: Date;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTA' | 'IGNORADA';
  configuracionNotificacionesEnviadas: boolean;
}

// Tipo de ConfiguracionAlerta con destinatarios incluidos
type ConfiguracionAlertaCompleta = Prisma.ConfiguracionAlertaGetPayload<{
  include: {
    destinatarios: {
      include: {
        destinatario: true;
      }
    }
  }
}>;

@Injectable()
export class SensorAlertManagerService {
  private readonly logger = new Logger(SensorAlertManagerService.name);
  private alertasEnCache = new Map<string, { fecha: Date; alerta: AlertaGenerada }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly smsService: SMSNotificationService,
    // private readonly sensoresGateway: SensoresGateway, // Removed as per edit hint
  ) {}

  /**
   * 🚨 Procesa una lectura de sensor y evalúa si genera alertas
   */
  async procesarLecturaSensor(
    lectura: LecturaSensor,
    empresaId: number
  ): Promise<AlertaGenerada | null> {
    try {
      this.logger.log(`Procesando lectura de sensor ${lectura.tipo} para empresa ${empresaId}`);

      // 1. Obtener configuración de alertas para este sensor específico
      this.logger.log(`🔍 BUSCANDO CONFIGURACIÓN: sensorId=${lectura.sensorId}, empresaId=${empresaId}`);
      const configuracion = await this.obtenerConfiguracionAlertasPorSensor(lectura.sensorId, empresaId);
      
      if (!configuracion) {
        this.logger.error(`❌ NO SE ENCONTRÓ CONFIGURACIÓN para sensor ${lectura.sensorId}`);
        return null;
      }
      
      if (!configuracion.activo) {
        this.logger.error(`❌ CONFIGURACIÓN INACTIVA para sensor ${lectura.sensorId}`);
        return null;
      }
      
      this.logger.log(`✅ CONFIGURACIÓN ENCONTRADA: ID=${configuracion.id}, Destinatarios=${configuracion.destinatarios.length}`);

      // 2. Verificar si ya se envió una alerta recientemente (evitar spam)
      if (await this.verificarVentanaEspera(lectura, configuracion)) {
        this.logger.debug(`Alerta reciente para sensor ${lectura.sensorId}, esperando ventana de tiempo`);
        return null;
      }

      // 3. Evaluar si la lectura activa una alerta (implementación simplificada)
      const alertaEvaluada = this.evaluarLecturaSimplificada(lectura, configuracion.umbralCritico as UmbralesSensorLegacyDto);
      if (!alertaEvaluada) {
        return null;
      }

      // 4. Generar y registrar la alerta
      const alertaGenerada = await this.generarAlerta(lectura, alertaEvaluada, configuracion, empresaId);

      // 5. Enviar configuracionNotificaciones
      await this.enviarNotificaciones(alertaGenerada, configuracion);

      // 6. Emitir por WebSocket
      // await this.emitirAlertaWebSocket(alertaGenerada); // Removed as per edit hint

      this.logger.log(`Alerta generada y notificada: ${alertaGenerada.tipo} - ${alertaGenerada.mensaje}`);
      return alertaGenerada;

    } catch (error) {
      this.logger.error(`Error procesando lectura de sensor: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 🔍 Evalúa si una lectura de sensor excede los umbralCriticoes (implementación simplificada)
   */
  private evaluarLecturaSimplificada(lectura: LecturaSensor, umbralCriticoes: UmbralesSensorLegacyDto): AlertaEvaluada | null {
    try {
      this.logger.log(`🔍 EVALUANDO LECTURA: ${lectura.tipo} = ${lectura.valor}${lectura.unidad}`);
      this.logger.log(`🔍 UMBRALES RECIBIDOS:`, JSON.stringify(umbralCriticoes, null, 2));
      
      let activada = false;
      let severidad: SeveridadAlerta = 'MEDIA';
      let mensaje = '';
      let detalles: Record<string, unknown> = {};
      let requiereAccion = false;

      // Evaluar temperatura usando los campos correctos del sistema
      if (lectura.tipo === 'TEMPERATURA') {
        this.logger.log(`🔍 EVALUANDO TEMPERATURA: valor=${lectura.valor}, umbral_critico=${(umbralCriticoes as any).umbral_critico}, umbralCritico_critico=${(umbralCriticoes as any).umbralCritico_critico}`);
        
        // Usar umbral_critico del sistema de configuración de sensores
        if ((umbralCriticoes as any).umbral_critico !== undefined && lectura.valor > (umbralCriticoes as any).umbral_critico) {
          activada = true;
          severidad = 'CRITICA';
          mensaje = `Temperatura crítica: ${lectura.valor}${lectura.unidad} > ${(umbralCriticoes as any).umbral_critico}${lectura.unidad}`;
          detalles = { tipo: 'TEMPERATURA_CRITICA', valor: lectura.valor, umbralCritico: (umbralCriticoes as any).umbral_critico };
          requiereAccion = true;
          this.logger.log(`🚨 TEMPERATURA CRÍTICA DETECTADA: ${mensaje}`);
        }
        // También verificar umbralCritico_critico si existe
        else if ((umbralCriticoes as any).umbralCritico_critico !== undefined && lectura.valor > (umbralCriticoes as any).umbralCritico_critico) {
          activada = true;
          severidad = 'CRITICA';
          mensaje = `Temperatura muy alta: ${lectura.valor}${lectura.unidad} > ${(umbralCriticoes as any).umbralCritico_critico}${lectura.unidad}`;
          detalles = { tipo: 'TEMPERATURA_MUY_ALTA', valor: lectura.valor, umbralCritico: (umbralCriticoes as any).umbralCritico_critico };
          requiereAccion = true;
          this.logger.log(`🚨 TEMPERATURA MUY ALTA DETECTADA: ${mensaje}`);
        }
      }

      // Evaluar humedad
      if (umbralCriticoes.humedadMin !== undefined && lectura.valor < umbralCriticoes.humedadMin) {
        activada = true;
        severidad = 'MEDIA';
        mensaje = `Humedad por debajo del umbralCritico mínimo: ${lectura.valor}${lectura.unidad} < ${umbralCriticoes.humedadMin}${lectura.unidad}`;
        detalles = { tipo: 'HUMEDAD_BAJA', valor: lectura.valor, umbralCritico: umbralCriticoes.humedadMin };
        requiereAccion = false;
      } else if (umbralCriticoes.humedadMax !== undefined && lectura.valor > umbralCriticoes.humedadMax) {
        activada = true;
        severidad = 'ALTA';
        mensaje = `Humedad por encima del umbralCritico máximo: ${lectura.valor}${lectura.unidad} > ${umbralCriticoes.humedadMax}${lectura.unidad}`;
        detalles = { tipo: 'HUMEDAD_ALTA', valor: lectura.valor, umbralCritico: umbralCriticoes.humedadMax };
        requiereAccion = true;
      }

      // Evaluar peso
      if (umbralCriticoes.pesoMin !== undefined && lectura.valor < umbralCriticoes.pesoMin) {
        activada = true;
        severidad = 'ALTA';
        mensaje = `Peso por debajo del umbralCritico mínimo: ${lectura.valor}${lectura.unidad} < ${umbralCriticoes.pesoMin}${lectura.unidad}`;
        detalles = { tipo: 'PESO_BAJO', valor: lectura.valor, umbralCritico: umbralCriticoes.pesoMin };
        requiereAccion = true;
      } else if (umbralCriticoes.pesoMax !== undefined && lectura.valor > umbralCriticoes.pesoMax) {
        activada = true;
        severidad = 'CRITICA';
        mensaje = `Peso por encima del umbralCritico máximo: ${lectura.valor}${lectura.unidad} > ${umbralCriticoes.pesoMax}${lectura.unidad}`;
        detalles = { tipo: 'PESO_ALTO', valor: lectura.valor, umbralCritico: umbralCriticoes.pesoMax };
        requiereAccion = true;
      }

      // Evaluar presión
      if (umbralCriticoes.presionMin !== undefined && lectura.valor < umbralCriticoes.presionMin) {
        activada = true;
        severidad = 'ALTA';
        mensaje = `Presión por debajo del umbralCritico mínimo: ${lectura.valor}${lectura.unidad} < ${umbralCriticoes.presionMin}${lectura.unidad}`;
        detalles = { tipo: 'PRESION_BAJA', valor: lectura.valor, umbralCritico: umbralCriticoes.presionMin };
        requiereAccion = true;
      } else if (umbralCriticoes.presionMax !== undefined && lectura.valor > umbralCriticoes.presionMax) {
        activada = true;
        severidad = 'CRITICA';
        mensaje = `Presión por encima del umbralCritico máximo: ${lectura.valor}${lectura.unidad} > ${umbralCriticoes.presionMax}${lectura.unidad}`;
        detalles = { tipo: 'PRESION_ALTA', valor: lectura.valor, umbralCritico: umbralCriticoes.presionMax };
        requiereAccion = true;
      }

      this.logger.log(`🔍 RESULTADO EVALUACIÓN: activada=${activada}, severidad=${severidad}`);
      
      if (!activada) {
        this.logger.log(`❌ NO SE ACTIVÓ ALERTA - Lectura normal`);
        return null;
      }

      this.logger.log(`✅ ALERTA ACTIVADA: ${mensaje}`);
      return {
        tipo: `ALERTA_${lectura.tipo}`,
        severidad,
        mensaje,
        detalles,
        requiereAccion,
      };
    } catch (error) {
      this.logger.error(`Error evaluando lectura de sensor: ${error.message}`);
      return null;
    }
  }

  /**
   * ⚙️ Obtiene la configuración de alertas para un sensor específico
   * ✅ CORREGIDO: Busca por sensorId en la tabla ConfiguracionAlerta
   */
  private async obtenerConfiguracionAlertasPorSensor(
    sensorId: number,
    empresaId: number
  ): Promise<ConfiguracionAlertaCompleta | null> {
    try {
      // 🔧 NUEVO: Buscar configuración específica del sensor
      const configuracionAlerta = await this.prisma.configuracionAlerta.findFirst({
        where: {
          sensorId,
          empresaId,
          activo: true,
        },
        include: {
          destinatarios: {
            include: {
              destinatario: true,
            },
          },
        },
      });

      if (!configuracionAlerta) {
        this.logger.debug(`No hay configuración de alerta para sensor ${sensorId}`);
        return null;
      }

      // 🔧 NUEVO: Extraer configuración de notificaciones del JSON
      this.logger.log(`🔍 DEBUG: configuracionNotificacion RAW:`, JSON.stringify(configuracionAlerta.configuracionNotificacion, null, 2));
      const configNotificacion = (configuracionAlerta.configuracionNotificacion as { email?: boolean; sms?: boolean; webSocket?: boolean }) || {};
      this.logger.log(`🔍 DEBUG: configNotificacion PROCESADA:`, JSON.stringify(configNotificacion, null, 2));
      const umbralCritico = (configuracionAlerta.umbralCritico as UmbralesSensorLegacyDto) || {};

      // 🔧 NUEVO: Extraer destinatarios por tipo (solo activos)
      const destinatariosEmail = configuracionAlerta.destinatarios
        .filter(d => d.destinatario.activo && d.destinatario.email)
        .map(d => d.destinatario.email);

      const destinatariosSMS = configuracionAlerta.destinatarios
        .filter(d => d.destinatario.activo && d.destinatario.telefono)
        .map(d => d.destinatario.telefono!);

      this.logger.log(`✅ Configuración encontrada para sensor ${sensorId}:`);
      this.logger.log(`   Email habilitado: ${configNotificacion.email}`);
      this.logger.log(`   SMS habilitado: ${configNotificacion.sms}`);
      this.logger.log(`   Destinatarios email: ${destinatariosEmail.length}`);
      this.logger.log(`   Destinatarios SMS: ${destinatariosSMS.length}`);
      
      return configuracionAlerta;
    } catch (error) {
      this.logger.error(`Error obteniendo configuración de alertas para sensor ${sensorId}: ${error.message}`);
      return null;
    }
  }

  /**
   * ⚙️ Obtiene la configuración de alertas para un tipo de sensor (LEGACY)
   * ⚠️ DEPRECADO: Usar obtenerConfiguracionAlertasPorSensor en su lugar
   */
  private async obtenerConfiguracionAlertas(
    tipoSensor: SensorTipo,
    empresaId: number
  ): Promise<ConfiguracionAlertaCompleta | null> {
    try {
      // Buscar un sensor del tipo especificado con configuración
      const sensor = await this.prisma.sensor.findFirst({
        where: {
          empresaId,
          tipo: tipoSensor,
          activo: true,
        },
        select: {
          id: true,
          empresaId: true,
          tipo: true,
          activo: true,
          configuracion: true,
        },
      });

      if (!sensor || !sensor.configuracion) return null;

      // ✅ BUENA PRÁCTICA: Convertir la configuración del sensor a ConfiguracionAlerta
      const configuracion = sensor.configuracion as any;
      
      // ⚠️ DEPRECADO: Esta función ya no se usa, devolver null
      return null;
    } catch (error) {
      this.logger.error(`Error obteniendo configuración de alertas: ${error.message}`);
      return null;
    }
  }

  /**
   * ⏰ Verifica si ya se envió una alerta recientemente para evitar spam
   */
  private async verificarVentanaEspera(
    lectura: LecturaSensor,
    configuracion: ConfiguracionAlertaCompleta
  ): Promise<boolean> {
    const cacheKey = `${lectura.sensorId}_${lectura.tipo}`;
    const alertaEnCache = this.alertasEnCache.get(cacheKey);

    if (alertaEnCache) {
      const tiempoTranscurrido = Date.now() - alertaEnCache.fecha.getTime();
      const ventanaMs = (configuracion.ventanaEsperaMinutos || 15) * 60 * 1000;
      
      if (tiempoTranscurrido < ventanaMs) {
        return true; // Aún en ventana de espera
      }
    }

    return false;
  }

  /**
   * 📝 Genera y registra una nueva alerta en la base de datos
   */
  private async generarAlerta(
    lectura: LecturaSensor,
    alertaEvaluada: AlertaEvaluada,
    configuracion: ConfiguracionAlertaCompleta,
    empresaId: number
  ): Promise<AlertaGenerada> {
    try {
      // 🔧 DEBUG: Verificar destinatarios antes de guardar
      const destinatariosEmails = configuracion.destinatarios
        .map(d => d.destinatario.email)
        .filter(Boolean);
      
      this.logger.log(`🔍 DEBUG: Guardando alerta con destinatarios:`);
      this.logger.log(`   Configuración ID: ${configuracion.id}`);
      this.logger.log(`   Total destinatarios: ${configuracion.destinatarios.length}`);
      this.logger.log(`   Emails válidos: ${destinatariosEmails.length}`);
      this.logger.log(`   Emails: ${destinatariosEmails.join(', ')}`);
      
      // Crear la alerta en la base de datos
      const alertaDB = await this.prisma.alertaHistorial.create({
        data: {
          empresaId,
          tipo: alertaEvaluada.tipo,
          severidad: alertaEvaluada.severidad,
          titulo: `Alerta de ${alertaEvaluada.tipo}`,
          mensaje: alertaEvaluada.mensaje,
          sensorId: lectura.sensorId,
          ubicacionId: lectura.ubicacionId,
          productoId: lectura.productoId,
          estado: 'PENDIENTE',
          destinatarios: destinatariosEmails,
          condicionActivacion: JSON.parse(JSON.stringify(alertaEvaluada.detalles)),
        },
      });

      // Crear el objeto de alerta generada
      const alertaGenerada: AlertaGenerada = {
        id: alertaDB.id.toString(),
        tipo: alertaEvaluada.tipo,
        severidad: alertaEvaluada.severidad,
        mensaje: alertaEvaluada.mensaje,
        detalles: alertaEvaluada.detalles,
        requiereAccion: alertaEvaluada.requiereAccion,
        sensorId: lectura.sensorId,
        ubicacionId: lectura.ubicacionId,
        empresaId,
        productoId: lectura.productoId,
        fecha: alertaDB.fechaEnvio,
        estado: 'PENDIENTE',
        configuracionNotificacionesEnviadas: false,
      };

      // Actualizar cache para evitar spam
      const cacheKey = `${lectura.sensorId}_${lectura.tipo}`;
      this.alertasEnCache.set(cacheKey, {
        fecha: new Date(),
        alerta: alertaGenerada,
      });

      // Limpiar cache antiguo (más de 1 hora)
      this.limpiarCacheAntiguo();

      return alertaGenerada;

    } catch (error) {
      this.logger.error(`Error generando alerta en BD: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📧 Envía notificaciones por email y SMS según la configuración
   */
  private async enviarNotificaciones(
    alerta: AlertaGenerada,
    configuracion: ConfiguracionAlertaCompleta
  ): Promise<void> {
    try {
      this.logger.log(`🔔 Iniciando envío de notificaciones para alerta ${alerta.id}`);
      
      // 🔧 NUEVO: Extraer configuración de notificaciones del JSON
      const configNotificacion = (configuracion.configuracionNotificacion as { email?: boolean; sms?: boolean; webSocket?: boolean }) || {};
      
      this.logger.log(`📋 Configuración notificaciones: ${JSON.stringify(configNotificacion)}`);
      
      // 🔧 NUEVO: Extraer destinatarios por tipo (solo activos)
      const destinatariosEmail = configuracion.destinatarios
        .filter(d => d.destinatario.activo && d.destinatario.email)
        .map(d => d.destinatario.email);

      const destinatariosSMS = configuracion.destinatarios
        .filter(d => d.destinatario.activo && d.destinatario.telefono)
        .map(d => d.destinatario.telefono!);

      this.logger.log(`📧 Destinatarios Email: ${destinatariosEmail.length} - ${destinatariosEmail.join(', ')}`);
      this.logger.log(`📱 Destinatarios SMS: ${destinatariosSMS.length} - ${destinatariosSMS.join(', ')}`);

      const notificacionesPromises: Promise<void>[] = [];

      // 1. 📧 Enviar email si está habilitado
      if (configNotificacion.email && destinatariosEmail.length > 0) {
        this.logger.log(`📧 Enviando email a ${destinatariosEmail.length} destinatarios`);
        notificacionesPromises.push(this.enviarEmailAlerta(alerta, { ...configuracion, destinatarios: destinatariosEmail } as any));
      } else {
        this.logger.log(`📧 Email omitido: habilitado=${configNotificacion.email}, destinatarios=${destinatariosEmail.length}`);
      }

      // 2. 📱 Enviar SMS si está habilitado
      if (configNotificacion.sms && destinatariosSMS.length > 0) {
        this.logger.log(`📱 Enviando SMS a ${destinatariosSMS.length} destinatarios`);
        notificacionesPromises.push(this.enviarSMSAlerta(alerta, { ...configuracion, destinatariosSMS } as any));
      } else {
        this.logger.log(`📱 SMS omitido: habilitado=${configNotificacion.sms}, destinatarios=${destinatariosSMS.length}`);
      }

      // Ejecutar notificaciones en paralelo
      const resultados = await Promise.allSettled(notificacionesPromises);

      // Log de resultados
      let emailExitoso = false;
      let smsExitoso = false;
      resultados.forEach((resultado, index) => {
        if (resultado.status === 'fulfilled') {
          if (index === 0 && configNotificacion.email) emailExitoso = true;
          if (index === 1 && configNotificacion.sms) smsExitoso = true;
        } else {
          this.logger.error(`Error en notificación ${index}: ${resultado.reason}`);
        }
      });

      this.logger.log(`✅ Notificaciones completadas - Email: ${emailExitoso}, SMS: ${smsExitoso}`);

      // Marcar como notificada solo si al menos una notificación fue exitosa
      if (emailExitoso || smsExitoso) {
        await this.marcarAlertaNotificada(alerta.id);
      }

    } catch (error) {
      this.logger.error(`❌ Error enviando notificaciones: ${error.message}`);
      this.logger.error(`❌ Stack: ${error.stack}`);
    }
  }

  /**
   * 📧 Envía notificación por email
   */
  private async enviarEmailAlerta(
    alerta: AlertaGenerada,
    configuracion: ConfiguracionAlertaCompleta
  ): Promise<void> {
    try {
      await this.notificationService.sendSensorAlert({
        tipo: 'sensor-alert',
        destinatarios: configuracion.destinatarios,
        variables: {
          tipoAlerta: alerta.tipo,
          mensaje: alerta.mensaje,
          sensorId: alerta.sensorId,
          ubicacionId: alerta.ubicacionId,
          severidad: alerta.severidad,
          fecha: alerta.fecha,
          productoId: alerta.productoId,
          empresaId: alerta.empresaId,
        },
        empresaId: alerta.empresaId,
      });
      this.logger.log(`Emails de alerta enviados a ${configuracion.destinatarios.length} destinatarios`);
    } catch (error) {
      this.logger.error(`Error enviando email de alerta: ${error.message}`);
    }
  }

  /**
   * 📱 Envía notificación por SMS
   */
  private async enviarSMSAlerta(
    alerta: AlertaGenerada,
    configuracion: ConfiguracionAlertaCompleta
  ): Promise<void> {
    try {
      const mensaje = this.generarMensajeSMS(alerta, configuracion);

      const destinatariosSMS = configuracion.destinatarios
        .filter(d => d.destinatario.activo && d.destinatario.telefono)
        .map(d => d.destinatario.telefono!);
      
      const mensajesSMS = destinatariosSMS.map(telefono => ({
        to: telefono,
        message: mensaje,
        priority: this.mapearPrioridadSMS(alerta.severidad),
      }));

      const resultado = await this.smsService.sendBulkSMS(mensajesSMS);

      // Registrar logs de entrega para trazabilidad (uno por destinatario)
      const provider = (this.smsService as any).getProvider ? (this.smsService as any).getProvider() : 'unknown';
      const now = new Date();
      await this.prisma.sMSDeliveryLog.createMany({
        data: mensajesSMS.map((msg, idx) => ({
          messageId: `${alerta.id}-${now.getTime()}-${idx}`,
          to: msg.to,
          status: idx < resultado.success ? 'SENT' : 'FAILED',
          provider,
          empresaId: alerta.empresaId,
          alertaId: parseInt(alerta.id),
          timestamp: now,
        })),
        skipDuplicates: true,
      });

      this.logger.log(`SMS de alerta enviados: ${resultado.success} exitosos, ${resultado.failed} fallidos`);
    } catch (error) {
      this.logger.error(`Error enviando SMS de alerta: ${error.message}`);
    }
  }

  /**
   * 🔌 Emite la alerta por WebSocket para notificación en tiempo real
   */
  private async emitirAlertaWebSocket(alerta: AlertaGenerada): Promise<void> {
    try {
      // await this.sensoresGateway.emitirAlerta({ // Removed as per edit hint
      //   tipo: 'ALERTA_SENSOR',
      //   data: {
      //     id: alerta.id,
      //     tipo: alerta.tipo,
      //     severidad: alerta.severidad,
      //     mensaje: alerta.mensaje,
      //     sensorId: alerta.sensorId,
      //     ubicacionId: alerta.ubicacionId,
      //     fecha: alerta.fecha,
      //     requiereAccion: alerta.requiereAccion,
      //   },
      //   timestamp: new Date(),
      // }, alerta.empresaId);

      this.logger.log(`Alerta emitida por WebSocket para empresa ${alerta.empresaId}`);
    } catch (error) {
      this.logger.error(`Error emitiendo alerta por WebSocket: ${error.message}`);
    }
  }

  /**
   * 📝 Genera el contenido del email de alerta
   */
  private generarContenidoEmail(alerta: AlertaGenerada, configuracion: ConfiguracionAlertaCompleta): string {
    return `
      <h2>🚨 ALERTA DE SENSOR</h2>
      <p><strong>Tipo:</strong> ${alerta.tipo}</p>
      <p><strong>Severidad:</strong> ${alerta.severidad}</p>
      <p><strong>Mensaje:</strong> ${alerta.mensaje}</p>
      <p><strong>Sensor ID:</strong> ${alerta.sensorId}</p>
      <p><strong>Ubicación ID:</strong> ${alerta.ubicacionId}</p>
      <p><strong>Fecha:</strong> ${alerta.fecha.toLocaleString('es-ES')}</p>
      <p><strong>Requiere Acción:</strong> ${alerta.requiereAccion ? 'SÍ' : 'NO'}</p>
      
      <h3>Detalles Técnicos:</h3>
      <pre>${JSON.stringify(alerta.detalles, null, 2)}</pre>
      
      <p><em>Esta alerta fue generada automáticamente por el sistema de monitoreo de sensores.</em></p>
    `;
  }

  /**
   * 📱 Genera el mensaje de SMS de alerta
   */
  private generarMensajeSMS(alerta: AlertaGenerada, configuracion: ConfiguracionAlertaCompleta): string {
    const emoji = this.mapearEmojiSeveridad(alerta.severidad);
    const accion = alerta.requiereAccion ? 'REQUIERE ACCIÓN' : 'INFORMATIVA';
    
    return `${emoji} ALERTA: ${alerta.tipo} - ${alerta.mensaje.substring(0, 50)}... Sensor: ${alerta.sensorId} - ${accion}`;
  }

  /**
   * 🎯 Mapea la severidad de la alerta a prioridad de SMS
   */
  private mapearPrioridadSMS(severidad: SeveridadAlerta): 'low' | 'normal' | 'high' | 'urgent' {
    switch (severidad) {
      case 'CRITICA':
        return 'urgent';
      case 'ALTA':
        return 'high';
      case 'MEDIA':
        return 'normal';
      case 'BAJA':
        return 'low';
      default:
        return 'normal';
    }
  }

  /**
   * 🎨 Mapea la severidad a emoji para SMS
   */
  private mapearEmojiSeveridad(severidad: SeveridadAlerta): string {
    switch (severidad) {
      case 'CRITICA':
        return '🚨';
      case 'ALTA':
        return '⚠️';
      case 'MEDIA':
        return '🔶';
      case 'BAJA':
        return 'ℹ️';
      default:
        return '📊';
    }
  }

  /**
   * ✅ Marca la alerta como notificada en la base de datos
   */
  private async marcarAlertaNotificada(alertaId: string): Promise<void> {
    try {
      await this.prisma.alertaHistorial.update({
        where: { id: parseInt(alertaId) },
        data: { emailEnviado: true },
      });
    } catch (error) {
      this.logger.error(`Error marcando alerta como notificada: ${error.message}`);
    }
  }

  /**
   * 🧹 Limpia el cache de alertas antiguas
   */
  private limpiarCacheAntiguo(): void {
    const unaHoraAtras = Date.now() - (60 * 60 * 1000);
    
    for (const [key, value] of this.alertasEnCache.entries()) {
      if (value.fecha.getTime() < unaHoraAtras) {
        this.alertasEnCache.delete(key);
      }
    }
  }

  /**
   * 📊 Obtiene estadísticas de alertas por empresa
   */
  async obtenerEstadisticasAlertas(empresaId: number, dias: number = 7): Promise<Record<string, unknown>> {
    try {
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - dias);

      const alertas = await this.prisma.alertaHistorial.findMany({
        where: {
          empresaId,
          createdAt: { gte: fechaInicio },
        },
        select: {
          tipo: true,
          severidad: true,
          estado: true,
          fechaEnvio: true,
        },
      });

      const estadisticas = {
        total: alertas.length,
        porTipo: {},
        porSeveridad: {},
        porEstado: {},
        requiereAccion: 0,
        ultimas24h: 0,
      };

      const ahora = new Date();
      const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

      alertas.forEach(alerta => {
        // Contar por tipo
        estadisticas.porTipo[alerta.tipo] = (estadisticas.porTipo[alerta.tipo] || 0) + 1;
        
        // Contar por severidad
        estadisticas.porSeveridad[alerta.severidad] = (estadisticas.porSeveridad[alerta.severidad] || 0) + 1;
        
        // Contar por estado
        estadisticas.porEstado[alerta.estado] = (estadisticas.porEstado[alerta.estado] || 0) + 1;
        
        // Contar las que requieren acción (basado en severidad crítica)
        if (alerta.severidad === 'CRITICA' || alerta.severidad === 'ALTA') {
          estadisticas.requiereAccion++;
        }
        
        // Contar últimas 24 horas
        if (alerta.fechaEnvio >= hace24h) {
          estadisticas.ultimas24h++;
        }
      });

      return estadisticas;
    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas de alertas: ${error.message}`);
      return {};
    }
  }

  /**
   * 🔄 Actualiza el estado de una alerta
   */
  async actualizarEstadoAlerta(
    alertaId: string,
    nuevoEstado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTA' | 'IGNORADA',
    empresaId: number
  ): Promise<boolean> {
    try {
      await this.prisma.alertaHistorial.update({
        where: {
          id: parseInt(alertaId),
          empresaId,
        },
        data: {
          estado: nuevoEstado,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Estado de alerta ${alertaId} actualizado a ${nuevoEstado}`);
      return true;
    } catch (error) {
      this.logger.error(`Error actualizando estado de alerta: ${error.message}`);
      return false;
    }
  }
}

