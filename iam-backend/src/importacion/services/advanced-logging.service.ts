import { Injectable, Logger } from '@nestjs/common';
import { ErrorImportacion } from '../../colas/interfaces/trabajo-importacion.interface';
import { ImportacionConfigService } from '../config/importacion.config';

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
  throughput: number; // registros por segundo
}

export interface LogEntry {
  nivel: 'debug' | 'info' | 'warn' | 'error';
  mensaje: string;
  contexto: LogContext;
  datos?: Record<string, unknown>;
  errores?: ErrorImportacion[];
  metricas?: Partial<PerformanceMetrics>;
  timestamp: Date;
  id: string; // Identificador único para el log
}

export interface LogSummary {
  totalLogs: number;
  errores: number;
  warnings: number;
  ultimaActividad: Date | null;
  metricas: PerformanceMetrics | null;
  rendimiento: {
    promedioTiempoProcesamiento: number;
    throughputPromedio: number;
    eficiencia: number; // porcentaje de éxito
  };
}

@Injectable()
export class AdvancedLoggingService {
  private readonly logger = new Logger(AdvancedLoggingService.name);
  private readonly logs: Map<string, LogEntry[]> = new Map();
  private readonly metricas: Map<string, PerformanceMetrics> = new Map();
  private readonly config = ImportacionConfigService.getConfiguracionLogging();
  private readonly logCounter = new Map<string, number>();
  private readonly batchLogs: LogEntry[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Iniciar procesamiento por lotes de logs
    this.startBatchProcessing();
  }

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
      throughput: 0,
    };

    this.metricas.set(trabajoId, metricas);
    this.logs.set(trabajoId, []);
    this.logCounter.set(trabajoId, 0);

    this.log('info', 'Iniciando tracking de importación', {
      ...contexto,
      etapa: 'inicio',
      timestamp: new Date(),
    });
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
    // Verificar límite de logs por trabajo
    const logsTrabajo = this.logs.get(contexto.trabajoId) || [];
    if (logsTrabajo.length >= this.config.maxLogsPorTrabajo) {
      // Eliminar logs más antiguos si se excede el límite
      logsTrabajo.splice(0, Math.ceil(this.config.maxLogsPorTrabajo * 0.1)); // Eliminar 10% más antiguos
    }

    const entrada: LogEntry = {
      nivel,
      mensaje: this.sanitizeMessage(mensaje),
      contexto,
      datos: this.sanitizeData(datos),
      errores: errores?.slice(0, 10), // Limitar a 10 errores por log
      timestamp: new Date(),
      id: this.generateLogId(contexto.trabajoId),
    };

    // Agregar a logs del trabajo
    logsTrabajo.push(entrada);
    this.logs.set(contexto.trabajoId, logsTrabajo);

    // Agregar a batch para procesamiento eficiente
    this.batchLogs.push(entrada);

    // Log inmediato solo para errores críticos
    if (nivel === 'error' || (nivel === 'warn' && this.config.nivel === 'warn')) {
      this.logImmediate(entrada);
    }

    // Procesar batch si está lleno
    if (this.batchLogs.length >= 50) {
      this.processBatch();
    }
  }

  /**
   * Sanitiza el mensaje para evitar logs excesivamente largos
   */
  private sanitizeMessage(mensaje: string): string {
    // Remover emojis y caracteres innecesarios
    let sanitized = mensaje
      .replace(/[🚀✅❌⚠️🔧📋📁]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Limitar longitud
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 197) + '...';
    }

    return sanitized;
  }

  /**
   * Sanitiza los datos para evitar logs excesivamente grandes
   */
  private sanitizeData(datos?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!datos) return undefined;

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(datos)) {
      if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = value.substring(0, 97) + '...';
      } else if (Array.isArray(value) && value.length > 10) {
        sanitized[key] = `[${value.length} elementos]`;
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Genera un ID único para el log
   */
  private generateLogId(trabajoId: string): string {
    const counter = this.logCounter.get(trabajoId) || 0;
    this.logCounter.set(trabajoId, counter + 1);
    return `${trabajoId}-${Date.now()}-${counter}`;
  }

  /**
   * Log inmediato para errores críticos
   */
  private logImmediate(entrada: LogEntry): void {
    const logData = {
      trabajoId: entrada.contexto.trabajoId,
      empresaId: entrada.contexto.empresaId,
      etapa: entrada.contexto.etapa,
      mensaje: entrada.mensaje,
      errores: entrada.errores?.length || 0,
      timestamp: entrada.contexto.timestamp.toISOString(),
    };

    switch (entrada.nivel) {
      case 'error':
        this.logger.error(JSON.stringify(logData));
        break;
      case 'warn':
        this.logger.warn(JSON.stringify(logData));
        break;
      default:
        // No logear inmediatamente para otros niveles
        break;
    }
  }

  /**
   * Procesa logs en lotes para mejor rendimiento
   */
  private processBatch(): void {
    if (this.batchLogs.length === 0) return;

    const batch = [...this.batchLogs];
    this.batchLogs.length = 0;

    // Agrupar logs por nivel y trabajo
    const groupedLogs = new Map<string, LogEntry[]>();
    
    batch.forEach(log => {
      const key = `${log.nivel}:${log.contexto.trabajoId}`;
      if (!groupedLogs.has(key)) {
        groupedLogs.set(key, []);
      }
      groupedLogs.get(key)!.push(log);
    });

    // Logear grupos de logs similares
    groupedLogs.forEach((logs, key) => {
      if (logs.length === 1) {
        this.logImmediate(logs[0]);
      } else {
        // Logear resumen para múltiples logs similares
        const firstLog = logs[0];
        const summary = {
          trabajoId: firstLog.contexto.trabajoId,
          nivel: firstLog.nivel,
          cantidad: logs.length,
          mensaje: `${logs.length} logs similares`,
          ultimoMensaje: logs[logs.length - 1].mensaje,
          timestamp: firstLog.contexto.timestamp.toISOString(),
        };

        switch (firstLog.nivel) {
          case 'info':
            this.logger.log(JSON.stringify(summary));
            break;
          case 'debug':
            if (this.config.nivel === 'debug') {
              this.logger.debug(JSON.stringify(summary));
            }
            break;
          default:
            this.logger.log(JSON.stringify(summary));
        }
      }
    });
  }

  /**
   * Inicia el procesamiento por lotes
   */
  private startBatchProcessing(): void {
    // Procesar batch cada 5 segundos
    setInterval(() => {
      this.processBatch();
    }, 5000);
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

    // Actualizar métricas
    Object.assign(metricas, actualizaciones);

    // Calcular métricas derivadas
    if (metricas.registrosProcesados > 0) {
      const tiempoTranscurrido = Date.now() - metricas.tiempoInicio.getTime();
      metricas.tiempoPromedioPorRegistro = tiempoTranscurrido / metricas.registrosProcesados;
      metricas.throughput = (metricas.registrosProcesados / tiempoTranscurrido) * 1000; // registros por segundo
    }

    // Actualizar métricas del sistema
    metricas.memoriaUtilizada = process.memoryUsage().heapUsed;
    metricas.cpuUtilizado = process.cpuUsage().user;

    this.metricas.set(trabajoId, metricas);
  }

  /**
   * Finaliza el tracking y calcula métricas finales
   */
  finalizarTracking(trabajoId: string): PerformanceMetrics | null {
    const metricas = this.metricas.get(trabajoId);
    if (!metricas) return null;

    metricas.tiempoFin = new Date();
    
    // Calcular métricas finales
    const tiempoTotal = metricas.tiempoFin.getTime() - metricas.tiempoInicio.getTime();
    metricas.tiempoPromedioPorRegistro = tiempoTotal / Math.max(metricas.registrosProcesados, 1);
    metricas.throughput = (metricas.registrosProcesados / tiempoTotal) * 1000;

    // Log de resumen final
    this.log('info', 'Tracking finalizado', {
      trabajoId,
      empresaId: 0, // Se obtendrá del contexto real
      usuarioId: 0,
      tipoImportacion: 'unknown',
      archivo: 'unknown',
      etapa: 'finalizacion',
      timestamp: new Date(),
    }, {
      registrosProcesados: metricas.registrosProcesados,
      registrosExitosos: metricas.registrosExitosos,
      registrosConError: metricas.registrosConError,
      tiempoTotal: tiempoTotal,
      throughput: metricas.throughput,
      eficiencia: (metricas.registrosExitosos / Math.max(metricas.registrosProcesados, 1)) * 100,
    });

    return metricas;
  }

  /**
   * Obtiene logs de un trabajo específico
   */
  obtenerLogs(trabajoId: string, nivel?: LogEntry['nivel']): LogEntry[] {
    const logs = this.logs.get(trabajoId) || [];
    
    if (nivel) {
      return logs.filter(log => log.nivel === nivel);
    }
    
    return logs;
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
  generarResumenLogs(trabajoId: string): LogSummary {
    const logs = this.obtenerLogs(trabajoId);
    const metricas = this.obtenerMetricas(trabajoId);

    const errores = logs.filter(log => log.nivel === 'error').length;
    const warnings = logs.filter(log => log.nivel === 'warn').length;
    const ultimaActividad = logs.length > 0 ? logs[logs.length - 1].timestamp : null;

    // Calcular métricas de rendimiento
    const rendimiento = {
      promedioTiempoProcesamiento: 0,
      throughputPromedio: 0,
      eficiencia: 0,
    };

    if (metricas) {
      rendimiento.promedioTiempoProcesamiento = metricas.tiempoPromedioPorRegistro;
      rendimiento.throughputPromedio = metricas.throughput;
      rendimiento.eficiencia = (metricas.registrosExitosos / Math.max(metricas.registrosProcesados, 1)) * 100;
    }

    return {
      totalLogs: logs.length,
      errores,
      warnings,
      ultimaActividad,
      metricas,
      rendimiento,
    };
  }

  /**
   * Limpia logs antiguos
   */
  limpiarLogsAntiguos(diasAntiguedad: number = 7): void {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

    let logsEliminados = 0;
    let trabajosEliminados = 0;

    for (const [trabajoId, logs] of this.logs.entries()) {
      const logsActualizados = logs.filter(log => log.timestamp > fechaLimite);
      
      if (logsActualizados.length === 0) {
        this.logs.delete(trabajoId);
        this.metricas.delete(trabajoId);
        this.logCounter.delete(trabajoId);
        trabajosEliminados++;
      } else if (logsActualizados.length !== logs.length) {
        this.logs.set(trabajoId, logsActualizados);
        logsEliminados += logs.length - logsActualizados.length;
      }
    }

    if (logsEliminados > 0 || trabajosEliminados > 0) {
      this.logger.log(`Limpieza de logs completada: ${logsEliminados} logs eliminados, ${trabajosEliminados} trabajos eliminados`);
    }
  }

  /**
   * Obtiene estadísticas generales del sistema de logging
   */
  obtenerEstadisticasSistema(): {
    totalTrabajos: number;
    totalLogs: number;
    logsPorNivel: Record<string, number>;
    trabajosActivos: number;
    memoriaUtilizada: number;
  } {
    const totalTrabajos = this.logs.size;
    const totalLogs = Array.from(this.logs.values()).reduce((sum, logs) => sum + logs.length, 0);
    
    const logsPorNivel: Record<string, number> = {};
    let trabajosActivos = 0;

    for (const [trabajoId, logs] of this.logs.entries()) {
      // Contar logs por nivel
      logs.forEach(log => {
        logsPorNivel[log.nivel] = (logsPorNivel[log.nivel] || 0) + 1;
      });

      // Verificar si el trabajo está activo (último log en las últimas 24 horas)
      const ultimoLog = logs[logs.length - 1];
      if (ultimoLog && Date.now() - ultimoLog.timestamp.getTime() < 24 * 60 * 60 * 1000) {
        trabajosActivos++;
      }
    }

    const memoriaUtilizada = process.memoryUsage().heapUsed;

    return {
      totalTrabajos,
      totalLogs,
      logsPorNivel,
      trabajosActivos,
      memoriaUtilizada,
    };
  }

  /**
   * Exporta logs de un trabajo para análisis
   */
  exportarLogs(trabajoId: string, formato: 'json' | 'csv' = 'json'): string {
    const logs = this.obtenerLogs(trabajoId);
    const metricas = this.obtenerMetricas(trabajoId);

    if (formato === 'csv') {
      const headers = ['timestamp', 'nivel', 'etapa', 'mensaje', 'errores'];
      const rows = logs.map(log => [
        log.timestamp.toISOString(),
        log.nivel,
        log.contexto.etapa,
        log.mensaje,
        log.errores?.length || 0,
      ]);

      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    } else {
      return JSON.stringify({
        trabajoId,
        metricas,
        logs: logs.map(log => ({
          timestamp: log.timestamp.toISOString(),
          nivel: log.nivel,
          etapa: log.contexto.etapa,
          mensaje: log.mensaje,
          errores: log.errores?.length || 0,
          datos: log.datos,
        })),
      }, null, 2);
    }
  }

  /**
   * Limpia todos los logs (útil para testing)
   */
  limpiarTodosLosLogs(): void {
    this.logs.clear();
    this.metricas.clear();
    this.logCounter.clear();
    this.batchLogs.length = 0;
    this.logger.log('Todos los logs han sido limpiados');
  }
} 