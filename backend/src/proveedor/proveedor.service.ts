import { Injectable, NotFoundException } from '@nestjs/common';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProveedorService {
  constructor(private prisma: PrismaService) {}

  async crear(data: CrearProveedorDto, empresaId: number) {
    return this.prisma.proveedor.create({
      data: {
        ...data,
        empresaId,
      },
    });
  }

  async obtenerTodos(empresaId: number) {
    return this.prisma.proveedor.findMany({
      where: { empresaId },
    });
  }

  async obtenerUno(id: number, empresaId: number) {
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id, empresaId },
    });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');
    return proveedor;
  }

  async actualizar(id: number, data: ActualizarProveedorDto, empresaId: number) {
    await this.obtenerUno(id, empresaId); // valida que exista
    return this.prisma.proveedor.update({
      where: { id },
      data,
    });
  }

  async eliminar(id: number, empresaId: number) {
    await this.obtenerUno(id, empresaId);
    return this.prisma.proveedor.delete({
      where: { id },
    });
  }
}
