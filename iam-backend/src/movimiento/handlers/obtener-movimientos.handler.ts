import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ObtenerMovimientosQuery } from '../queries/obtener-movimientos.query';

@Injectable()
export class ObtenerMovimientosHandler {
  private readonly logger = new Logger(ObtenerMovimientosHandler.name);

  constructor(private prisma: PrismaService) {}

  async execute(
    query: ObtenerMovimientosQuery,
    empresaId: number | undefined,
  ): Promise<any> {
    // Si el usuario no tiene empresa configurada, devolver respuesta vacía
    if (!empresaId) {
      return {
        movimientos: [],
        estadisticas: {
          total: 0,
          entradas: 0,
          salidas: 0,
          hoy: 0,
        },
      };
    }

    const movimientos = await this.prisma.movimientoInventario.findMany({
      where: {
        empresaId,
        estado: 'ACTIVO', // Solo movimientos activos
        ...(query.tipo && { tipo: query.tipo }),
      },
      include: {
        producto: {
          select: {
            nombre: true,
            etiquetas: true,
            unidad: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });

    // Calcular estadísticas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const [totalMovimientos, entradas, salidas, movimientosHoy] =
      await Promise.all([
        this.prisma.movimientoInventario.count({
          where: { empresaId, estado: 'ACTIVO' },
        }),
        this.prisma.movimientoInventario.count({
          where: { empresaId, tipo: 'ENTRADA', estado: 'ACTIVO' },
        }),
        this.prisma.movimientoInventario.count({
          where: { empresaId, tipo: 'SALIDA', estado: 'ACTIVO' },
        }),
        this.prisma.movimientoInventario.count({
          where: {
            empresaId,
            estado: 'ACTIVO',
            fecha: {
              gte: hoy,
              lt: mañana,
            },
          },
        }),
      ]);

    this.logger.debug(`Movimientos obtenidos para empresa ${empresaId}`, {
      total: movimientos.length,
      estadisticas: {
        total: totalMovimientos,
        entradas,
        salidas,
        hoy: movimientosHoy,
      },
    });

    return {
      movimientos,
      estadisticas: {
        total: totalMovimientos,
        entradas,
        salidas,
        hoy: movimientosHoy,
      },
    };
  }
}
