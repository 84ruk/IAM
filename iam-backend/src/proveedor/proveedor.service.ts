import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Rol } from '@prisma/client';

@Injectable()
export class ProveedorService {
  constructor(private prisma: PrismaService) {}

  async crear(data: CrearProveedorDto, empresaId: number) {
    // Validar duplicados por nombre/email
    const whereConditions: Prisma.ProveedorWhereInput = {
      empresaId,
      estado: { in: ['ACTIVO', 'INACTIVO'] }, // Solo verificar activos e inactivos
      OR: [
        { nombre: data.nombre },
        ...(data.email ? [{ email: data.email }] : [])
      ],
    };

    const existe = await this.prisma.proveedor.findFirst({
      where: whereConditions,
    });
    if (existe) {
      throw new ConflictException('Ya existe un proveedor con ese nombre o email en la empresa.');
    }
    return this.prisma.proveedor.create({
      data: {
        ...data,
        empresaId,
        estado: 'ACTIVO',
      },
    });
  }

  async obtenerTodos(empresaId: number) {
    return this.prisma.proveedor.findMany({
      where: { 
        empresaId,
        estado: { in: ['ACTIVO', 'INACTIVO'] } // Solo mostrar activos e inactivos
      },
      include: {
        productos: {
          where: { estado: 'ACTIVO' },
          select: { id: true, nombre: true }
        }
      }
    });
  }

  async obtenerInactivos(empresaId: number) {
    return this.prisma.proveedor.findMany({
      where: { 
        empresaId,
        estado: 'INACTIVO'
      },
      include: {
        productos: {
          where: { estado: 'ACTIVO' },
          select: { id: true, nombre: true }
        }
      }
    });
  }

  async obtenerEliminados(empresaId: number) {
    return this.prisma.proveedor.findMany({
      where: { 
        empresaId,
        estado: 'ELIMINADO'
      },
      include: {
        productos: {
          where: { estado: 'ACTIVO' },
          select: { id: true, nombre: true }
        }
      }
    });
  }

  async obtenerUno(id: number, empresaId: number) {
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { 
        id, 
        empresaId,
        estado: { in: ['ACTIVO', 'INACTIVO'] } // Solo activos e inactivos
      },
      include: {
        productos: {
          where: { estado: 'ACTIVO' },
          select: { id: true, nombre: true, stock: true }
        }
      }
    });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');
    return proveedor;
  }

  async actualizar(id: number, data: ActualizarProveedorDto, empresaId: number) {
    await this.obtenerUno(id, empresaId); // valida que exista
    
    // Solo validar duplicados si se están actualizando nombre o email
    if (data.nombre || data.email) {
      const condiciones: Prisma.ProveedorWhereInput[] = [];
      
      // Agregar condición de nombre si se está actualizando
      if (data.nombre) {
        condiciones.push({ nombre: data.nombre });
      }
      
      // Agregar condición de email si se está actualizando
      if (data.email) {
        condiciones.push({ email: data.email });
      }

      const existe = await this.prisma.proveedor.findFirst({
        where: {
          empresaId,
          id: { not: id },
          estado: { in: ['ACTIVO', 'INACTIVO'] },
          OR: condiciones,
        },
      });
      if (existe) {
        throw new ConflictException('Ya existe otro proveedor con ese nombre o email en la empresa.');
      }
    }

    return this.prisma.proveedor.update({
      where: { id },
      data,
    });
  }

  async desactivar(id: number, empresaId: number) {
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { 
        id, 
        empresaId,
        estado: 'ACTIVO'
      },
    });
    
    if (!proveedor) {
      throw new NotFoundException('Proveedor activo no encontrado');
    }

    return this.prisma.proveedor.update({
      where: { id },
      data: { estado: 'INACTIVO' },
    });
  }

  async reactivar(id: number, empresaId: number) {
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { 
        id, 
        empresaId,
        estado: 'INACTIVO'
      },
    });
    
    if (!proveedor) {
      throw new NotFoundException('Proveedor inactivo no encontrado');
    }

    return this.prisma.proveedor.update({
      where: { id },
      data: { estado: 'ACTIVO' },
    });
  }

  async softDelete(id: number, empresaId: number, rol: Rol) {
    // Solo ADMIN puede eliminar proveedores
    if (rol !== Rol.ADMIN && rol !== Rol.SUPERADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar proveedores');
    }

    const proveedor = await this.prisma.proveedor.findFirst({
      where: { 
        id, 
        empresaId,
        estado: { in: ['ACTIVO', 'INACTIVO'] }
      },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Soft delete directo - cambiar estado a ELIMINADO sin validaciones
    return this.prisma.proveedor.update({
      where: { id },
      data: { estado: 'ELIMINADO' },
    });
  }

  async restaurar(id: number, empresaId: number, rol: Rol) {
    // Solo ADMIN puede restaurar proveedores
    if (rol !== Rol.ADMIN && rol !== Rol.SUPERADMIN) {
      throw new ForbiddenException('Solo los administradores pueden restaurar proveedores');
    }

    const proveedor = await this.prisma.proveedor.findFirst({
      where: { 
        id, 
        empresaId,
        estado: 'ELIMINADO'
      },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor eliminado no encontrado');
    }

    return this.prisma.proveedor.update({
      where: { id },
      data: { estado: 'ACTIVO' },
    });
  }

  async eliminar(id: number, empresaId: number, rol: Rol) {
    // Solo ADMIN puede eliminar permanentemente
    if (rol !== Rol.ADMIN && rol !== Rol.SUPERADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar proveedores permanentemente');
    }

    const proveedor = await this.prisma.proveedor.findFirst({
      where: { 
        id, 
        empresaId,
        estado: 'ELIMINADO'
      },
      include: {
        productos: {
          where: { estado: 'ACTIVO' },
          select: { id: true, nombre: true }
        }
      }
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor eliminado no encontrado');
    }

    if (proveedor.productos.length > 0) {
      throw new BadRequestException('No se puede eliminar permanentemente un proveedor con productos asociados.');
    }

    return this.prisma.proveedor.delete({
      where: { id },
    });
  }
}
