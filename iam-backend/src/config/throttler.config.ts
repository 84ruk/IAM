import { ThrottlerOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerOptions[] = [
  // 🔓 Configuración para dispositivos IoT (muy permisiva)
  {
    ttl: 60000, // 1 minuto
    limit: 1000, // 1000 requests por minuto
    name: 'iot-short',
  },
  {
    ttl: 3600000, // 1 hora
    limit: 10000, // 10000 requests por hora
    name: 'iot-medium',
  },
  {
    ttl: 86400000, // 1 día
    limit: 100000, // 100000 requests por día
    name: 'iot-long',
  },
  // ⏱️ Configuración para endpoints normales (moderada)
  {
    ttl: 60000, // 1 minuto
    limit: 100, // 100 requests por minuto
    name: 'normal-short',
  },
  {
    ttl: 3600000, // 1 hora
    limit: 1000, // 1000 requests por hora
    name: 'normal-medium',
  },
  // 🚫 Configuración para endpoints sensibles (restrictiva)
  {
    ttl: 60000, // 1 minuto
    limit: 10, // 10 requests por minuto
    name: 'sensitive-short',
  },
  {
    ttl: 3600000, // 1 hora
    limit: 100, // 100 requests por hora
    name: 'sensitive-medium',
  },
];

export const iotThrottlerConfig: ThrottlerOptions[] = [
  // 🔓 Configuración específica para IoT (sin límites prácticos)
  {
    ttl: 60000, // 1 minuto
    limit: 10000, // 10000 requests por minuto
    name: 'iot-ultra-permissive',
  },
  {
    ttl: 3600000, // 1 hora
    limit: 100000, // 100000 requests por hora
    name: 'iot-ultra-permissive-hour',
  },
  {
    ttl: 86400000, // 1 día
    limit: 1000000, // 1M requests por día
    name: 'iot-ultra-permissive-day',
  },
];
