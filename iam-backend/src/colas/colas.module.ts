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
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { ImportacionCacheService } from '../importacion/servicios/importacion-cache.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    CommonModule,
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
    ImportacionCacheService,
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
    ImportacionCacheService,
  ],
})
export class ColasModule {} 