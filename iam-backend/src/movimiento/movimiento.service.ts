import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KPICacheService } from '../common/services/kpi-cache.service';
import { CrearMovimientoCommand } from './commands/crear-movimiento.command';
import { CrearMovimientoPorCodigoBarrasCommand } from './commands/crear-movimiento-por-codigo-barras.command';
import { ActualizarMovimientoCommand } from './commands/actualizar-movimiento.command';
import { ObtenerMovimientosQuery } from './queries/obtener-movimientos.query';
import { ObtenerMovimientoQuery } from './queries/obtener-movimiento.query';
import { ObtenerMovimientosPorProductoQuery } from './queries/obtener-movimientos-por-producto.query';
import { TipoMovimiento } from '@prisma/client';

// Importar todos los handlers
import { CrearMovimientoHandler } from './handlers/crear-movimiento.handler';
import { CrearMovimientoPorCodigoBarrasHandler } from './handlers/crear-movimiento-por-codigo-barras.handler';
import { ActualizarMovimientoHandler } from './handlers/actualizar-movimiento.handler';
import { EliminarMovimientoHandler } from './handlers/eliminar-movimiento.handler';
import { EliminarPermanentementeMovimientoHandler } from './handlers/eliminar-permanentemente-movimiento.handler';
import { RestaurarMovimientoHandler } from './handlers/restaurar-movimiento.handler';
import { ObtenerMovimientosHandler } from './handlers/obtener-movimientos.handler';
import { ObtenerMovimientoHandler } from './handlers/obtener-movimiento.handler';
import { ObtenerMovimientosPorProductoHandler } from './handlers/obtener-movimientos-por-producto.handler';
import { ObtenerMovimientosEliminadosHandler } from './handlers/obtener-movimientos-eliminados.handler';
import { ObtenerMovimientoEliminadoHandler } from './handlers/obtener-movimiento-eliminado.handler';

@Injectable()
export class MovimientoService {
  private readonly logger = new Logger(MovimientoService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: KPICacheService,
    // Command Handlers
    private crearMovimientoHandler: CrearMovimientoHandler,
    private crearMovimientoPorCodigoBarrasHandler: CrearMovimientoPorCodigoBarrasHandler,
    private actualizarMovimientoHandler: ActualizarMovimientoHandler,
    private eliminarMovimientoHandler: EliminarMovimientoHandler,
    private eliminarPermanentementeMovimientoHandler: EliminarPermanentementeMovimientoHandler,
    private restaurarMovimientoHandler: RestaurarMovimientoHandler,
    // Query Handlers
    private obtenerMovimientosHandler: ObtenerMovimientosHandler,
    private obtenerMovimientoHandler: ObtenerMovimientoHandler,
    private obtenerMovimientosPorProductoHandler: ObtenerMovimientosPorProductoHandler,
    private obtenerMovimientosEliminadosHandler: ObtenerMovimientosEliminadosHandler,
    private obtenerMovimientoEliminadoHandler: ObtenerMovimientoEliminadoHandler,
  ) {}

  // COMMANDS - Operaciones de escritura
  async registrar(dto: any, empresaId: number | undefined) {
    const command = new CrearMovimientoCommand();
    Object.assign(command, dto);
    return this.crearMovimientoHandler.execute(command, empresaId);
  }

  async registrarPorCodigoBarras(dto: any, empresaId: number | undefined) {
    const command = new CrearMovimientoPorCodigoBarrasCommand();
    Object.assign(command, dto);
    return this.crearMovimientoPorCodigoBarrasHandler.execute(
      command,
      empresaId,
    );
  }

  async update(id: number, empresaId: number | undefined, data: any) {
    const command = new ActualizarMovimientoCommand();
    Object.assign(command, data);
    return this.actualizarMovimientoHandler.execute(id, command, empresaId);
  }

  async remove(id: number, empresaId: number | undefined) {
    return this.eliminarMovimientoHandler.execute(id, empresaId);
  }

  async removePermanentemente(id: number, empresaId: number | undefined) {
    return this.eliminarPermanentementeMovimientoHandler.execute(id, empresaId);
  }

  async restaurar(id: number, empresaId: number | undefined) {
    return this.restaurarMovimientoHandler.execute(id, empresaId);
  }

  // QUERIES - Operaciones de lectura
  async findAll(empresaId: number | undefined, tipo?: TipoMovimiento) {
    const query = new ObtenerMovimientosQuery();
    if (tipo) query.tipo = tipo;
    return this.obtenerMovimientosHandler.execute(query, empresaId);
  }

  async findOne(id: number, empresaId: number | undefined) {
    const query = new ObtenerMovimientoQuery();
    query.id = id;
    return this.obtenerMovimientoHandler.execute(query, empresaId);
  }

  async obtenerPorProducto(productoId: number, empresaId: number | undefined) {
    const query = new ObtenerMovimientosPorProductoQuery();
    query.productoId = productoId;
    return this.obtenerMovimientosPorProductoHandler.execute(query, empresaId);
  }

  async obtenerEliminados(empresaId: number | undefined) {
    return this.obtenerMovimientosEliminadosHandler.execute(empresaId);
  }

  async findOneEliminado(id: number, empresaId: number | undefined) {
    return this.obtenerMovimientoEliminadoHandler.execute(id, empresaId);
  }
}
