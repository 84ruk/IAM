import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { InvalidProviderException, ProductNotFoundException, DuplicateProductException, InsufficientPermissionsException } from '../common/exceptions/business-exceptions';
import { Rol } from '@prisma/client';

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
        throw new InvalidProviderException(dto.proveedorId, empresaId);
      }
    }

    // Verificar duplicados de código de barras si se proporciona
    if (dto.codigoBarras) {
      const productoExistente = await this.prisma.producto.findFirst({
        where: {
          codigoBarras: dto.codigoBarras.trim(),
          empresaId,
        },
      });

      if (productoExistente) {
        throw new DuplicateProductException('código de barras', dto.codigoBarras);
      }
    }

    const data = {
      ...dto,
      empresaId,
      proveedorId: dto.proveedorId || null, 
      codigoBarras: dto.codigoBarras?.trim() || null,
      rfid: dto.rfid?.trim() || null,
      sku: dto.sku?.trim() || null,
    };

    return this.prisma.producto.create({
      data,
    });
  }

  async findAll(empresaId: number, filters?: {
    search?: string;
    etiqueta?: string;
    estado?: string;
    tipoProducto?: string;
    agotados?: boolean;
    proveedorId?: number;
    page?: number;
    limit?: number;
  }) {
    const where: any = { 
      empresaId,
      estado: filters?.estado || 'ACTIVO' // Por defecto solo productos activos
    };

    // Filtro de búsqueda por nombre o descripción
    if (filters?.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { descripcion: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters?.etiqueta) {
      where.etiquetas = { has: filters.etiqueta };
    }

    if (filters?.tipoProducto) {
      where.tipoProducto = filters.tipoProducto;
    }

    if (filters?.agotados === true) {
      where.stock = { lte: 0 };
    }

    if (filters?.proveedorId) {
      where.proveedorId = filters.proveedorId;
    }

    // Calcular skip para paginación
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    // Obtener total de registros
    const total = await this.prisma.producto.count({ where });

    // Obtener productos con paginación
    const productos = await this.prisma.producto.findMany({
      where,
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
          },
        },
      },
      orderBy: [
        { stock: 'desc' },
        { nombre: 'asc' } 
      ],
      skip,
      take: limit
    });

    return {
      productos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findInactive(empresaId: number) {
    return this.prisma.producto.findMany({
      where: { 
        empresaId,
        estado: 'INACTIVO' // Solo productos inactivos
      },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
          },
        },
      },
    });
  }

  async findDeleted(empresaId: number) {
    return this.prisma.producto.findMany({
      where: { 
        empresaId,
        estado: 'ELIMINADO' // Solo productos eliminados (soft delete)
      },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
          },
        },
      },
    });
  }

  async findWithoutProvider(empresaId: number) {
    return this.prisma.producto.findMany({
      where: { 
        empresaId,
        estado: 'ACTIVO', // Solo productos activos
        proveedorId: null // Sin proveedor asignado
      },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
          },
        },
      },
      orderBy: [
        { stock: 'desc' },
        { nombre: 'asc' } 
      ],
    });
  }

  async findOne(id: number, empresaId: number) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, empresaId },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
          },
        },
      },
    });

    if (!producto) {
      throw new ProductNotFoundException(id);
    }

    return producto;
  }

  async buscarPorCodigoBarras(codigoBarras: string, empresaId: number) {
    const producto = await this.prisma.producto.findFirst({
      where: { 
        codigoBarras: codigoBarras.trim(),
        empresaId,
        estado: { in: ['ACTIVO', 'INACTIVO'] } // Excluir eliminados
      },
    });

    if (!producto) {
      throw new ProductNotFoundException(undefined, codigoBarras);
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
      throw new ProductNotFoundException(id);
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
        throw new InvalidProviderException(dto.proveedorId, empresaId);
      }
    }

    // 3. Verificar duplicados de código de barras si se está actualizando
    if (dto.codigoBarras && dto.codigoBarras !== productoExistente.codigoBarras) {
      const productoConCodigo = await this.prisma.producto.findFirst({
        where: {
          codigoBarras: dto.codigoBarras.trim(),
          empresaId,
          id: { not: id }, // Excluir el producto actual
        },
      });

      if (productoConCodigo) {
        throw new DuplicateProductException('código de barras', dto.codigoBarras);
      }
    }

    // 4. Realizar la actualización
    const data = {
      ...dto,
      proveedorId: dto.proveedorId ?? null,
      codigoBarras: dto.codigoBarras?.trim() || null,
      rfid: dto.rfid?.trim() || null,
      sku: dto.sku?.trim() || null,
    };

    return this.prisma.producto.update({
      where: { id },
      data,
    });
  }

  // Método para desactivar (soft delete) - usado por usuarios normales
  async deactivate(id: number, empresaId: number) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, empresaId },
    });

    if (!producto) {
      throw new ProductNotFoundException(id);
    }

    if (producto.estado === 'INACTIVO') {
      throw new BadRequestException('El producto ya está inactivo');
    }

    return this.prisma.producto.update({
      where: { id },
      data: { estado: 'INACTIVO' },
    });
  }

  // Método para reactivar un producto inactivo
  async reactivate(id: number, empresaId: number) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, empresaId },
    });

    if (!producto) {
      throw new ProductNotFoundException(id);
    }

    if (producto.estado === 'ACTIVO') {
      throw new BadRequestException('El producto ya está activo');
    }

    return this.prisma.producto.update({
      where: { id },
      data: { estado: 'ACTIVO' },
    });
  }

  // Método para "eliminar" un producto usuarios normales
  async softDelete(id: number, empresaId: number) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, empresaId },
    });

    if (!producto) {
      throw new ProductNotFoundException(id);
    }

    if (producto.estado === 'ELIMINADO') {
      throw new BadRequestException('El producto ya está eliminado');
    }

    return this.prisma.producto.update({
      where: { id },
      data: { estado: 'ELIMINADO' },
    });
  }

  // Método para restaurar un producto eliminado
  async restore(id: number, empresaId: number) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, empresaId },
    });

    if (!producto) {
      throw new ProductNotFoundException(id);
    }

    if (producto.estado !== 'ELIMINADO') {
      throw new BadRequestException('El producto no está eliminado');
    }

    return this.prisma.producto.update({
      where: { id },
      data: { estado: 'ACTIVO' },
    });
  }

  // Método para eliminar permanentemente - solo para admins
  async remove(id: number, empresaId: number, rol: Rol) {

    if (rol !== Rol.ADMIN && rol !== Rol.SUPERADMIN) {
      throw new InsufficientPermissionsException('ADMIN', rol, 'eliminar productos permanentemente');
    }

    const producto = await this.prisma.producto.findFirst({
      where: { id, empresaId },
    });

    if (!producto) {
      throw new ProductNotFoundException(id);
    }

    return this.prisma.producto.delete({
      where: { id },
    });
  }
}
