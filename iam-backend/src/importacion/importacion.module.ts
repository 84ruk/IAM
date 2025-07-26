import { Module } from '@nestjs/common';
import { ImportacionController } from './importacion.controller';
import { ImportacionService } from './importacion.service';
import { ProcesadorArchivosService } from './servicios/procesador-archivos.service';
import { ValidadorDatosService } from './servicios/validador-datos.service';
import { TransformadorDatosService } from './servicios/transformador-datos.service';
import { PlantillasService } from './servicios/plantillas.service';
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
  ],
  exports: [
    ImportacionService,
    ProcesadorArchivosService,
    ValidadorDatosService,
    TransformadorDatosService,
    PlantillasService,
  ],
})
export class ImportacionModule {} 