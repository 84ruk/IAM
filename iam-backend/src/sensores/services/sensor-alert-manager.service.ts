import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SensorAlertEvaluatorService, EvaluacionAlerta } from './sensor-alert-evaluator.service';
import { AlertasAvanzadasService } from '../../alertas/alertas-avanzadas.service';
import { SensoresGateway } from '../../websockets/sensores/sensores.gateway';
import { NotificationService } from '../../notifications/notification.service';
import { 
  UmbralesSensorDto, 
  ConfiguracionUmbralesSensorDto,
  UmbralesConfiguradosDto 
} from '../dto/umbrales-sensor.dto';
import { SensorTipo, Sensor, SensorLectura, AlertHistory } from '@prisma/client';

export interface AlertaGestionada {
  id: number;
  sensorId: number;
  tipo: SensorTipo;
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  mensaje: string;
  estado: 'ACTIVA' | 'RESUELTA' | 'ESCALADA';
  fechaCreacion: Date;
  fechaResolucion?: Date;
  productoId?: number;
  ubicacionId?: number;
  empresaId: number;
  umbralesExcedidos: string[];
  recomendaciones: string[];
  accionesTomadas: string[];
  notificacionesEnviadas: {
    email: boolean;
    sms: boolean;
    webSocket: boolean;
    push?: boolean;
  };
}

export interface ResumenAlertas {
  totalActivas: number;
  porSeveridad: {
    BAJA: number;
    MEDIA: number;
    ALTA: number;
    CRITICA: number;
  };
  porTipo: Record<SensorTipo, number>;
  porUbicacion: Record<string, number>;
  tendencia: 'MEJORANDO' | 'ESTABLE' | 'EMPEORANDO';
  ultimaAlerta: Date;
  proximaVerificacion: Date;
}

export interface ConfiguracionAlertas {
  sensorId: number;
  umbrales: UmbralesSensorDto;
  activo: boolean;
  notificaciones: {
    email: boolean;
    sms: boolean;
    webSocket: boolean;
    push?: boolean;
  };
  escalamiento: {
    habilitado: boolean;
    tiempoEscalacionMinutos: number;
    destinatariosEscalacion: string[];
  };
  horario: {
    habilitado: boolean;
    inicio: string; // HH:mm
    fin: string; // HH:mm
    diasSemana: number[]; // 0=Domingo, 1=Lunes, etc.
  };
}

@Injectable()
export class SensorAlertManagerService {
  private readonly logger = new Logger(SensorAlertManagerService.name);
  private readonly cacheUmbrales = new Map<string, UmbralesSensorDto>();
  private readonly cacheConfiguraciones = new Map<string, ConfiguracionAlertas>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluadorService: SensorAlertEvaluatorService,
    private readonly alertasAvanzadasService: AlertasAvanzadasService,
    private readonly sensoresGateway: SensoresGateway,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Gestiona una nueva lectura de sensor y genera alertas si es necesario
   */
  async procesarLecturaSensor(
    lectura: SensorLectura, 
    empresaId: number
  ): Promise<AlertaGestionada | null> {
    try {
      this.logger.log(`Procesando lectura del sensor ${lectura.sensorId} - ${lectura.tipo}: ${lectura.valor}`);

      // Obtener umbrales configurados para el sensor
      const umbrales = await this.obtenerUmbralesSensor(lectura.sensorId!, empresaId);
      
      if (!umbrales.alertasActivas) {
        this.logger.debug(`Alertas desactivadas para sensor ${lectura.sensorId}`);
        return null;
      }

      // Evaluar la lectura contra los umbrales
      const evaluacion = await this.evaluadorService.evaluarLectura(lectura, umbrales);
      
      if (evaluacion.estado === 'NORMAL') {
        this.logger.debug(`Lectura normal para sensor ${lectura.sensorId}`);
        return null;
      }

      // Verificar si ya existe una alerta activa similar
      const alertaExistente = await this.verificarAlertaExistente(
        lectura.sensorId!, 
        evaluacion.estado, 
        empresaId
      );

      if (alertaExistente) {
        this.logger.debug(`Alerta existente para sensor ${lectura.sensorId}, actualizando...`);
        return await this.actualizarAlertaExistente(alertaExistente.id, evaluacion, empresaId);
      }

      // Crear nueva alerta
      const alerta = await this.crearNuevaAlerta(lectura, evaluacion, empresaId);
      
      // Enviar notificaciones
      await this.enviarNotificacionesAlerta(alerta, evaluacion, empresaId);
      
      // Emitir por WebSocket
      await this.emitirAlertaWebSocket(alerta, empresaId);
      
      // Registrar en historial
      await this.registrarAlertaHistorial(alerta, evaluacion, empresaId);

      this.logger.log(`Alerta creada: ${alerta.id} para sensor ${lectura.sensorId}`);
      return alerta;

    } catch (error) {
      this.logger.error(`Error procesando lectura del sensor ${lectura.sensorId}:`, error);
      throw new Error(`Error procesando lectura: ${error.message}`);
    }
  }

