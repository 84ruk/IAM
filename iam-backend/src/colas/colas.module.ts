import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ColasService } from './colas.service';
import { ImportacionProductosProcesador } from './procesadores/importacion-productos.procesador';
import { ImportacionProveedoresProcesador } from './procesadores/importacion-proveedores.procesador';
import { ImportacionMovimientosProcesador } from './procesadores/importacion-movimientos.procesador';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
  ],
  providers: [
    ColasService,
    ImportacionProductosProcesador,
    ImportacionProveedoresProcesador,
    ImportacionMovimientosProcesador,
  ],
  exports: [
    ColasService,
    ImportacionProductosProcesador,
    ImportacionProveedoresProcesador,
    ImportacionMovimientosProcesador,
  ],
})
export class ColasModule {} 