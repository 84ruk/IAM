import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EliminarPermanentementeMovimientoHandler {
  private readonly logger = new Logger(
    EliminarPermanentementeMovimientoHandler.name,
  );

  constructor(private prisma: PrismaService) {}

  async execute(id: number, empresaId: number | undefined): Promise<any> {
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para eliminar movimientos',
      );
    }

    const movimiento = await this.prisma.movimientoInventario.findFirst({
      where: {
        id,
        empresaId,
        estado: 'ELIMINADO', // Solo movimientos eliminados
      },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento eliminado no encontrado');
    }

    // Eliminación permanente
    const deletedMovimiento = await this.prisma.movimientoInventario.delete({
      where: { id },
    });

    this.logger.log(`Movimiento eliminado permanentemente: ID ${id}`, {
      empresaId,
      movimientoId: id,
      tipo: movimiento.tipo,
      cantidad: movimiento.cantidad,
    });

    return deletedMovimiento;
  }
}
