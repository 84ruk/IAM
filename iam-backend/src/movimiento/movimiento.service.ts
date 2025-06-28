import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearMovimientoDto } from './dto/crear-movimiento.dto';
import { CrearMovimientoPorCodigoBarrasDto } from './dto/crear-movimiento-por-codigo-barras.dto';
import { TipoMovimiento } from '@prisma/client';

@Injectable()
export class MovimientoService {
  constructor(private prisma: PrismaService) {}

  async registrar(dto: CrearMovimientoDto, empresaId: number) {

    const producto = await this.prisma.producto.findFirst({
      where: { id: dto.productoId, empresaId },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Si se proporciona un proveedorId, validar que existe
    if (dto.proveedorId) {
      const proveedor = await this.prisma.proveedor.findFirst({
        where: { id: dto.proveedorId, empresaId, estado: 'ACTIVO' },
      });

      if (!proveedor) {
        throw new NotFoundException('Proveedor no encontrado o inactivo');
      }
    }

    // Crear el movimiento
    const movimiento = await this.prisma.movimientoInventario.create({
      data: {
        tipo: dto.tipo,
        cantidad: dto.cantidad,
        productoId: dto.productoId,
        empresaId,
        motivo: dto.motivo,
        descripcion: dto.descripcion,
      },
    });

    const nuevoStock = dto.tipo === 'ENTRADA' 
      ? producto.stock + dto.cantidad 
      : producto.stock - dto.cantidad;

    if (nuevoStock < 0) {
      throw new BadRequestException('No hay suficiente stock para realizar esta salida');
    }

    // Actualizar el stock del producto y opcionalmente el proveedor
    await this.prisma.producto.update({
      where: { id: dto.productoId },
      data: { 
        stock: nuevoStock,
        ...(dto.proveedorId && { proveedorId: dto.proveedorId })
      },
    });

    return movimiento;
  }

  async registrarPorCodigoBarras(dto: CrearMovimientoPorCodigoBarrasDto, empresaId: number) {
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

  async obtenerPorProducto(productoId: number, empresaId: number) {
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

  async findOne(id: number, empresaId: number) {
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
            etiqueta: true,
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

  async update(id: number, empresaId: number, data: { motivo?: string | null; descripcion?: string | null }) {
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

  async remove(id: number, empresaId: number) {
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

  async removePermanentemente(id: number, empresaId: number) {
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

  async findAll(empresaId: number, tipo?: TipoMovimiento) {
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
            etiqueta: true,
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

  async obtenerEliminados(empresaId: number) {
    return this.prisma.movimientoInventario.findMany({
      where: { 
        empresaId,
        estado: 'ELIMINADO'
      },
      include: {
        producto: {
          select: {
            nombre: true,
            etiqueta: true,
            unidad: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  async findOneEliminado(id: number, empresaId: number) {
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
            etiqueta: true,
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

  async restaurar(id: number, empresaId: number) {
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
