import { Module } from '@nestjs/common';
import { MovimientoService } from './movimiento.service';
import { MovimientoController } from './movimiento.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { KPICacheService } from '../common/services/kpi-cache.service';
import { KPIErrorHandler } from '../common/services/kpi-error-handler.service';

// Command Handlers
import { CrearMovimientoHandler } from './handlers/crear-movimiento.handler';
import { CrearMovimientoPorCodigoBarrasHandler } from './handlers/crear-movimiento-por-codigo-barras.handler';
import { ActualizarMovimientoHandler } from './handlers/actualizar-movimiento.handler';
import { EliminarMovimientoHandler } from './handlers/eliminar-movimiento.handler';
import { EliminarPermanentementeMovimientoHandler } from './handlers/eliminar-permanentemente-movimiento.handler';
import { RestaurarMovimientoHandler } from './handlers/restaurar-movimiento.handler';

// Query Handlers
import { ObtenerMovimientosHandler } from './handlers/obtener-movimientos.handler';
import { ObtenerMovimientoHandler } from './handlers/obtener-movimiento.handler';
import { ObtenerMovimientosPorProductoHandler } from './handlers/obtener-movimientos-por-producto.handler';
import { ObtenerMovimientosEliminadosHandler } from './handlers/obtener-movimientos-eliminados.handler';
import { ObtenerMovimientoEliminadoHandler } from './handlers/obtener-movimiento-eliminado.handler';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    MovimientoService,
    KPICacheService,
    KPIErrorHandler,
    // Command Handlers
    CrearMovimientoHandler,
    CrearMovimientoPorCodigoBarrasHandler,
    ActualizarMovimientoHandler,
    EliminarMovimientoHandler,
    EliminarPermanentementeMovimientoHandler,
    RestaurarMovimientoHandler,
    // Query Handlers
    ObtenerMovimientosHandler,
    ObtenerMovimientoHandler,
    ObtenerMovimientosPorProductoHandler,
    ObtenerMovimientosEliminadosHandler,
    ObtenerMovimientoEliminadoHandler,
  ],
  controllers: [MovimientoController],
  exports: [MovimientoService],
})
export class MovimientoModule {}
