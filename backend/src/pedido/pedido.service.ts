import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PedidoService {
  constructor(private prisma: PrismaService) {}

  async generarPedido(productoId: number, proveedorId: number, cantidad: number, empresaId: number) {
    const proveedor = await this.prisma.proveedor.findFirst({
        where: { id: proveedorId, empresaId }
    });
    if (!proveedor) {
        throw new NotFoundException('Proveedor no encontrado o no pertenece a tu empresa');
    }

    return this.prisma.pedidoInventario.create({
      data: {
        productoId,
        proveedorId,
        cantidad,
        empresaId,
      },
    });
  }

  async obtenerPedidosPorEmpresa(empresaId: number) {
    return this.prisma.pedidoInventario.findMany({
      where: { empresaId },
      include: {
        producto: true,
        proveedor: true,
      },
    });
  }
}
