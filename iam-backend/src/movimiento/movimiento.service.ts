import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearMovimientoDto } from './dto/crear-movimiento.dto';
import { CrearMovimientoPorCodigoBarrasDto } from './dto/crear-movimiento-por-codigo-barras.dto';
import { TipoMovimiento } from '@prisma/client';
import { KPICacheService } from '../common/services/kpi-cache.service';

@Injectable()
export class MovimientoService {
  private readonly logger = new Logger(MovimientoService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: KPICacheService
  ) {}

  async registrar(dto: CrearMovimientoDto, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada para registrar movimientos');
    }

    // ✅ IMPLEMENTAR TRANSACCIÓN CRÍTICA CON VERSIONADO OPTIMISTA
    const movimiento = await this.prisma.$transaction(async (tx) => {
      // 1. Validar producto con versionado optimista
      const producto = await tx.producto.findFirst({
        where: { id: dto.productoId, empresaId },
        select: {
          id: true,
          stock: true,
          version: true,
          estado: true,
          nombre: true
        }
      });

      if (!producto) {
        throw new NotFoundException('Producto no encontrado');
      }

      if (producto.estado !== 'ACTIVO') {
        throw new BadRequestException('No se pueden registrar movimientos para productos inactivos');
      }

      // 2. Validar proveedor si se proporciona
      if (dto.proveedorId) {
        const proveedor = await tx.proveedor.findFirst({
          where: { id: dto.proveedorId, empresaId, estado: 'ACTIVO' },
        });

        if (!proveedor) {
          throw new NotFoundException('Proveedor no encontrado o inactivo');
        }
      }

      // 3. Calcular nuevo stock
      const nuevoStock = dto.tipo === 'ENTRADA' 
        ? producto.stock + dto.cantidad 
        : producto.stock - dto.cantidad;

      // 4. Validar stock suficiente para salidas
      if (nuevoStock < 0) {
        throw new BadRequestException('No hay suficiente stock para realizar esta salida');
      }

      // 5. Crear el movimiento
      const movimiento = await tx.movimientoInventario.create({
        data: {
          tipo: dto.tipo,
          cantidad: dto.cantidad,
          productoId: dto.productoId,
          empresaId,
          motivo: dto.motivo,
          descripcion: dto.descripcion,
        },
      });

      // 6. Actualizar el stock del producto con versionado optimista
      const updateResult = await tx.producto.updateMany({
        where: { 
          id: dto.productoId,
          version: producto.version // Solo actualizar si la versión coincide
        },
        data: { 
          stock: nuevoStock,
          version: producto.version + 1, // Incrementar versión
          ...(dto.proveedorId && { proveedorId: dto.proveedorId })
        },
      });

      // 7. Verificar si la actualización fue exitosa
      if (updateResult.count === 0) {
        throw new BadRequestException('El producto fue modificado por otro usuario. Por favor, intente nuevamente.');
      }

      this.logger.log(`Movimiento registrado exitosamente: ${dto.tipo} ${dto.cantidad} unidades del producto ${producto.nombre}`, {
        empresaId,
        productoId: dto.productoId,
        tipo: dto.tipo,
        cantidad: dto.cantidad,
        stockAnterior: producto.stock,
        stockNuevo: nuevoStock,
        versionAnterior: producto.version,
        versionNueva: producto.version + 1
      });

      return movimiento;
    }, {
      maxWait: 5000, // Máximo 5 segundos de espera
      timeout: 10000, // Timeout de 10 segundos
      isolationLevel: 'Serializable', // Nivel más alto de aislamiento
    });

    // ✅ INVALIDAR CACHE DESPUÉS DE LA TRANSACCIÓN
    try {
      await Promise.all([
        this.cacheService.invalidate(`kpis:${empresaId}`),
        this.cacheService.invalidate(`financial-kpis:${empresaId}`),
        this.cacheService.invalidate(`product-kpis:${dto.productoId}`),
        this.cacheService.invalidate(`movement-kpis:${empresaId}`),
      ]);
      
      this.logger.debug(`Cache invalidated for empresa ${empresaId} and producto ${dto.productoId}`);
    } catch (cacheError) {
      this.logger.warn(`Failed to invalidate cache after movement:`, cacheError);
      // No lanzar error, solo log
    }

