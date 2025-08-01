import { Module } from '@nestjs/common';
import { MovimientoController } from './movimiento.controller';
import { MovimientoService } from './movimiento.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

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

// ✅ NUEVO: Servicio de estadísticas financieras
import { EstadisticasFinancierasService } from './services/estadisticas-financieras.service';

// ✅ Servicios de auditoría necesarios para UnifiedEmpresaGuard
import { JwtAuditService } from '../auth/jwt-audit.service';
import { EmpresaCacheService } from '../auth/empresa-cache.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [MovimientoController],
  providers: [
    MovimientoService,
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
    // ✅ NUEVO: Servicio de estadísticas financieras
    EstadisticasFinancierasService,
    // ✅ Servicios de auditoría
    JwtAuditService,
    EmpresaCacheService,
  ],
  exports: [MovimientoService, EstadisticasFinancierasService],
})
export class MovimientoModule {}
