import { Module } from '@nestjs/common';
import { KPICacheService } from './services/kpi-cache.service';
import { CacheStrategiesService } from './services/cache-strategies.service';
import { ErrorHandlerService } from './services/error-handler.service';
import { KPIErrorHandler } from './services/kpi-error-handler.service';
import { RedisConfigService } from './services/redis-config.service';
import { RedisHealthService } from './services/redis-health.service';
import { HealthController } from './controllers/health.controller';
import { ImportacionCacheService } from '../importacion/servicios/importacion-cache.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [
    KPICacheService,
    CacheStrategiesService,
    ErrorHandlerService,
    KPIErrorHandler,
    RedisConfigService,
    RedisHealthService,
    ImportacionCacheService,
  ],
  exports: [
    KPICacheService,
    CacheStrategiesService,
    ErrorHandlerService,
    KPIErrorHandler,
    RedisConfigService,
    RedisHealthService,
    ImportacionCacheService,
  ],
})
export class CommonModule {}
