import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KPICacheService } from '../../common/services/kpi-cache.service';
import { CrearMovimientoCommand } from '../commands/crear-movimiento.command';

@Injectable()
export class CrearMovimientoHandler {
  private readonly logger = new Logger(CrearMovimientoHandler.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: KPICacheService,
  ) {}

  async execute(
    command: CrearMovimientoCommand,
    empresaId: number | undefined,
  ): Promise<any> {
    if (!empresaId) {
      throw new BadRequestException(
        'El usuario debe tener una empresa configurada para registrar movimientos',
      );
    }

    const movimiento = await this.prisma.$transaction(
      async (tx) => {
        const producto = await tx.producto.findFirst({
          where: { id: command.productoId, empresaId },
          select: {
            id: true,
            stock: true,
            version: true,
            estado: true,
            nombre: true,
            precioCompra: true,
            precioVenta: true,
          },
        });

        if (!producto) {
          throw new NotFoundException('Producto no encontrado');
        }

        if (producto.estado !== 'ACTIVO') {
          throw new BadRequestException(
            'No se pueden registrar movimientos para productos inactivos',
          );
        }

        if (command.proveedorId) {
          const proveedor = await tx.proveedor.findFirst({
            where: { id: command.proveedorId, empresaId, estado: 'ACTIVO' },
          });

          if (!proveedor) {
            throw new NotFoundException('Proveedor no encontrado o inactivo');
          }
        }

        // ✅ NUEVO: Lógica de precios mejorada (comentada temporalmente hasta migración)
        /*
        let precioUnitario = command.precioUnitario;
        let precioTotal = command.precioTotal;
        let tipoPrecio = command.tipoPrecio;

        // Si no se proporciona precioUnitario, usar precios del producto según el tipo
        if (!precioUnitario) {
          if (command.tipo === 'ENTRADA') {
            precioUnitario = producto.precioCompra;
            tipoPrecio = 'COMPRA';
          } else {
            precioUnitario = producto.precioVenta;
            tipoPrecio = 'VENTA';
          }
        }

        // Si no se proporciona precioTotal, calcularlo
        if (!precioTotal && precioUnitario) {
          precioTotal = precioUnitario * command.cantidad;
        }

        // Validar que el precioTotal sea coherente si se proporcionan ambos
        if (precioUnitario && precioTotal) {
          const precioCalculado = precioUnitario * command.cantidad;
          const diferencia = Math.abs(precioCalculado - precioTotal);
          
          // Permitir pequeñas diferencias por redondeo (máximo 0.01)
          if (diferencia > 0.01) {
            throw new BadRequestException(
              'El precio total no coincide con el precio unitario por la cantidad',
            );
          }
        }

        // Determinar tipoPrecio si no se proporciona
        if (!tipoPrecio) {
          if (command.tipo === 'ENTRADA') {
            tipoPrecio = 'COMPRA';
          } else {
            tipoPrecio = 'VENTA';
          }
        }
        */

        const nuevoStock =
          command.tipo === 'ENTRADA'
            ? producto.stock + command.cantidad
            : producto.stock - command.cantidad;

        if (nuevoStock < 0) {
          throw new BadRequestException(
            'No hay suficiente stock para realizar esta salida',
          );
        }

        // Validar que la fecha no sea futura (si se proporciona)
        const fechaMovimiento = command.fecha ? new Date(command.fecha) : new Date();
        const hoy = new Date();
        const mañana = new Date(hoy);
        mañana.setDate(hoy.getDate() + 1);
        
        if (fechaMovimiento > mañana) {
          throw new BadRequestException('La fecha del movimiento no puede ser futura');
        }

        const movimiento = await tx.movimientoInventario.create({
          data: {
            tipo: command.tipo,
            cantidad: command.cantidad,
            productoId: command.productoId,
            empresaId,
            motivo: command.motivo,
            descripcion: command.descripcion,
            fecha: fechaMovimiento,
            // ✅ NUEVO: Campos de precio (comentados temporalmente)
            // precioUnitario,
            // precioTotal,
            // tipoPrecio,
          },
        });

        // 6. Actualizar el stock del producto con versionado optimista
        const updateResult = await tx.producto.updateMany({
          where: {
            id: command.productoId,
            version: producto.version, // Solo actualizar si la versión coincide
          },
          data: {
            stock: nuevoStock,
            version: producto.version + 1, // Incrementar versión
            ...(command.proveedorId && { proveedorId: command.proveedorId }),
          },
        });

        // 7. Verificar si la actualización fue exitosa
        if (updateResult.count === 0) {
          throw new BadRequestException(
            'El producto fue modificado por otro usuario. Por favor, intente nuevamente.',
          );
        }

        this.logger.log(
          `Movimiento registrado exitosamente: ${command.tipo} ${command.cantidad} unidades del producto ${producto.nombre}`,
          {
            empresaId,
            productoId: command.productoId,
            tipo: command.tipo,
            cantidad: command.cantidad,
            stockAnterior: producto.stock,
            stockNuevo: nuevoStock,
            versionAnterior: producto.version,
            versionNueva: producto.version + 1,
            // precioUnitario, // Comentado temporalmente
            // precioTotal, // Comentado temporalmente
            // tipoPrecio, // Comentado temporalmente
          },
        );

        return movimiento;
      },
      {
        maxWait: 5000, // Máximo 5 segundos de espera
        timeout: 10000, // Timeout de 10 segundos
        isolationLevel: 'Serializable', // Nivel más alto de aislamiento
      },
    );

    // ✅ INVALIDAR CACHE DESPUÉS DE LA TRANSACCIÓN
    try {
      await Promise.all([
        this.cacheService.invalidate(`kpis:${empresaId}`),
        this.cacheService.invalidate(`financial-kpis:${empresaId}`),
        this.cacheService.invalidate(`product-kpis:${command.productoId}`),
        this.cacheService.invalidate(`movement-kpis:${empresaId}`),
      ]);

      this.logger.debug(
        `Cache invalidated for empresa ${empresaId} and producto ${command.productoId}`,
      );
    } catch (cacheError) {
      this.logger.warn(
        `Failed to invalidate cache after movement:`,
        cacheError,
      );
      // No lanzar error, solo log
    }

    return movimiento;
  }
}
