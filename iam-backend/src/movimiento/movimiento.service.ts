import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearMovimientoDto } from './dto/crear-movimiento.dto';
import { TipoMovimiento } from '@prisma/client';

@Injectable()
export class MovimientoService {
  constructor(private prisma: PrismaService) {}


    async registrar(dto: CrearMovimientoDto, empresaId: number) {
    return this.prisma.$transaction(async (tx) => {
      const producto = await tx.producto.findFirst({
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

      await tx.producto.update({
        where: { id: producto.id },
        data: { stock: nuevoStock },
      });

      const data = {
        ...dto,
        empresaId,
      };

      return tx.movimientoInventario.create({
        data
      });
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

    async findAll(empresaId: number, tipo?: TipoMovimiento) {
      return this.prisma.movimientoInventario.findMany({
        where: {
          empresaId,
          ...(tipo && { tipo }), // solo si se filtra
        },
        include: {
          producto: {
            select: {
              nombre: true,
            },
          },
        },
        orderBy: {
          fecha: 'desc',
        },
      });
    }




}
