import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ObtenerMovimientosEliminadosHandler {
  private readonly logger = new Logger(
    ObtenerMovimientosEliminadosHandler.name,
  );

  constructor(private prisma: PrismaService) {}

  async execute(empresaId: number | undefined): Promise<any> {
    // Si el usuario no tiene empresa configurada, devolver array vacío
    if (!empresaId) {
      return [];
    }

    const movimientos = await this.prisma.movimientoInventario.findMany({
      where: {
        empresaId,
        estado: 'ELIMINADO',
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

    this.logger.debug(
      `Movimientos eliminados obtenidos para empresa ${empresaId}`,
      {
        total: movimientos.length,
      },
    );

    return movimientos;
  }
}
