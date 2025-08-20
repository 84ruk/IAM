import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsArray, IsOptional, IsIn, ValidateNested, IsEmail, IsPhoneNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { SensorAlertManagerService } from '../../alertas/services/sensor-alert-manager.service';
import { NotificationService } from '../../notifications/notification.service';
import { SMSNotificationService } from '../../alertas/services/sms-notification.service';
import { SensoresGateway } from '../../websockets/sensores/sensores.gateway';

// DTOs para configuración de alertas
export class DestinatarioAlertaDto {
  @IsString()
  id: string;

  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  telefono: string;

  @IsIn(['EMAIL', 'SMS', 'AMBOS'])
  tipo: 'EMAIL' | 'SMS' | 'AMBOS';

  @IsIn(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'])
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

  @IsBoolean()
  activo: boolean;
}

export class NivelEscalamientoDto {
  @IsString()
  id: string;

  @IsNumber()
  nivel: number;

  @IsNumber()
  tiempoMinutos: number;

  @IsArray()
  @IsString({ each: true })
  destinatarios: string[];

  @IsString()
  mensaje: string;
}

export class ConfiguracionEscalamientoDto {
  @IsBoolean()
  activo: boolean;

  @IsNumber()
  tiempoEscalamientoMinutos: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NivelEscalamientoDto)
  niveles: NivelEscalamientoDto[];
}

export class ConfiguracionHorarioDto {
  @IsBoolean()
  activo: boolean;

  @IsString()
  horaInicio: string; // HH:mm

  @IsString()
  horaFin: string; // HH:mm

  @IsArray()
  @IsNumber({}, { each: true })
  diasSemana: number[]; // 0=Domingo, 1=Lunes, etc.

  @IsString()
  zonaHoraria: string;
}

export class TiposNotificacionDto {
  @IsBoolean()
  email: boolean;

  @IsBoolean()
  sms: boolean;

  @IsBoolean()
  webSocket: boolean;

  @IsBoolean()
  push: boolean;
}

export class ConfiguracionAlertasSensorDto {
  @IsOptional()
  @IsNumber()
  sensorId?: number;

  @ValidateNested()
  @Type(() => TiposNotificacionDto)
  tiposNotificacion: TiposNotificacionDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DestinatarioAlertaDto)
  destinatarios: DestinatarioAlertaDto[];

  @ValidateNested()
  @Type(() => ConfiguracionEscalamientoDto)
  escalamiento: ConfiguracionEscalamientoDto;

  @ValidateNested()
  @Type(() => ConfiguracionHorarioDto)
  horario: ConfiguracionHorarioDto;

  @IsNumber()
  retrasoNotificacionMinutos: number;

  @IsNumber()
  maxIntentosNotificacion: number;
}

