import { Module } from '@nestjs/common';
import { ImportacionController } from './importacion.controller';
import { ImportacionRapidaController } from './importacion-rapida.controller';
import { PlantillasController } from './controllers/plantillas.controller';
import { ImportacionService } from './importacion.service';
import { DetectorTipoImportacionService } from './servicios/detector-tipo-importacion.service';
import { PlantillasService } from './servicios/plantillas.service';
import { ProcesadorArchivosService } from './servicios/procesador-archivos.service';
import { ValidadorDatosService } from './servicios/validador-datos.service';
import { TransformadorDatosService } from './servicios/transformador-datos.service';
import { BatchProcessorService } from './services/batch-processor.service';
import { ValidationCacheService } from './services/validation-cache.service';
import { ErrorHandlerService } from './services/error-handler.service';
import { AdvancedLoggingService } from './services/advanced-logging.service';
import { SmartErrorResolverService } from './services/smart-error-resolver.service';
import { ImportacionProgressTrackerService } from './services/importacion-progress-tracker.service';
import { AutocorreccionInteligenteService } from './services/autocorreccion-inteligente.service';
import { ImportacionRapidaService } from './services/importacion-rapida.service';
import { ReporteErroresService } from './services/reporte-errores.service';
import { ProductoCreatorService } from './services/producto-creator.service';
import { RelacionCreatorService } from './services/relacion-creator.service';
import { ImportacionConfigService } from './config/importacion.config';
import { TrabajoImportacionFactory } from './factories/trabajo-importacion.factory';
import { ColasModule } from '../colas/colas.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketsModule } from '../websockets/websockets.module';
import { ImportacionWebSocketService } from './importacion-websocket.service';
import { PlantillasGeneradorService } from './services/plantillas-generador.service';

@Module({
  imports: [
    ColasModule,
    PrismaModule,
    WebSocketsModule,
  ],
  controllers: [ImportacionController, ImportacionRapidaController, PlantillasController],
  providers: [
    ImportacionService,
    DetectorTipoImportacionService,
    PlantillasService,
    ProcesadorArchivosService,
    ValidadorDatosService,
    TransformadorDatosService,
    BatchProcessorService,
    ValidationCacheService,
    ErrorHandlerService,
    AdvancedLoggingService,
    SmartErrorResolverService,
    ImportacionProgressTrackerService,
    AutocorreccionInteligenteService,
    ImportacionRapidaService,
    ReporteErroresService,
    ProductoCreatorService,
    RelacionCreatorService,
    ImportacionConfigService,
    TrabajoImportacionFactory,
    ImportacionWebSocketService,
    PlantillasGeneradorService,
  ],
  exports: [
    ImportacionService,
    ImportacionWebSocketService,
    ProductoCreatorService,
    RelacionCreatorService,
  ],
})
export class ImportacionModule {} 