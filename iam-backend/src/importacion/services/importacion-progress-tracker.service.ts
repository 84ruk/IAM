import { Injectable, Logger } from '@nestjs/common';
import { ErrorImportacion } from '../../colas/interfaces/trabajo-importacion.interface';

export interface ProgressStage {
  id: string;
  nombre: string;
  descripcion: string;
  progreso: number; // 0-100
  estado: 'pendiente' | 'procesando' | 'completado' | 'error';
  tiempoInicio?: Date;
  tiempoFin?: Date;
  tiempoEstimado?: number; // en segundos
  registrosProcesados?: number;
  registrosTotal?: number;
  errores?: ErrorImportacion[];
  mensaje?: string;
}

export interface ProgressUpdate {
  trabajoId: string;
  etapa: string;
  progreso: number;
  registrosProcesados: number;
  registrosTotal: number;
  errores: ErrorImportacion[];
  mensaje?: string;
  tiempoEstimado?: number;
  timestamp: Date;
}

export interface ProgressSummary {
  trabajoId: string;
  progresoGeneral: number;
  etapaActual: string;
  etapas: ProgressStage[];
  tiempoTranscurrido: number;
  tiempoEstimadoTotal: number;
  registrosProcesados: number;
  registrosTotal: number;
  registrosExitosos: number;
  registrosConError: number;
  tasaExito: number;
  velocidadProcesamiento: number; // registros por segundo
  ultimaActualizacion: Date;
}

@Injectable()
export class ImportacionProgressTrackerService {
  private readonly logger = new Logger(ImportacionProgressTrackerService.name);
  private readonly progressData: Map<string, ProgressSummary> = new Map();
  private readonly stageTemplates: Record<string, ProgressStage[]> = {
    productos: [
      { id: 'validacion', nombre: 'Validación', descripcion: 'Validando estructura y datos del archivo', progreso: 0, estado: 'pendiente' },
      { id: 'procesamiento', nombre: 'Procesamiento', descripcion: 'Procesando registros de productos', progreso: 0, estado: 'pendiente' },
      { id: 'guardado', nombre: 'Guardado', descripcion: 'Guardando productos en la base de datos', progreso: 0, estado: 'pendiente' },
      { id: 'finalizacion', nombre: 'Finalización', descripcion: 'Completando importación', progreso: 0, estado: 'pendiente' },
    ],
    proveedores: [
      { id: 'validacion', nombre: 'Validación', descripcion: 'Validando estructura y datos del archivo', progreso: 0, estado: 'pendiente' },
      { id: 'procesamiento', nombre: 'Procesamiento', descripcion: 'Procesando registros de proveedores', progreso: 0, estado: 'pendiente' },
      { id: 'guardado', nombre: 'Guardado', descripcion: 'Guardando proveedores en la base de datos', progreso: 0, estado: 'pendiente' },
      { id: 'finalizacion', nombre: 'Finalización', descripcion: 'Completando importación', progreso: 0, estado: 'pendiente' },
    ],
    movimientos: [
      { id: 'validacion', nombre: 'Validación', descripcion: 'Validando estructura y datos del archivo', progreso: 0, estado: 'pendiente' },
      { id: 'verificacion_productos', nombre: 'Verificación de Productos', descripcion: 'Verificando existencia de productos', progreso: 0, estado: 'pendiente' },
      { id: 'procesamiento', nombre: 'Procesamiento', descripcion: 'Procesando movimientos de inventario', progreso: 0, estado: 'pendiente' },
      { id: 'guardado', nombre: 'Guardado', descripcion: 'Guardando movimientos en la base de datos', progreso: 0, estado: 'pendiente' },
      { id: 'actualizacion_stock', nombre: 'Actualización de Stock', descripcion: 'Actualizando niveles de stock', progreso: 0, estado: 'pendiente' },
      { id: 'finalizacion', nombre: 'Finalización', descripcion: 'Completando importación', progreso: 0, estado: 'pendiente' },
    ],
  };

  /**
   * Inicia el tracking de progreso para un trabajo
   */
  iniciarTracking(trabajoId: string, tipoImportacion: string, totalRegistros: number): void {
    const etapas = this.stageTemplates[tipoImportacion] || this.stageTemplates.productos;
    
    const progressSummary: ProgressSummary = {
      trabajoId,
      progresoGeneral: 0,
      etapaActual: etapas[0].id,
      etapas: etapas.map(etapa => ({ ...etapa })),
      tiempoTranscurrido: 0,
      tiempoEstimadoTotal: this.calcularTiempoEstimado(totalRegistros, tipoImportacion),
      registrosProcesados: 0,
      registrosTotal: totalRegistros,
      registrosExitosos: 0,
      registrosConError: 0,
      tasaExito: 0,
      velocidadProcesamiento: 0,
      ultimaActualizacion: new Date(),
    };

    this.progressData.set(trabajoId, progressSummary);
    
    this.logger.log(`Iniciando tracking para trabajo ${trabajoId} - ${tipoImportacion} (${totalRegistros} registros)`);
  }