@ApiTags('Alertas de Sensores')
@Controller('sensores')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SensorAlertasController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertManager: SensorAlertManagerService,
    private readonly notificationService: NotificationService,
    private readonly smsNotificationService: SMSNotificationService,
    private readonly sensoresGateway: SensoresGateway,
  ) {}

  /**
   * 📊 Obtener alertas de un sensor específico
   */
  @Get(':id/alertas')
  @ApiOperation({ summary: 'Obtener alertas de un sensor específico' })
  @ApiResponse({ status: 200, description: 'Alertas obtenidas exitosamente' })
  @ApiResponse({ status: 404, description: 'Sensor no encontrado' })
  async obtenerAlertasSensor(
    @Param('id') sensorId: string,
    @CurrentUser() user: any,
    @Query('estado') estado?: string,
    @Query('limite') limite: string = '50',
    @Query('pagina') pagina: string = '1'
  ) {
    try {
      const sensorIdNum = parseInt(sensorId);
      const limiteNum = parseInt(limite) || 50;
      const paginaNum = parseInt(pagina) || 1;
      const offset = (paginaNum - 1) * limiteNum;

      // Verificar que el sensor existe y pertenece a la empresa
      const sensor = await this.prisma.sensor.findFirst({
        where: { 
          id: sensorIdNum, 
          empresaId: user.empresaId 
        },
        include: {
          ubicacion: true
        }
      });

      if (!sensor) {
        throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
      }

      // Construir filtros para las alertas
      const where: any = { 
        empresaId: user.empresaId,
        sensorId: sensorIdNum,
        tipo: 'SENSOR'
      };
      
      if (estado) {
        where.estado = estado;
      }

      // Obtener alertas del sensor
      const [alertas, total] = await Promise.all([
        this.prisma.alertaHistorial.findMany({
          where,
          orderBy: { fechaEnvio: 'desc' },
          take: limiteNum,
          skip: offset,
          include: {
            sensor: {
              select: {
                id: true,
                nombre: true,
                tipo: true,
                ubicacion: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
              },
            },
            producto: {
              select: {
                id: true,
                nombre: true,
                sku: true,
              },
            },
          },
        }),
        this.prisma.alertaHistorial.count({ where }),
      ]);

      // Calcular estadísticas del sensor
      const alertasActivas = alertas.filter(a => a.estado === 'ACTIVA').length;
      const alertasResueltas = alertas.filter(a => a.estado === 'RESUELTA').length;
      const alertasEscaladas = alertas.filter(a => a.estado === 'ESCALADA').length;

      return {
        success: true,
        data: {
          sensor: {
            id: sensor.id,
            nombre: sensor.nombre,
            tipo: sensor.tipo,
            ubicacion: sensor.ubicacion?.nombre,
          },
          alertas,
          estadisticas: {
            total: total,
            activas: alertasActivas,
            resueltas: alertasResueltas,
            escaladas: alertasEscaladas,
          },
          paginacion: {
            total,
            pagina: paginaNum,
            limite: limiteNum,
            totalPaginas: Math.ceil(total / limiteNum),
          },
        },
        message: 'Alertas del sensor obtenidas correctamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error obteniendo alertas del sensor: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 🔔 Obtener alertas activas de un sensor
   */
  @Get(':id/alertas/activas')
  @ApiOperation({ summary: 'Obtener alertas activas de un sensor' })
  @ApiResponse({ status: 200, description: 'Alertas activas obtenidas exitosamente' })
  async obtenerAlertasActivas(
    @Param('id') sensorId: string,
    @CurrentUser() user: any
  ) {
    try {
      const sensorIdNum = parseInt(sensorId);

      // Verificar que el sensor existe
      const sensor = await this.prisma.sensor.findFirst({
        where: { 
          id: sensorIdNum, 
          empresaId: user.empresaId 
        }
      });

      if (!sensor) {
        throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
      }

      // Obtener alertas activas del sensor
      const alertasActivas = await this.prisma.alertaHistorial.findMany({
        where: { 
          empresaId: user.empresaId,
          sensorId: sensorIdNum,
          tipo: 'SENSOR',
          estado: 'ACTIVA'
        },
        orderBy: { fechaEnvio: 'desc' },
        include: {
          sensor: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
            },
          },
        },
      });

      return {
        success: true,
        data: {
          sensorId: sensorIdNum,
          alertasActivas,
          total: alertasActivas.length,
        },
        message: 'Alertas activas obtenidas correctamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error obteniendo alertas activas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 📈 Obtener histórico de alertas de un sensor
   */
  @Get(':id/alertas/historico')
  @ApiOperation({ summary: 'Obtener histórico de alertas de un sensor' })
  @ApiResponse({ status: 200, description: 'Histórico obtenido exitosamente' })
  async obtenerHistoricoAlertas(
    @Param('id') sensorId: string,
    @CurrentUser() user: any,
    @Query('dias') dias: string = '30',
    @Query('estado') estado?: string
  ) {
    try {
      const sensorIdNum = parseInt(sensorId);
      const diasNum = parseInt(dias) || 30;

      // Verificar que el sensor existe
      const sensor = await this.prisma.sensor.findFirst({
        where: { 
          id: sensorIdNum, 
          empresaId: user.empresaId 
        }
      });

      if (!sensor) {
        throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
      }

      // Calcular fecha límite
      const fechaLimite = new Date(Date.now() - diasNum * 24 * 60 * 60 * 1000);

      // Construir filtros
      const where: any = { 
        empresaId: user.empresaId,
        sensorId: sensorIdNum,
        tipo: 'SENSOR',
        fechaEnvio: { gte: fechaLimite }
      };
      
      if (estado) {
        where.estado = estado;
      }

      // Obtener histórico de alertas
      const historico = await this.prisma.alertaHistorial.findMany({
        where,
        orderBy: { fechaEnvio: 'desc' },
        include: {
          sensor: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
            },
          },
        },
      });

      // Agrupar por fecha para análisis temporal
      const agrupadoPorFecha = historico.reduce((acc, alerta) => {
        const fecha = alerta.fechaEnvio.toISOString().split('T')[0];
        if (!acc[fecha]) {
          acc[fecha] = [];
        }
        acc[fecha].push(alerta);
        return acc;
      }, {} as Record<string, any[]>);

      return {
        success: true,
        data: {
          sensorId: sensorIdNum,
          historico,
          agrupadoPorFecha,
          estadisticas: {
            total: historico.length,
            porEstado: {
              ACTIVA: historico.filter(a => a.estado === 'ACTIVA').length,
              RESUELTA: historico.filter(a => a.estado === 'RESUELTA').length,
              ESCALADA: historico.filter(a => a.estado === 'ESCALADA').length,
            },
            porSeveridad: {
              BAJA: historico.filter(a => a.severidad === 'BAJA').length,
              MEDIA: historico.filter(a => a.severidad === 'MEDIA').length,
              ALTA: historico.filter(a => a.severidad === 'ALTA').length,
              CRITICA: historico.filter(a => a.severidad === 'CRITICA').length,
            },
          },
          periodo: {
            dias: diasNum,
            fechaInicio: fechaLimite,
            fechaFin: new Date(),
          },
        },
        message: 'Histórico de alertas obtenido correctamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error obteniendo histórico: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ⚙️ Guardar configuración de alertas de un sensor
   */
  @Post(':id/alertas/configuracion')
  @ApiOperation({ summary: 'Guardar configuración de alertas de un sensor' })
  @ApiResponse({ status: 200, description: 'Configuración guardada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async guardarConfiguracionAlertas(
    @Param('id') sensorId: string,
    @Body() configuracion: ConfiguracionAlertasSensorDto,
    @CurrentUser() user: any
  ) {
    try {
      const sensorIdNum = parseInt(sensorId);

      // Verificar que el sensor existe
      const sensor = await this.prisma.sensor.findFirst({
        where: { 
          id: sensorIdNum, 
          empresaId: user.empresaId 
        }
      });

      if (!sensor) {
        throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
      }

      // Validar configuración
      this.validarConfiguracionAlertas(configuracion);

      // Obtener configuración actual del sensor
      const configuracionActual = sensor.configuracion as any || {};
      
      // Actualizar configuración
      const nuevaConfiguracion = {
        ...configuracionActual,
        alertas: {
          tiposNotificacion: configuracion.tiposNotificacion,
          destinatarios: configuracion.destinatarios,
          escalamiento: configuracion.escalamiento,
          horario: configuracion.horario,
          retrasoNotificacionMinutos: configuracion.retrasoNotificacionMinutos,
          maxIntentosNotificacion: configuracion.maxIntentosNotificacion,
          ultimaActualizacion: new Date(),
          actualizadoPor: user.id,
        }
      };

      // Guardar en la base de datos
      const sensorActualizado = await this.prisma.sensor.update({
        where: { id: sensorIdNum },
        data: {
          configuracion: nuevaConfiguracion
        },
        include: {
          ubicacion: true
        }
      });

      // Crear log de auditoría
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          userName: user.nombre || user.email,
          action: 'ACTUALIZAR_CONFIGURACION_ALERTAS',
          resource: 'SENSOR',
          resourceId: sensorIdNum,
          details: JSON.stringify({
            sensorId: sensorIdNum,
            configuracion: nuevaConfiguracion.alertas,
            cambios: 'Configuración de alertas actualizada'
          }),
          ipAddress: 'N/A', // Se puede obtener del request
          userAgent: 'N/A', // Se puede obtener del request
          empresaId: user.empresaId,
          empresaName: 'N/A', // Se puede obtener del request
        }
      });

      return {
        success: true,
        data: {
          sensorId: sensorIdNum,
          sensorNombre: sensor.nombre,
          configuracion: nuevaConfiguracion.alertas,
          ultimaActualizacion: nuevaConfiguracion.alertas.ultimaActualizacion,
        },
        message: 'Configuración de alertas guardada exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error guardando configuración: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 📋 Obtener configuración de alertas de un sensor
   */
  @Get(':id/alertas/configuracion')
  @ApiOperation({ summary: 'Obtener configuración de alertas de un sensor' })
  @ApiResponse({ status: 200, description: 'Configuración obtenida exitosamente' })
  async obtenerConfiguracionAlertas(
    @Param('id') sensorId: string,
    @CurrentUser() user: any
  ) {
    try {
      const sensorIdNum = parseInt(sensorId);

      // Verificar que el sensor existe
      const sensor = await this.prisma.sensor.findFirst({
        where: { 
          id: sensorIdNum, 
          empresaId: user.empresaId 
        },
        include: {
          ubicacion: true
        }
      });

      if (!sensor) {
        throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
      }

      // Obtener configuración actual
      const configuracionActual = sensor.configuracion as any || {};
      const configuracionAlertas = configuracionActual.alertas || this.getConfiguracionPorDefecto();

      return {
        success: true,
        data: {
          sensorId: sensorIdNum,
          sensorNombre: sensor.nombre,
          sensorTipo: sensor.tipo,
          ubicacion: sensor.ubicacion?.nombre,
          configuracion: configuracionAlertas,
          ultimaActualizacion: configuracionAlertas.ultimaActualizacion || null,
        },
        message: 'Configuración de alertas obtenida correctamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error obteniendo configuración: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 👥 Gestionar destinatarios de alertas de un sensor
   */
  @Post(':id/alertas/destinatarios')
  @ApiOperation({ summary: 'Gestionar destinatarios de alertas de un sensor' })
  @ApiResponse({ status: 200, description: 'Destinatarios gestionados exitosamente' })
  async gestionarDestinatarios(
    @Param('id') sensorId: string,
    @Body() body: { 
      accion: 'AGREGAR' | 'ACTUALIZAR' | 'ELIMINAR';
      destinatario: DestinatarioAlertaDto;
    },
    @CurrentUser() user: any
  ) {
    try {
      const sensorIdNum = parseInt(sensorId);

      // Verificar que el sensor existe
      const sensor = await this.prisma.sensor.findFirst({
        where: { 
          id: sensorIdNum, 
          empresaId: user.empresaId 
        }
      });

      if (!sensor) {
        throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
      }

      // Obtener configuración actual
      const configuracionActual = sensor.configuracion as any || {};
      const configuracionAlertas = configuracionActual.alertas || this.getConfiguracionPorDefecto();

      let destinatarios = configuracionAlertas.destinatarios || [];

      // Aplicar acción
      switch (body.accion) {
        case 'AGREGAR':
          const nuevoId = Date.now().toString();
          destinatarios.push({
            ...body.destinatario,
            id: nuevoId
          });
          break;

        case 'ACTUALIZAR':
          destinatarios = destinatarios.map(d => 
            d.id === body.destinatario.id ? body.destinatario : d
          );
          break;

        case 'ELIMINAR':
          destinatarios = destinatarios.filter(d => d.id !== body.destinatario.id);
          break;

        default:
          throw new HttpException('Acción no válida', HttpStatus.BAD_REQUEST);
      }

      // Actualizar configuración
      const nuevaConfiguracion = {
        ...configuracionActual,
        alertas: {
          ...configuracionAlertas,
          destinatarios,
          ultimaActualizacion: new Date(),
          actualizadoPor: user.id,
        }
      };

      // Guardar en la base de datos
      await this.prisma.sensor.update({
        where: { id: sensorIdNum },
        data: {
          configuracion: nuevaConfiguracion
        }
      });

      return {
        success: true,
        data: {
          sensorId: sensorIdNum,
          destinatarios,
          total: destinatarios.length,
          accion: body.accion,
        },
        message: `Destinatario ${body.accion.toLowerCase()} exitosamente`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error gestionando destinatarios: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 🧪 Probar configuración de alertas de un sensor
   */
  @Post(':id/alertas/probar')
  @ApiOperation({ summary: 'Probar configuración de alertas de un sensor' })
  @ApiResponse({ status: 200, description: 'Prueba ejecutada exitosamente' })
  async probarConfiguracionAlertas(
    @Param('id') sensorId: string,
    @Body() body: { 
      tipoPrueba: 'EMAIL' | 'SMS' | 'WEBSOCKET';
      destinatario?: string;
    },
    @CurrentUser() user: any
  ) {
    try {
      const sensorIdNum = parseInt(sensorId);

      // Verificar que el sensor existe
      const sensor = await this.prisma.sensor.findFirst({
        where: { 
          id: sensorIdNum, 
          empresaId: user.empresaId 
        }
      });

      if (!sensor) {
        throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
      }

      // Obtener configuración actual
      const configuracionActual = sensor.configuracion as any || {};
      const configuracionAlertas = configuracionActual.alertas || this.getConfiguracionPorDefecto();

      // Simular envío de notificación de prueba
      const resultadoPrueba = await this.simularNotificacionPrueba(
        sensor,
        configuracionAlertas,
        body.tipoPrueba,
        body.destinatario
      );

      return {
        success: true,
        data: {
          sensorId: sensorIdNum,
          tipoPrueba: body.tipoPrueba,
          resultado: resultadoPrueba,
          timestamp: new Date(),
        },
        message: 'Prueba de configuración ejecutada correctamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error en prueba de configuración: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Métodos privados de validación y utilidades
  private validarConfiguracionAlertas(configuracion: ConfiguracionAlertasSensorDto) {
    // Validar tipos de notificación
    if (!configuracion.tiposNotificacion) {
      throw new HttpException('Tipos de notificación requeridos', HttpStatus.BAD_REQUEST);
    }

    // Validar destinatarios
    if (!Array.isArray(configuracion.destinatarios)) {
      throw new HttpException('Destinatarios debe ser un array', HttpStatus.BAD_REQUEST);
    }

    // Validar escalamiento
    if (configuracion.escalamiento.activo) {
      if (configuracion.escalamiento.tiempoEscalamientoMinutos < 1) {
        throw new HttpException('Tiempo de escalamiento debe ser mayor a 0', HttpStatus.BAD_REQUEST);
      }
    }

    // Validar horario
    if (configuracion.horario.activo) {
      if (!configuracion.horario.horaInicio || !configuracion.horario.horaFin) {
        throw new HttpException('Horario de inicio y fin requeridos', HttpStatus.BAD_REQUEST);
      }
    }
  }

  private getConfiguracionPorDefecto() {
    return {
      tiposNotificacion: {
        email: true,
        sms: false,
        webSocket: true,
        push: false
      },
      destinatarios: [
        {
          id: '1',
          nombre: 'Administrador',
          email: 'admin@empresa.com',
          telefono: '+52 55 1234 5678',
          tipo: 'EMAIL',
          prioridad: 'ALTA',
          activo: true
        }
      ],
      escalamiento: {
        activo: false,
        tiempoEscalamientoMinutos: 30,
        niveles: [
          {
            id: '1',
            nivel: 1,
            tiempoMinutos: 15,
            destinatarios: ['1'],
            mensaje: 'Primera notificación de escalamiento'
          }
        ]
      },
      horario: {
        activo: false,
        horaInicio: '08:00',
        horaFin: '18:00',
        diasSemana: [1, 2, 3, 4, 5], // Lunes a Viernes
        zonaHoraria: 'America/Mexico_City'
      },
      retrasoNotificacionMinutos: 0,
      maxIntentosNotificacion: 3
    };
  }

  private async simularNotificacionPrueba(
    sensor: any,
    configuracion: any,
    tipoPrueba: string,
    destinatario?: string
  ) {
    const mensajePrueba = `🔔 PRUEBA: Alerta de prueba del sensor ${sensor.nombre} (${sensor.tipo})`;
    const timestamp = new Date();
    
    try {
      switch (tipoPrueba) {
        case 'EMAIL':
          // Enviar email real usando el servicio de configuracionNotificaciones
          if (configuracion.tiposNotificacion?.email) {
            const emailDestinatario = destinatario || configuracion.destinatarios?.find(d => d.tipo === 'EMAIL' || d.tipo === 'AMBOS')?.email || 'admin@empresa.com';
            
            console.log(`📧 Enviando email de prueba a: ${emailDestinatario}`);
            
            try {
              // Crear datos de sensor para el servicio de configuracionNotificaciones
              const sensorData = {
                nombre: sensor.nombre,
                tipo: sensor.tipo,
                severidad: 'MEDIA',
                valor: 0,
                unidad: 'N/A',
                producto: null,
                ubicacion: null
              };
              
              // Obtener nombre de la empresa
              const empresa = await this.prisma.empresa.findUnique({
                where: { id: sensor.empresaId },
                select: { nombre: true }
              });
              
              // Enviar email real usando NotificationService (mismo patrón que forgot-password)
              const resultadoEmail = await this.notificationService.sendSensorAlert(
                sensorData,
                sensor.empresaId,
                empresa?.nombre || 'Empresa'
              );
              
              if (resultadoEmail.success) {
                return {
                  tipo: 'EMAIL',
                  enviado: true,
                  mensaje: mensajePrueba,
                  destinatario: emailDestinatario,
                  timestamp: timestamp,
                  detalles: `Email de prueba enviado correctamente a ${emailDestinatario}`
                };
              } else {
                throw new Error(`Error enviando email: ${resultadoEmail.error}`);
              }
            } catch (emailError) {
              console.error(`❌ Error enviando email de prueba:`, emailError);
              return {
                tipo: 'EMAIL',
                enviado: false,
                mensaje: mensajePrueba,
                destinatario: emailDestinatario,
                timestamp: timestamp,
                detalles: `Error enviando email: ${emailError.message}`
              };
            }
          }
          break;
        
        case 'SMS':
          // Enviar SMS real usando el servicio de configuracionNotificaciones
          if (configuracion.tiposNotificacion?.sms) {
            const telefonoDestinatario = destinatario || configuracion.destinatarios?.find(d => d.tipo === 'SMS' || d.tipo === 'AMBOS')?.telefono || '+52 55 1234 5678';
            
            console.log(`📱 Enviando SMS de prueba a: ${telefonoDestinatario}`);
            
            try {
              // Enviar SMS real usando SMSNotificationService
              const resultadoSMS = await this.smsNotificationService.sendSMS({
                to: telefonoDestinatario,
                message: mensajePrueba,
                priority: 'high'
              });
              
              if (resultadoSMS) {
                return {
                  tipo: 'SMS',
                  enviado: true,
                  mensaje: mensajePrueba,
                  destinatario: telefonoDestinatario,
                  timestamp: timestamp,
                  detalles: `SMS de prueba enviado correctamente a ${telefonoDestinatario}`
                };
              } else {
                throw new Error('Error enviando SMS');
              }
            } catch (smsError) {
              console.error(`❌ Error enviando SMS de prueba:`, smsError);
              return {
                tipo: 'SMS',
                enviado: false,
                mensaje: mensajePrueba,
                destinatario: telefonoDestinatario,
                timestamp: timestamp,
                detalles: `Error enviando SMS: ${smsError.message}`
              };
            }
          }
          break;
        
        case 'WEBSOCKET':
          // Emitir notificación real por WebSocket
          if (configuracion.tiposNotificacion?.webSocket) {
            console.log(`🌐 Emitiendo notificación WebSocket de prueba`);
            
            try {
              // Emitir alerta real por WebSocket
              await this.sensoresGateway.emitirAlerta({
                id: `prueba-${Date.now()}`,
                tipo: 'SENSOR_PRUEBA',
                severidad: 'MEDIA',
                mensaje: mensajePrueba,
                sensorId: sensor.id,
                ubicacionId: sensor.ubicacionId,
                empresaId: sensor.empresaId,
                fecha: timestamp,
                requiereAccion: false
              }, sensor.empresaId);
              
              return {
                tipo: 'WEBSOCKET',
                enviado: true,
                mensaje: mensajePrueba,
                destinatario: 'Cliente WebSocket',
                timestamp: timestamp,
                detalles: 'Notificación WebSocket emitida correctamente a todos los clientes conectados'
              };
            } catch (wsError) {
              console.error(`❌ Error emitiendo WebSocket de prueba:`, wsError);
              return {
                tipo: 'WEBSOCKET',
                enviado: false,
                mensaje: mensajePrueba,
                destinatario: 'Cliente WebSocket',
                timestamp: timestamp,
                detalles: `Error emitiendo WebSocket: ${wsError.message}`
              };
            }
          }
          break;
        
        default:
          throw new HttpException('Tipo de prueba no válido', HttpStatus.BAD_REQUEST);
      }
      
      // Si llegamos aquí, el tipo de notificación no está habilitado
      throw new HttpException(`Tipo de notificación ${tipoPrueba} no está habilitado en la configuración`, HttpStatus.BAD_REQUEST);
      
    } catch (error) {
      console.error(`❌ Error en prueba de notificación ${tipoPrueba}:`, error);
      
      return {
        tipo: tipoPrueba as any,
        enviado: false,
        mensaje: mensajePrueba,
        destinatario: destinatario || 'No especificado',
        timestamp: timestamp,
        detalles: `Error: ${error.message}`
      };
    }
  }
}
