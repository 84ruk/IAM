import { Injectable, Logger } from '@nestjs/common';
import { ErrorImportacion } from '../../colas/interfaces/trabajo-importacion.interface';

export interface LogContext {
  trabajoId: string;
  empresaId: number;
  usuarioId: number;
  tipoImportacion: string;
  archivo: string;
  etapa: string;
  timestamp: Date;
}

export interface PerformanceMetrics {
  tiempoInicio: Date;
  tiempoFin?: Date;
  registrosProcesados: number;
  registrosExitosos: number;
  registrosConError: number;
  tiempoPromedioPorRegistro: number;
  memoriaUtilizada: number;
  cpuUtilizado: number;
}

export interface LogEntry {
  nivel: 'debug' | 'info' | 'warn' | 'error';
  mensaje: string;
  contexto: LogContext;
  datos?: Record<string, unknown>;
  errores?: ErrorImportacion[];
  metricas?: Partial<PerformanceMetrics>;
  timestamp: Date;
}

@Injectable()
export class AdvancedLoggingService {
  private readonly logger = new Logger(AdvancedLoggingService.name);
  private readonly logs: Map<string, LogEntry[]> = new Map();
  private readonly metricas: Map<string, PerformanceMetrics> = new Map();

  /**
   * Inicia el tracking de métricas para un trabajo
   */
  iniciarTracking(trabajoId: string, contexto: Omit<LogContext, 'timestamp' | 'etapa'>): void {
    const metricas: PerformanceMetrics = {
      tiempoInicio: new Date(),
      registrosProcesados: 0,
      registrosExitosos: 0,
      registrosConError: 0,
      tiempoPromedioPorRegistro: 0,
      memoriaUtilizada: process.memoryUsage().heapUsed,
      cpuUtilizado: process.cpuUsage().user,
    };

    this.metricas.set(trabajoId, metricas);
    this.logs.set(trabajoId, []);

    this.log('info', 'Iniciando tracking de importación', {
      ...contexto,
      etapa: 'inicio',
      timestamp: new Date(),
    }, { trabajoId });
  }

  /**
   * Registra un evento de procesamiento
   */
  log(
    nivel: LogEntry['nivel'],
    mensaje: string,
    contexto: LogContext,
    datos?: Record<string, unknown>,
    errores?: ErrorImportacion[]
  ): void {
    const entrada: LogEntry = {
      nivel,
      mensaje,
      contexto,
      datos,
      errores,
      timestamp: new Date(),
    };

    // Guardar en memoria
    const logsTrabajo = this.logs.get(contexto.trabajoId) || [];
    logsTrabajo.push(entrada);
    this.logs.set(contexto.trabajoId, logsTrabajo);

    // Log estructurado
    const logData = {
      trabajoId: contexto.trabajoId,
      empresaId: contexto.empresaId,
      usuarioId: contexto.usuarioId,
      tipoImportacion: contexto.tipoImportacion,
      archivo: contexto.archivo,
      etapa: contexto.etapa,
      mensaje,
      datos,
      errores: errores?.length || 0,
      timestamp: contexto.timestamp.toISOString(),
    };

    switch (nivel) {
      case 'debug':
        this.logger.debug(JSON.stringify(logData));
        break;
      case 'info':
        this.logger.log(JSON.stringify(logData));
        break;
      case 'warn':
        this.logger.warn(JSON.stringify(logData));
        break;
      case 'error':
        this.logger.error(JSON.stringify(logData));
        break;
    }
  }

  /**
   * Actualiza métricas de rendimiento
   */
  actualizarMetricas(
    trabajoId: string,
    actualizaciones: Partial<Pick<PerformanceMetrics, 'registrosProcesados' | 'registrosExitosos' | 'registrosConError'>>
  ): void {
    const metricas = this.metricas.get(trabajoId);
    if (!metricas) return;

    Object.assign(metricas, actualizaciones);

    // Calcular tiempo promedio por registro
    if (metricas.registrosProcesados > 0) {
      const tiempoTranscurrido = Date.now() - metricas.tiempoInicio.getTime();
      metricas.tiempoPromedioPorRegistro = tiempoTranscurrido / metricas.registrosProcesados;
    }

    // Actualizar métricas del sistema
    metricas.memoriaUtilizada = process.memoryUsage().heapUsed;
    metricas.cpuUtilizado = process.cpuUsage().user;
  }

  /**
   * Finaliza el tracking y genera resumen
   */
  finalizarTracking(trabajoId: string): PerformanceMetrics | null {
    const metricas = this.metricas.get(trabajoId);
    if (!metricas) return null;

    metricas.tiempoFin = new Date();
    const tiempoTotal = metricas.tiempoFin.getTime() - metricas.tiempoInicio.getTime();

    this.log('info', 'Importación finalizada', {
      trabajoId,
      empresaId: 0,
      usuarioId: 0,
      tipoImportacion: '',
      archivo: '',
      etapa: 'finalizacion',
      timestamp: new Date(),
    }, {
      tiempoTotalMs: tiempoTotal,
      tiempoTotalSegundos: Math.round(tiempoTotal / 1000),
      registrosProcesados: metricas.registrosProcesados,
      registrosExitosos: metricas.registrosExitosos,
      registrosConError: metricas.registrosConError,
      tasaExito: metricas.registrosProcesados > 0 
        ? Math.round((metricas.registrosExitosos / metricas.registrosProcesados) * 100)
        : 0,
      memoriaUtilizadaMB: Math.round(metricas.memoriaUtilizada / 1024 / 1024),
    });

    return metricas;
  }

  /**
   * Obtiene logs de un trabajo específico
   */
  obtenerLogs(trabajoId: string, nivel?: LogEntry['nivel']): LogEntry[] {
    const logs = this.logs.get(trabajoId) || [];
    return nivel ? logs.filter(log => log.nivel === nivel) : logs;
  }

  /**
   * Obtiene métricas de un trabajo específico
   */
  obtenerMetricas(trabajoId: string): PerformanceMetrics | null {
    return this.metricas.get(trabajoId) || null;
  }

  /**
   * Genera resumen de logs para el frontend
   */
  generarResumenLogs(trabajoId: string): {
    totalLogs: number;
    errores: number;
    warnings: number;
    ultimaActividad: Date | null;
    metricas: PerformanceMetrics | null;
  } {
    const logs = this.obtenerLogs(trabajoId);
    const metricas = this.obtenerMetricas(trabajoId);

    return {
      totalLogs: logs.length,
      errores: logs.filter(log => log.nivel === 'error').length,
      warnings: logs.filter(log => log.nivel === 'warn').length,
      ultimaActividad: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
      metricas,
    };
  }

  /**
   * Limpia logs antiguos
   */
  limpiarLogsAntiguos(diasAntiguedad: number = 7): void {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

    for (const [trabajoId, logs] of this.logs.entries()) {
      const logsRecientes = logs.filter(log => log.timestamp > fechaLimite);
      if (logsRecientes.length === 0) {
        this.logs.delete(trabajoId);
        this.metricas.delete(trabajoId);
      } else {
        this.logs.set(trabajoId, logsRecientes);
      }
    }
  }
} 