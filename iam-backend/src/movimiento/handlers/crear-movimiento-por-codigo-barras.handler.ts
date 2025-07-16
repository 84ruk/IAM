import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearMovimientoPorCodigoBarrasCommand } from '../commands/crear-movimiento-por-codigo-barras.command';
import { CrearMovimientoHandler } from './crear-movimiento.handler';

@Injectable()
export class CrearMovimientoPorCodigoBarrasHandler {
  private readonly logger = new Logger(
    CrearMovimientoPorCodigoBarrasHandler.name,
  );

  constructor(
    private prisma: PrismaService,
    private crearMovimientoHandler: CrearMovimientoHandler,
  ) {}

  async execute(
    command: CrearMovimientoPorCodigoBarrasCommand,
    empresaId: number | undefined,
  ): Promise<any> {
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para registrar movimientos',
      );
    }

    // Buscar el producto por código de barras
    const producto = await this.prisma.producto.findFirst({
      where: {
        codigoBarras: command.codigoBarras.trim(),
        empresaId,
        estado: 'ACTIVO',
      },
    });

    if (!producto) {
      throw new NotFoundException(
        'Producto no encontrado con ese código de barras',
      );
    }

    // Crear el movimiento usando el producto encontrado
    const crearMovimientoCommand = {
      tipo: command.tipo,
      cantidad: command.cantidad,
      productoId: producto.id,
      motivo: command.motivo,
      descripcion: command.descripcion,
    };

    return this.crearMovimientoHandler.execute(
      crearMovimientoCommand,
      empresaId,
    );
  }
}