  /**
   * Actualiza el progreso de una etapa específica
   */
  actualizarProgreso(update: ProgressUpdate): void {
    const progress = this.progressData.get(update.trabajoId);
    if (!progress) {
      this.logger.warn(`No se encontró progreso para trabajo ${update.trabajoId}`);
      return;
    }

    // Actualizar etapa específica
    const etapa = progress.etapas.find(e => e.id === update.etapa);
    if (etapa) {
      etapa.progreso = update.progreso;
      etapa.registrosProcesados = update.registrosProcesados;
      etapa.registrosTotal = update.registrosTotal;
      etapa.errores = update.errores;
      etapa.mensaje = update.mensaje;
      etapa.tiempoEstimado = update.tiempoEstimado;

      if (etapa.estado === 'pendiente' && update.progreso > 0) {
        etapa.estado = 'procesando';
        etapa.tiempoInicio = new Date();
      }

      if (update.progreso >= 100) {
        etapa.estado = 'completado';
        etapa.tiempoFin = new Date();
      }
    }

    // Actualizar métricas generales
    progress.registrosProcesados = update.registrosProcesados;
    progress.ultimaActualizacion = update.timestamp;
    progress.tiempoTranscurrido = this.calcularTiempoTranscurrido(progress);

    // Calcular progreso general
    progress.progresoGeneral = this.calcularProgresoGeneral(progress.etapas);

    // Calcular velocidad de procesamiento
    if (progress.tiempoTranscurrido > 0) {
      progress.velocidadProcesamiento = progress.registrosProcesados / (progress.tiempoTranscurrido / 1000);
    }

    // Actualizar tasa de éxito
    if (progress.registrosProcesados > 0) {
      progress.tasaExito = Math.round((progress.registrosExitosos / progress.registrosProcesados) * 100);
    }

    this.logger.debug(`Progreso actualizado para ${update.trabajoId}: ${update.etapa} - ${update.progreso}%`);
  }

  /**
   * Marca una etapa como completada
   */
  completarEtapa(trabajoId: string, etapaId: string, errores: ErrorImportacion[] = []): void {
    const progress = this.progressData.get(trabajoId);
    if (!progress) return;

    const etapa = progress.etapas.find(e => e.id === etapaId);
    if (etapa) {
      etapa.progreso = 100;
      etapa.estado = 'completado';
      etapa.tiempoFin = new Date();
      etapa.errores = errores;

      // Activar siguiente etapa
      const etapaIndex = progress.etapas.findIndex(e => e.id === etapaId);
      const siguienteEtapa = progress.etapas[etapaIndex + 1];
      if (siguienteEtapa) {
        siguienteEtapa.estado = 'procesando';
        siguienteEtapa.tiempoInicio = new Date();
        progress.etapaActual = siguienteEtapa.id;
      }

      this.logger.log(`Etapa ${etapaId} completada para trabajo ${trabajoId}`);
    }
  }

  /**
   * Marca una etapa como con error
   */
  marcarEtapaConError(trabajoId: string, etapaId: string, error: string, errores: ErrorImportacion[] = []): void {
    const progress = this.progressData.get(trabajoId);
    if (!progress) return;

    const etapa = progress.etapas.find(e => e.id === etapaId);
    if (etapa) {
      etapa.estado = 'error';
      etapa.mensaje = error;
      etapa.errores = errores;
      etapa.tiempoFin = new Date();

      this.logger.error(`Etapa ${etapaId} con error para trabajo ${trabajoId}: ${error}`);
    }
  }

  /**
   * Actualiza estadísticas de registros
   */
  actualizarEstadisticas(
    trabajoId: string,
    registrosExitosos: number,
    registrosConError: number
  ): void {
    const progress = this.progressData.get(trabajoId);
    if (!progress) return;

    progress.registrosExitosos = registrosExitosos;
    progress.registrosConError = registrosConError;

    if (progress.registrosProcesados > 0) {
      progress.tasaExito = Math.round((registrosExitosos / progress.registrosProcesados) * 100);
    }
  }

  /**
   * Obtiene el resumen de progreso actual
   */
  obtenerProgreso(trabajoId: string): ProgressSummary | null {
    const progress = this.progressData.get(trabajoId);
    if (!progress) return null;

    // Actualizar tiempo transcurrido
    progress.tiempoTranscurrido = this.calcularTiempoTranscurrido(progress);

    return { ...progress };
  }

