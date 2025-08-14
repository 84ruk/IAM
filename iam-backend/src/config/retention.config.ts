import { registerAs } from '@nestjs/config';

export default registerAs('retention', () => ({
  // Hora de ejecución del job en formato cron (min hora * * *)
  cron: process.env.SENSOR_RETENTION_CRON || '30 3 * * *', // 03:30 todos los días

  // Compactación a nivel horario: mantener 1 lectura por hora
  compactHourly: {
    enabled: (process.env.SENSOR_RETENTION_COMPACT_HOURLY_ENABLED || 'true') === 'true',
    // A partir de cuántas horas atrás se empieza a compactar a nivel horario
    startAfterHours: parseInt(process.env.SENSOR_RETENTION_HOURLY_START_AFTER_HOURS || '24', 10),
    // Ventana (en días) en la que se aplica compactación horaria
    rangeDays: parseInt(process.env.SENSOR_RETENTION_HOURLY_RANGE_DAYS || '7', 10),
  },

  // Compactación a nivel diario: mantener 1 lectura por día
  compactDaily: {
    enabled: (process.env.SENSOR_RETENTION_COMPACT_DAILY_ENABLED || 'true') === 'true',
    // A partir de cuántos días atrás se empieza a compactar a nivel diario
    startAfterDays: parseInt(process.env.SENSOR_RETENTION_DAILY_START_AFTER_DAYS || '7', 10),
    // Ventana (en días) en la que se aplica compactación diaria
    rangeDays: parseInt(process.env.SENSOR_RETENTION_DAILY_RANGE_DAYS || '90', 10),
  },

  // Eliminación total de lecturas muy antiguas
  purge: {
    enabled: (process.env.SENSOR_RETENTION_PURGE_ENABLED || 'true') === 'true',
    // Días máximos a retener antes de purgar completamente
    maxAgeDays: parseInt(process.env.SENSOR_RETENTION_MAX_AGE_DAYS || '365', 10),
  },
}));