  /**
   * Configura umbrales para un sensor
   */
  async configurarUmbralesSensor(
    configuracion: ConfiguracionUmbralesSensorDto,
    empresaId: number
  ): Promise<UmbralesConfiguradosDto> {
    try {
      // Validar configuración
      const validacion = await this.evaluadorService.validarConfiguracionUmbrales(configuracion);
      if (!validacion.valido) {
        throw new Error(`Configuración inválida: ${validacion.errores.join(', ')}`);
      }

      // Actualizar sensor con nueva configuración
      const sensor = await this.prisma.sensor.update({
        where: { id: configuracion.sensorId, empresaId },
        data: {
          configuracion: {
            ...configuracion.umbrales,
            ultimaActualizacion: new Date()
          }
        },
        include: { ubicacion: true }
      });

      // Limpiar cache
      this.cacheUmbrales.delete(`${empresaId}-${configuracion.sensorId}`);

      // Crear configuración de alertas
      const configAlertas: ConfiguracionAlertas = {
        sensorId: configuracion.sensorId,
        umbrales: configuracion.umbrales,
        activo: configuracion.umbrales.alertasActivas ?? true,
        notificaciones: {
          email: configuracion.umbrales.notificacionEmail ?? true,
          sms: configuracion.umbrales.notificacionSMS ?? false,
          webSocket: configuracion.umbrales.notificacionWebSocket ?? true,
          push: false
        },
        escalamiento: {
          habilitado: configuracion.umbrales.severidad === 'CRITICA',
          tiempoEscalacionMinutos: 30,
          destinatariosEscalacion: configuracion.umbrales.destinatarios || []
        },
        horario: {
          habilitado: false,
          inicio: '08:00',
          fin: '18:00',
          diasSemana: [1, 2, 3, 4, 5] // Lunes a Viernes
        }
      };

      this.cacheConfiguraciones.set(`${empresaId}-${configuracion.sensorId}`, configAlertas);

      return {
        id: sensor.id,
        sensorId: sensor.id,
        tipo: sensor.tipo,
        nombre: sensor.nombre,
        ubicacionId: sensor.ubicacionId,
        ubicacionNombre: sensor.ubicacion.nombre,
        umbrales: configuracion.umbrales,
        activo: configAlertas.activo,
        ultimaActualizacion: new Date(),
        proximaVerificacion: new Date(Date.now() + (configuracion.umbrales.intervaloVerificacionMinutos || 5) * 60 * 1000)
      };

    } catch (error) {
      this.logger.error(`Error configurando umbrales para sensor ${configuracion.sensorId}:`, error);
      throw new Error(`Error configurando umbrales: ${error.message}`);
    }
  }