  /**
   * Obtiene el progreso de una etapa específica
   */
  obtenerProgresoEtapa(trabajoId: string, etapaId: string): ProgressStage | null {
    const progress = this.progressData.get(trabajoId);
    if (!progress) return null;

    return progress.etapas.find(e => e.id === etapaId) || null;
  }

  /**
   * Calcula el tiempo estimado restante
   */
  calcularTiempoRestante(trabajoId: string): number {
    const progress = this.progressData.get(trabajoId);
    if (!progress || progress.progresoGeneral === 0) return 0;

    const tiempoTranscurrido = progress.tiempoTranscurrido;
    const progresoActual = progress.progresoGeneral;
    
    // Tiempo total estimado basado en el progreso actual
    const tiempoTotalEstimado = (tiempoTranscurrido / progresoActual) * 100;
    
    return Math.max(0, tiempoTotalEstimado - tiempoTranscurrido);
  }

  /**
   * Genera reporte de progreso para el frontend
   */
  generarReporteProgreso(trabajoId: string): {
    progreso: ProgressSummary;
    tiempoRestante: number;
    proximaEtapa?: string;
    alertas: string[];
  } {
    const progress = this.obtenerProgreso(trabajoId);
    if (!progress) {
      return {
        progreso: null as any,
        tiempoRestante: 0,
        alertas: ['No se encontró información de progreso'],
      };
    }

    const tiempoRestante = this.calcularTiempoRestante(trabajoId);
    const proximaEtapa = this.obtenerProximaEtapa(progress);
    const alertas = this.generarAlertas(progress);

    return {
      progreso: progress,
      tiempoRestante,
      proximaEtapa,
      alertas,
    };
  }

  /**
   * Finaliza el tracking de un trabajo
   */
  finalizarTracking(trabajoId: string): ProgressSummary | null {
    const progress = this.progressData.get(trabajoId);
    if (!progress) return null;

    // Marcar todas las etapas como completadas
    progress.etapas.forEach(etapa => {
      if (etapa.estado === 'procesando') {
        etapa.estado = 'completado';
        etapa.progreso = 100;
        etapa.tiempoFin = new Date();
      }
    });

    progress.progresoGeneral = 100;
    progress.ultimaActualizacion = new Date();

    this.logger.log(`Tracking finalizado para trabajo ${trabajoId}`);

    return progress;
  }

  /**
   * Limpia datos de progreso antiguos
   */
  limpiarDatosAntiguos(diasAntiguedad: number = 7): void {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

    for (const [trabajoId, progress] of this.progressData.entries()) {
      if (progress.ultimaActualizacion < fechaLimite) {
        this.progressData.delete(trabajoId);
      }
    }

    this.logger.log(`Datos de progreso antiguos limpiados`);
  }

  // Métodos privados de utilidad

  private calcularTiempoEstimado(totalRegistros: number, tipoImportacion: string): number {
    // Estimaciones basadas en experiencia
    const velocidadesEstimadas = {
      productos: 50, // registros por segundo
      proveedores: 100,
      movimientos: 30,
    };

    const velocidad = velocidadesEstimadas[tipoImportacion] || 50;
    return Math.ceil(totalRegistros / velocidad);
  }

  private calcularTiempoTranscurrido(progress: ProgressSummary): number {
    const primeraEtapa = progress.etapas.find(e => e.tiempoInicio);
    if (!primeraEtapa?.tiempoInicio) return 0;

    return Date.now() - primeraEtapa.tiempoInicio.getTime();
  }

  private calcularProgresoGeneral(etapas: ProgressStage[]): number {
    if (etapas.length === 0) return 0;

    const progresoTotal = etapas.reduce((sum, etapa) => sum + etapa.progreso, 0);
    return Math.round(progresoTotal / etapas.length);
  }

  private obtenerProximaEtapa(progress: ProgressSummary): string | undefined {
    const etapaActualIndex = progress.etapas.findIndex(e => e.id === progress.etapaActual);
    const proximaEtapa = progress.etapas[etapaActualIndex + 1];
    
    return proximaEtapa?.nombre;
  }

  private generarAlertas(progress: ProgressSummary): string[] {
    const alertas: string[] = [];

    // Alerta por baja tasa de éxito
    if (progress.tasaExito < 50 && progress.registrosProcesados > 10) {
      alertas.push(`Tasa de éxito baja: ${progress.tasaExito}%`);
    }

    // Alerta por velocidad lenta
    if (progress.velocidadProcesamiento < 10 && progress.tiempoTranscurrido > 30000) {
      alertas.push('Velocidad de procesamiento lenta detectada');
    }

    // Alerta por errores en etapa actual
    const etapaActual = progress.etapas.find(e => e.id === progress.etapaActual);
    if (etapaActual?.errores && etapaActual.errores.length > 0) {
      alertas.push(`${etapaActual.errores.length} errores en etapa actual`);
    }

    return alertas;
  }
} 