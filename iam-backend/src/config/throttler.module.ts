import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { throttlerConfig } from './throttler.config';

/**
 * 🔧 Módulo de Throttler específico para endpoints que requieren rate limiting
 * NO se aplica globalmente, solo donde se importe explícitamente
 */
@Module({
  imports: [
    ThrottlerModule.forRoot(throttlerConfig),
  ],
  exports: [ThrottlerModule],
})
export class AppThrottlerModule {}

/**
 * 🔓 Módulo de Throttler específico para IoT (muy permisivo)
 */
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 999999, // Prácticamente sin límite
        name: 'iot-ultra-permissive',
      },
      {
        ttl: 3600000, // 1 hora
        limit: 9999999, // Prácticamente sin límite
        name: 'iot-ultra-permissive-hour',
      },
      {
        ttl: 86400000, // 1 día
        limit: 99999999, // Prácticamente sin límite
        name: 'iot-ultra-permissive-day',
      },
    ]),
  ],
  exports: [ThrottlerModule],
})
export class IoTThrottlerModule {}
