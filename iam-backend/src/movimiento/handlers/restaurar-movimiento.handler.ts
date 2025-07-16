import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RestaurarMovimientoHandler {
  private readonly logger = new Logger(RestaurarMovimientoHandler.name);

  constructor(private prisma: PrismaService) {}

  async execute(id: number, empresaId: number | undefined): Promise<any> {
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para restaurar movimientos',
      );
    }

    const movimiento = await this.prisma.movimientoInventario.findFirst({
      where: {
        id,
        empresaId,
        estado: 'ELIMINADO',
      },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento eliminado no encontrado');
    }

    const restoredMovimiento = await this.prisma.movimientoInventario.update({
      where: { id },
      data: { estado: 'ACTIVO' },
    });

    this.logger.log(`Movimiento restaurado exitosamente: ID ${id}`, {
      empresaId,
      movimientoId: id,
      tipo: movimiento.tipo,
      cantidad: movimiento.cantidad,
    });

    return restoredMovimiento;
  }
}
