import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfiguracionAlertaDto, NotificacionConfigDto, UmbralCriticoDto, DestinatarioDto } from '../dto/configuracion-alerta.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConfiguracionSensorAlertasService {
  private readonly logger = new Logger(ConfiguracionSensorAlertasService.name);

  constructor(private readonly prisma: PrismaService) {}

  async obtenerConfiguracion(sensorId: number, empresaId: number) {
    const config = await this.prisma.configuracionAlerta.findUnique({
      where: {
        id: sensorId
      },
      include: {
        destinatarios: {
          include: {
            destinatario: true
          }
        }
      }
    });

    if (!config) {
      return null;
    }

    return {
      ...config,
      configuracionNotificacion: config.configuracionNotificacion as unknown as NotificacionConfigDto,
      umbralCritico: config.umbralCritico as unknown as UmbralCriticoDto,
      destinatarios: config.destinatarios.map(d => ({
        id: d.destinatario.id,
        nombre: d.destinatario.nombre,
        email: d.destinatario.email,
        telefono: d.destinatario.telefono,
        tipo: d.destinatario.tipo,
        configuracionAlertaId: config.id
      }))
    };
  }

  async actualizarConfiguracion(sensorId: number, empresaId: number, config: ConfiguracionAlertaDto) {
    return this.prisma.configuracionAlerta.upsert({
      where: {
        id: sensorId
      },
      update: {
        tipoAlerta: config.tipoAlerta,
        activo: config.activo,
        frecuencia: config.frecuencia,
        ventanaEsperaMinutos: config.ventanaEsperaMinutos ?? null,
        umbralCritico: config.umbralCritico ? config.umbralCritico as Prisma.JsonObject : {},
        configuracionNotificacion: config.configuracionNotificacion ? config.configuracionNotificacion as unknown as Prisma.JsonObject : {},
      },
      create: {
        sensorId,
        empresaId,
        tipoAlerta: config.tipoAlerta,
        activo: config.activo,
        frecuencia: config.frecuencia,
        ventanaEsperaMinutos: config.ventanaEsperaMinutos ?? null,
        umbralCritico: config.umbralCritico ? config.umbralCritico as Prisma.JsonObject : {},
        configuracionNotificacion: config.configuracionNotificacion ? config.configuracionNotificacion as unknown as Prisma.JsonObject : {},
      },
      include: {
        destinatarios: {
          include: {
            destinatario: true
          }
        }
      }
    });
  }

  async agregarDestinatario(sensorId: number, empresaId: number, destinatario: Omit<DestinatarioDto, 'id' | 'configuracionAlertaId'>) {
    const nuevoDestinatario = await this.prisma.destinatarioAlerta.create({
      data: {
        nombre: destinatario.nombre,
        email: destinatario.email,
        telefono: destinatario.telefono,
        tipo: destinatario.tipo,
        empresaId
      }
    });

    const config = await this.prisma.configuracionAlerta.findUnique({
      where: {
        id: sensorId
      }
    });

    if (!config) {
      throw new NotFoundException('Configuración de alerta no encontrada');
    }

    await this.prisma.configuracionAlertaDestinatario.create({
      data: {
        configuracionAlertaId: config.id,
        destinatarioId: nuevoDestinatario.id
      }
    });

    return nuevoDestinatario;
  }

  async eliminarDestinatario(sensorId: number, destinatarioId: number, empresaId: number) {
    const config = await this.prisma.configuracionAlerta.findUnique({
      where: {
        id: sensorId
      }
    });

    if (!config) {
      throw new NotFoundException('Configuración de alerta no encontrada');
    }

    await this.prisma.configuracionAlertaDestinatario.delete({
      where: {
        configuracionAlertaId_destinatarioId: {
          configuracionAlertaId: config.id,
          destinatarioId
        }
      }
    });

    return { success: true };
  }
}