  /**
   * Obtiene resumen de alertas para una empresa
   */
  async obtenerResumenAlertas(empresaId: number): Promise<ResumenAlertas> {
    try {
      const alertasActivas = await this.prisma.alertHistory.findMany({
        where: { 
          empresaId, 
          estado: 'ACTIVA',
          tipo: 'SENSOR'
        },
        include: { sensor: true, ubicacion: true }
      });

      const porSeveridad = {
        BAJA: 0,
        MEDIA: 0,
        ALTA: 0,
        CRITICA: 0
      };

      const porTipo: Record<SensorTipo, number> = {
        TEMPERATURA: 0,
        HUMEDAD: 0,
        PRESION: 0,
        PESO: 0
      };

      const porUbicacion: Record<string, number> = {};

      alertasActivas.forEach(alerta => {
        // Contar por severidad
        if (alerta.severidad) {
          const severidad = alerta.severidad.toUpperCase() as keyof typeof porSeveridad;
          if (porSeveridad[severidad] !== undefined) {
            porSeveridad[severidad]++;
          }
        }

        // Contar por tipo de sensor
        if (alerta.sensor?.tipo) {
          porTipo[alerta.sensor.tipo]++;
        }

        // Contar por ubicación
        if (alerta.ubicacion?.nombre) {
          porUbicacion[alerta.ubicacion.nombre] = (porUbicacion[alerta.ubicacion.nombre] || 0) + 1;
        }
      });

      const tendencia = this.calcularTendenciaAlertas(alertasActivas);
      const ultimaAlerta = alertasActivas.length > 0 ? 
        new Date(Math.max(...alertasActivas.map(a => a.fechaEnvio.getTime()))) : 
        new Date();

      return {
        totalActivas: alertasActivas.length,
        porSeveridad,
        porTipo,
        porUbicacion,
        tendencia,
        ultimaAlerta,
        proximaVerificacion: new Date(Date.now() + 5 * 60 * 1000) // 5 minutos
      };

    } catch (error) {
      this.logger.error(`Error obteniendo resumen de alertas:`, error);
      throw new Error(`Error obteniendo resumen: ${error.message}`);
    }
  }

  /**
   * Resuelve una alerta
   */
  async resolverAlerta(
    alertaId: number, 
    empresaId: number, 
    comentario?: string
  ): Promise<AlertaGestionada> {
    try {
      // Primero obtener la alerta para acceder a su mensaje
      const alertaExistente = await this.prisma.alertHistory.findFirst({
        where: { id: alertaId, empresaId }
      });

      if (!alertaExistente) {
        throw new Error('Alerta no encontrada');
      }

      const alerta = await this.prisma.alertHistory.update({
        where: { id: alertaId, empresaId },
        data: {
          estado: 'RESUELTA',
          fechaResolucion: new Date(),
          mensaje: comentario ? `${alertaExistente.mensaje} - Resuelto: ${comentario}` : alertaExistente.mensaje
        },
        include: { sensor: true, ubicacion: true }
      });

      // Emitir resolución por WebSocket
      await this.emitirResolucionWebSocket(alerta, empresaId);

      // Limpiar cache si es necesario
      if (alerta.sensorId) {
        this.cacheUmbrales.delete(`${empresaId}-${alerta.sensorId}`);
      }

      this.logger.log(`Alerta ${alertaId} resuelta`);
      
      return this.convertirAlertHistoryToAlertaGestionada(alerta);

    } catch (error) {
      this.logger.error(`Error resolviendo alerta ${alertaId}:`, error);
      throw new Error(`Error resolviendo alerta: ${error.message}`);
    }
  }

  /**
   * Escala una alerta crítica
   */
  async escalarAlerta(
    alertaId: number, 
    empresaId: number, 
    destinatarios: string[]
  ): Promise<void> {
    try {
      const alerta = await this.prisma.alertHistory.findFirst({
        where: { id: alertaId, empresaId }
      });

      if (!alerta) {
        throw new Error('Alerta no encontrada');
      }

      if (alerta.severidad !== 'CRITICA') {
        throw new Error('Solo se pueden escalar alertas críticas');
      }

      // Enviar notificación de escalamiento
      await this.enviarNotificacionEscalamiento(alerta, destinatarios, empresaId);

      // Actualizar estado
      await this.prisma.alertHistory.update({
        where: { id: alertaId },
        data: { estado: 'ESCALADA' }
      });

      this.logger.log(`Alerta ${alertaId} escalada a ${destinatarios.length} destinatarios`);

    } catch (error) {
      this.logger.error(`Error escalando alerta ${alertaId}:`, error);
      throw new Error(`Error escalando alerta: ${error.message}`);
    }
  }

