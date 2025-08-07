import { Module } from '@nestjs/common';
import { UbicacionesService } from './ubicaciones.service';
import { UbicacionesController } from './ubicaciones.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [UbicacionesService],
  controllers: [UbicacionesController],
  exports: [UbicacionesService],
})
export class UbicacionesModule {} 