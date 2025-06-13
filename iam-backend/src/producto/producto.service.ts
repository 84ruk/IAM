import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductoDto, empresaId: number) {
  return this.prisma.producto.create({
    data: {
      ...dto,
      empresaId, //Envio desde JWT
    },
  });
}


  findAll() {
    return this.prisma.producto.findMany();
  }

  findOne(id: number) {
    return this.prisma.producto.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateProductoDto) {
    const producto = await this.findOne(id);
    if (!producto) throw new NotFoundException('Producto no encontrado');
    return this.prisma.producto.update({ where: { id }, data });
  }

  async remove(id: number) {
    const producto = await this.findOne(id);
    if (!producto) throw new NotFoundException('Producto no encontrado');
    return this.prisma.producto.delete({ where: { id } });
  }
}
