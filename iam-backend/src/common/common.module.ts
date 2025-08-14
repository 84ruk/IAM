import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KPICacheService } from './services/kpi-cache.service';
import { CacheStrategiesService } from './services/cache-strategies.service';
import { ErrorHandlerService } from './services/error-handler.service';
import { KPIErrorHandler } from './services/kpi-error-handler.service';
import { RedisConfigService } from './services/redis-config.service';
import { RedisHealthService } from './services/redis-health.service';
import { HealthController } from './controllers/health.controller';
import { ImportacionCacheService } from '../importacion/servicios/importacion-cache.service';
import { PrismaModule } from '../prisma/prisma.module';
import { URLConfigService } from './services/url-config.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [HealthController],
  providers: [
    KPICacheService,
    CacheStrategiesService,
    ErrorHandlerService,
    KPIErrorHandler,
    RedisConfigService,
    RedisHealthService,
    ImportacionCacheService,
    URLConfigService,
  ],
  exports: [
    KPICacheService,
    CacheStrategiesService,
    ErrorHandlerService,
    KPIErrorHandler,
    RedisConfigService,
    RedisHealthService,
    ImportacionCacheService,
    URLConfigService,
  ],
})
export class CommonModule {}
