import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SensorRetentionService {
  private readonly logger = new Logger(SensorRetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  // Job principal de retención ejecutado a la hora configurada
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runDailyRetention() {
    try {
      // Permitir override con CRON env: si existe, solo log y ejecutar secuencia igualmente
      const cronEnv = this.config.get<string>('retention.cron');
      if (cronEnv) {
        this.logger.log(`⏰ Retention job (cron=${cronEnv}) ejecutándose ahora`);
      } else {
        this.logger.log('⏰ Retention job ejecutándose (03:00 AM por defecto)');
      }

      const compactHourlyEnabled = this.config.get<boolean>('retention.compactHourly.enabled');
      if (compactHourlyEnabled) {
        await this.compactHourly();
      }

      const compactDailyEnabled = this.config.get<boolean>('retention.compactDaily.enabled');
      if (compactDailyEnabled) {
        await this.compactDaily();
      }

      const purgeEnabled = this.config.get<boolean>('retention.purge.enabled');
      if (purgeEnabled) {
        await this.purgeVeryOld();
      }

      this.logger.log('✅ Retention job finalizado');
    } catch (error) {
      this.logger.error('❌ Error ejecutando retention job:', error);
    }
  }

  // Mantener 1 lectura por hora en ventana configurable
  private async compactHourly() {
    const startAfterHours = this.config.get<number>('retention.compactHourly.startAfterHours') || 24;
    const rangeDays = this.config.get<number>('retention.compactHourly.rangeDays') || 7;

    const now = new Date();
    const start = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() - startAfterHours * 60 * 60 * 1000);

    this.logger.log(`🕐 Compactación horaria entre ${start.toISOString()} y ${end.toISOString()}`);

    // Estrategia: Para cada empresa/ubicación/sensor/tipo, quedarnos con la lectura con mínima diferencia a la mitad de cada hora
    // Optimizamos usando consulta por franjas y luego eliminaciones en batch
    try {
      // Obtener lecturas objetivo
      const lecturas = await this.prisma.sensorLectura.findMany({
        where: {
          fecha: { gte: start, lte: end },
        },
        select: {
          id: true,
          fecha: true,
          empresaId: true,
          ubicacionId: true,
          sensorId: true,
          tipo: true,
        },
      });

      const keepIds = new Set<number>();
      const buckets = new Map<string, { target: number; id: number; diff: number }>();

      for (const l of lecturas) {
        const horaKey = new Date(l.fecha);
        horaKey.setMinutes(0, 0, 0);
        const key = `${l.empresaId}|${l.ubicacionId || 0}|${l.sensorId || 0}|${l.tipo}|${horaKey.toISOString()}`;

        const targetMs = horaKey.getTime() + 30 * 60 * 1000; // mitad de la hora
        const diff = Math.abs(l.fecha.getTime() - targetMs);

        const existing = buckets.get(key);
        if (!existing || diff < existing.diff) {
          buckets.set(key, { target: targetMs, id: l.id, diff });
        }
      }

      for (const [, v] of buckets) keepIds.add(v.id);

      // Eliminar todas las lecturas del rango excepto las seleccionadas
      const deleteResult = await this.prisma.sensorLectura.deleteMany({
        where: {
          fecha: { gte: start, lte: end },
          id: { notIn: Array.from(keepIds) },
        },
      });

      this.logger.log(`🧹 Compactación horaria: eliminadas ${deleteResult.count} lecturas`);
    } catch (error) {
      this.logger.error('Error en compactación horaria:', error);
    }
  }

  // Mantener 1 lectura por día en ventana configurable
  private async compactDaily() {
    const startAfterDays = this.config.get<number>('retention.compactDaily.startAfterDays') || 7;
    const rangeDays = this.config.get<number>('retention.compactDaily.rangeDays') || 90;

    const now = new Date();
    const end = new Date(now.getTime() - startAfterDays * 24 * 60 * 60 * 1000);
    const start = new Date(now.getTime() - (startAfterDays + rangeDays) * 24 * 60 * 60 * 1000);

    this.logger.log(`📅 Compactación diaria entre ${start.toISOString()} y ${end.toISOString()}`);

    try {
      const lecturas = await this.prisma.sensorLectura.findMany({
        where: {
          fecha: { gte: start, lte: end },
        },
        select: {
          id: true,
          fecha: true,
          empresaId: true,
          ubicacionId: true,
          sensorId: true,
          tipo: true,
        },
      });

      const keepIds = new Set<number>();
      const buckets = new Map<string, { target: number; id: number; diff: number }>();

      for (const l of lecturas) {
        const dayKey = new Date(Date.UTC(l.fecha.getUTCFullYear(), l.fecha.getUTCMonth(), l.fecha.getUTCDate()));
        const key = `${l.empresaId}|${l.ubicacionId || 0}|${l.sensorId || 0}|${l.tipo}|${dayKey.toISOString()}`;

        const targetMs = dayKey.getTime() + 12 * 60 * 60 * 1000; // mediodía UTC
        const diff = Math.abs(l.fecha.getTime() - targetMs);

        const existing = buckets.get(key);
        if (!existing || diff < existing.diff) {
          buckets.set(key, { target: targetMs, id: l.id, diff });
        }
      }

      for (const [, v] of buckets) keepIds.add(v.id);

      const deleteResult = await this.prisma.sensorLectura.deleteMany({
        where: {
          fecha: { gte: start, lte: end },
          id: { notIn: Array.from(keepIds) },
        },
      });

      this.logger.log(`🧹 Compactación diaria: eliminadas ${deleteResult.count} lecturas`);
    } catch (error) {
      this.logger.error('Error en compactación diaria:', error);
    }
  }

  // Purgar lecturas más antiguas que maxAgeDays
  private async purgeVeryOld() {
    const maxAgeDays = this.config.get<number>('retention.purge.maxAgeDays') || 365;
    const limitDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
    this.logger.log(`🗑️ Purga de lecturas anteriores a ${limitDate.toISOString()}`);

    try {
      const deleteResult = await this.prisma.sensorLectura.deleteMany({
        where: { fecha: { lt: limitDate } },
      });
      this.logger.log(`🗑️ Purga completada: eliminadas ${deleteResult.count} lecturas antiguas`);
    } catch (error) {
      this.logger.error('Error purgando lecturas antiguas:', error);
    }
  }
}


