import { Injectable, Logger } from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import { ColasConfigService } from './colas-config.service';

export interface QueueStats {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
  processingRate: number;
  errorRate: number;
  avgProcessingTime: number;
  memoryUsage: number;
  lastUpdated: Date;
}

export interface JobStats {
  jobId: string;
  status: string;
  progress: number;
  attempts: number;
  delay: number;
  timestamp: Date;
  processingTime?: number;
  errorMessage?: string;
}

export interface WorkerStats {
  workerId: string;
  status: 'idle' | 'working' | 'error';
  currentJob?: string;
  jobsProcessed: number;
  jobsFailed: number;
  avgProcessingTime: number;
  memoryUsage: number;
  uptime: number;
  lastActivity: Date;
}

@Injectable()
export class ColasMonitoringService {
  private readonly logger = new Logger(ColasMonitoringService.name);
  private readonly statsCache = new Map<string, QueueStats>();
  private readonly cacheTTL = 30000; // 30 segundos

  constructor(private readonly colasConfigService: ColasConfigService) {}

  /**
   * Obtiene estadísticas completas de una cola
   */
  async getQueueStats(queue: Queue): Promise<QueueStats> {
    const queueName = queue.name;
    const cacheKey = `stats:${queueName}`;
    const cached = this.statsCache.get(cacheKey);
    
    // Verificar cache
    if (cached && (Date.now() - cached.lastUpdated.getTime()) < this.cacheTTL) {
      return cached;
    }

    try {
      const [
        waiting,
        active,
        completed,
        failed,
        delayed
      ] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      const total = waiting.length + active.length + completed.length + failed.length + delayed.length;
      
      // Calcular métricas de rendimiento
      const processingRate = this.calculateProcessingRate(completed.length, failed.length);
      const errorRate = this.calculateErrorRate(failed.length, total);
      const avgProcessingTime = await this.calculateAverageProcessingTime(queue);
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

      const stats: QueueStats = {
        queueName,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total,
        processingRate,
        errorRate,
        avgProcessingTime,
        memoryUsage: Math.round(memoryUsage * 100) / 100,
        lastUpdated: new Date(),
      };

      // Actualizar cache
      this.statsCache.set(cacheKey, stats);
      
      return stats;
    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas de cola ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de un trabajo específico
   */
  async getJobStats(queue: Queue, jobId: string): Promise<JobStats | null> {
    try {
      const job = await queue.getJob(jobId);
      if (!job) return null;

      const state = await job.getState();
      const progress = job.progress || 0;
      const attempts = job.attemptsMade;
      const delay = job.delay || 0;
      const timestamp = new Date(job.timestamp);
      
      let processingTime: number | undefined;
      let errorMessage: string | undefined;

      if (state === 'completed') {
        const result = await job.returnvalue;
        processingTime = result?.tiempoProcesamiento;
      } else if (state === 'failed') {
        const failedReason = await job.failedReason;
        errorMessage = failedReason?.message || 'Error desconocido';
      }

      return {
        jobId,
        status: state,
        progress: typeof progress === 'number' ? progress : 0,
        attempts,
        delay,
        timestamp,
        processingTime,
        errorMessage,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas del trabajo ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Obtiene estadísticas de todos los trabajos de una empresa
   */
  async getEmpresaJobsStats(queue: Queue, empresaId: number, limit: number = 50): Promise<JobStats[]> {
    try {
      const jobs = await queue.getJobs(['completed', 'failed', 'waiting', 'active'], 0, limit);
      const empresaJobs = jobs.filter(job => job.data?.empresaId === empresaId);
      
      const statsPromises = empresaJobs.map(job => this.getJobStats(queue, job.id as string));
      const stats = await Promise.all(statsPromises);
      
      return stats.filter(Boolean) as JobStats[];
    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas de trabajos de empresa ${empresaId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de rendimiento del sistema
   */
  async getSystemStats(): Promise<{
    memory: NodeJS.MemoryUsage;
    cpu: number;
    uptime: number;
    activeConnections: number;
  }> {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    
    // Simular CPU usage (en producción usaría una librería como 'cpu-usage')
    const cpu = Math.random() * 100; // Placeholder
    
    // Simular conexiones activas
    const activeConnections = Math.floor(Math.random() * 100); // Placeholder

    return {
      memory,
      cpu: Math.round(cpu * 100) / 100,
      uptime: Math.round(uptime * 100) / 100,
      activeConnections,
    };
  }

  /**
   * Genera un reporte de salud del sistema
   */
  async generateHealthReport(queue: Queue): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
    stats: QueueStats;
  }> {
    const stats = await this.getQueueStats(queue);
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Verificar tasa de error
    if (stats.errorRate > 0.1) { // Más del 10% de errores
      issues.push(`Alta tasa de errores: ${(stats.errorRate * 100).toFixed(2)}%`);
      recommendations.push('Revisar logs de errores y validar configuración de reintentos');
    }

    // Verificar cola de espera
    if (stats.waiting > 100) {
      issues.push(`Cola de espera grande: ${stats.waiting} trabajos pendientes`);
      recommendations.push('Considerar aumentar la concurrencia de workers o optimizar el procesamiento');
    }

    // Verificar uso de memoria
    if (stats.memoryUsage > 500) { // Más de 500MB
      issues.push(`Alto uso de memoria: ${stats.memoryUsage}MB`);
      recommendations.push('Revisar posibles memory leaks y optimizar el procesamiento por lotes');
    }

    // Verificar tiempo de procesamiento
    if (stats.avgProcessingTime > 30000) { // Más de 30 segundos
      issues.push(`Tiempo de procesamiento alto: ${stats.avgProcessingTime}ms`);
      recommendations.push('Optimizar consultas de base de datos y reducir el tamaño de lotes');
    }

    // Determinar estado general
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 2) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }

    return {
      status,
      issues,
      recommendations,
      stats,
    };
  }

  /**
   * Limpia el cache de estadísticas
   */
  clearStatsCache(): void {
    this.statsCache.clear();
    this.logger.log('Cache de estadísticas limpiado');
  }

  /**
   * Calcula la tasa de procesamiento
   */
  private calculateProcessingRate(completed: number, failed: number): number {
    const total = completed + failed;
    return total > 0 ? (completed / total) * 100 : 0;
  }

  /**
   * Calcula la tasa de error
   */
  private calculateErrorRate(failed: number, total: number): number {
    return total > 0 ? failed / total : 0;
  }

  /**
   * Calcula el tiempo promedio de procesamiento
   */
  private async calculateAverageProcessingTime(queue: Queue): Promise<number> {
    try {
      const completedJobs = await queue.getCompleted(0, 100); // Últimos 100 trabajos
      if (completedJobs.length === 0) return 0;

      const processingTimes = completedJobs
        .map(job => job.returnvalue?.tiempoProcesamiento)
        .filter(time => typeof time === 'number');

      if (processingTimes.length === 0) return 0;

      const total = processingTimes.reduce((sum, time) => sum + time, 0);
      return Math.round(total / processingTimes.length);
    } catch (error) {
      this.logger.warn('Error calculando tiempo promedio de procesamiento:', error);
      return 0;
    }
  }

  /**
   * Obtiene métricas de rendimiento en tiempo real
   */
  async getRealTimeMetrics(queue: Queue): Promise<{
    jobsPerSecond: number;
    avgQueueTime: number;
    throughput: number;
  }> {
    // Implementación simplificada - en producción usaría métricas más sofisticadas
    const stats = await this.getQueueStats(queue);
    
    return {
      jobsPerSecond: stats.processingRate / 100, // Simplificado
      avgQueueTime: stats.avgProcessingTime,
      throughput: stats.completed / Math.max(1, stats.total),
    };
  }
} 