  /**
   * Obtiene umbrales configurados para un sensor
   */
  private async obtenerUmbralesSensor(sensorId: number, empresaId: number): Promise<UmbralesSensorDto> {
    const cacheKey = `${empresaId}-${sensorId}`;
    
    // Verificar cache
    if (this.cacheUmbrales.has(cacheKey)) {
      return this.cacheUmbrales.get(cacheKey)!;
    }

    try {
      const sensor = await this.prisma.sensor.findFirst({
        where: { id: sensorId, empresaId }
      });

      if (!sensor || !sensor.configuracion) {
        // Retornar umbrales por defecto
        const umbrales = this.obtenerUmbralesPorDefecto(sensor?.tipo || 'TEMPERATURA');
        this.cacheUmbrales.set(cacheKey, umbrales);
        return umbrales;
      }

      const config = sensor.configuracion as any;
      const umbrales: UmbralesSensorDto = {
        temperaturaMin: config.temperaturaMin,
        temperaturaMax: config.temperaturaMax,
        humedadMin: config.humedadMin,
        humedadMax: config.humedadMax,
        pesoMin: config.pesoMin,
        pesoMax: config.pesoMax,
        presionMin: config.presionMin,
        presionMax: config.presionMax,
        alertasActivas: config.alertasActivas ?? true,
        mensajeAlerta: config.mensajeAlerta,
        mensajeCritico: config.mensajeCritico,
        destinatarios: config.destinatarios,
        severidad: config.severidad ?? 'MEDIA',
        intervaloVerificacionMinutos: config.intervaloVerificacionMinutos ?? 5,
        notificacionEmail: config.notificacionEmail ?? true,
        notificacionSMS: config.notificacionSMS ?? false,
        notificacionWebSocket: config.notificacionWebSocket ?? true
      };

      this.cacheUmbrales.set(cacheKey, umbrales);
      return umbrales;

    } catch (error) {
      this.logger.error(`Error obteniendo umbrales del sensor:`, error);
      const umbrales = this.obtenerUmbralesPorDefecto('TEMPERATURA');
      this.cacheUmbrales.set(cacheKey, umbrales);
      return umbrales;
    }
  }

  /**
   * Verifica si ya existe una alerta activa similar
   */
  private async verificarAlertaExistente(
    sensorId: number, 
    estado: string, 
    empresaId: number
  ): Promise<AlertHistory | null> {
    const hace5Minutos = new Date(Date.now() - 5 * 60 * 1000);
    
    return await this.prisma.alertHistory.findFirst({
      where: {
        sensorId,
        empresaId,
        estado: 'ACTIVA',
        tipo: 'SENSOR',
        fechaEnvio: { gte: hace5Minutos }
      }
    });
  }

  /**
   * Actualiza una alerta existente
   */
  private async actualizarAlertaExistente(
    alertaId: number, 
    evaluacion: any, 
    empresaId: number
  ): Promise<AlertaGestionada> {
    const alerta = await this.prisma.alertHistory.update({
      where: { id: alertaId, empresaId },
      data: {
        mensaje: evaluacion.mensaje,
        severidad: evaluacion.severidad,
        fechaEnvio: new Date(),
        condicionActivacion: {
          umbralesExcedidos: evaluacion.umbralesExcedidos,
          recomendaciones: evaluacion.recomendaciones
        }
      },
      include: { sensor: true, ubicacion: true }
    });

    return this.convertirAlertHistoryToAlertaGestionada(alerta);
  }

  /**
   * Crea una nueva alerta
   */
  private async crearNuevaAlerta(
    lectura: SensorLectura, 
    evaluacion: any, 
    empresaId: number
  ): Promise<AlertaGestionada> {
    const alerta = await this.prisma.alertHistory.create({
      data: {
        empresaId,
        tipo: 'SENSOR',
        severidad: evaluacion.severidad,
        titulo: `Alerta de ${lectura.tipo}`,
        mensaje: evaluacion.mensaje,
        sensorId: lectura.sensorId!,
        productoId: lectura.productoId,
        ubicacionId: lectura.ubicacionId,
        valor: lectura.valor.toString(),
        estado: 'ACTIVA',
        fechaEnvio: new Date(),
        condicionActivacion: {
          umbralesExcedidos: evaluacion.umbralesExcedidos,
          recomendaciones: evaluacion.recomendaciones,
          tipo: lectura.tipo,
          unidad: lectura.unidad
        }
      },
      include: { sensor: true, ubicacion: true }
    });

    return this.convertirAlertHistoryToAlertaGestionada(alerta);
  }