    return movimiento;
  }

  async registrarPorCodigoBarras(dto: CrearMovimientoPorCodigoBarrasDto, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada para registrar movimientos');
    }

    // Buscar el producto por código de barras
    const producto = await this.prisma.producto.findFirst({
      where: { 
        codigoBarras: dto.codigoBarras.trim(),
        empresaId,
        estado: 'ACTIVO'
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado con ese código de barras');
    }

    // Crear el movimiento usando el producto encontrado
    const movimientoDto: CrearMovimientoDto = {
      tipo: dto.tipo,
      cantidad: dto.cantidad,
      productoId: producto.id,
      motivo: dto.motivo,
      descripcion: dto.descripcion,
    };

    return this.registrar(movimientoDto, empresaId);
  }

  async obtenerPorProducto(productoId: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new NotFoundException('Producto no encontrado');
    }

    const producto = await this.prisma.producto.findFirst({
      where: { id: productoId, empresaId },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    return this.prisma.movimientoInventario.findMany({
      where: { 
        productoId,
        estado: 'ACTIVO' // Solo movimientos activos
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async findOne(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new NotFoundException('Movimiento no encontrado');
    }

    const movimiento = await this.prisma.movimientoInventario.findFirst({
      where: { 
        id, 
        empresaId,
        estado: 'ACTIVO' // Solo movimientos activos
      },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            stock: true,
            stockMinimo: true,
            precioCompra: true,
            precioVenta: true,
            unidad: true,
            etiquetas: true,
            codigoBarras: true,
            rfid: true,
            sku: true,
            estado: true,
            tipoProducto: true,
            proveedor: {
              select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true,
                estado: true,
              },
            },
          },
        },
      },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento no encontrado');
    }

    return movimiento;
  }

  async update(id: number, empresaId: number | undefined, data: { motivo?: string | null; descripcion?: string | null }) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada para actualizar movimientos');
    }

    const movimiento = await this.prisma.movimientoInventario.findFirst({
      where: { 
        id, 
        empresaId,
        estado: 'ACTIVO' // Solo movimientos activos
      },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento no encontrado');
    }

    return this.prisma.movimientoInventario.update({
      where: { id },
      data: {
        motivo: data.motivo,
        descripcion: data.descripcion,
      },
    });
  }

  async remove(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada para eliminar movimientos');
    }

    const movimiento = await this.prisma.movimientoInventario.findFirst({
      where: { 
        id, 
        empresaId,
        estado: 'ACTIVO' // Solo movimientos activos
      },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento no encontrado');
    }

    // Soft delete - cambiar estado a ELIMINADO
    return this.prisma.movimientoInventario.update({
      where: { id },
      data: { estado: 'ELIMINADO' },
    });
  }

  async removePermanentemente(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada para eliminar movimientos');
    }

    const movimiento = await this.prisma.movimientoInventario.findFirst({
      where: { 
        id, 
        empresaId,
        estado: 'ELIMINADO' // Solo movimientos eliminados
      },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento eliminado no encontrado');
    }

    // Eliminación permanente
    return this.prisma.movimientoInventario.delete({
      where: { id },
    });
  }

  async findAll(empresaId: number | undefined, tipo?: TipoMovimiento) {
    // Si el usuario no tiene empresa configurada, devolver respuesta vacía
    if (!empresaId) {
      return {
        movimientos: [],
        estadisticas: {
          total: 0,
          entradas: 0,
          salidas: 0,
          hoy: 0
        }
      };
    }

    const movimientos = await this.prisma.movimientoInventario.findMany({
      where: {
        empresaId,
        estado: 'ACTIVO', // Solo movimientos activos
        ...(tipo && { tipo }),
      },
      include: {
        producto: {
          select: {
            nombre: true,
            etiquetas: true,
            unidad: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });

    // Calcular estadísticas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const [totalMovimientos, entradas, salidas, movimientosHoy] = await Promise.all([
      this.prisma.movimientoInventario.count({
        where: { empresaId, estado: 'ACTIVO' }
      }),
      this.prisma.movimientoInventario.count({
        where: { empresaId, tipo: 'ENTRADA', estado: 'ACTIVO' }
      }),
      this.prisma.movimientoInventario.count({
        where: { empresaId, tipo: 'SALIDA', estado: 'ACTIVO' }
      }),
      this.prisma.movimientoInventario.count({
        where: {
          empresaId,
          estado: 'ACTIVO',
          fecha: {
            gte: hoy,
            lt: mañana
          }
        }
      })
    ]);

    return {
      movimientos,
      estadisticas: {
        total: totalMovimientos,
        entradas,
        salidas,
        hoy: movimientosHoy
      }
    };
  }

  async obtenerEliminados(empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, devolver array vacío
    if (!empresaId) {
      return [];
    }

    return this.prisma.movimientoInventario.findMany({
      where: { 
        empresaId,
        estado: 'ELIMINADO'
      },
      include: {
        producto: {
          select: {
            nombre: true,
            etiquetas: true,
            unidad: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async findOneEliminado(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new NotFoundException('Movimiento eliminado no encontrado');
    }

    const movimiento = await this.prisma.movimientoInventario.findFirst({
      where: { 
        id, 
        empresaId,
        estado: 'ELIMINADO' // Solo movimientos eliminados
      },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            stock: true,
            stockMinimo: true,
            precioCompra: true,
            precioVenta: true,
            unidad: true,
            etiquetas: true,
            codigoBarras: true,
            rfid: true,
            sku: true,
            estado: true,
            tipoProducto: true,
            proveedor: {
              select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true,
                estado: true,
              },
            },
          },
        },
      },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento eliminado no encontrado');
    }

    return movimiento;
  }

  async restaurar(id: number, empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, lanzar error
    if (!empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada para restaurar movimientos');
    }

    const movimiento = await this.prisma.movimientoInventario.findFirst({
      where: { 
        id, 
        empresaId,
        estado: 'ELIMINADO'
      },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento eliminado no encontrado');
    }

    return this.prisma.movimientoInventario.update({
      where: { id },
      data: { estado: 'ACTIVO' },
    });
  }
}
