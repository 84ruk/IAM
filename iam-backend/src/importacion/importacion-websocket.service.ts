import { Injectable, Logger } from '@nestjs/common';
import { ImportacionGateway } from '../websockets/importacion/importacion.gateway';
import { TrabajoImportacion, MensajeUsuario, ResumenProcesamiento } from '../colas/interfaces/trabajo-importacion.interface';

// Definir el enum localmente para evitar dependencias circulares
enum ImportacionEventType {
  TRABAJO_CREADO = 'TRABAJO_CREADO',
  TRABAJO_ACTUALIZADO = 'TRABAJO_ACTUALIZADO',
  PROGRESO_ACTUALIZADO = 'PROGRESO_ACTUALIZADO',
  TRABAJO_COMPLETADO = 'TRABAJO_COMPLETADO',
  TRABAJO_ERROR = 'TRABAJO_ERROR',
  ERROR_VALIDACION = 'ERROR_VALIDACION',
  ESTADISTICAS_ACTUALIZADAS = 'ESTADISTICAS_ACTUALIZADAS',
  TRABAJO_CANCELADO = 'TRABAJO_CANCELADO',
  ERRORES_RESUELTOS = 'ERRORES_RESUELTOS',
  LOGS_ACTUALIZADOS = 'LOGS_ACTUALIZADOS',
  ESTADISTICAS_RENDIMIENTO = 'ESTADISTICAS_RENDIMIENTO',
  MENSAJE_USUARIO = 'MENSAJE_USUARIO',
  RESUMEN_PROCESAMIENTO = 'RESUMEN_PROCESAMIENTO',
  DUPLICADOS_ENCONTRADOS = 'DUPLICADOS_ENCONTRADOS',
  RECOMENDACIONES = 'RECOMENDACIONES',
}

// Interfaces específicas para tipos de datos
interface ErrorResuelto {
  id: string
  tipo: string
  mensaje: string
  solucion: string
  timestamp: string
}

interface LogEntry {
  id: string
  nivel: 'info' | 'warning' | 'error' | 'debug'
  mensaje: string
  timestamp: string
  metadata?: Record<string, unknown>
}

interface EstadisticasRendimiento {
  velocidadPromedio: number
  velocidadActual: number
  tiempoEstimado: number
  tiempoTranscurrido: number
  eficiencia: number
  erroresPorMinuto: number
  registrosPorSegundo: number
  usoMemoria: number
  usoCPU: number
}

@Injectable()
export class ImportacionWebSocketService {
  private readonly logger = new Logger(ImportacionWebSocketService.name);

  constructor(private readonly importacionGateway: ImportacionGateway) {}

  /**
   * Emitir evento de trabajo cancelado
   */
  emitTrabajoCancelado(empresaId: string, trabajo: TrabajoImportacion) {
    try {
      const message = {
        event: ImportacionEventType.TRABAJO_CANCELADO,
        trabajoId: trabajo.id,
        data: trabajo,
        timestamp: new Date().toISOString(),
        empresaId,
        usuarioId: trabajo.usuarioId,
      };

      this.importacionGateway.server.to(`empresa:${empresaId}`).emit('importacion:event', message);
      this.importacionGateway.server.to(`trabajo:${trabajo.id}`).emit('importacion:event', message);
      
      this.logger.log(`Evento TRABAJO_CANCELADO enviado para trabajo ${trabajo.id}`);
    } catch (error) {
      this.logger.error(`Error enviando evento TRABAJO_CANCELADO:`, error);
    }
  }

