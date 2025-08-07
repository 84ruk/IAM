import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUbicacionDto } from './dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';

@Injectable()
export class UbicacionesService {
  private readonly logger = new Logger(UbicacionesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async crearUbicacion(dto: CreateUbicacionDto, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para crear ubicaciones',
      );
    }

    try {
      const ubicacion = await this.prisma.ubicacion.create({
        data: {
          ...dto,
          empresaId,
        },
        include: {
          empresa: {
            select: {
              id: true,
              nombre: true,
            },
          },
          sensores: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
              activo: true,
            },
          },
          _count: {
            select: {
              sensores: true,
              productos: true,
            },
          },
        },
      });

      this.logger.log(`Ubicación creada: ${ubicacion.nombre} para empresa ${empresaId}`);
      return ubicacion;
    } catch (error) {
      this.logger.error(`Error creando ubicación: ${error.message}`);
      throw error;
    }
  }

  async obtenerUbicaciones(empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, devolver respuesta vacía
    if (!empresaId) {
      return [];
    }

    try {
      const ubicaciones = await this.prisma.ubicacion.findMany({
        where: {
          empresaId,
          activa: true,
        },
        include: {
          sensores: {
            where: {
              activo: true,
            },
            select: {
              id: true,
              nombre: true,
              tipo: true,
              activo: true,
            },
          },
          _count: {
            select: {
              sensores: true,
              productos: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return ubicaciones;
    } catch (error) {
      this.logger.error(`Error obteniendo ubicaciones: ${error.message}`);
      throw error;
    }
  }

  async obtenerUbicacion(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para acceder a ubicaciones',
      );
    }

    try {
      const ubicacion = await this.prisma.ubicacion.findFirst({
        where: {
          id,
          empresaId,
          activa: true,
        },
        include: {
          empresa: {
            select: {
              id: true,
              nombre: true,
            },
          },
          sensores: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
              activo: true,
            },
          },
          _count: {
            select: {
              sensores: true,
              productos: true,
            },
          },
        },
      });

      if (!ubicacion) {
        throw new NotFoundException('Ubicación no encontrada');
      }

      return ubicacion;
    } catch (error) {
      this.logger.error(`Error obteniendo ubicación: ${error.message}`);
      throw error;
    }
  }

  async actualizarUbicacion(id: number, dto: UpdateUbicacionDto, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para actualizar ubicaciones',
      );
    }

    try {
      // Verificar que la ubicación existe y pertenece a la empresa
      const ubicacionExistente = await this.prisma.ubicacion.findFirst({
        where: {
          id,
          empresaId,
          activa: true,
        },
      });

      if (!ubicacionExistente) {
        throw new NotFoundException('Ubicación no encontrada');
      }

      const ubicacion = await this.prisma.ubicacion.update({
        where: {
          id,
        },
        data: {
          ...dto,
        },
        include: {
          empresa: {
            select: {
              id: true,
              nombre: true,
            },
          },
          sensores: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
              activo: true,
            },
          },
          _count: {
            select: {
              sensores: true,
              productos: true,
            },
          },
        },
      });

      this.logger.log(`Ubicación actualizada: ${ubicacion.nombre} para empresa ${empresaId}`);
      return ubicacion;
    } catch (error) {
      this.logger.error(`Error actualizando ubicación: ${error.message}`);
      throw error;
    }
  }

  async eliminarUbicacion(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para eliminar ubicaciones',
      );
    }

    try {
      // Verificar que la ubicación existe y pertenece a la empresa
      const ubicacionExistente = await this.prisma.ubicacion.findFirst({
        where: {
          id,
          empresaId,
          activa: true,
        },
      });

      if (!ubicacionExistente) {
        throw new NotFoundException('Ubicación no encontrada');
      }

      // Verificar si hay sensores activos en la ubicación
      const sensoresActivos = await this.prisma.sensor.count({
        where: {
          ubicacionId: id,
          activo: true,
        },
      });

      if (sensoresActivos > 0) {
        throw new BadRequestException(
          `No se puede eliminar la ubicación porque tiene ${sensoresActivos} sensor(es) activo(s)`,
        );
      }

      // Verificar si hay productos en la ubicación
      const productosEnUbicacion = await this.prisma.producto.count({
        where: {
          ubicacionId: id,
          estado: 'ACTIVO',
        },
      });

      if (productosEnUbicacion > 0) {
        throw new BadRequestException(
          `No se puede eliminar la ubicación porque tiene ${productosEnUbicacion} producto(s) asignado(s)`,
        );
      }

      // Soft delete - marcar como inactiva
      const ubicacion = await this.prisma.ubicacion.update({
        where: {
          id,
        },
        data: {
          activa: false,
        },
      });

      this.logger.log(`Ubicación eliminada (soft delete): ${ubicacion.nombre} para empresa ${empresaId}`);
      return { message: 'Ubicación eliminada correctamente' };
    } catch (error) {
      this.logger.error(`Error eliminando ubicación: ${error.message}`);
      throw error;
    }
  }

  async obtenerEstadisticasUbicacion(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para acceder a estadísticas',
      );
    }

    try {
      // Verificar que la ubicación existe y pertenece a la empresa
      const ubicacion = await this.prisma.ubicacion.findFirst({
        where: {
          id,
          empresaId,
          activa: true,
        },
      });

      if (!ubicacion) {
        throw new NotFoundException('Ubicación no encontrada');
      }

      // Obtener estadísticas de sensores
      const sensoresActivos = await this.prisma.sensor.count({
        where: {
          ubicacionId: id,
          activo: true,
        },
      });

      const sensoresInactivos = await this.prisma.sensor.count({
        where: {
          ubicacionId: id,
          activo: false,
        },
      });

      // Obtener estadísticas de productos
      const productosEnUbicacion = await this.prisma.producto.count({
        where: {
          ubicacionId: id,
          estado: 'ACTIVO',
        },
      });

      // Obtener estadísticas de alertas
      const alertasRecientes = await this.prisma.alertHistory.count({
        where: {
          empresaId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
          },
        },
      });

      // Obtener lecturas recientes de sensores
      const lecturasRecientes = await this.prisma.sensorLectura.count({
        where: {
          ubicacionId: id,
          fecha: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
          },
        },
      });

      return {
        ubicacion: {
          id: ubicacion.id,
          nombre: ubicacion.nombre,
          descripcion: ubicacion.descripcion,
        },
        estadisticas: {
          sensores: {
            activos: sensoresActivos,
            inactivos: sensoresInactivos,
            total: sensoresActivos + sensoresInactivos,
          },
          productos: {
            enUbicacion: productosEnUbicacion,
          },
          alertas: {
            ultimos7Dias: alertasRecientes,
          },
          lecturas: {
            ultimas24Horas: lecturasRecientes,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas de ubicación: ${error.message}`);
      throw error;
    }
  }

  async obtenerSensoresUbicacion(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para acceder a sensores',
      );
    }

    try {
      // Verificar que la ubicación existe y pertenece a la empresa
      const ubicacion = await this.prisma.ubicacion.findFirst({
        where: {
          id,
          empresaId,
          activa: true,
        },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
        },
      });

      if (!ubicacion) {
        throw new NotFoundException('Ubicación no encontrada');
      }

      // Obtener todos los sensores de la ubicación
      const sensores = await this.prisma.sensor.findMany({
        where: {
          ubicacionId: id,
          empresaId,
        },
        select: {
          id: true,
          nombre: true,
          tipo: true,
          activo: true,
          configuracion: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Obtener la última lectura de cada sensor
      const sensoresConLecturas = await Promise.all(
        sensores.map(async (sensor) => {
          const ultimaLectura = await this.prisma.sensorLectura.findFirst({
            where: {
              sensorId: sensor.id,
            },
            select: {
              valor: true,
              unidad: true,
              fecha: true,
            },
            orderBy: {
              fecha: 'desc',
            },
          });

          return {
            ...sensor,
            ultimaLectura: ultimaLectura ? {
              valor: ultimaLectura.valor,
              unidad: ultimaLectura.unidad,
              fecha: ultimaLectura.fecha,
            } : null,
          };
        })
      );

      return {
        ubicacion,
        sensores: sensoresConLecturas,
        total: sensoresConLecturas.length,
        activos: sensoresConLecturas.filter(s => s.activo).length,
        inactivos: sensoresConLecturas.filter(s => !s.activo).length,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo sensores de ubicación: ${error.message}`);
      throw error;
    }
  }

  async obtenerTiempoReal(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para acceder a datos en tiempo real',
      );
    }

    try {
      // Verificar que la ubicación existe y pertenece a la empresa
      const ubicacion = await this.prisma.ubicacion.findFirst({
        where: {
          id,
          empresaId,
          activa: true,
        },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
        },
      });

      if (!ubicacion) {
        throw new NotFoundException('Ubicación no encontrada');
      }

      // Obtener lecturas recientes de la ubicación (últimas 24 horas)
      const fechaLimite = new Date();
      fechaLimite.setHours(fechaLimite.getHours() - 24);

      const lecturasRecientes = await this.prisma.sensorLectura.findMany({
        where: {
          ubicacionId: id,
          fecha: {
            gte: fechaLimite,
          },
        },
        select: {
          id: true,
          tipo: true,
          valor: true,
          unidad: true,
          fecha: true,
          sensor: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
            },
          },
        },
        orderBy: {
          fecha: 'desc',
        },
        take: 100, // Limitar a las últimas 100 lecturas
      });

      // Agrupar lecturas por tipo de sensor
      const lecturasPorTipo = lecturasRecientes.reduce((acc, lectura) => {
        const tipo = lectura.tipo;
        if (!acc[tipo]) {
          acc[tipo] = [];
        }
        acc[tipo].push(lectura);
        return acc;
      }, {} as Record<string, any[]>);

      // Calcular estadísticas por tipo
      const estadisticasPorTipo = Object.entries(lecturasPorTipo).map(([tipo, lecturas]) => {
        const valores = lecturas.map(l => l.valor);
        const promedio = valores.reduce((sum, val) => sum + val, 0) / valores.length;
        const maximo = Math.max(...valores);
        const minimo = Math.min(...valores);

        return {
          tipo,
          promedio: Math.round(promedio * 100) / 100,
          maximo: Math.round(maximo * 100) / 100,
          minimo: Math.round(minimo * 100) / 100,
          totalLecturas: lecturas.length,
          ultimaLectura: lecturas[0],
        };
      });

      return {
        ubicacion,
        estadisticasPorTipo,
        lecturasRecientes: lecturasRecientes.slice(0, 20), // Últimas 20 lecturas
        totalLecturas: lecturasRecientes.length,
        ultimaActualizacion: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error obteniendo datos en tiempo real: ${error.message}`);
      throw error;
    }
  }
} 