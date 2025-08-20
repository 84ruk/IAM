import { SeveridadAlerta } from '@prisma/client';
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
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SensorAlertManagerService } from '../services/sensor-alert-manager.service';
import { UmbralesSensorDto, ConfiguracionUmbralesEmpresaDto } from '../../sensores/dto/umbrales-sensor.dto';
import { SensorTipo } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UnifiedEmpresaGuard } from 'src/auth/guards/unified-empresa.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { EmpresaRequired } from 'src/auth/decorators/empresa-required.decorator';
import { JwtUser } from 'src/auth/interfaces/jwt-user.interface';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Prisma } from '@prisma/client';

@Controller('sensor-alerts')
@UseGuards(JwtAuthGuard)
export class SensorAlertsController {
  constructor(
    private readonly alertManager: SensorAlertManagerService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 📊 Obtiene estadísticas de alertas para la empresa del usuario
   */
  @Get('estadisticas')
  async obtenerEstadisticas(
    @Request() req,
    @Query('dias') dias: string = '7'
  ) {
    try {
      const empresaId = req.user.empresaId;
      const diasNum = parseInt(dias) || 7;
      
      const estadisticas = await this.alertManager.obtenerEstadisticasAlertas(empresaId, diasNum);
      
      return {
        success: true,
        data: estadisticas,
        message: 'Estadísticas obtenidas correctamente',
      };
    } catch (error) {
      throw new HttpException(
        `Error obteniendo estadísticas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 📋 Lista todas las alertas de la empresa
   */
  @Get()
  async listarAlertas(
    @Request() req,
    @Query('estado') estado?: string,
    @Query('tipo') tipo?: string,
    @Query('severidad') severidad?: SeveridadAlerta,
    @Query('limite') limite: string = '50',
    @Query('pagina') pagina: string = '1',
  ) {
    try {
      const empresaId = req.user.empresaId;
      const limiteNum = parseInt(limite) || 50;
      const paginaNum = parseInt(pagina) || 1;
      const offset = (paginaNum - 1) * limiteNum;

      const where: any = { empresaId };
      
      if (estado) where.estado = estado;
      if (tipo) where.tipo = tipo;
      if (severidad) where.severidad = severidad;

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

      return {
        success: true,
        data: {
          alertas,
          paginacion: {
            total,
            pagina: paginaNum,
            limite: limiteNum,
            totalPaginas: Math.ceil(total / limiteNum),
          },
        },
        message: 'Alertas obtenidas correctamente',
      };
    } catch (error) {
      throw new HttpException(
        `Error listando alertas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 🔍 Obtiene una alerta específica por ID
   */
  @Get(':id')
  async obtenerAlerta(@Request() req, @Param('id') id: string) {
    try {
      const empresaId = req.user.empresaId;
      const alertaId = parseInt(id);

      const alerta = await this.prisma.alertaHistorial.findFirst({
        where: {
          id: alertaId,
          empresaId,
        },
        include: {
          sensor: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
              configuracion: true,
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
      });

      if (!alerta) {
        throw new HttpException('Alerta no encontrada', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: alerta,
        message: 'Alerta obtenida correctamente',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Error obteniendo alerta: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ⚙️ Configura umbralCriticoes por sensor (forma compatible con frontend newer)
   */
  @Post('sensores/umbralCriticoes')
  async configurarUmbrales(@Request() req, @Body() dto: { sensorId: number; tipo: SensorTipo; umbralCriticoes: any }) {
    try {
      const empresaId = req.user.empresaId;
      const sensorActualizado = await this.prisma.sensor.update({
        where: { id: dto.sensorId, empresaId },
        data: {
          configuracion: {
            ...dto.umbralCriticoes,
            ultimaActualizacion: new Date(),
          },
        },
        include: { ubicacion: { select: { id: true, nombre: true } } },
      });

      return {
        success: true,
        data: {
          sensorId: sensorActualizado.id,
          tipo: dto.tipo,
          umbralCriticoes: dto.umbralCriticoes as UmbralesSensorDto,
          ubicacion: sensorActualizado.ubicacion?.nombre || '',
        },
        message: 'Umbrales configurados correctamente',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Error configurando umbralCriticoes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene umbralCriticoes del sensor
   */
  @Get('sensores/:id/umbralCriticoes')
  @UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
  @EmpresaRequired()
  async obtenerUmbrales(
    @CurrentUser() currentUser: JwtUser,
    @Param('id') id: string
  ) {
    const empresaId = currentUser.empresaId;
    const sensor = await this.prisma.sensor.findFirst({ where: { id: Number(id), empresaId }, include: { ubicacion: true } });
    if (!sensor) throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
    return {
      success: true,
      data: {
        sensorId: sensor.id,
        tipo: sensor.tipo,
        umbralCriticoes: (sensor.configuracion as any) || {},
        ubicacion: sensor.ubicacion?.nombre || '',
      },
    };
  }

  /**
   * 📋 Lista las configuraciones de alertas de la empresa
   */
  @Get('configuraciones/listar')
  @UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
  @EmpresaRequired()
    async listarConfiguraciones(
    @CurrentUser() currentUser: JwtUser,
  ) {
    try {
      const empresaId = currentUser.empresaId;

      const configuraciones = await this.prisma.sensor.findMany({
        where: { empresaId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          tipo: true,
          nombre: true,
          activo: true,
          configuracion: true,
          ubicacion: {
            select: {
              id: true,
              nombre: true,
            },
          },
          updatedAt: true,
        },
      });

      return {
        success: true,
        data: configuraciones,
        message: 'Configuraciones obtenidas correctamente',
      };
    } catch (error) {
      throw new HttpException(
        `Error listando configuraciones: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 🔄 Actualiza el estado de una alerta
   */
  @Put(':id/estado')
  async actualizarEstadoAlerta(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTA' | 'IGNORADA' }
  ) {
    try {
      const empresaId = req.user.empresaId;
      const alertaId = parseInt(id);
      const nuevoEstado = body.estado;

      if (!nuevoEstado) {
        throw new HttpException('Estado requerido', HttpStatus.BAD_REQUEST);
      }

      const actualizado = await this.alertManager.actualizarEstadoAlerta(
        id,
        nuevoEstado,
        empresaId
      );

      if (!actualizado) {
        throw new HttpException('Error actualizando estado de alerta', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        success: true,
        message: `Estado de alerta actualizado a ${nuevoEstado}`,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Error actualizando estado: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 🧪 Simula una alerta para testing
   */
  @Post('simular')
  async simularAlerta(
    @Request() req,
    @Body() body: {
      tipoSensor: SensorTipo;
      valor: number;
      sensorId: number;
      ubicacionId: number;
      productoId?: number;
    }
  ) {
    try {
      const empresaId = req.user.empresaId;
      
      // Solo permitir en desarrollo
      if (process.env.NODE_ENV === 'production') {
        throw new HttpException('Simulación no permitida en producción', HttpStatus.FORBIDDEN);
      }

      const lecturaSimulada = {
        id: Date.now(),
        tipo: body.tipoSensor,
        valor: body.valor,
        unidad: this.obtenerUnidadSensor(body.tipoSensor),
        fecha: new Date(),
        sensorId: body.sensorId,
        ubicacionId: body.ubicacionId,
        productoId: body.productoId,
        timestamp: new Date(),
      };

      const alerta = await this.alertManager.procesarLecturaSensor(lecturaSimulada, empresaId);

      return {
        success: true,
        data: {
          lecturaSimulada,
          alertaGenerada: alerta,
        },
        message: 'Simulación ejecutada correctamente',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Error en simulación: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 🗑️ Elimina una configuración de alerta
   */
  @Delete('configuraciones/:id')
  async eliminarConfiguracion(
    @Request() req,
    @Param('id') id: string
  ) {
    try {
      const empresaId = req.user.empresaId;
      const configId = parseInt(id);

      const sensor = await this.prisma.sensor.findFirst({
        where: {
          id: configId,
          empresaId,
        },
      });

      if (!sensor) {
        throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
      }

      // Limpiar la configuración del sensor
      await this.prisma.sensor.update({
        where: { id: configId },
        data: {
          configuracion: {}
        }
      });

      return {
        success: true,
        message: 'Configuración eliminada correctamente',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Error eliminando configuración: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 🔌 Activa/desactiva una configuración de alerta
   */
  @Put('configuraciones/:id/toggle')
  async toggleConfiguracion(
    @Request() req,
    @Param('id') id: string
  ) {
    try {
      const empresaId = req.user.empresaId;
      const configId = parseInt(id);

      const sensor = await this.prisma.sensor.findFirst({
        where: {
          id: configId,
          empresaId,
        },
      });

      if (!sensor) {
        throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
      }

      const nuevoEstado = !sensor.activo;

      await this.prisma.sensor.update({
        where: { id: configId },
        data: { activo: nuevoEstado },
      });

      return {
        success: true,
        data: { activo: nuevoEstado },
        message: `Sensor ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Error cambiando estado: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 🎯 Obtiene la unidad de medida para un tipo de sensor
   */
  private obtenerUnidadSensor(tipo: SensorTipo): string {
    switch (tipo) {
      case SensorTipo.PESO:
        return 'g';
      case SensorTipo.TEMPERATURA:
        return '°C';
      case SensorTipo.HUMEDAD:
        return '%';
      case SensorTipo.PRESION:
        return 'hPa';
      default:
        return 'un';
    }
  }

  /**
   * Obtiene los destinatarios asociados a una ubicación específica
   */
  @Get('ubicaciones/:ubicacionId/destinatarios')
  @UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
  @EmpresaRequired()
  async obtenerDestinatariosPorUbicacion(
    @CurrentUser() currentUser: JwtUser,
    @Param('ubicacionId') ubicacionId: string
  ) {
    const empresaId = currentUser.empresaId;
    // 1. Buscar sensores de la ubicación y empresa
    const sensores = await this.prisma.sensor.findMany({
      where: {
        empresaId,
        ubicacionId: Number(ubicacionId),
      },
      select: { id: true },
    });
    const sensorIds = sensores.map(s => s.id);
    if (sensorIds.length === 0) {
      return { success: true, data: [] };
    }
    // 2. Buscar configuraciones de alerta de esos sensores
    const configuraciones = await this.prisma.configuracionAlerta.findMany({
      where: {
        sensorId: { in: sensorIds },
        empresaId,
      },
      include: {
        destinatarios: {
          include: {
            destinatario: true,
          },
        },
      },
    });
    // 3. Unir todos los destinatarios únicos
    const destinatarios = configuraciones.flatMap(c => c.destinatarios.map(d => d.destinatario));
    // Eliminar duplicados por id
    const destinatariosUnicos = Array.from(new Map(destinatarios.map(d => [d.id, d])).values());
    return {
      success: true,
      data: destinatariosUnicos,
    };
  }

  /**
   * Obtiene la configuración de alerta y destinatarios de un sensor
   */
  @Get('sensores/:sensorId/alertas/configuracion')
  @UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
  @EmpresaRequired()
  async obtenerConfiguracionAlertaSensor(
    @CurrentUser() currentUser: JwtUser,
    @Param('sensorId') sensorId: string
  ) {
    const empresaId = currentUser.empresaId;
    const config = await this.prisma.configuracionAlerta.findFirst({
      where: {
        sensorId: Number(sensorId),
        empresaId,
      },
      include: {
        destinatarios: {
          include: {
            destinatario: true,
          },
        },
      },
    });
    if (!config) {
      return { success: true, data: null };
    }
    return {
      success: true,
      data: {
        ...config,
        destinatarios: config.destinatarios.map(d => d.destinatario),
      },
    };
  }

  /**
   * Crea o actualiza la configuración de alerta y destinatarios de un sensor
   */
  @Post('sensores/:sensorId/alertas/configuracion')
  @UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
  @EmpresaRequired()
  async guardarConfiguracionAlertaSensor(
    @CurrentUser() currentUser: JwtUser,
    @Param('sensorId') sensorId: string,
    @Body() body: { tipoAlerta: string, frecuencia: string, ventanaEsperaMinutos?: number, umbralCritico?: any, configuracionNotificacion?: any, destinatarios: number[] }
  ) {
    const empresaId = currentUser.empresaId;
    let config = await this.prisma.configuracionAlerta.findFirst({
      where: {
        sensorId: Number(sensorId),
        empresaId,
      },
    });
    if (!config) {
      config = await this.prisma.configuracionAlerta.create({
        data: {
          empresaId: empresaId!,
          sensorId: Number(sensorId),
          tipoAlerta: body.tipoAlerta,
          frecuencia: body.frecuencia,
          activo: true,
          ...(body.ventanaEsperaMinutos !== undefined ? { ventanaEsperaMinutos: body.ventanaEsperaMinutos } : {}),
          umbralCritico: body.umbralCritico as Prisma.JsonObject,
          configuracionNotificacion: body.configuracionNotificacion as unknown as Prisma.JsonObject,
        },
      });
    } else {
      config = await this.prisma.configuracionAlerta.update({
        where: { id: config.id },
        data: {
          tipoAlerta: body.tipoAlerta,
          frecuencia: body.frecuencia,
          activo: true,
          ...(body.ventanaEsperaMinutos !== undefined ? { ventanaEsperaMinutos: body.ventanaEsperaMinutos } : {}),
          umbralCritico: body.umbralCritico as Prisma.JsonObject,
          configuracionNotificacion: body.configuracionNotificacion as unknown as Prisma.JsonObject,
        },
      });
      await this.prisma.configuracionAlertaDestinatario.deleteMany({
        where: { configuracionAlertaId: config.id },
      });
    }
    if (body.destinatarios && body.destinatarios.length > 0) {
      await this.prisma.configuracionAlertaDestinatario.createMany({
        data: body.destinatarios.map(destinatarioId => ({
          configuracionAlertaId: config.id,
          destinatarioId,
        })),
      });
    }
    const configWithDest = await this.prisma.configuracionAlerta.findUnique({
      where: { id: config.id },
      include: {
        destinatarios: {
          include: { destinatario: true },
        },
      },
    });
    return {
      success: true,
      data: {
        ...configWithDest,
        destinatarios: configWithDest?.destinatarios.map(d => d.destinatario) || [],
      },
      message: 'Configuración de alerta guardada correctamente',
    };
  }

  /**
   * Asocia destinatarios a un sensor (solo email/telefono y tipo)
   */
  @Post('sensores/:sensorId/destinatarios')
  @UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
  @EmpresaRequired()
  async asociarDestinatariosSensor(
    @CurrentUser() currentUser: JwtUser,
    @Param('sensorId') sensorId: string,
    @Body() body: { destinatarios: { email?: string, telefono?: string, tipo: 'EMAIL' | 'SMS' | 'AMBOS' }[] }
  ) {
    const empresaId = currentUser.empresaId;
    let config = await this.prisma.configuracionAlerta.findFirst({
      where: { empresaId, sensorId: Number(sensorId) }
    });
    if (!config) {
      config = await this.prisma.configuracionAlerta.create({
        data: {
          empresaId: empresaId!,
          sensorId: Number(sensorId),
          tipoAlerta: 'GENERAL',
          frecuencia: 'INMEDIATA',
          activo: true,
          umbralCritico: {},
          configuracionNotificacion: {},
        }
      });
    }
    // Borra destinatarios previos y asocia los nuevos
    await this.prisma.configuracionAlertaDestinatario.deleteMany({
      where: { configuracionAlertaId: config.id }
    });
    // Filtrar destinatarios únicos por email (ignorando mayúsculas/minúsculas)
    const destinatariosUnicos: typeof body.destinatarios = [];
    const emailsVistos = new Set<string>();
    for (const d of body.destinatarios) {
      const emailKey = (d.email ?? '').trim().toLowerCase();
      if (emailKey && !emailsVistos.has(emailKey)) {
        destinatariosUnicos.push(d);
        emailsVistos.add(emailKey);
      } else if (!emailKey) {
        // Si no hay email, permite por teléfono único
        const telKey = (d.telefono ?? '').trim();
        if (telKey && !destinatariosUnicos.some(x => x.telefono === telKey)) {
          destinatariosUnicos.push(d);
        }
      }
    }
    for (const d of destinatariosUnicos) {
      let destinatario = await this.prisma.destinatarioAlerta.upsert({
        where: { empresaId_email: { empresaId: empresaId!, email: d.email ?? '' } },
        update: { tipo: d.tipo },
        create: {
          email: d.email ?? '',
          telefono: d.telefono ?? '',
          tipo: d.tipo,
          empresaId: empresaId!,
          nombre: d.email ?? d.telefono ?? 'Sin nombre'
        }
      });
      try {
        await this.prisma.configuracionAlertaDestinatario.create({
          data: {
            configuracionAlertaId: config.id,
            destinatarioId: destinatario.id
          }
        });
      } catch (e: any) {
        // Si ya existe la relación, ignora el error de clave única
        if (e.code !== 'P2002') throw e;
      }
    }
    return { success: true };
  }
}

