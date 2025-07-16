import { Module } from '@nestjs/common';
import { KPICacheService } from './services/kpi-cache.service';
import { CacheStrategiesService } from './services/cache-strategies.service';
import { ErrorHandlerService } from './services/error-handler.service';
import { KPIErrorHandler } from './services/kpi-error-handler.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    KPICacheService,
    CacheStrategiesService,
    ErrorHandlerService,
    KPIErrorHandler,
  ],
  exports: [
    KPICacheService,
    CacheStrategiesService,
    ErrorHandlerService,
    KPIErrorHandler,
  ],
})
export class CommonModule {} 