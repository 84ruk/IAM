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
    @Query('severidad') severidad?: string,
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
        this.prisma.alertHistory.findMany({
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
        this.prisma.alertHistory.count({ where }),
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

      const alerta = await this.prisma.alertHistory.findFirst({
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
   * ⚙️ Configura umbrales por sensor (forma compatible con frontend newer)
   */
  @Post('sensores/umbrales')
  async configurarUmbrales(@Request() req, @Body() dto: { sensorId: number; tipo: SensorTipo; umbrales: any }) {
    try {
      const empresaId = req.user.empresaId;
      const sensorActualizado = await this.prisma.sensor.update({
        where: { id: dto.sensorId, empresaId },
        data: {
          configuracion: {
            ...dto.umbrales,
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
          umbrales: dto.umbrales as UmbralesSensorDto,
          ubicacion: sensorActualizado.ubicacion?.nombre || '',
        },
        message: 'Umbrales configurados correctamente',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        `Error configurando umbrales: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene umbrales del sensor
   */
  @Get('sensores/:id/umbrales')
  async obtenerUmbrales(@Request() req, @Param('id') id: string) {
    const empresaId = req.user.empresaId;
    const sensor = await this.prisma.sensor.findFirst({ where: { id: Number(id), empresaId }, include: { ubicacion: true } });
    if (!sensor) throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
    return {
      success: true,
      data: {
        sensorId: sensor.id,
        tipo: sensor.tipo,
        umbrales: (sensor.configuracion as any) || {},
        ubicacion: sensor.ubicacion?.nombre || '',
      },
    };
  }

  /**
   * 📋 Lista las configuraciones de alertas de la empresa
   */
  @Get('configuraciones/listar')
  async listarConfiguraciones(@Request() req) {
    try {
      const empresaId = req.user.empresaId;

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
}

