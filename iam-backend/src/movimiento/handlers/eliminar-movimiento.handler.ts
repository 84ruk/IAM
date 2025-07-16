import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EliminarMovimientoHandler {
  private readonly logger = new Logger(EliminarMovimientoHandler.name);

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
        estado: 'ACTIVO', // Solo movimientos activos
      },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento no encontrado');
    }

    // Soft delete - cambiar estado a ELIMINADO
    const deletedMovimiento = await this.prisma.movimientoInventario.update({
      where: { id },
      data: { estado: 'ELIMINADO' },
    });

    this.logger.log(`Movimiento eliminado exitosamente: ID ${id}`, {
      empresaId,
      movimientoId: id,
      tipo: movimiento.tipo,
      cantidad: movimiento.cantidad,
    });

    return deletedMovimiento;
  }
}
