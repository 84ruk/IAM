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

        const nuevoStock =
          command.tipo === 'ENTRADA'
            ? producto.stock + command.cantidad
            : producto.stock - command.cantidad;

        if (nuevoStock < 0) {
          throw new BadRequestException(
            'No hay suficiente stock para realizar esta salida',
          );
        }

        const movimiento = await tx.movimientoInventario.create({
          data: {
            tipo: command.tipo,
            cantidad: command.cantidad,
            productoId: command.productoId,
            empresaId,
            motivo: command.motivo,
            descripcion: command.descripcion,
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
