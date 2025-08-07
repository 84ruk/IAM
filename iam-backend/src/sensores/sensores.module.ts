import { Module } from '@nestjs/common';
import { SensoresService } from './sensores.service';
import { SensoresController } from './sensores.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertasAvanzadasModule } from '../alertas/alertas-avanzadas.module';
import { SensoresGateway } from '../websockets/sensores/sensores.gateway';

@Module({
  imports: [AuthModule, PrismaModule, AlertasAvanzadasModule],
  providers: [SensoresService, SensoresGateway],
  controllers: [SensoresController],
  exports: [SensoresService],
})
export class SensoresModule {}