  /**
   * Emitir evento de errores resueltos
   */
  emitErroresResueltos(empresaId: string, trabajoId: string, erroresResueltos: ErrorResuelto[]) {
    try {
      const message = {
        event: ImportacionEventType.ERRORES_RESUELTOS,
        trabajoId,
        data: {
          erroresResueltos,
          totalResueltos: erroresResueltos.length,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        empresaId,
      };

      this.importacionGateway.server.to(`empresa:${empresaId}`).emit('importacion:event', message);
      this.importacionGateway.server.to(`trabajo:${trabajoId}`).emit('importacion:event', message);
      
      this.logger.log(`Evento ERRORES_RESUELTOS enviado para trabajo ${trabajoId}`);
    } catch (error) {
      this.logger.error(`Error enviando evento ERRORES_RESUELTOS:`, error);
    }
  }

  /**
   * Emitir evento de logs actualizados
   */
  emitLogsActualizados(empresaId: string, trabajoId: string, logs: LogEntry[]) {
    try {
      const message = {
        event: ImportacionEventType.LOGS_ACTUALIZADOS,
        trabajoId,
        data: {
          logs,
          totalLogs: logs.length,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        empresaId,
      };

      this.importacionGateway.server.to(`empresa:${empresaId}`).emit('importacion:event', message);
      this.importacionGateway.server.to(`trabajo:${trabajoId}`).emit('importacion:event', message);
      
      this.logger.log(`Evento LOGS_ACTUALIZADOS enviado para trabajo ${trabajoId}`);
    } catch (error) {
      this.logger.error(`Error enviando evento LOGS_ACTUALIZADOS:`, error);
    }
  }

  /**
   * Emitir evento de estadísticas de rendimiento
   */
  emitEstadisticasRendimiento(empresaId: string, estadisticas: EstadisticasRendimiento) {
    try {
      const message = {
        event: ImportacionEventType.ESTADISTICAS_RENDIMIENTO,
        data: {
          ...estadisticas,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        empresaId,
      };

      this.importacionGateway.server.to(`empresa:${empresaId}`).emit('importacion:event', message);
      
      this.logger.log(`Evento ESTADISTICAS_RENDIMIENTO enviado para empresa ${empresaId}`);
    } catch (error) {
      this.logger.error(`Error enviando evento ESTADISTICAS_RENDIMIENTO:`, error);
    }
  }

  /**
   * Emitir mensajes de usuario durante el procesamiento
   */
  emitMensajeUsuario(empresaId: string, trabajoId: string, mensaje: MensajeUsuario) {
    try {
      const message = {
        event: ImportacionEventType.MENSAJE_USUARIO,
        trabajoId,
        data: mensaje,
        timestamp: new Date().toISOString(),
        empresaId,
      };

      this.importacionGateway.server.to(`empresa:${empresaId}`).emit('importacion:event', message);
      this.importacionGateway.server.to(`trabajo:${trabajoId}`).emit('importacion:event', message);
      
      this.logger.log(`Evento MENSAJE_USUARIO enviado para trabajo ${trabajoId}`);
    } catch (error) {
      this.logger.error(`Error enviando evento MENSAJE_USUARIO:`, error);
    }
  }

  /**
   * Emitir resumen de procesamiento
   */
  emitResumenProcesamiento(empresaId: string, trabajoId: string, resumen: ResumenProcesamiento) {
    try {
      const message = {
        event: ImportacionEventType.RESUMEN_PROCESAMIENTO,
        trabajoId,
        data: resumen,
        timestamp: new Date().toISOString(),
        empresaId,
      };

      this.importacionGateway.server.to(`empresa:${empresaId}`).emit('importacion:event', message);
      this.importacionGateway.server.to(`trabajo:${trabajoId}`).emit('importacion:event', message);
      
      this.logger.log(`Evento RESUMEN_PROCESAMIENTO enviado para trabajo ${trabajoId}`);
    } catch (error) {
      this.logger.error(`Error enviando evento RESUMEN_PROCESAMIENTO:`, error);
    }
  }

  /**
   * Emitir evento de duplicados encontrados
   */
  emitDuplicadosEncontrados(empresaId: string, trabajoId: string, duplicados: number, total: number) {
    try {
      const message = {
        event: ImportacionEventType.DUPLICADOS_ENCONTRADOS,
        trabajoId,
        data: {
          duplicados,
          total,
          porcentaje: total > 0 ? (duplicados / total) * 100 : 0,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        empresaId,
      };

      this.importacionGateway.server.to(`empresa:${empresaId}`).emit('importacion:event', message);
      this.importacionGateway.server.to(`trabajo:${trabajoId}`).emit('importacion:event', message);
      
      this.logger.log(`Evento DUPLICADOS_ENCONTRADOS enviado para trabajo ${trabajoId}: ${duplicados}/${total}`);
    } catch (error) {
      this.logger.error(`Error enviando evento DUPLICADOS_ENCONTRADOS:`, error);
    }
  }

  /**
   * Emitir recomendaciones automáticas
   */
  emitRecomendaciones(empresaId: string, trabajoId: string, recomendaciones: string[]) {
    try {
      const message = {
        event: ImportacionEventType.RECOMENDACIONES,
        trabajoId,
        data: {
          recomendaciones,
          totalRecomendaciones: recomendaciones.length,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        empresaId,
      };

      this.importacionGateway.server.to(`empresa:${empresaId}`).emit('importacion:event', message);
      this.importacionGateway.server.to(`trabajo:${trabajoId}`).emit('importacion:event', message);
      
      this.logger.log(`Evento RECOMENDACIONES enviado para trabajo ${trabajoId}: ${recomendaciones.length} recomendaciones`);
    } catch (error) {
      this.logger.error(`Error enviando evento RECOMENDACIONES:`, error);
    }
  }
} 