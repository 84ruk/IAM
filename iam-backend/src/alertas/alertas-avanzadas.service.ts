import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SMSNotificationService, SMSMessage } from './services/sms-notification.service';
import { SMSTemplateService } from './services/sms-template.service';
import { NotificationService } from '../notifications/notification.service';
import { ConfigurarAlertaDto } from './dto/configurar-alerta.dto';
import { UmbralAlertaDto, SensorLectura, AlertaGenerada } from './interfaces/sensor-lectura.interface';

interface AlertaConfiguracion {
  id: number;
  empresaId: number;
  tipoAlerta: string;
  activo: boolean;
  destinatarios: string[];
  frecuencia: string;
  ventanaEsperaMinutos?: number;
  umbralCritico?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AlertasAvanzadasService {
  private readonly logger = new Logger(AlertasAvanzadasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SMSNotificationService,
    private readonly templateService: SMSTemplateService,
    private readonly notificationService: NotificationService,
  ) {}

  async configurarAlerta(dto: ConfigurarAlertaDto, empresaId: number): Promise<AlertaConfiguracion> {
    const configuracion = await this.prisma.alertConfiguration.create({
      data: {
        empresaId,
        tipoAlerta: dto.tipoAlerta,
        activo: dto.activo,
        destinatarios: [...dto.destinatarios, ...dto.destinatariosSMS],
        frecuencia: dto.frecuencia,
        ventanaEsperaMinutos: dto.ventanaEsperaMinutos,
        umbralCritico: {
          ...dto.umbralCritico,
          enviarSMS: dto.enviarSMS,
          mensajeSMS: dto.mensajeSMS,
          prioridadSMS: dto.prioridadSMS,
          destinatariosSMS: dto.destinatariosSMS,
        },
      },
    });

    this.logger.log(`Alerta configurada: ${configuracion.tipoAlerta} para empresa ${empresaId}`);
    return configuracion as AlertaConfiguracion;
  }

  async obtenerConfiguracionesAlertas(empresaId: number, ubicacionId?: number): Promise<AlertaConfiguracion[]> {
    const where: Record<string, unknown> = { empresaId };

    const configuraciones = await this.prisma.alertConfiguration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return configuraciones as AlertaConfiguracion[];
  }

  async actualizarConfiguracionAlerta(id: number, updateData: Partial<ConfigurarAlertaDto>, empresaId: number): Promise<AlertaConfiguracion> {
    const configuracion = await this.prisma.alertConfiguration.update({
      where: { id, empresaId },
      data: {
        tipoAlerta: updateData.tipoAlerta,
        activo: updateData.activo,
        destinatarios: updateData.destinatarios ? [...updateData.destinatarios, ...(updateData.destinatariosSMS || [])] : undefined,
        frecuencia: updateData.frecuencia,
        ventanaEsperaMinutos: updateData.ventanaEsperaMinutos,
        umbralCritico: updateData.umbralCritico ? {
          ...updateData.umbralCritico,
          enviarSMS: updateData.enviarSMS,
          mensajeSMS: updateData.mensajeSMS,
          prioridadSMS: updateData.prioridadSMS,
          destinatariosSMS: updateData.destinatariosSMS,
        } : undefined,
      },
    });

    this.logger.log(`Alerta actualizada: ${configuracion.tipoAlerta}`);
    return configuracion as AlertaConfiguracion;
  }

  async eliminarConfiguracionAlerta(id: number, empresaId: number): Promise<void> {
    await this.prisma.alertConfiguration.delete({
      where: { id, empresaId },
    });

    this.logger.log(`Alerta eliminada: ${id}`);
  }

  async verificarAlertasPorLectura(lectura: SensorLectura, empresaId: number): Promise<AlertaGenerada[]> {
    const configuraciones = await this.obtenerConfiguracionesAlertas(empresaId);
    const alertasGeneradas: AlertaGenerada[] = [];

    for (const configuracion of configuraciones) {
      if (!configuracion.activo) continue;

      // Verificar si la lectura coincide con el tipo de alerta
      if (configuracion.tipoAlerta !== lectura.tipo) continue;

      // Verificar umbrales
      const umbralExcedido = await this.evaluarUmbrales(lectura, configuracion.umbralCritico as UmbralAlertaDto);
      
      if (umbralExcedido) {
        const alerta = await this.generarAlerta(lectura, configuracion, empresaId);
        alertasGeneradas.push(alerta);
      }
    }

    this.logger.log(`Verificadas ${configuraciones.length} configuraciones, generadas ${alertasGeneradas.length} alertas`);
    return alertasGeneradas;
  }

  private async evaluarUmbrales(lectura: SensorLectura, umbrales: UmbralAlertaDto): Promise<boolean> {
    if (!umbrales) return false;

    switch (lectura.tipo) {
      case 'TEMPERATURA':
        return (umbrales.temperaturaMin !== undefined && lectura.valor < umbrales.temperaturaMin) ||
               (umbrales.temperaturaMax !== undefined && lectura.valor > umbrales.temperaturaMax);
      
      case 'HUMEDAD':
        return (umbrales.humedadMin !== undefined && lectura.valor < umbrales.humedadMin) ||
               (umbrales.humedadMax !== undefined && lectura.valor > umbrales.humedadMax);
      
      case 'PESO':
        return (umbrales.pesoMin !== undefined && lectura.valor < umbrales.pesoMin) ||
               (umbrales.pesoMax !== undefined && lectura.valor > umbrales.pesoMax);
      
      case 'PRESION':
        return (umbrales.presionMin !== undefined && lectura.valor < umbrales.presionMin) ||
               (umbrales.presionMax !== undefined && lectura.valor > umbrales.presionMax);
      
      default:
        return false;
    }
  }

  private async generarAlerta(lectura: SensorLectura, configuracion: AlertaConfiguracion, empresaId: number): Promise<AlertaGenerada> {
    const mensaje = this.generarMensajeAlerta(lectura, configuracion);
    const severidad = this.determinarSeveridad(lectura, configuracion.umbralCritico as UmbralAlertaDto);

    // Crear registro de alerta
    const alerta = await this.prisma.alertHistory.create({
      data: {
        tipo: configuracion.tipoAlerta,
        titulo: `Alerta de ${lectura.tipo}`,
        mensaje,
        severidad,
        empresaId,
        productoId: lectura.productoId,
        destinatarios: configuracion.destinatarios,
        estado: 'PENDIENTE',
        condicionActivacion: {
          lectura: {
            tipo: lectura.tipo,
            valor: lectura.valor,
            unidad: lectura.unidad,
          },
          configuracion: {
            id: configuracion.id,
            tipoAlerta: configuracion.tipoAlerta,
          },
        },
      },
    });

    // Enviar notificaciones
    await this.enviarSMSAlerta(lectura, configuracion, mensaje);
    await this.enviarEmailAlerta(lectura, configuracion, mensaje);

    this.logger.log(`Alerta generada: ${alerta.id} - ${mensaje}`);
    return {
      id: alerta.id,
      tipo: alerta.tipo,
      mensaje: alerta.mensaje,
      severidad: alerta.severidad,
      empresaId: alerta.empresaId,
      ubicacionId: lectura.ubicacionId,
      sensorId: lectura.sensorId,
      productoId: alerta.productoId || undefined,
      fecha: alerta.createdAt,
      estado: alerta.estado,
      condicionActivacion: alerta.condicionActivacion as Record<string, unknown>,
    };
  }

  private async enviarSMSAlerta(lectura: SensorLectura, configuracion: AlertaConfiguracion, mensaje: string): Promise<void> {
    try {
      const umbralCritico = configuracion.umbralCritico as Record<string, unknown>;
      
      if (!umbralCritico?.enviarSMS || !Array.isArray(umbralCritico?.destinatariosSMS) || umbralCritico.destinatariosSMS.length === 0) {
        return;
      }

      const mensajeSMS = this.formatearMensajeSMS(umbralCritico.mensajeSMS as string || mensaje, lectura);
      const destinatariosSMS = umbralCritico.destinatariosSMS as string[];
      
      for (const destinatario of destinatariosSMS) {
        const message: SMSMessage = {
          to: destinatario,
          message: mensajeSMS,
          priority: (umbralCritico.prioridadSMS as 'low' | 'normal' | 'high' | 'urgent') || 'normal',
        };

        const success = await this.smsService.sendSMS(message);
        this.logger.log(`SMS de alerta enviado a ${destinatario}: ${success ? 'Exitoso' : 'Fallido'}`);
      }
    } catch (error) {
      this.logger.error('Error enviando SMS de alerta:', error);
    }
  }

  private async enviarEmailAlerta(lectura: SensorLectura, configuracion: AlertaConfiguracion, mensaje: string): Promise<void> {
    try {
      if (!configuracion.destinatarios?.length) {
        return;
      }

      const empresa = await this.prisma.empresa.findUnique({ 
        where: { id: configuracion.empresaId }, 
        select: { nombre: true } 
      });

      const result = await this.notificationService.sendSensorAlert(
        { 
          tipo: lectura.tipo, 
          valor: lectura.valor, 
          unidad: lectura.unidad, 
          ubicacion: lectura.ubicacion?.nombre || 'Ubicación Desconocida', 
          sensor: lectura.sensor?.nombre || 'Sensor Desconocido' 
        },
        configuracion.empresaId,
        empresa?.nombre || 'Empresa'
      );

      this.logger.log(`Email de alerta enviado: ${result.success ? 'Exitoso' : 'Fallido'}`);
    } catch (error) {
      this.logger.error('Error enviando email de alerta:', error);
    }
  }

  private formatearMensajeSMS(mensaje: string, lectura: SensorLectura): string {
    if (mensaje.includes('{') && mensaje.includes('}')) {
      const datos = { 
        tipo: lectura.tipo, 
        valor: lectura.valor, 
        unidad: lectura.unidad, 
        fecha: new Date().toLocaleString(), 
        ubicacion: lectura.ubicacion?.nombre || 'Ubicación Desconocida', 
        sensor: lectura.sensor?.nombre || 'Sensor Desconocido' 
      };
      
      const plantillaPorTipo = this.templateService.procesarPlantillaPorTipo(lectura.tipo, datos);
      if (plantillaPorTipo) {
        return plantillaPorTipo;
      }
      
      return mensaje
        .replace('{tipo}', lectura.tipo)
        .replace('{valor}', lectura.valor.toString())
        .replace('{unidad}', lectura.unidad)
        .replace('{fecha}', new Date().toLocaleString())
        .replace('{ubicacion}', lectura.ubicacion?.nombre || 'Ubicación Desconocida')
        .replace('{sensor}', lectura.sensor?.nombre || 'Sensor Desconocido')
        .substring(0, 160);
    }
    return mensaje.substring(0, 160);
  }

  private generarMensajeAlerta(lectura: SensorLectura, configuracion: AlertaConfiguracion): string {
    const baseMensaje = configuracion.umbralCritico?.mensajePersonalizado as string || `Alerta de ${lectura.tipo}`;
    
    return baseMensaje
      .replace('{tipo}', lectura.tipo)
      .replace('{valor}', lectura.valor.toString())
      .replace('{unidad}', lectura.unidad)
      .replace('{ubicacion}', lectura.ubicacion?.nombre || 'Ubicación Desconocida')
      .replace('{sensor}', lectura.sensor?.nombre || 'Sensor Desconocido')
      .replace('{fecha}', new Date().toLocaleString());
  }

  private determinarSeveridad(lectura: SensorLectura, umbrales: UmbralAlertaDto): string {
    // Lógica para determinar severidad basada en qué tan lejos está del umbral
    const umbralCritico = 0.5; // 50% más allá del umbral
    
    switch (lectura.tipo) {
      case 'TEMPERATURA':
        if (umbrales.temperaturaMin !== undefined && lectura.valor < umbrales.temperaturaMin * umbralCritico) return 'CRITICA';
        if (umbrales.temperaturaMax !== undefined && lectura.valor > umbrales.temperaturaMax * (2 - umbralCritico)) return 'CRITICA';
        break;
      case 'HUMEDAD':
        if (umbrales.humedadMin !== undefined && lectura.valor < umbrales.humedadMin * umbralCritico) return 'CRITICA';
        if (umbrales.humedadMax !== undefined && lectura.valor > umbrales.humedadMax * (2 - umbralCritico)) return 'CRITICA';
        break;
    }
    
    return 'ALTA';
  }
} 