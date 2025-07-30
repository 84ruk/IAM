import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import {
  InvalidProviderException,
  ProductNotFoundException,
  DuplicateProductException,
  InsufficientPermissionsException,
} from '../common/exceptions/business-exceptions';
import { Rol } from '@prisma/client';

@Injectable()
export class ProductoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductoDto, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para crear productos',
      );
    }

    return this.prisma.executeWithRetry(async () => {
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
          throw new DuplicateProductException(
            'código de barras',
            dto.codigoBarras,
          );
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
    });
  }

  async findAll(
    empresaId: number | undefined,
    filters?: {
      search?: string;
      etiqueta?: string;
      estado?: string;
      tipoProducto?: string;
      agotados?: boolean;
      proveedorId?: number;
      page?: number;
      limit?: number;
      // Filtros específicos por industria
      temperaturaMin?: number;
      temperaturaMax?: number;
      humedadMin?: number;
      humedadMax?: number;
      talla?: string;
      color?: string;
      sku?: string;
      codigoBarras?: string;
    },
  ) {
    // Si el usuario no tiene empresa configurada, devolver respuesta vacía
    if (!empresaId) {
      return {
        productos: [],
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 50,
        totalPages: 0,
      };
    }

    const where: any = {
      empresaId,
    };

    // Solo aplicar filtro de estado si se especifica explícitamente
    if (filters?.estado && filters.estado !== '') {
      where.estado = filters.estado;
      console.log('🔍 Backend: Aplicando filtro de estado:', filters.estado);
    } else {
      // Por defecto mostrar solo productos activos en la página principal
      where.estado = 'ACTIVO';
      console.log('🔍 Backend: Mostrando solo productos activos por defecto');
    }

    // Filtro de búsqueda por nombre o descripción
    if (filters?.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { descripcion: { contains: filters.search, mode: 'insensitive' } },
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

    // Filtros específicos por industria
    if (
      filters?.temperaturaMin !== undefined ||
      filters?.temperaturaMax !== undefined
    ) {
      where.temperaturaOptima = {};
      if (filters.temperaturaMin !== undefined) {
        where.temperaturaOptima.gte = filters.temperaturaMin;
      }
      if (filters.temperaturaMax !== undefined) {
        where.temperaturaOptima.lte = filters.temperaturaMax;
      }
    }

    if (
      filters?.humedadMin !== undefined ||
      filters?.humedadMax !== undefined
    ) {
      where.humedadOptima = {};
      if (filters.humedadMin !== undefined) {
        where.humedadOptima.gte = filters.humedadMin;
      }
      if (filters.humedadMax !== undefined) {
        where.humedadOptima.lte = filters.humedadMax;
      }
    }

    if (filters?.talla) {
      where.talla = filters.talla;
    }

    if (filters?.color) {
      where.color = filters.color;
    }

    if (filters?.sku) {
      where.sku = { contains: filters.sku, mode: 'insensitive' };
    }

    if (filters?.codigoBarras) {
      where.codigoBarras = {
        contains: filters.codigoBarras,
        mode: 'insensitive',
      };
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
      orderBy: [{ stock: 'desc' }, { nombre: 'asc' }],
      skip,
      take: limit,
    });

    return {
      productos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findInactive(empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, devolver array vacío
    if (!empresaId) {
      return [];
    }

    return this.prisma.producto.findMany({
      where: {
        empresaId,
        estado: 'INACTIVO', // Solo productos inactivos
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

  async findDeleted(empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, devolver array vacío
    if (!empresaId) {
      return [];
    }

    return this.prisma.producto.findMany({
      where: {
        empresaId,
        estado: 'ELIMINADO', // Solo productos eliminados (soft delete)
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

  async findTrash(empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, devolver array vacío
    if (!empresaId) {
      return [];
    }

    return this.prisma.producto.findMany({
      where: {
        empresaId,
        estado: {
          in: ['INACTIVO', 'ELIMINADO'] // Productos inactivos y eliminados
        },
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
        { estado: 'asc' }, // Primero INACTIVO, luego ELIMINADO
        { nombre: 'asc' }
      ],
    });
  }

  async findWithoutProvider(empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, devolver array vacío
    if (!empresaId) {
      return [];
    }

    return this.prisma.producto.findMany({
      where: {
        empresaId,
        estado: 'ACTIVO', // Solo productos activos
        proveedorId: null, // Sin proveedor asignado
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
      orderBy: [{ stock: 'desc' }, { nombre: 'asc' }],
    });
  }

  async findOne(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new ProductNotFoundException(id);
    }

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

  async buscarPorCodigoBarras(
    codigoBarras: string,
    empresaId: number | undefined,
  ) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new ProductNotFoundException(undefined, codigoBarras);
    }

    const producto = await this.prisma.producto.findFirst({
      where: {
        codigoBarras: codigoBarras.trim(),
        empresaId,
        estado: { in: ['ACTIVO', 'INACTIVO'] }, // Excluir eliminados
      },
    });

    if (!producto) {
      throw new ProductNotFoundException(undefined, codigoBarras);
    }

    return producto;
  }

  async update(
    id: number,
    dto: UpdateProductoDto,
    empresaId: number | undefined,
  ) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para actualizar productos',
      );
    }

    // ✅ IMPLEMENTAR TRANSACCIÓN CON VERSIONADO OPTIMISTA
    return this.prisma.$transaction(
      async (tx) => {
        // 1. Verificar que el producto exista y pertenezca a la empresa con versión
        const productoExistente = await tx.producto.findFirst({
          where: {
            id,
            empresaId,
          },
          select: {
            id: true,
            version: true,
            codigoBarras: true,
            estado: true,
          },
        });

        if (!productoExistente) {
          throw new ProductNotFoundException(id);
        }

        // 2. Si se envía proveedorId, validar que sea válido para esta empresa
        if (dto.proveedorId) {
          const proveedor = await tx.proveedor.findFirst({
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
        if (
          dto.codigoBarras &&
          dto.codigoBarras !== productoExistente.codigoBarras
        ) {
          const productoConCodigo = await tx.producto.findFirst({
            where: {
              codigoBarras: dto.codigoBarras.trim(),
              empresaId,
              id: { not: id }, // Excluir el producto actual
            },
          });

          if (productoConCodigo) {
            throw new DuplicateProductException(
              'código de barras',
              dto.codigoBarras,
            );
          }
        }

        // 4. Preparar datos para actualización
        const data = {
          ...dto,
          proveedorId: dto.proveedorId ?? null,
          codigoBarras: dto.codigoBarras?.trim() || null,
          rfid: dto.rfid?.trim() || null,
          sku: dto.sku?.trim() || null,
          version: productoExistente.version + 1, // Incrementar versión
        };

        // 5. Actualizar con versionado optimista
        const updateResult = await tx.producto.updateMany({
          where: {
            id,
            version: productoExistente.version, // Solo actualizar si la versión coincide
          },
          data,
        });

        // 6. Verificar si la actualización fue exitosa
        if (updateResult.count === 0) {
          throw new BadRequestException(
            'El producto fue modificado por otro usuario. Por favor, intente nuevamente.',
          );
        }

        // 7. Retornar el producto actualizado
        return tx.producto.findUnique({
          where: { id },
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
      },
      {
        maxWait: 5000, // Máximo 5 segundos de espera
        timeout: 10000, // Timeout de 10 segundos
        isolationLevel: 'Serializable', // Nivel más alto de aislamiento
      },
    );
  }

  // Método para desactivar (soft delete) - usado por usuarios normales
  async deactivate(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para desactivar productos',
      );
    }

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
  async reactivate(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para reactivar productos',
      );
    }

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
  async softDelete(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para eliminar productos',
      );
    }

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
  async restore(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para restaurar productos',
      );
    }

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
  async remove(id: number, empresaId: number | undefined, rol: Rol) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para eliminar productos',
      );
    }

    if (rol !== Rol.ADMIN && rol !== Rol.SUPERADMIN) {
      throw new InsufficientPermissionsException(
        'ADMIN',
        rol,
        'eliminar productos permanentemente',
      );
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
