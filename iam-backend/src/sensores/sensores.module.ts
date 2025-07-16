import { Module } from '@nestjs/common';
import { SensoresService } from './sensores.service';
import { SensoresController } from './sensores.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [SensoresService],
  controllers: [SensoresController]
})
export class SensoresModule {}
