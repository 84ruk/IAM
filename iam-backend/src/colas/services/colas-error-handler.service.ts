import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ErrorImportacion, EstadoTrabajo } from '../interfaces/trabajo-importacion.interface';

export interface ErrorContext {
  trabajoId: string;
  tipo: string;
  empresaId: number;
  usuarioId: number;
  etapa: string;
  timestamp: Date;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  userMessage: string;
  technicalMessage: string;
}

@Injectable()
export class ColasErrorHandlerService {
  private readonly logger = new Logger(ColasErrorHandlerService.name);

  /**
   * Maneja errores de procesamiento de trabajos
   */
  handleJobError(error: Error, job: Job, etapa: string): ErrorReport {
    const context: ErrorContext = {
      trabajoId: job.id as string,
      tipo: job.data?.tipo || 'unknown',
      empresaId: job.data?.empresaId || 0,
      usuarioId: job.data?.usuarioId || 0,
      etapa,
      timestamp: new Date(),
    };

    const errorReport = this.analyzeError(error, context);
    this.logError(errorReport);
    
    return errorReport;
  }

  /**
   * Analiza un error y determina su severidad y si es reintentable
   */
  private analyzeError(error: Error, context: ErrorContext): ErrorReport {
    const errorMessage = error.message.toLowerCase();
    
    // Errores críticos (no reintentables)
    if (this.isCriticalError(errorMessage)) {
      return {
        error,
        context,
        severity: 'critical',
        retryable: false,
        userMessage: 'Error crítico del sistema. Contacte al administrador.',
        technicalMessage: `Critical error: ${error.message}`,
      };
    }

    // Errores de validación (no reintentables)
    if (this.isValidationError(errorMessage)) {
      return {
        error,
        context,
        severity: 'medium',
        retryable: false,
        userMessage: 'Error de validación en los datos. Revise el archivo e intente nuevamente.',
        technicalMessage: `Validation error: ${error.message}`,
      };
    }

    // Errores de base de datos (reintentables)
    if (this.isDatabaseError(errorMessage)) {
      return {
        error,
        context,
        severity: 'high',
        retryable: true,
        userMessage: 'Error temporal de base de datos. El sistema reintentará automáticamente.',
        technicalMessage: `Database error: ${error.message}`,
      };
    }

    // Errores de red/conexión (reintentables)
    if (this.isNetworkError(errorMessage)) {
      return {
        error,
        context,
        severity: 'medium',
        retryable: true,
        userMessage: 'Error de conexión temporal. El sistema reintentará automáticamente.',
        technicalMessage: `Network error: ${error.message}`,
      };
    }

    // Errores de memoria (críticos)
    if (this.isMemoryError(errorMessage)) {
      return {
        error,
        context,
        severity: 'critical',
        retryable: false,
        userMessage: 'Error de memoria del sistema. Contacte al administrador.',
        technicalMessage: `Memory error: ${error.message}`,
      };
    }

    // Errores desconocidos (reintentables por defecto)
    return {
      error,
      context,
      severity: 'medium',
      retryable: true,
      userMessage: 'Error inesperado. El sistema reintentará automáticamente.',
      technicalMessage: `Unknown error: ${error.message}`,
    };
  }

  /**
   * Convierte errores a formato ErrorImportacion
   */
  convertToErrorImportacion(error: Error, fila: number, columna: string, valor: string): ErrorImportacion {
    return {
      fila,
      columna,
      valor,
      mensaje: error.message,
      tipo: this.determineErrorType(error.message),
    };
  }

  /**
   * Determina el tipo de error basado en el mensaje
   */
  private determineErrorType(errorMessage: string): 'validacion' | 'duplicado' | 'referencia' | 'sistema' {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('duplicate') || message.includes('duplicado') || message.includes('ya existe')) {
      return 'duplicado';
    }
    
    if (message.includes('validation') || message.includes('validacion') || message.includes('invalid')) {
      return 'validacion';
    }
    
    if (message.includes('foreign key') || message.includes('reference') || message.includes('referencia')) {
      return 'referencia';
    }
    
    return 'sistema';
  }

  /**
   * Verifica si es un error crítico
   */
  private isCriticalError(errorMessage: string): boolean {
    const criticalKeywords = [
      'fatal', 'critical', 'unrecoverable', 'corruption',
      'fatal', 'crítico', 'irrecuperable', 'corrupción'
    ];
    return criticalKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Verifica si es un error de validación
   */
  private isValidationError(errorMessage: string): boolean {
    const validationKeywords = [
      'validation', 'invalid', 'required', 'format',
      'validacion', 'invalido', 'requerido', 'formato'
    ];
    return validationKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Verifica si es un error de base de datos
   */
  private isDatabaseError(errorMessage: string): boolean {
    const databaseKeywords = [
      'database', 'connection', 'timeout', 'deadlock',
      'base de datos', 'conexion', 'timeout', 'deadlock'
    ];
    return databaseKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Verifica si es un error de red
   */
  private isNetworkError(errorMessage: string): boolean {
    const networkKeywords = [
      'network', 'connection', 'timeout', 'unreachable',
      'red', 'conexion', 'timeout', 'inaccesible'
    ];
    return networkKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Verifica si es un error de memoria
   */
  private isMemoryError(errorMessage: string): boolean {
    const memoryKeywords = [
      'memory', 'heap', 'out of memory', 'allocation',
      'memoria', 'heap', 'sin memoria', 'asignacion'
    ];
    return memoryKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Registra el error con el nivel apropiado
   */
  private logError(errorReport: ErrorReport): void {
    const { error, context, severity } = errorReport;
    
    const logMessage = `[${severity.toUpperCase()}] Error en trabajo ${context.trabajoId} (${context.tipo}) - Etapa: ${context.etapa} - ${error.message}`;
    
    switch (severity) {
      case 'critical':
        this.logger.error(logMessage, error.stack);
        break;
      case 'high':
        this.logger.error(logMessage);
        break;
      case 'medium':
        this.logger.warn(logMessage);
        break;
      case 'low':
        this.logger.debug(logMessage);
        break;
    }
  }

  /**
   * Genera un resumen de errores para el usuario
   */
  generateErrorSummary(errores: ErrorImportacion[]): {
    total: number;
    porTipo: Record<string, number>;
    mensajeResumen: string;
  } {
    const porTipo = errores.reduce((acc, error) => {
      acc[error.tipo] = (acc[error.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mensajeResumen = this.generateUserFriendlyMessage(porTipo);

    return {
      total: errores.length,
      porTipo,
      mensajeResumen,
    };
  }

  /**
   * Genera un mensaje amigable para el usuario
   */
  private generateUserFriendlyMessage(porTipo: Record<string, number>): string {
    const mensajes: string[] = [];
    
    if (porTipo.validacion) {
      mensajes.push(`${porTipo.validacion} errores de validación`);
    }
    
    if (porTipo.duplicado) {
      mensajes.push(`${porTipo.duplicado} registros duplicados`);
    }
    
    if (porTipo.referencia) {
      mensajes.push(`${porTipo.referencia} errores de referencia`);
    }
    
    if (porTipo.sistema) {
      mensajes.push(`${porTipo.sistema} errores del sistema`);
    }

    if (mensajes.length === 0) {
      return 'No se encontraron errores';
    }

    return `Se encontraron: ${mensajes.join(', ')}`;
  }
} 