  /**
   * Envía notificaciones de alerta
   */
  private async enviarNotificacionesAlerta(
    alerta: AlertaGestionada, 
    evaluacion: any, 
    empresaId: number
  ): Promise<void> {
    try {
      const config = await this.obtenerConfiguracionAlertas(alerta.sensorId, empresaId);
      
      if (config.notificaciones.email) {
        await this.enviarNotificacionEmail(alerta, evaluacion, empresaId);
      }

      if (config.notificaciones.sms) {
        await this.enviarNotificacionSMS(alerta, evaluacion, empresaId);
      }

      if (config.notificaciones.push) {
        await this.enviarNotificacionPush(alerta, evaluacion, empresaId);
      }

    } catch (error) {
      this.logger.error(`Error enviando notificaciones:`, error);
    }
  }

  /**
   * Emite alerta por WebSocket
   */
  private async emitirAlertaWebSocket(
    alerta: AlertaGestionada, 
    empresaId: number
  ): Promise<void> {
    try {
      await this.sensoresGateway.emitirEstadoSensores({
        tipo: 'ALERTA',
        alerta: {
          id: alerta.id,
          sensorId: alerta.sensorId,
          tipo: alerta.tipo,
          severidad: alerta.severidad,
          mensaje: alerta.mensaje,
          fecha: alerta.fechaCreacion
        }
      }, empresaId);
    } catch (error) {
      this.logger.error(`Error emitiendo alerta por WebSocket:`, error);
    }
  }

  /**
   * Emite resolución por WebSocket
   */
  private async emitirResolucionWebSocket(
    alerta: AlertHistory, 
    empresaId: number
  ): Promise<void> {
    try {
      await this.sensoresGateway.emitirEstadoSensores({
        tipo: 'RESOLUCION_ALERTA',
        alerta: {
          id: alerta.id,
          sensorId: alerta.sensorId,
          estado: 'RESUELTA',
          fecha: new Date()
        }
      }, empresaId);
    } catch (error) {
      this.logger.error(`Error emitiendo resolución por WebSocket:`, error);
    }
  }

  /**
   * Registra alerta en historial
   */
  private async registrarAlertaHistorial(
    alerta: AlertaGestionada, 
    evaluacion: any, 
    empresaId: number
  ): Promise<void> {
    // La alerta ya se registra en AlertHistory al crearla
    this.logger.debug(`Alerta ${alerta.id} registrada en historial`);
  }

  /**
   * Obtiene configuración de alertas para un sensor
   */
  private async obtenerConfiguracionAlertas(
    sensorId: number, 
    empresaId: number
  ): Promise<ConfiguracionAlertas> {
    const cacheKey = `${empresaId}-${sensorId}`;
    
    if (this.cacheConfiguraciones.has(cacheKey)) {
      return this.cacheConfiguraciones.get(cacheKey)!;
    }

    // Configuración por defecto
    const config: ConfiguracionAlertas = {
      sensorId,
      umbrales: await this.obtenerUmbralesSensor(sensorId, empresaId),
      activo: true,
      notificaciones: {
        email: true,
        sms: false,
        webSocket: true,
        push: false
      },
      escalamiento: {
        habilitado: false,
        tiempoEscalacionMinutos: 30,
        destinatariosEscalacion: []
      },
      horario: {
        habilitado: false,
        inicio: '08:00',
        fin: '18:00',
        diasSemana: [1, 2, 3, 4, 5]
      }
    };

    this.cacheConfiguraciones.set(cacheKey, config);
    return config;
  }

  /**
   * Envía notificación por email
   */
  private async enviarNotificacionEmail(
    alerta: AlertaGestionada, 
    evaluacion: any, 
    empresaId: number
  ): Promise<void> {
    try {
      // TODO: Implementar envío de email usando tu servicio existente
      this.logger.debug(`Email enviado para alerta ${alerta.id}`);
    } catch (error) {
      this.logger.error(`Error enviando notificación por email:`, error);
    }
  }

  /**
   * Envía notificación por SMS
   */
  private async enviarNotificacionSMS(
    alerta: AlertaGestionada, 
    evaluacion: any, 
    empresaId: number
  ): Promise<void> {
    try {
      // Implementar envío de SMS usando tu servicio existente
      this.logger.debug(`SMS enviado para alerta ${alerta.id}`);
    } catch (error) {
      this.logger.error(`Error enviando notificación por SMS:`, error);
    }
  }

