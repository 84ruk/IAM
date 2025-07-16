import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ObtenerMovimientoQuery } from '../queries/obtener-movimiento.query';

@Injectable()
export class ObtenerMovimientoHandler {
  private readonly logger = new Logger(ObtenerMovimientoHandler.name);

  constructor(private prisma: PrismaService) {}

  async execute(
    query: ObtenerMovimientoQuery,
    empresaId: number | undefined,
  ): Promise<any> {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new NotFoundException('Movimiento no encontrado');
    }

    const movimiento = await this.prisma.movimientoInventario.findFirst({
      where: {
        id: query.id,
        empresaId,
        estado: 'ACTIVO', // Solo movimientos activos
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
      throw new NotFoundException('Movimiento no encontrado');
    }

    this.logger.debug(`Movimiento obtenido: ID ${query.id}`, {
      empresaId,
      movimientoId: query.id,
      tipo: movimiento.tipo,
      cantidad: movimiento.cantidad,
    });

    return movimiento;
  }
}
