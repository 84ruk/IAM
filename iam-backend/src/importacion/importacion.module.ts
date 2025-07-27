import { Module } from '@nestjs/common';
import { ImportacionController } from './importacion.controller';
import { ImportacionService } from './importacion.service';
import { ProcesadorArchivosService } from './servicios/procesador-archivos.service';
import { ValidadorDatosService } from './servicios/validador-datos.service';
import { TransformadorDatosService } from './servicios/transformador-datos.service';
import { PlantillasService } from './servicios/plantillas.service';
import { BatchProcessorService } from './services/batch-processor.service';
import { ValidationCacheService } from './services/validation-cache.service';
import { ErrorHandlerService } from './services/error-handler.service';
import { EstrategiaImportacionFactory } from './factories/estrategia-importacion.factory';
import { ProductosEstrategia } from './dto/estrategias/productos-estrategia';
import { ProveedoresEstrategia } from './dto/estrategias/proveedores-estrategia';
import { MovimientosEstrategia } from './dto/estrategias/movimientos-estrategia';
import { DetectorTipoImportacionService } from './servicios/detector-tipo-importacion.service';
import { ColasModule } from '../colas/colas.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    ColasModule,    // Para procesamiento asíncrono
    PrismaModule,   // Para acceso a base de datos
    AuthModule,     // Para autenticación y autorización
    CommonModule,   // Para configuración Redis unificada
  ],
  controllers: [ImportacionController],
  providers: [
    ImportacionService,
    ProcesadorArchivosService,
    ValidadorDatosService,
    TransformadorDatosService,
    PlantillasService,
    BatchProcessorService,
    ValidationCacheService,
    ErrorHandlerService,
    EstrategiaImportacionFactory,
    ProductosEstrategia,
    ProveedoresEstrategia,
    MovimientosEstrategia,
    DetectorTipoImportacionService,
  ],
  exports: [
    ImportacionService,
    ProcesadorArchivosService,
    ValidadorDatosService,
    TransformadorDatosService,
    PlantillasService,
    BatchProcessorService,
    ValidationCacheService,
    ErrorHandlerService,
    EstrategiaImportacionFactory,
    ProductosEstrategia,
    ProveedoresEstrategia,
    MovimientosEstrategia,
    DetectorTipoImportacionService,
  ],
})
export class ImportacionModule {} 