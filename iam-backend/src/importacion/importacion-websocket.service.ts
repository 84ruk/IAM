import { Injectable, Logger } from '@nestjs/common';
import { ImportacionGateway } from '../websockets/importacion/importacion.gateway';

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
}

@Injectable()
export class ImportacionWebSocketService {
  private readonly logger = new Logger(ImportacionWebSocketService.name);

  constructor(private readonly importacionGateway: ImportacionGateway) {}

  /**
   * Emitir evento de trabajo cancelado
   */
  emitTrabajoCancelado(empresaId: string, trabajo: any) {
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
  emitErroresResueltos(empresaId: string, trabajoId: string, erroresResueltos: any[]) {
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
  emitLogsActualizados(empresaId: string, trabajoId: string, logs: any[]) {
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
  emitEstadisticasRendimiento(empresaId: string, estadisticas: any) {
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
} 