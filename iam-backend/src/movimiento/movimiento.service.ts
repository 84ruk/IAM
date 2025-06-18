import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearMovimientoDto, TipoMovimiento } from './dto/crear-movimiento.dto';

@Injectable()
export class MovimientoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CrearMovimientoDto) {
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

    return this.prisma.$transaction([
      this.prisma.movimientoInventario.create({ data: dto }),
      this.prisma.producto.update({
        where: { id: dto.productoId },
        data: { stock: nuevoStock },
      }),
    ]);
  }

  async registrar(dto: CrearMovimientoDto, empresaId: number) {
    const producto = await this.prisma.producto.findFirst({
      where: { id: dto.productoId, empresaId },
    });

    if (!producto) throw new NotFoundException('Producto no encontrado');

    if (dto.tipo === TipoMovimiento.SALIDA && producto.stock < dto.cantidad) {
      throw new BadRequestException('Stock insuficiente para realizar la salida');
    }

    const nuevoStock =
      dto.tipo === TipoMovimiento.ENTRADA
        ? producto.stock + dto.cantidad
        : producto.stock - dto.cantidad;

    await this.prisma.producto.update({
      where: { id: producto.id },
      data: { stock: nuevoStock },
    });

    return this.prisma.movimientoInventario.create({
      data: {
        productoId: dto.productoId,
        tipo: dto.tipo,
        cantidad: dto.cantidad,
        motivo: dto.motivo,
        empresaId: dto.empresaId,
      },
    });
  }

    async obtenerPorProducto(productoId: number, empresaId: number) {
    const producto = await this.prisma.producto.findFirst({
      where: { id: productoId, empresaId },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    return this.prisma.movimientoInventario.findMany({
      where: { productoId },
      orderBy: { fecha: 'desc' },
    });
  }

  findAll() {
    return this.prisma.movimientoInventario.findMany({
      include: { producto: true },
    });
  }
}
