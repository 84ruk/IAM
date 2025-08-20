import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SeveridadAlerta } from '@prisma/client';
import { SMSNotificationService } from './services/sms-notification.service';
import { SMSTemplateService } from './services/sms-template.service';
import { NotificationService } from '../notifications/notification.service';
import { ConfigurarAlertaDto } from './dto/configurar-alerta.dto';
import { SensorLectura } from './interfaces/sensor-lectura.interface';
import { TipoDestinatarioAlerta } from './enums/tipo-destinatario.enum';
import { 
  AlertaConfiguracion, 
  AlertaGenerada, 
  UmbralCriticoConfig, 
  NotificacionConfig 
} from '../types/alertas';

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
    // Primero creamos o actualizamos los destinatarios y usuarios en paralelo
    const [destinatariosCreados] = await Promise.all([
      Promise.all(
        dto.destinatarios.map(async dest => {
          const [destinatario] = await Promise.all([
            this.prisma.destinatarioAlerta.upsert({
              where: {
                empresaId_email: {
                  empresaId,
                  email: dest.email
                }
              },
              create: {
                nombre: dest.nombre,
                email: dest.email,
                telefono: dest.telefono,
                tipo: dest.tipo,
                empresaId
              },
              update: {
                nombre: dest.nombre,
                telefono: dest.telefono,
                tipo: dest.tipo,
                activo: true
              }
            })
          ]);
          return destinatario;
        })
      )
    ]);

    const destinatariosTelefono = destinatariosCreados
      .filter(d => d.tipo === TipoDestinatarioAlerta.SMS || d.tipo === TipoDestinatarioAlerta.AMBOS)
      .map(d => d.telefono)
      .filter(Boolean) as string[];

    const umbralCritico: UmbralCriticoConfig = {
      ...dto.umbralCritico,
      enviarSMS: destinatariosCreados.some(d => d.tipo === TipoDestinatarioAlerta.SMS || d.tipo === TipoDestinatarioAlerta.AMBOS),
      mensajeSMS: dto.mensajeSMS,
      prioridadSMS: (dto.prioridadSMS === 'high' ? 'high' : 'normal') as 'normal' | 'high',
      destinatarios: destinatariosTelefono
    };

    const configuracionNotificacion: NotificacionConfig = {
      email: destinatariosCreados.some(d => d.tipo === TipoDestinatarioAlerta.EMAIL || d.tipo === TipoDestinatarioAlerta.AMBOS),
      sms: destinatariosCreados.some(d => d.tipo === TipoDestinatarioAlerta.SMS || d.tipo === TipoDestinatarioAlerta.AMBOS),
      webSocket: false,
      mensajeEmail: dto.mensajePersonalizado,
      mensajeSMS: dto.mensajeSMS
    };

    // Creamos la configuración de alerta con los destinatarios
    // Crear o actualizar la configuración de alerta
    const configuracion = await this.prisma.configuracionAlerta.upsert({
      where: {
        sensorId: dto.sensorId
      },
      create: {
        empresaId,
        sensorId: dto.sensorId,
        tipoAlerta: dto.tipoAlerta,
        activo: dto.activo,
        frecuencia: dto.frecuencia,
        ventanaEsperaMinutos: dto.ventanaEsperaMinutos ?? null,
        umbralCritico: umbralCritico ? umbralCritico as unknown as Prisma.InputJsonValue : {},
        configuracionNotificacion: configuracionNotificacion ? configuracionNotificacion as unknown as Prisma.InputJsonValue : {},
        destinatarios: {
          create: destinatariosCreados.map(dest => ({ destinatarioId: dest.id }))
        }
      },
      update: {
        tipoAlerta: dto.tipoAlerta,
        activo: dto.activo,
        frecuencia: dto.frecuencia,
        ventanaEsperaMinutos: dto.ventanaEsperaMinutos ?? null,
        umbralCritico: umbralCritico ? umbralCritico as unknown as Prisma.InputJsonValue : {},
        configuracionNotificacion: configuracionNotificacion ? configuracionNotificacion as unknown as Prisma.InputJsonValue : {},
        destinatarios: {
          deleteMany: {},
          create: destinatariosCreados.map(dest => ({ destinatarioId: dest.id }))
        }
      },
      include: {
        destinatarios: {
          include: {
            destinatario: true
          }
        }
      }
    });
    this.logger.log(`Alerta configurada: ${configuracion.tipoAlerta} para empresa ${empresaId}`);
    
    const destinatarios = await Promise.all(
      configuracion.destinatarios.map(async d => {
        const dest = await this.prisma.usuario.findUnique({
          where: { id: d.destinatarioId },
          select: { email: true }
        });
        return dest?.email || '';
      })
    );

    // Convertir datos a los tipos correctos
    const mappedConfig: AlertaConfiguracion = {
      id: configuracion.id,
      empresaId: configuracion.empresaId,
      sensorId: configuracion.sensorId,
      tipoAlerta: configuracion.tipoAlerta,
      activo: configuracion.activo,
      frecuencia: configuracion.frecuencia,
      ventanaEsperaMinutos: configuracion.ventanaEsperaMinutos,
      createdAt: configuracion.createdAt,
      updatedAt: configuracion.updatedAt,
      umbralCritico: {
        ...(configuracion.umbralCritico as any),
        destinatarios: configuracion.destinatarios
          .filter(d => d.destinatario.tipo === TipoDestinatarioAlerta.SMS || d.destinatario.tipo === TipoDestinatarioAlerta.AMBOS)
          .map(d => d.destinatario.telefono)
          .filter(Boolean) as string[]
      } as UmbralCriticoConfig,
      configuracionNotificacion: {
        ...(configuracion.configuracionNotificacion as any),
        email: configuracion.destinatarios.some(d => 
          d.destinatario.tipo === TipoDestinatarioAlerta.EMAIL || d.destinatario.tipo === TipoDestinatarioAlerta.AMBOS
        ),
        sms: configuracion.destinatarios.some(d => 
          d.destinatario.tipo === TipoDestinatarioAlerta.SMS || d.destinatario.tipo === TipoDestinatarioAlerta.AMBOS
        ),
        webSocket: false
      } as NotificacionConfig,
      destinatarios: configuracion.destinatarios.map(d => ({
        id: d.destinatario.id,
        nombre: d.destinatario.nombre,
        email: d.destinatario.email,
        telefono: d.destinatario.telefono || undefined,
        tipo: d.destinatario.tipo as TipoDestinatarioAlerta,
        activo: d.destinatario.activo,
        empresaId: d.destinatario.empresaId,
        configuracionAlertaId: configuracion.id
      }))
    };

    return mappedConfig;
  }

  async obtenerConfiguracionesAlertas(empresaId: number): Promise<AlertaConfiguracion[]> {
    const configuraciones = await this.prisma.configuracionAlerta.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      include: {
        destinatarios: {
          include: {
            destinatario: true
          }
        }
      }
    });

    const results = await Promise.all(configuraciones.map(async config => {
      return {
        id: config.id,
        sensorId: config.sensorId,
        empresaId: config.empresaId,
        tipoAlerta: config.tipoAlerta,
        activo: config.activo,
        frecuencia: config.frecuencia,
        ventanaEsperaMinutos: config.ventanaEsperaMinutos,
        umbralCritico: {
          ...(config.umbralCritico as any),
          destinatarios: config.destinatarios
            .filter(d => d.destinatario.tipo === TipoDestinatarioAlerta.SMS || d.destinatario.tipo === TipoDestinatarioAlerta.AMBOS)
            .map(d => d.destinatario.telefono)
            .filter(Boolean) as string[]
        } as UmbralCriticoConfig,
        configuracionNotificacion: {
          ...(config.configuracionNotificacion as any),
          email: config.destinatarios.some(d => 
            d.destinatario.tipo === TipoDestinatarioAlerta.EMAIL || d.destinatario.tipo === TipoDestinatarioAlerta.AMBOS
          ),
          sms: config.destinatarios.some(d => 
            d.destinatario.tipo === TipoDestinatarioAlerta.SMS || d.destinatario.tipo === TipoDestinatarioAlerta.AMBOS
          ),
          webSocket: false
        } as NotificacionConfig,
        destinatarios: config.destinatarios.map(d => ({
          id: d.destinatario.id,
          nombre: d.destinatario.nombre,
          email: d.destinatario.email,
          telefono: d.destinatario.telefono || undefined,
          tipo: d.destinatario.tipo as TipoDestinatarioAlerta,
          activo: d.destinatario.activo,
          empresaId: d.destinatario.empresaId,
          configuracionAlertaId: config.id
        })),
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      } as AlertaConfiguracion;
    }));

    return results;
  }

  async actualizarConfiguracionAlerta(id: number, updateData: Partial<ConfigurarAlertaDto>, empresaId: number): Promise<AlertaConfiguracion> {
    // Actualizar o crear destinatarios si se proporcionan
    type DestinatarioCreado = {
      id: number;
      nombre: string;
      email: string;
      telefono: string | null;
      tipo: TipoDestinatarioAlerta;
      activo: boolean;
      empresaId: number;
    };

    let destinatariosCreados: DestinatarioCreado[] = [];
    if (updateData.destinatarios?.length) {
      const crearOActualizarDestinatarios = updateData.destinatarios.map(async dest => {
        return await this.prisma.destinatarioAlerta.upsert({
          where: {
            empresaId_email: {
              empresaId,
              email: dest.email
            }
          },
          create: {
            nombre: dest.nombre,
            email: dest.email,
            telefono: dest.telefono,
            tipo: dest.tipo,
            empresaId
          },
          update: {
            nombre: dest.nombre,
            telefono: dest.telefono,
            tipo: dest.tipo,
            activo: true
          }
        });
      });

      destinatariosCreados = await Promise.all(crearOActualizarDestinatarios);
    }

    // Prepare umbralCritico data
    const umbralCritico: UmbralCriticoConfig = {
      ...(updateData.umbralCritico || {}),
      enviarSMS: destinatariosCreados.some(d => d.tipo === TipoDestinatarioAlerta.SMS || d.tipo === TipoDestinatarioAlerta.AMBOS),
      mensajeSMS: updateData.mensajePersonalizado ?? '',
      prioridadSMS: 'normal',
      destinatarios: destinatariosCreados
        .filter(d => (d.tipo === TipoDestinatarioAlerta.SMS || d.tipo === TipoDestinatarioAlerta.AMBOS) && d.telefono)
        .map(d => d.telefono!) // El filtro anterior asegura que telefono no sea null
    };

    // Prepare configuracionNotificacion
    const configuracionNotificacion: NotificacionConfig = {
      email: destinatariosCreados.some(d => d.tipo === TipoDestinatarioAlerta.EMAIL || d.tipo === TipoDestinatarioAlerta.AMBOS),
      sms: destinatariosCreados.some(d => d.tipo === TipoDestinatarioAlerta.SMS || d.tipo === TipoDestinatarioAlerta.AMBOS),
      webSocket: false,
      mensajeEmail: updateData.mensajePersonalizado,
      mensajeSMS: updateData.mensajePersonalizado
    };

    // Update the configuration
    const updatedConfig = await this.prisma.configuracionAlerta.update({
      where: { id, empresaId },
      data: {
        ...(updateData.tipoAlerta && { tipoAlerta: updateData.tipoAlerta }),
        ...(typeof updateData.activo !== 'undefined' && { activo: updateData.activo }),
        ...(updateData.frecuencia && { frecuencia: updateData.frecuencia }),
        ...(typeof updateData.ventanaEsperaMinutos !== 'undefined' && { ventanaEsperaMinutos: updateData.ventanaEsperaMinutos ?? null }),
        umbralCritico: umbralCritico ? umbralCritico as unknown as Prisma.InputJsonValue : {},
        configuracionNotificacion: configuracionNotificacion ? configuracionNotificacion as unknown as Prisma.InputJsonValue : {},
        ...(destinatariosCreados.length > 0 && {
          destinatarios: {
            deleteMany: {},
            create: destinatariosCreados.map(dest => ({
              destinatarioId: dest.id
            }))
          }
        })
      },
      include: {
        destinatarios: {
          include: {
            destinatario: true
          }
        }
      }
    });

    this.logger.log(`Alerta actualizada: ${updatedConfig.tipoAlerta}`);

    const result: AlertaConfiguracion = {
      id: updatedConfig.id,
      empresaId: updatedConfig.empresaId,
      sensorId: updatedConfig.sensorId,
      tipoAlerta: updatedConfig.tipoAlerta,
      activo: updatedConfig.activo,
      frecuencia: updatedConfig.frecuencia,
      ventanaEsperaMinutos: updatedConfig.ventanaEsperaMinutos || 0,
      umbralCritico: {
        ...umbralCritico,
        destinatarios: updatedConfig.destinatarios
          .filter(d => d.destinatario.tipo === TipoDestinatarioAlerta.SMS || d.destinatario.tipo === TipoDestinatarioAlerta.AMBOS)
          .map(d => d.destinatario.telefono)
          .filter(Boolean) as string[]
      },
      configuracionNotificacion: {
        ...configuracionNotificacion,
        email: updatedConfig.destinatarios.some(d => 
          d.destinatario.tipo === TipoDestinatarioAlerta.EMAIL || d.destinatario.tipo === TipoDestinatarioAlerta.AMBOS
        ),
        sms: updatedConfig.destinatarios.some(d => 
          d.destinatario.tipo === TipoDestinatarioAlerta.SMS || d.destinatario.tipo === TipoDestinatarioAlerta.AMBOS
        ),
      },
      destinatarios: updatedConfig.destinatarios.map(d => ({
        id: d.destinatario.id,
        nombre: d.destinatario.nombre,
        email: d.destinatario.email,
        telefono: d.destinatario.telefono || undefined,
        tipo: d.destinatario.tipo as TipoDestinatarioAlerta,
        activo: d.destinatario.activo,
        empresaId: d.destinatario.empresaId,
        configuracionAlertaId: updatedConfig.id
      })),
      createdAt: updatedConfig.createdAt,
      updatedAt: updatedConfig.updatedAt
    };
    
    // Enviamos configuracionNotificaciones
    const smsDestinatarios = result.destinatarios
      .filter(d => d.tipo === TipoDestinatarioAlerta.SMS || d.tipo === TipoDestinatarioAlerta.AMBOS)
      .filter(d => d.telefono)
      .map(d => d.telefono as string);

    const emailDestinatarios = result.destinatarios
      .filter(d => d.tipo === TipoDestinatarioAlerta.EMAIL || d.tipo === TipoDestinatarioAlerta.AMBOS)
      .map(d => d.email);

    await Promise.all([
      ...smsDestinatarios.map(telefono => 
        this.smsService.sendSMS({ to: telefono, message: `Configuración de alerta actualizada: ${result.tipoAlerta}` })
      ),
      ...emailDestinatarios.map(email =>
        this.notificationService.sendSensorAlert({
          tipo: 'sensor-alert',
          destinatarios: [email],
          variables: {
            mensaje: `Configuración de alerta actualizada: ${result.tipoAlerta}`,
            tipoAlerta: result.tipoAlerta,
            sensorId: result.sensorId
          },
          empresaId: result.empresaId
        }))
    ]);

    return result;
  }

  async eliminarConfiguracionAlerta(id: number, empresaId: number): Promise<void> {
    await this.prisma.configuracionAlerta.delete({
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

      // Verificar umbralCriticoes
      const umbralCriticoExcedido = await this.evaluarUmbrales(lectura, configuracion.umbralCritico as unknown as UmbralCriticoConfig);
      
      if (umbralCriticoExcedido) {
        const alerta = await this.generarAlerta(lectura, configuracion, empresaId);
        alertasGeneradas.push(alerta);
      }
    }

    this.logger.log(`Verificadas ${configuraciones.length} configuraciones, generadas ${alertasGeneradas.length} alertas`);
    return alertasGeneradas;
  }

  public async asociarDestinatarios(alertaId: number, destinatarios: number[], empresaId: number): Promise<{ success: boolean; destinatarios: number[] }> {
    const alerta = await this.prisma.configuracionAlerta.findUnique({ where: { id: alertaId, empresaId } });
    if (!alerta) throw new Error('Alerta no encontrada o no autorizada');
    const validos = await this.prisma.destinatarioAlerta.findMany({
      where: { id: { in: destinatarios }, empresaId },
      select: { id: true }
    });
    const idsValidos = validos.map(d => d.id);
    await this.prisma.configuracionAlerta.update({
      where: { id: alertaId },
      data: {
        destinatarios: {
          connect: idsValidos.map(destinatarioId => ({
            configuracionAlertaId_destinatarioId: {
              configuracionAlertaId: alertaId,
              destinatarioId
            }
          }))
        }
      }
    });
    return { success: true, destinatarios: idsValidos };
  }

  public async desasociarDestinatario(alertaId: number, destinatarioId: number, empresaId: number): Promise<{ success: boolean; destinatarios: number[] }> {
    const alerta = await this.prisma.configuracionAlerta.findUnique({ where: { id: alertaId, empresaId } });
    if (!alerta) throw new Error('Alerta no encontrada o no autorizada');
    await this.prisma.configuracionAlerta.update({
      where: { id: alertaId },
      data: {
        destinatarios: {
          disconnect: [{
            configuracionAlertaId_destinatarioId: {
              configuracionAlertaId: alertaId,
              destinatarioId
            }
          }]
        }
      }
    });
    const updated = await this.prisma.configuracionAlerta.findUnique({
      where: { id: alertaId },
      include: { destinatarios: true }
    });
    const idsActuales = updated?.destinatarios.map(d => d.destinatarioId) || [];
    return { success: true, destinatarios: idsActuales };
  }

  public async editarDestinatarios(alertaId: number, destinatarios: number[], empresaId: number): Promise<{ success: boolean; destinatarios: number[] }> {
    const alerta = await this.prisma.configuracionAlerta.findUnique({ where: { id: alertaId, empresaId } });
    if (!alerta) throw new Error('Alerta no encontrada o no autorizada');
    const validos = await this.prisma.destinatarioAlerta.findMany({
      where: { id: { in: destinatarios }, empresaId },
      select: { id: true }
    });
    const idsValidos = validos.map(d => d.id);
    await this.prisma.configuracionAlerta.update({
      where: { id: alertaId },
      data: {
        destinatarios: {
          set: idsValidos.map(destinatarioId => ({
            configuracionAlertaId_destinatarioId: {
              configuracionAlertaId: alertaId,
              destinatarioId
            }
          }))
        }
      }
    });
    return { success: true, destinatarios: idsValidos };
  }

  private async evaluarUmbrales(lectura: SensorLectura, umbralCriticoes: UmbralCriticoConfig): Promise<boolean> {
    if (!umbralCriticoes) return false;

    switch (lectura.tipo) {
      case 'TEMPERATURA':
        return (umbralCriticoes.temperaturaMin !== undefined && lectura.valor < umbralCriticoes.temperaturaMin) ||
               (umbralCriticoes.temperaturaMax !== undefined && lectura.valor > umbralCriticoes.temperaturaMax);
      
      case 'HUMEDAD':
        return (umbralCriticoes.humedadMin !== undefined && lectura.valor < umbralCriticoes.humedadMin) ||
               (umbralCriticoes.humedadMax !== undefined && lectura.valor > umbralCriticoes.humedadMax);
      
      case 'PESO':
        return (umbralCriticoes.pesoMin !== undefined && lectura.valor < umbralCriticoes.pesoMin) ||
               (umbralCriticoes.pesoMax !== undefined && lectura.valor > umbralCriticoes.pesoMax);
      
      case 'PRESION':
        return (umbralCriticoes.presionMin !== undefined && lectura.valor < umbralCriticoes.presionMin) ||
               (umbralCriticoes.presionMax !== undefined && lectura.valor > umbralCriticoes.presionMax);
      
      default:
        return false;
    }
  }

  private async generarAlerta(lectura: SensorLectura, configuracion: AlertaConfiguracion, empresaId: number): Promise<AlertaGenerada> {
    const mensaje = configuracion.umbralCritico.mensajePersonalizado || 
                   `Alerta: Valor ${lectura.valor} ${lectura.unidad} en sensor ${configuracion.tipoAlerta}`;
    const severidad = this.determinarSeveridad(lectura, configuracion.umbralCritico);

    // Serializar la configuración umbralCritico para almacenamiento JSON
    const umbralCriticoSerializado = {
      ...configuracion.umbralCritico,
      valores: {
        min: configuracion.umbralCritico.temperaturaMin || 
             configuracion.umbralCritico.humedadMin || 
             configuracion.umbralCritico.presionMin || 
             configuracion.umbralCritico.pesoMin,
        max: configuracion.umbralCritico.temperaturaMax || 
             configuracion.umbralCritico.humedadMax || 
             configuracion.umbralCritico.presionMax || 
             configuracion.umbralCritico.pesoMax,
      }
    };

    // Crear registro de alerta
    const alerta = await this.prisma.alertaHistorial.create({
      data: {
        tipo: configuracion.tipoAlerta,
        titulo: `Alerta de ${configuracion.tipoAlerta}`,
        mensaje,
        severidad: severidad as SeveridadAlerta,
        empresaId,
        sensorId: configuracion.sensorId,
        valor: lectura.valor.toString(),
        estado: 'PENDIENTE',
        condicionActivacion: {
          umbralCritico: umbralCriticoSerializado as unknown as Prisma.InputJsonValue,
          lectura: {
            tipo: lectura.tipo,
            valor: lectura.valor,
            unidad: lectura.unidad
          }
        } as unknown as Prisma.InputJsonValue
      }
    });

    // Enviar configuracionNotificaciones si están configuradas
    if (configuracion.umbralCritico.enviarSMS) {
      const destinatarios = configuracion.umbralCritico.destinatarios || [];
      await Promise.all(destinatarios.map(destinatario => 
        this.smsService.sendSMS({
          to: destinatario,
          message: mensaje,
          priority: configuracion.umbralCritico.prioridadSMS || 'normal'
        })
      ));
    }

    if (configuracion.configuracionNotificacion.email) {
      await this.notificationService.sendSensorAlert({
        tipo: 'sensor-alert',
        destinatarios: configuracion.destinatarios.map(d => d.email),
        variables: {
          mensaje,
          tipoAlerta: configuracion.tipoAlerta,
          sensor: configuracion.sensorId,
          empresa: configuracion.empresaId
        },
        empresaId: configuracion.empresaId,
        empresaNombre: 'IAM' // This should come from empresa service
      });
    }

    this.logger.log(`Alerta generada: ${alerta.id} - ${mensaje}`);

    return {
      id: alerta.id,
      tipo: alerta.tipo,
      mensaje: alerta.mensaje,
      severidad: alerta.severidad,
      empresaId: alerta.empresaId,
      sensorId: configuracion.sensorId,
      fecha: alerta.createdAt,
      estado: alerta.estado,
      titulo: alerta.titulo,
      valor: alerta.valor || '',
      condicionActivacion: alerta.condicionActivacion as Record<string, any>,
      detalles: {
        lectura: {
          tipo: lectura.tipo,
          valor: lectura.valor,
          unidad: lectura.unidad
        },
        umbralCritico: configuracion.umbralCritico
      }
    };
  }

  // Lógica de envío de alertas usando include para destinatarios
  private async enviarSMSAlerta(lectura: SensorLectura, configuracion: Prisma.ConfiguracionAlertaGetPayload<{ include: { destinatarios: true } }>, mensaje: string): Promise<void> {
    try {
      const alerta = await this.prisma.configuracionAlerta.findUnique({
        where: { id: configuracion.id },
        include: { destinatarios: { include: { destinatario: true } } }
      });
      if (!alerta || alerta.destinatarios.length === 0) return;
      const telefonos = alerta.destinatarios.map(d => d.destinatario.telefono).filter((t): t is string => !!t);
      if (telefonos.length === 0) return;
      for (const telefono of telefonos) {
        await this.smsService.sendSMS({
          to: telefono,
          message: mensaje,
          priority: 'normal'
        });
        this.logger.log(`SMS de alerta enviado a ${telefono}`);
      }
    } catch (error) {
      this.logger.error('Error enviando SMS de alerta:', error);
    }
  }

  private async enviarEmailAlerta(lectura: SensorLectura, configuracion: Prisma.ConfiguracionAlertaGetPayload<{ include: { destinatarios: true } }>, mensaje: string): Promise<void> {
    try {
      const alerta = await this.prisma.configuracionAlerta.findUnique({
        where: { id: configuracion.id },
        include: { destinatarios: { include: { destinatario: true } } }
      });
      if (!alerta || alerta.destinatarios.length === 0) return;
      const emails = alerta.destinatarios.map(d => d.destinatario.email).filter((e): e is string => !!e);
      if (emails.length === 0) return;
      const empresa = await this.prisma.empresa.findUnique({ 
        where: { id: configuracion.empresaId }, 
        select: { nombre: true } 
      });
      // Suponiendo que notificationService.sendSensorAlert acepta emails como parámetro
      await this.notificationService.sendSensorAlert(
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
      this.logger.log(`Email de alerta enviado a: ${emails.join(', ')}`);
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

  private generarMensajeAlerta(lectura: SensorLectura, configuracion: Prisma.ConfiguracionAlertaGetPayload<{ include: { destinatarios: true } }>): string {
    const umbralCritico = configuracion.umbralCritico as unknown as UmbralCriticoConfig;
    const baseMensaje = umbralCritico?.mensajePersonalizado || `Alerta de ${lectura.tipo}`;
    
    return baseMensaje
      .replace('{tipo}', lectura.tipo)
      .replace('{valor}', lectura.valor.toString())
      .replace('{unidad}', lectura.unidad)
      .replace('{ubicacion}', lectura.ubicacion?.nombre || 'Ubicación Desconocida')
      .replace('{sensor}', lectura.sensor?.nombre || 'Sensor Desconocido')
      .replace('{fecha}', new Date().toLocaleString());
  }

  private determinarSeveridad(lectura: SensorLectura, umbralCriticoes: UmbralCriticoConfig): SeveridadAlerta {
    // Lógica para determinar severidad basada en qué tan lejos está del umbralCritico
    const umbralCritico = 0.5; // 50% más allá del umbralCritico
    
    switch (lectura.tipo) {
      case 'TEMPERATURA':
        if (umbralCriticoes.temperaturaMin !== undefined && lectura.valor < umbralCriticoes.temperaturaMin * umbralCritico) return 'CRITICA';
        if (umbralCriticoes.temperaturaMax !== undefined && lectura.valor > umbralCriticoes.temperaturaMax * (2 - umbralCritico)) return 'CRITICA';
        break;
      case 'HUMEDAD':
        if (umbralCriticoes.humedadMin !== undefined && lectura.valor < umbralCriticoes.humedadMin * umbralCritico) return 'CRITICA';
        if (umbralCriticoes.humedadMax !== undefined && lectura.valor > umbralCriticoes.humedadMax * (2 - umbralCritico)) return 'CRITICA';
        break;
    }
    
    return 'ALTA';
  }
} 