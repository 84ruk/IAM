import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarMovimientoCommand } from '../commands/actualizar-movimiento.command';

@Injectable()
export class ActualizarMovimientoHandler {
  private readonly logger = new Logger(ActualizarMovimientoHandler.name);

  constructor(private prisma: PrismaService) {}

  async execute(
    id: number,
    command: ActualizarMovimientoCommand,
    empresaId: number | undefined,
  ): Promise<any> {
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para actualizar movimientos',
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

    const updatedMovimiento = await this.prisma.movimientoInventario.update({
      where: { id },
      data: {
        motivo: command.motivo,
        descripcion: command.descripcion,
      },
    });

    this.logger.log(`Movimiento actualizado exitosamente: ID ${id}`, {
      empresaId,
      movimientoId: id,
      cambios: {
        motivo: command.motivo,
        descripcion: command.descripcion,
      },
    });

    return updatedMovimiento;
  }
}
