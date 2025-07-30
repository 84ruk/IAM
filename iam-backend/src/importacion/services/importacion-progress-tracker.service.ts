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
  errores?: ErrorImportacion[];
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
  velocidadProcesamiento: number;
  ultimaActualizacion: Date;
}

@Injectable()
export class ImportacionProgressTrackerService {
  private readonly logger = new Logger(ImportacionProgressTrackerService.name)
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
    
    this.logger.log(`📊 Tracking iniciado para trabajo ${trabajoId} (${tipoImportacion}, ${totalRegistros} registros)`);
  }

  /**
   * Actualiza el progreso de una etapa específica
   */
  actualizarProgreso(update: ProgressUpdate): void {
    const progress = this.progressData.get(update.trabajoId);
    if (!progress) {
      this.logger.warn(`⚠️ No se encontró progreso para trabajo ${update.trabajoId}`);
      return;
    }

    // Actualizar etapa específica
    const etapa = progress.etapas.find(e => e.id === update.etapa);
    if (etapa) {
      etapa.progreso = Math.min(100, Math.max(0, update.progreso)); // Asegurar rango 0-100
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

    // Calcular progreso general mejorado
    progress.progresoGeneral = this.calcularProgresoGeneralMejorado(progress.etapas, update);

    // Calcular velocidad de procesamiento
    if (progress.tiempoTranscurrido > 0) {
      progress.velocidadProcesamiento = progress.registrosProcesados / (progress.tiempoTranscurrido / 1000);
    }

    // Actualizar tasa de éxito
    if (progress.registrosProcesados > 0) {
      progress.tasaExito = Math.round((progress.registrosExitosos / progress.registrosProcesados) * 100);
    }

    this.logger.debug(`📊 Progreso actualizado para ${update.trabajoId}: ${update.etapa} - ${update.progreso}% (General: ${progress.progresoGeneral}%)`);
  }

  /**
   * Marca una etapa como completada
   */
  completarEtapa(trabajoId: string, etapaId: string, errores: ErrorImportacion[] = []): void {
    const progress = this.progressData.get(trabajoId);
    if (!progress) {
      this.logger.warn(`⚠️ No se encontró progreso para trabajo ${trabajoId}`);
      return;
    }

    const etapa = progress.etapas.find(e => e.id === etapaId);
    if (etapa) {
      etapa.estado = 'completado';
      etapa.progreso = 100;
      etapa.tiempoFin = new Date();
      etapa.errores = errores;

      // Actualizar etapa actual
      const currentIndex = progress.etapas.findIndex(e => e.id === etapaId);
      if (currentIndex < progress.etapas.length - 1) {
        progress.etapaActual = progress.etapas[currentIndex + 1].id;
        progress.etapas[currentIndex + 1].estado = 'procesando';
        progress.etapas[currentIndex + 1].tiempoInicio = new Date();
      }

      // Recalcular progreso general
      progress.progresoGeneral = this.calcularProgresoGeneralMejorado(progress.etapas);
      progress.ultimaActualizacion = new Date();

      this.logger.log(`✅ Etapa ${etapaId} completada para trabajo ${trabajoId} (Progreso general: ${progress.progresoGeneral}%)`);
    }
  }

  /**
   * Marca una etapa como con error
   */
  marcarEtapaConError(trabajoId: string, etapaId: string, error: ErrorImportacion): void {
    const progress = this.progressData.get(trabajoId);
    if (!progress) {
      this.logger.warn(`⚠️ No se encontró progreso para trabajo ${trabajoId}`);
      return;
    }

    const etapa = progress.etapas.find(e => e.id === etapaId);
    if (etapa) {
      etapa.estado = 'error';
      etapa.errores = [error];
      etapa.mensaje = error.mensaje;

      this.logger.error(`❌ Etapa ${etapaId} con error para trabajo ${trabajoId}: ${error.mensaje}`);
    }
  }

  /**
   * Obtiene el progreso actual de un trabajo
   */
  obtenerProgreso(trabajoId: string): ProgressSummary | null {
    return this.progressData.get(trabajoId) || null;
  }

  /**
   * Calcula el progreso general mejorado
   */
  private calcularProgresoGeneralMejorado(etapas: ProgressStage[], update?: ProgressUpdate): number {
    if (etapas.length === 0) return 0;

    // Pesos de las etapas (pueden variar según el tipo de importación)
    const pesos = {
      validacion: 0.15,
      verificacion_productos: 0.10,
      procesamiento: 0.50,
      guardado: 0.20,
      actualizacion_stock: 0.10,
      finalizacion: 0.05
    };

    let progresoTotal = 0;
    let pesoTotal = 0;

    for (const etapa of etapas) {
      const peso = pesos[etapa.id as keyof typeof pesos] || 1 / etapas.length;
      pesoTotal += peso;

      if (etapa.estado === 'completado') {
        progresoTotal += peso * 100;
      } else if (etapa.estado === 'procesando') {
        // Si es la etapa actual y tenemos información de progreso
        if (update && update.etapa === etapa.id) {
          progresoTotal += peso * update.progreso;
        } else {
          progresoTotal += peso * etapa.progreso;
        }
      }
      // Las etapas pendientes contribuyen 0 al progreso
    }

    // Normalizar por el peso total
    const progresoNormalizado = pesoTotal > 0 ? progresoTotal / pesoTotal : 0;
    
    // Asegurar que el progreso esté entre 0 y 100
    return Math.min(100, Math.max(0, Math.round(progresoNormalizado * 100) / 100));
  }

  /**
   * Calcula el progreso general (método anterior para compatibilidad)
   */
  private calcularProgresoGeneral(etapas: ProgressStage[]): number {
    if (etapas.length === 0) return 0;

    const progresoTotal = etapas.reduce((sum, etapa) => {
      if (etapa.estado === 'completado') {
        return sum + 100;
      } else if (etapa.estado === 'procesando') {
        return sum + etapa.progreso;
      }
      return sum;
    }, 0);

    return Math.round(progresoTotal / etapas.length);
  }

  /**
   * Calcula el tiempo transcurrido
   */
  private calcularTiempoTranscurrido(progress: ProgressSummary): number {
    const primeraEtapa = progress.etapas.find(e => e.tiempoInicio);
    if (!primeraEtapa?.tiempoInicio) return 0;

    return Date.now() - primeraEtapa.tiempoInicio.getTime();
  }

  /**
   * Calcula el tiempo estimado total
   */
  private calcularTiempoEstimado(totalRegistros: number, tipo: string): number {
    // Estimaciones basadas en el tipo de importación y cantidad de registros
    const estimacionesPorTipo = {
      productos: 0.5, // segundos por registro
      proveedores: 0.3,
      movimientos: 0.8,
    };

    const tiempoPorRegistro = estimacionesPorTipo[tipo as keyof typeof estimacionesPorTipo] || 0.5;
    return Math.round(totalRegistros * tiempoPorRegistro * 1000); // en milisegundos
  }

  /**
   * Calcula el tiempo restante
   */
  calcularTiempoRestante(trabajoId: string): number {
    const progress = this.progressData.get(trabajoId);
    if (!progress || progress.progresoGeneral === 0) return 0;

    const tiempoTranscurrido = progress.tiempoTranscurrido;
    const progresoActual = progress.progresoGeneral;
    
    if (progresoActual >= 100) return 0;

    const tiempoTotalEstimado = (tiempoTranscurrido / progresoActual) * 100;
    return Math.max(0, tiempoTotalEstimado - tiempoTranscurrido);
  }

  /**
   * Limpia el progreso de un trabajo
   */
  limpiarProgreso(trabajoId: string): void {
    this.progressData.delete(trabajoId);
    this.logger.log(`🧹 Progreso limpiado para trabajo ${trabajoId}`);
  }

  /**
   * Obtiene estadísticas de todos los trabajos
   */
  obtenerEstadisticas(): {
    totalTrabajos: number;
    trabajosActivos: number;
    trabajosCompletados: number;
    trabajosConError: number;
  } {
    const trabajos = Array.from(this.progressData.values());
    
    return {
      totalTrabajos: trabajos.length,
      trabajosActivos: trabajos.filter(t => t.progresoGeneral > 0 && t.progresoGeneral < 100).length,
      trabajosCompletados: trabajos.filter(t => t.progresoGeneral >= 100).length,
      trabajosConError: trabajos.filter(t => t.etapas.some(e => e.estado === 'error')).length,
    };
  }
} 
