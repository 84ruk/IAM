import { Module } from '@nestjs/common';
import { MovimientoService } from './movimiento.service';
import { MovimientoController } from './movimiento.controller';

@Module({
  providers: [MovimientoService],
  controllers: [MovimientoController]
})
export class MovimientoModule {}
