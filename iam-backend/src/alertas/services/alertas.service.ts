import { SeveridadAlerta } from '@prisma/client';
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfiguracionAlertaDestinatario } from '@prisma/client';
import { CrearAlertaDto, ActualizarAlertaDto } from '../dto/alerta.dto';

@Injectable()
export class AlertasService {
  private readonly logger = new Logger(AlertasService.name);

  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearAlertaDto, empresaId: number) {
    try {
      const alerta = await this.prisma.alertaHistorial.create({
        data: {
          empresaId,
          tipo: dto.tipo,
          severidad: dto.severidad,
          titulo: dto.titulo,
          mensaje: dto.mensaje,
          valor: dto.valor?.toString(),
          sensorId: dto.sensorId,
          ubicacionId: dto.ubicacionId,
          productoId: dto.productoId,
          destinatarios: dto.destinatarios || [],
          estado: 'PENDIENTE',
        },
      });

      this.logger.log(`Alerta creada: ${alerta.id} para empresa ${empresaId}`);
      return alerta;
    } catch (error) {
      this.logger.error(`Error creando alerta: ${error.message}`);
      throw new BadRequestException('Error al crear la alerta');
    }
  }

  async listar(empresaId: number, filtros: { estado?: string; tipo?: string; severidad?: SeveridadAlerta }) {
    try {
      const where = {
        empresaId,
        ...(filtros.estado && { estado: filtros.estado }),
        ...(filtros.tipo && { tipo: filtros.tipo }),
        ...(filtros.severidad && { severidad: filtros.severidad }),
      };

      const [alertas, total] = await Promise.all([
        this.prisma.alertaHistorial.findMany({
          where,
          include: {
            sensor: {
              select: {
                nombre: true,
                tipo: true,
              },
            },
            ubicacion: {
              select: {
                nombre: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.alertaHistorial.count({ where }),
      ]);

      return {
        alertas,
        total,
      };
    } catch (error) {
      this.logger.error(`Error listando alertas: ${error.message}`);
      throw new BadRequestException('Error al listar las alertas');
    }
  }

  async obtenerPorId(id: number, empresaId: number) {
    const alerta = await this.prisma.alertaHistorial.findFirst({
      where: { id, empresaId },
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
      },
    });

    if (!alerta) {
      throw new NotFoundException('Alerta no encontrada');
    }

    return alerta;
  }

  async actualizar(id: number, dto: ActualizarAlertaDto, empresaId: number) {
    const alerta = await this.prisma.alertaHistorial.findFirst({
      where: { id, empresaId },
    });

    if (!alerta) {
      throw new NotFoundException('Alerta no encontrada');
    }

    return this.prisma.alertaHistorial.update({
      where: { id },
      data: {
        estado: dto.estado,
        fechaResolucion: dto.estado === 'RESUELTA' ? new Date() : undefined,
        ...dto,
      },
    });
  }

  async eliminar(id: number, empresaId: number) {
    const alerta = await this.prisma.alertaHistorial.findFirst({
      where: { id, empresaId },
    });

    if (!alerta) {
      throw new NotFoundException('Alerta no encontrada');
    }

    await this.prisma.alertaHistorial.delete({ where: { id } });
    return { success: true, message: 'Alerta eliminada correctamente' };
  }

  async obtenerResumen(empresaId: number) {
    const [pendientes, enProceso, resueltas, criticas] = await Promise.all([
      this.prisma.alertaHistorial.count({
        where: { empresaId, estado: 'PENDIENTE' },
      }),
      this.prisma.alertaHistorial.count({
        where: { empresaId, estado: 'EN_PROCESO' },
      }),
      this.prisma.alertaHistorial.count({
        where: { empresaId, estado: 'RESUELTA' },
      }),
      this.prisma.alertaHistorial.count({
        where: { empresaId, severidad: 'CRITICA' },
      }),
    ]);

    return {
      pendientes,
      enProceso,
      resueltas,
      criticas,
    };
  }

  async listarConfiguraciones(empresaId: number) {
    return this.prisma.configuracionAlerta.findMany({
      where: { empresaId },
      include: {
        destinatarios: {
          include: {
            destinatario: true,
          },
        },
      },
    });
  }

  async guardarConfiguracion(configuracion: any, empresaId: number) {
    const { destinatarios, ...data } = configuracion;

    const config = await this.prisma.configuracionAlerta.create({
      data: {
        ...data,
        empresaId,
      },
    });

    if (destinatarios?.length) {
      await this.prisma.configuracionAlertaDestinatario.createMany({
        data: destinatarios.map((destinatarioId: number) => ({
          configuracionAlertaId: config.id,
          destinatarioId,
        })),
      });
    }

    return config;
  }

  async actualizarConfiguracion(id: number, configuracion: any, empresaId: number) {
    const { destinatarios, ...data } = configuracion;

    const config = await this.prisma.configuracionAlerta.findFirst({
      where: { id, empresaId },
    });

    if (!config) {
      throw new NotFoundException('Configuración no encontrada');
    }

    // Actualizar configuración
    const actualizada = await this.prisma.configuracionAlerta.update({
      where: { id },
      data,
    });

    // Si hay destinatarios, actualizar relaciones
    if (destinatarios) {
      // Eliminar relaciones existentes
      await this.prisma.configuracionAlertaDestinatario.deleteMany({
        where: { configuracionAlertaId: id },
      });

      // Crear nuevas relaciones
      if (destinatarios.length) {
        await this.prisma.configuracionAlertaDestinatario.createMany({
          data: destinatarios.map((destinatarioId: number) => ({
            configuracionAlertaId: id,
            destinatarioId,
          })),
        });
      }
    }

    return actualizada;
  }

  async eliminarConfiguracion(id: number, empresaId: number) {
    const config = await this.prisma.configuracionAlerta.findFirst({
      where: { id, empresaId },
    });

    if (!config) {
      throw new NotFoundException('Configuración no encontrada');
    }

    // Eliminar relaciones primero
    await this.prisma.configuracionAlertaDestinatario.deleteMany({
      where: { configuracionAlertaId: id },
    });

    // Eliminar la configuración
    await this.prisma.configuracionAlerta.delete({ where: { id } });

    return { success: true, message: 'Configuración eliminada correctamente' };
  }
}
