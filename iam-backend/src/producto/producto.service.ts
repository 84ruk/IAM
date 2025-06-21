import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductoDto, empresaId: number) {
    if (dto.proveedorId) {
      const proveedor = await this.prisma.proveedor.findFirst({
        where: {
          id: dto.proveedorId,
          empresaId,
        },
      });

      if (!proveedor) {
        throw new BadRequestException('El proveedor no existe o no pertenece a tu empresa');
      }
    }

    const data = {
      ...dto,
      empresaId,
      proveedorId: dto.proveedorId || null, 
    };

    return this.prisma.producto.create({
      data,
    });
  }


  async findAll(empresaId: number) {
    return this.prisma.producto.findMany({
      where: { empresaId },
      orderBy: { id: 'desc' },
    });
  }

 async findOne(id: number, empresaId: number) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, empresaId },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    return producto;
  }

    async update(id: number, dto: UpdateProductoDto, empresaId: number) {
    // 1. Verificar que el producto exista y pertenezca a la empresa
    const productoExistente = await this.prisma.producto.findFirst({
      where: {
        id,
        empresaId,
      },
    });

    if (!productoExistente) {
      throw new NotFoundException('Producto no encontrado o no pertenece a tu empresa');
    }

    // 2. Si se envía proveedorId, validar que sea válido para esta empresa
    if (dto.proveedorId) {
      const proveedor = await this.prisma.proveedor.findFirst({
        where: {
          id: dto.proveedorId,
          empresaId,
        },
      });

      if (!proveedor) {
        throw new BadRequestException('Proveedor no válido para esta empresa');
      }
    }

    // 3. Realizar la actualización
    const data = {
      ...dto,
      proveedorId: dto.proveedorId ?? null,
    };

    return this.prisma.producto.update({
      where: { id },
      data,
    });
  }
  

  async remove(id: number, empresaId: number) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, empresaId },
    });

    if (!producto) {
      throw new NotFoundException('No puedes eliminar un producto que no existe o no te pertenece');
    }

    return this.prisma.producto.delete({ where: { id } });
  }
}
