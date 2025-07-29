import { Injectable, Logger } from '@nestjs/common';
import { ImportacionGateway } from '../../websockets/importacion/importacion.gateway';
import { TrabajoImportacion } from '../../colas/interfaces/trabajo-importacion.interface';

@Injectable()
export class ImportacionWebSocketService {
  private readonly logger = new Logger(ImportacionWebSocketService.name);

  constructor(private readonly importacionGateway: ImportacionGateway) {}

  /**
   * Emitir evento cuando se crea un nuevo trabajo de importación
   */
  public emitTrabajoCreado(trabajo: TrabajoImportacion) {
    try {
      this.importacionGateway.emitTrabajoCreado(
        trabajo.empresaId.toString(),
        this.mapTrabajoToEvent(trabajo)
      );
      this.logger.log(`Evento TRABAJO_CREADO emitido para trabajo ${trabajo.id}`);
    } catch (error) {
      this.logger.error(`Error al emitir TRABAJO_CREADO: ${error.message}`);
    }
  }

  /**
   * Emitir evento cuando se actualiza un trabajo de importación
   */
  public emitTrabajoActualizado(trabajo: TrabajoImportacion) {
    try {
      this.importacionGateway.emitTrabajoActualizado(
        trabajo.empresaId.toString(),
        this.mapTrabajoToEvent(trabajo)
      );
      this.logger.log(`Evento TRABAJO_ACTUALIZADO emitido para trabajo ${trabajo.id}`);
    } catch (error) {
      this.logger.error(`Error al emitir TRABAJO_ACTUALIZADO: ${error.message}`);
    }
  }

  /**
   * Emitir evento cuando se actualiza el progreso de un trabajo
   */
  public emitProgresoActualizado(
    empresaId: number,
    trabajoId: string,
    progreso: number,
    registrosProcesados: number,
    registrosExitosos: number,
    registrosConError: number,
    estado: string,
    mensaje?: string
  ) {
    try {
      const progresoEvent = {
        trabajoId,
        progreso,
        registrosProcesados,
        registrosExitosos,
        registrosConError,
        estado,
        mensaje,
        timestamp: new Date().toISOString(),
      };

      this.importacionGateway.emitProgresoActualizado(
        empresaId.toString(),
        trabajoId,
        progresoEvent
      );
      this.logger.log(`Evento PROGRESO_ACTUALIZADO emitido para trabajo ${trabajoId} - Progreso: ${progreso}%`);
    } catch (error) {
      this.logger.error(`Error al emitir PROGRESO_ACTUALIZADO: ${error.message}`);
    }
  }

  /**
   * Emitir evento cuando se completa un trabajo exitosamente
   */
  public emitTrabajoCompletado(trabajo: TrabajoImportacion) {
    try {
      this.importacionGateway.emitTrabajoCompletado(
        trabajo.empresaId.toString(),
        this.mapTrabajoToEvent(trabajo)
      );
      this.logger.log(`Evento TRABAJO_COMPLETADO emitido para trabajo ${trabajo.id}`);
    } catch (error) {
      this.logger.error(`Error al emitir TRABAJO_COMPLETADO: ${error.message}`);
    }
  }

  /**
   * Emitir evento cuando un trabajo falla
   */
  public emitTrabajoError(trabajo: TrabajoImportacion, error?: string) {
    try {
      const trabajoConError = {
        ...this.mapTrabajoToEvent(trabajo),
        error: error || trabajo.mensaje || 'Error desconocido',
      };

      this.importacionGateway.emitTrabajoError(
        trabajo.empresaId.toString(),
        trabajoConError
      );
      this.logger.log(`Evento TRABAJO_ERROR emitido para trabajo ${trabajo.id}`);
    } catch (error) {
      this.logger.error(`Error al emitir TRABAJO_ERROR: ${error.message}`);
    }
  }

  /**
   * Emitir evento cuando hay errores de validación
   */
  public emitErrorValidacion(
    empresaId: number,
    trabajoId: string,
    fila: number,
    columna: string,
    valor: string,
    mensaje: string,
    tipo: string
  ) {
    try {
      const errorEvent = {
        trabajoId,
        fila,
        columna,
        valor,
        mensaje,
        tipo,
        timestamp: new Date().toISOString(),
      };

      this.importacionGateway.emitErrorValidacion(
        empresaId.toString(),
        trabajoId,
        errorEvent
      );
      this.logger.log(`Evento ERROR_VALIDACION emitido para trabajo ${trabajoId} - Fila: ${fila}`);
    } catch (error) {
      this.logger.error(`Error al emitir ERROR_VALIDACION: ${error.message}`);
    }
  }

  /**
   * Emitir estadísticas actualizadas de importación
   */
  public emitEstadisticasActualizadas(
    empresaId: number,
    totalTrabajos: number,
    trabajosCompletados: number,
    trabajosConError: number,
    trabajosEnProgreso: number
  ) {
    try {
      const porcentajeExito = totalTrabajos > 0 ? Math.round((trabajosCompletados / totalTrabajos) * 100) : 0;

      const estadisticasEvent = {
        totalTrabajos,
        trabajosCompletados,
        trabajosConError,
        trabajosEnProgreso,
        porcentajeExito,
        timestamp: new Date().toISOString(),
      };

      this.importacionGateway.emitEstadisticasActualizadas(
        empresaId.toString(),
        estadisticasEvent
      );
      this.logger.log(`Evento ESTADISTICAS_ACTUALIZADAS emitido para empresa ${empresaId}`);
    } catch (error) {
      this.logger.error(`Error al emitir ESTADISTICAS_ACTUALIZADAS: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de conexiones WebSocket
   */
  public getConnectionStats() {
    return this.importacionGateway.getConnectionStats();
  }

  /**
   * Mapear TrabajoImportacion a formato de evento
   */
  private mapTrabajoToEvent(trabajo: TrabajoImportacion) {
    // Manejar fechas que pueden ser strings o Date objects
    const fechaCreacion = typeof trabajo.fechaCreacion === 'string' 
      ? trabajo.fechaCreacion 
      : trabajo.fechaCreacion.toISOString();
    
    const fechaActualizacion = trabajo.fechaActualizacion 
      ? (typeof trabajo.fechaActualizacion === 'string' 
          ? trabajo.fechaActualizacion 
          : trabajo.fechaActualizacion.toISOString())
      : new Date().toISOString();

    return {
      id: trabajo.id,
      tipo: trabajo.tipo,
      estado: trabajo.estado,
      progreso: trabajo.progreso,
      totalRegistros: trabajo.totalRegistros,
      registrosProcesados: trabajo.registrosProcesados,
      registrosExitosos: trabajo.registrosExitosos,
      registrosConError: trabajo.registrosConError,
      archivoOriginal: trabajo.archivoOriginal,
      fechaCreacion,
      fechaActualizacion,
      mensaje: trabajo.mensaje,
      empresaId: trabajo.empresaId,
      usuarioId: trabajo.usuarioId,
    };
  }
} 