  /**
   * Envía notificación push
   */
  private async enviarNotificacionPush(
    alerta: AlertaGestionada, 
    evaluacion: any, 
    empresaId: number
  ): Promise<void> {
    try {
      // Implementar notificaciones push
      this.logger.debug(`Notificación push enviada para alerta ${alerta.id}`);
    } catch (error) {
      this.logger.error(`Error enviando notificación push:`, error);
    }
  }

  /**
   * Envía notificación de escalamiento
   */
  private async enviarNotificacionEscalamiento(
    alerta: AlertHistory, 
    destinatarios: string[], 
    empresaId: number
  ): Promise<void> {
    try {
      // Enviar notificación de escalamiento
      this.logger.log(`Notificación de escalamiento enviada para alerta ${alerta.id}`);
    } catch (error) {
      this.logger.error(`Error enviando notificación de escalamiento:`, error);
    }
  }

  /**
   * Convierte AlertHistory a AlertaGestionada
   */
  private convertirAlertHistoryToAlertaGestionada(alerta: AlertHistory): AlertaGestionada {
    const condicionActivacion = alerta.condicionActivacion as any;
    
          return {
        id: alerta.id,
        sensorId: alerta.sensorId!,
        tipo: 'TEMPERATURA', // Valor por defecto ya que no tenemos acceso al sensor
        severidad: (alerta.severidad as any) || 'MEDIA',
        mensaje: alerta.mensaje,
        estado: (alerta.estado as any) || 'ACTIVA',
        fechaCreacion: alerta.fechaEnvio,
        fechaResolucion: alerta.fechaLectura || undefined,
        productoId: alerta.productoId || undefined,
        ubicacionId: alerta.ubicacionId || undefined,
        empresaId: alerta.empresaId,
      umbralesExcedidos: condicionActivacion?.umbralesExcedidos || [],
      recomendaciones: condicionActivacion?.recomendaciones || [],
      accionesTomadas: [],
      notificacionesEnviadas: {
        email: alerta.emailEnviado,
        sms: false,
        webSocket: true,
        push: false
      }
    };
  }

  /**
   * Obtiene umbrales por defecto
   */
  private obtenerUmbralesPorDefecto(tipo: SensorTipo): UmbralesSensorDto {
    switch (tipo) {
      case 'TEMPERATURA':
        return {
          temperaturaMin: 15,
          temperaturaMax: 25,
          alertasActivas: true,
          severidad: 'MEDIA',
          intervaloVerificacionMinutos: 5
        };
      case 'HUMEDAD':
        return {
          humedadMin: 40,
          humedadMax: 60,
          alertasActivas: true,
          severidad: 'MEDIA',
          intervaloVerificacionMinutos: 5
        };
      case 'PESO':
        return {
          pesoMin: 100,
          pesoMax: 900,
          alertasActivas: true,
          severidad: 'MEDIA',
          intervaloVerificacionMinutos: 10
        };
      case 'PRESION':
        return {
          presionMin: 1000,
          presionMax: 1500,
          alertasActivas: true,
          severidad: 'MEDIA',
          intervaloVerificacionMinutos: 5
        };
      default:
        return {
          alertasActivas: true,
          severidad: 'MEDIA',
          intervaloVerificacionMinutos: 5
        };
    }
  }

  /**
   * Calcula tendencia de alertas
   */
  private calcularTendenciaAlertas(alertas: AlertHistory[]): 'MEJORANDO' | 'ESTABLE' | 'EMPEORANDO' {
    if (alertas.length < 3) return 'ESTABLE';

    const ultimas3 = alertas.slice(0, 3);
    const ahora = new Date();
    const hace1h = new Date(ahora.getTime() - 60 * 60 * 1000);
    
    const alertasRecientes = ultimas3.filter(a => a.fechaEnvio > hace1h);
    
    if (alertasRecientes.length === 0) return 'MEJORANDO';
    if (alertasRecientes.length === ultimas3.length) return 'EMPEORANDO';
    
    return 'ESTABLE';
  }
}
