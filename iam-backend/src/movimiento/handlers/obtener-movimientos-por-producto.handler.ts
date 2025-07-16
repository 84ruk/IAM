import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ObtenerMovimientosPorProductoQuery } from '../queries/obtener-movimientos-por-producto.query';

@Injectable()
export class ObtenerMovimientosPorProductoHandler {
  private readonly logger = new Logger(
    ObtenerMovimientosPorProductoHandler.name,
  );

  constructor(private prisma: PrismaService) {}

  async execute(
    query: ObtenerMovimientosPorProductoQuery,
    empresaId: number | undefined,
  ): Promise<any> {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new NotFoundException('Producto no encontrado');
    }

    const producto = await this.prisma.producto.findFirst({
      where: { id: query.productoId, empresaId },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    const movimientos = await this.prisma.movimientoInventario.findMany({
      where: {
        productoId: query.productoId,
        estado: 'ACTIVO', // Solo movimientos activos
      },
      orderBy: { fecha: 'desc' },
    });

    this.logger.debug(
      `Movimientos por producto obtenidos: Producto ID ${query.productoId}`,
      {
        empresaId,
        productoId: query.productoId,
        totalMovimientos: movimientos.length,
      },
    );

    return movimientos;
  }
}
