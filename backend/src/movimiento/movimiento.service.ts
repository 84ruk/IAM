import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';

@Injectable()
export class MovimientoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMovimientoDto) {
    const producto = await this.prisma.producto.findUnique({
      where: { id: dto.productoId },
    });

    if (!producto) throw new NotFoundException('Producto no encontrado');

    // actualizar stock según tipo
    const nuevoStock =
      dto.tipo === 'ENTRADA'
        ? producto.stock + dto.cantidad
        : producto.stock - dto.cantidad;

    if (nuevoStock < 0) throw new Error('Stock insuficiente');

    // transacción: registrar movimiento y actualizar producto
    return this.prisma.$transaction([
      this.prisma.movimientoInventario.create({ data: dto }),
      this.prisma.producto.update({
        where: { id: dto.productoId },
        data: { stock: nuevoStock },
      }),
    ]);
  }

  findAll() {
    return this.prisma.movimientoInventario.findMany({
      include: { producto: true },
    });
  }
}
