import { Module } from '@nestjs/common';
import { MovimientoService } from './movimiento.service';
import { MovimientoController } from './movimiento.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { KPICacheService } from '../common/services/kpi-cache.service';
import { KPIErrorHandler } from '../common/services/kpi-error-handler.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    MovimientoService,
    KPICacheService,
    KPIErrorHandler
  ],
  controllers: [MovimientoController],
  exports: [MovimientoService]
})
export class MovimientoModule {}
