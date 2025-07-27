import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ColasService } from './colas.service';
import { ColasConfigService } from './services/colas-config.service';
import { ColasErrorHandlerService } from './services/colas-error-handler.service';
import { ColasMonitoringService } from './services/colas-monitoring.service';
import { TrabajoSerializerService } from './services/trabajo-serializer.service';
import { ImportacionProductosProcesador } from './procesadores/importacion-productos.procesador';
import { ImportacionProveedoresProcesador } from './procesadores/importacion-proveedores.procesador';
import { ImportacionMovimientosProcesador } from './procesadores/importacion-movimientos.procesador';
import { ImportacionUnificadaProcesador } from './procesadores/importacion-unificada.procesador';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { ImportacionCacheService } from '../importacion/servicios/importacion-cache.service';
import { AdvancedLoggingService } from '../importacion/services/advanced-logging.service';
import { SmartErrorResolverService } from '../importacion/services/smart-error-resolver.service';
import { ImportacionProgressTrackerService } from '../importacion/services/importacion-progress-tracker.service';
import { EstrategiaImportacionFactory } from '../importacion/factories/estrategia-importacion.factory';
import { ProductosEstrategia } from '../importacion/dto/estrategias/productos-estrategia';
import { ProveedoresEstrategia } from '../importacion/dto/estrategias/proveedores-estrategia';
import { MovimientosEstrategia } from '../importacion/dto/estrategias/movimientos-estrategia';
// import { ImportacionModule } from '../importacion/importacion.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    CommonModule,
    // ImportacionModule, // Comentado para evitar dependencia circular
  ],
  providers: [
    ColasService,
    ColasConfigService,
    ColasErrorHandlerService,
    ColasMonitoringService,
    TrabajoSerializerService,
    ImportacionProductosProcesador,
    ImportacionProveedoresProcesador,
    ImportacionMovimientosProcesador,
    ImportacionUnificadaProcesador,
    ImportacionCacheService,
    AdvancedLoggingService,
    SmartErrorResolverService,
    ImportacionProgressTrackerService,
    EstrategiaImportacionFactory,
    ProductosEstrategia,
    ProveedoresEstrategia,
    MovimientosEstrategia,
  ],
  exports: [
    ColasService,
    ColasConfigService,
    ColasErrorHandlerService,
    ColasMonitoringService,
    TrabajoSerializerService,
    ImportacionProductosProcesador,
    ImportacionProveedoresProcesador,
    ImportacionMovimientosProcesador,
    ImportacionUnificadaProcesador,
    ImportacionCacheService,
    AdvancedLoggingService,
    SmartErrorResolverService,
    ImportacionProgressTrackerService,
    EstrategiaImportacionFactory,
    ProductosEstrategia,
    ProveedoresEstrategia,
    MovimientosEstrategia,
  ],
})
export class ColasModule {} 