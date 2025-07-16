import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ObtenerMovimientoEliminadoHandler {
  private readonly logger = new Logger(ObtenerMovimientoEliminadoHandler.name);

  constructor(private prisma: PrismaService) {}

  async execute(id: number, empresaId: number | undefined): Promise<any> {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new NotFoundException('Movimiento eliminado no encontrado');
    }

    const movimiento = await this.prisma.movimientoInventario.findFirst({
      where: {
        id,
        empresaId,
        estado: 'ELIMINADO', // Solo movimientos eliminados
      },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            stock: true,
            stockMinimo: true,
            precioCompra: true,
            precioVenta: true,
            unidad: true,
            etiquetas: true,
            codigoBarras: true,
            rfid: true,
            sku: true,
            estado: true,
            tipoProducto: true,
            proveedor: {
              select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true,
                estado: true,
              },
            },
          },
        },
      },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento eliminado no encontrado');
    }

    this.logger.debug(`Movimiento eliminado obtenido: ID ${id}`, {
      empresaId,
      movimientoId: id,
      tipo: movimiento.tipo,
      cantidad: movimiento.cantidad,
    });

    return movimiento;
  }
}
