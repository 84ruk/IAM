import { Injectable, Logger } from '@nestjs/common';
import { ErrorImportacion } from '../../colas/interfaces/trabajo-importacion.interface';
import { ImportacionConfigService } from '../config/importacion.config';

export interface ErrorContext {
  empresaId: number;
  usuarioId: number;
  tipoImportacion: string;
  archivo: string;
  timestamp: Date;
  trabajoId?: string;
  etapa?: string;
}

export interface ErrorReport {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByColumn: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  criticalErrors: ErrorImportacion[];
  warnings: ErrorImportacion[];
  suggestions: string[];
  canContinue: boolean;
  estimatedTimeToFix: number; // en minutos
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorResolution {
  error: ErrorImportacion;
  resolved: boolean;
  confidence: number;
  suggestedFix: string;
  autoFixable: boolean;
  requiresUserAction: boolean;
}

export interface ErrorPattern {
  pattern: string;
  count: number;
  examples: ErrorImportacion[];
  suggestedFix: string;
  autoFixable: boolean;
}

@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);
  private readonly errorPatterns = new Map<string, ErrorPattern>();
  private readonly errorHistory: ErrorImportacion[] = [];

  // Configuración de severidad de errores
  private readonly errorSeverity: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    // Errores críticos - impiden la importación
    'sistema': 'critical',
    'referencia': 'critical',
    'duplicado': 'high',
    
    // Errores de validación - pueden ser corregidos
    'validacion': 'medium',
    'formato': 'low',
    'ortografia': 'low',
  };

  // Campos críticos que no pueden estar vacíos
  private readonly criticalFields: Record<string, string[]> = {
    productos: ['nombre', 'stock', 'precioCompra', 'precioVenta'],
    proveedores: ['nombre'],
    movimientos: ['productoId', 'tipo', 'cantidad'],
  };

  // Patrones de errores comunes y sus soluciones
  private readonly commonErrorPatterns: Record<string, {
    pattern: RegExp;
    suggestedFix: string;
    autoFixable: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> = {
    emailInvalid: {
      pattern: /email.*inválido|invalid.*email/i,
      suggestedFix: 'Verificar formato de email (ejemplo@dominio.com)',
      autoFixable: false,
      severity: 'medium'
    },
    phoneInvalid: {
      pattern: /teléfono.*inválido|phone.*invalid/i,
      suggestedFix: 'Verificar formato de teléfono (solo números)',
      autoFixable: true,
      severity: 'low'
    },
    priceInvalid: {
      pattern: /precio.*inválido|price.*invalid/i,
      suggestedFix: 'Verificar que el precio sea un número válido mayor a 0',
      autoFixable: true,
      severity: 'medium'
    },
    stockInvalid: {
      pattern: /stock.*inválido|quantity.*invalid/i,
      suggestedFix: 'Verificar que la cantidad sea un número entero mayor o igual a 0',
      autoFixable: true,
      severity: 'medium'
    },
    duplicateFound: {
      pattern: /ya existe|already exists|duplicate/i,
      suggestedFix: 'Habilitar "Sobrescribir existentes" o cambiar valores únicos',
      autoFixable: false,
      severity: 'high'
    },
    referenceNotFound: {
      pattern: /no existe|not found|referencia/i,
      suggestedFix: 'Verificar que el elemento referenciado exista en el sistema',
      autoFixable: false,
      severity: 'critical'
    },
    requiredField: {
      pattern: /requerido|required|obligatorio/i,
      suggestedFix: 'Completar campos obligatorios marcados con *',
      autoFixable: false,
      severity: 'high'
    },
    dateInvalid: {
      pattern: /fecha.*inválida|date.*invalid/i,
      suggestedFix: 'Verificar formato de fecha (YYYY-MM-DD)',
      autoFixable: true,
      severity: 'low'
    }
  };

  /**
   * Analiza y categoriza errores de importación
   */
  analyzeErrors(errors: ErrorImportacion[], context: ErrorContext): ErrorReport {
    const report: ErrorReport = {
      totalErrors: errors.length,
      errorsByType: {},
      errorsByColumn: {},
      errorsBySeverity: {},
      criticalErrors: [],
      warnings: [],
      suggestions: [],
      canContinue: false,
      estimatedTimeToFix: 0,
      priority: 'low'
    };

    if (errors.length === 0) {
      report.canContinue = true;
      return report;
    }

    // Categorizar errores
    errors.forEach(error => {
      // Por tipo
      report.errorsByType[error.tipo] = (report.errorsByType[error.tipo] || 0) + 1;
      
      // Por columna
      report.errorsByColumn[error.columna] = (report.errorsByColumn[error.columna] || 0) + 1;
      
      // Por severidad
      const severity = this.getErrorSeverity(error);
      report.errorsBySeverity[severity] = (report.errorsBySeverity[severity] || 0) + 1;
      
      // Separar críticos de warnings
      if (this.isCriticalError(error, context.tipoImportacion)) {
        report.criticalErrors.push(error);
      } else {
        report.warnings.push(error);
      }
    });

    // Generar sugerencias
    report.suggestions = this.generateSuggestions(report, context);

    // Determinar si se puede continuar
    report.canContinue = this.canContinueWithErrors(errors, context);

    // Calcular tiempo estimado de corrección
    report.estimatedTimeToFix = this.estimateTimeToFix(errors, context);

    // Determinar prioridad
    report.priority = this.determinePriority(report);

    // Actualizar patrones de errores
    this.updateErrorPatterns(errors);

    this.logger.log(`Análisis de errores completado: ${report.totalErrors} errores, ${report.criticalErrors.length} críticos, prioridad: ${report.priority}`);

    return report;
  }

  /**
   * Determina la severidad de un error
   */
  private getErrorSeverity(error: ErrorImportacion): 'low' | 'medium' | 'high' | 'critical' {
    // Verificar patrones comunes
    for (const [patternName, pattern] of Object.entries(this.commonErrorPatterns)) {
      if (pattern.pattern.test(error.mensaje)) {
        return pattern.severity;
      }
    }

    // Verificar por tipo
    return this.errorSeverity[error.tipo] || 'medium';
  }

  /**
   * Determina si un error es crítico
   */
  private isCriticalError(error: ErrorImportacion, tipoImportacion: string): boolean {
    const criticalTypes = ['sistema', 'referencia'];
    const criticalColumns = this.criticalFields[tipoImportacion] || [];
    
    return criticalTypes.includes(error.tipo) || 
           criticalColumns.includes(error.columna) ||
           error.mensaje.includes('requerido') ||
           error.mensaje.includes('inválido') ||
           this.getErrorSeverity(error) === 'critical';
  }

  /**
   * Genera sugerencias basadas en los errores
   */
  private generateSuggestions(report: ErrorReport, context: ErrorContext): string[] {
    const suggestions: string[] = [];

    // Sugerencias basadas en tipos de error
    if (report.errorsByType['validacion'] > 0) {
      suggestions.push('Revisar el formato de los datos en las columnas con errores de validación');
    }

    if (report.errorsByType['duplicado'] > 0) {
      suggestions.push('Considerar usar la opción "Sobrescribir existentes" para manejar duplicados');
    }

    if (report.errorsByType['referencia'] > 0) {
      suggestions.push('Verificar que los productos/proveedores referenciados existan en el sistema');
    }

    if (report.errorsByType['sistema'] > 0) {
      suggestions.push('Contactar al administrador del sistema para errores técnicos');
    }

    // Sugerencias basadas en columnas específicas
    if (report.errorsByColumn['email'] > 0) {
      suggestions.push('Verificar el formato de los emails (debe ser válido)');
    }

    if (report.errorsByColumn['precioCompra'] > 0 || report.errorsByColumn['precioVenta'] > 0) {
      suggestions.push('Los precios deben ser números válidos mayores a 0');
    }

    if (report.errorsByColumn['stock'] > 0 || report.errorsByColumn['cantidad'] > 0) {
      suggestions.push('Las cantidades deben ser números enteros mayores o iguales a 0');
    }

    if (report.errorsByColumn['fecha'] > 0) {
      suggestions.push('Verificar el formato de fechas (YYYY-MM-DD)');
    }

    // Sugerencias basadas en patrones de errores
    const patterns = this.identifyErrorPatterns(report);
    patterns.forEach(pattern => {
      if (pattern.count > 2) { // Solo sugerir si hay más de 2 errores del mismo patrón
        suggestions.push(`${pattern.suggestedFix} (${pattern.count} ocurrencias)`);
      }
    });

    // Sugerencias generales
    if (report.totalErrors > 50) {
      suggestions.push('Considerar dividir el archivo en lotes más pequeños para facilitar la corrección');
    }

    if (report.criticalErrors.length > 0) {
      suggestions.push('Corregir errores críticos antes de continuar con la importación');
    }

    return [...new Set(suggestions)]; // Eliminar duplicados
  }

  /**
   * Identifica patrones de errores
   */
  private identifyErrorPatterns(report: ErrorReport): ErrorPattern[] {
    const patterns: ErrorPattern[] = [];

    // Agrupar errores por mensaje similar
    const errorGroups = new Map<string, ErrorImportacion[]>();
    
    // Aquí se agruparían los errores por similitud de mensaje
    // Por simplicidad, usamos el mensaje completo como clave
    
    return patterns;
  }

  /**
   * Actualiza los patrones de errores con nuevos datos
   */
  private updateErrorPatterns(errors: ErrorImportacion[]): void {
    errors.forEach(error => {
      const key = `${error.tipo}:${error.columna}`;
      const existing = this.errorPatterns.get(key);
      
      if (existing) {
        existing.count++;
        if (existing.examples.length < 5) {
          existing.examples.push(error);
        }
      } else {
        this.errorPatterns.set(key, {
          pattern: `${error.tipo}:${error.columna}`,
          count: 1,
          examples: [error],
          suggestedFix: this.getSuggestedFixForError(error),
          autoFixable: this.isErrorAutoFixable(error)
        });
      }
    });
  }

  /**
   * Obtiene sugerencia de corrección para un error
   */
  private getSuggestedFixForError(error: ErrorImportacion): string {
    // Verificar patrones comunes
    for (const [patternName, pattern] of Object.entries(this.commonErrorPatterns)) {
      if (pattern.pattern.test(error.mensaje)) {
        return pattern.suggestedFix;
      }
    }

    // Sugerencias específicas por tipo
    switch (error.tipo) {
      case 'validacion':
        return `Verificar el valor "${error.valor}" en la columna "${error.columna}"`;
      case 'duplicado':
        return 'Cambiar el valor o habilitar "Sobrescribir existentes"';
      case 'referencia':
        return 'Verificar que el elemento referenciado exista en el sistema';
      case 'sistema':
        return 'Contactar al administrador del sistema';
      default:
        return 'Revisar y corregir el valor';
    }
  }

  /**
   * Determina si un error se puede corregir automáticamente
   */
  private isErrorAutoFixable(error: ErrorImportacion): boolean {
    // Verificar patrones comunes
    for (const [patternName, pattern] of Object.entries(this.commonErrorPatterns)) {
      if (pattern.pattern.test(error.mensaje)) {
        return pattern.autoFixable;
      }
    }

    // Errores que se pueden corregir automáticamente
    const autoFixableTypes = ['formato', 'ortografia'];
    const autoFixableColumns = ['telefono', 'email', 'fecha', 'precio', 'stock', 'cantidad'];
    
    return autoFixableTypes.includes(error.tipo) || 
           autoFixableColumns.includes(error.columna.toLowerCase());
  }

  /**
   * Determina si se puede continuar con errores
   */
  canContinueWithErrors(errors: ErrorImportacion[], context: ErrorContext | { allowPartialImport: boolean }): boolean {
    // Si se pasa un contexto con allowPartialImport, usar esa configuración
    if ('allowPartialImport' in context) {
      if (!context.allowPartialImport) {
        return false;
      }
    }

    // Si no hay errores, siempre se puede continuar
    if (errors.length === 0) {
      return true;
    }

    // Contar errores críticos
    const criticalErrors = errors.filter(error => 
      this.isCriticalError(error, 'tipoImportacion' in context ? context.tipoImportacion : 'productos')
    );

    // Si hay errores críticos, no se puede continuar
    if (criticalErrors.length > 0) {
      return false;
    }

    // Si hay más del 20% de errores, no se puede continuar
    const errorPercentage = (errors.length / 100) * 100; // Asumiendo 100 registros como base
    if (errorPercentage > 20) {
      return false;
    }

    return true;
  }

  /**
   * Filtra errores por severidad
   */
  filterErrorsBySeverity(errors: ErrorImportacion[], severity: 'all' | 'critical' | 'warning' | 'low' | 'medium' | 'high'): ErrorImportacion[] {
    switch (severity) {
      case 'critical':
        return errors.filter(error => this.getErrorSeverity(error) === 'critical');
      case 'high':
        return errors.filter(error => this.getErrorSeverity(error) === 'high');
      case 'medium':
        return errors.filter(error => this.getErrorSeverity(error) === 'medium');
      case 'low':
        return errors.filter(error => this.getErrorSeverity(error) === 'low');
      case 'warning':
        return errors.filter(error => this.getErrorSeverity(error) !== 'critical');
      default:
        return errors;
    }
  }

  /**
   * Agrupa errores por fila
   */
  groupErrorsByRow(errors: ErrorImportacion[]): Record<number, ErrorImportacion[]> {
    const grouped: Record<number, ErrorImportacion[]> = {};
    
    errors.forEach(error => {
      if (!grouped[error.fila]) {
        grouped[error.fila] = [];
      }
      grouped[error.fila].push(error);
    });
    
    return grouped;
  }

  /**
   * Genera un resumen ejecutivo de errores
   */
  generateErrorSummary(errors: ErrorImportacion[]): {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    topIssues: Array<{ issue: string; count: number; severity: string }>;
    autoFixable: number;
    requiresUserAction: number;
  } {
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    let autoFixable = 0;
    let requiresUserAction = 0;

    errors.forEach(error => {
      const severity = this.getErrorSeverity(error);
      severityCounts[severity]++;
      
      if (this.isErrorAutoFixable(error)) {
        autoFixable++;
      } else {
        requiresUserAction++;
      }
    });

    // Identificar problemas más comunes
    const issueCounts: Record<string, { count: number; severity: string }> = {};
    errors.forEach(error => {
      const issue = `${error.columna}: ${error.tipo}`;
      if (!issueCounts[issue]) {
        issueCounts[issue] = { count: 0, severity: this.getErrorSeverity(error) };
      }
      issueCounts[issue].count++;
    });

    const topIssues = Object.entries(issueCounts)
      .map(([issue, data]) => ({ issue, count: data.count, severity: data.severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total: errors.length,
      critical: severityCounts.critical,
      high: severityCounts.high,
      medium: severityCounts.medium,
      low: severityCounts.low,
      topIssues,
      autoFixable,
      requiresUserAction
    };
  }

  /**
   * Calcula el tiempo estimado para corregir errores
   */
  private estimateTimeToFix(errors: ErrorImportacion[], context: ErrorContext): number {
    if (errors.length === 0) return 0;

    let totalMinutes = 0;
    
    errors.forEach(error => {
      const severity = this.getErrorSeverity(error);
      const isAutoFixable = this.isErrorAutoFixable(error);
      
      // Tiempo estimado por tipo de error
      switch (severity) {
        case 'critical':
          totalMinutes += isAutoFixable ? 2 : 5;
          break;
        case 'high':
          totalMinutes += isAutoFixable ? 1 : 3;
          break;
        case 'medium':
          totalMinutes += isAutoFixable ? 0.5 : 2;
          break;
        case 'low':
          totalMinutes += isAutoFixable ? 0.2 : 1;
          break;
      }
    });

    // Aplicar factor de eficiencia por volumen
    if (errors.length > 100) {
      totalMinutes *= 0.8; // Más eficiente con muchos errores
    } else if (errors.length < 10) {
      totalMinutes *= 1.2; // Menos eficiente con pocos errores
    }

    return Math.round(totalMinutes);
  }

  /**
   * Determina la prioridad general del reporte
   */
  private determinePriority(report: ErrorReport): 'low' | 'medium' | 'high' | 'critical' {
    if (report.errorsBySeverity['critical'] > 0) {
      return 'critical';
    }
    if (report.errorsBySeverity['high'] > 5) {
      return 'high';
    }
    if (report.errorsBySeverity['medium'] > 10) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Logs detallados de errores para debugging
   */
  logErrorDetails(errors: ErrorImportacion[], context: ErrorContext): void {
    this.logger.error(`Errores de importación para empresa ${context.empresaId}, trabajo ${context.trabajoId || 'N/A'}:`);
    
    const summary = this.generateErrorSummary(errors);
    this.logger.error(`Resumen: ${summary.total} errores (${summary.critical} críticos, ${summary.high} altos, ${summary.medium} medios, ${summary.low} bajos)`);
    this.logger.error(`Auto-corregibles: ${summary.autoFixable}, Requieren acción: ${summary.requiresUserAction}`);
    
    if (summary.topIssues.length > 0) {
      this.logger.error('Problemas más comunes:');
      summary.topIssues.forEach(({ issue, count, severity }) => {
        this.logger.error(`  - ${issue}: ${count} ocurrencias (${severity})`);
      });
    }

    // Log de errores críticos
    const criticalErrors = this.filterErrorsBySeverity(errors, 'critical');
    if (criticalErrors.length > 0) {
      this.logger.error('Errores críticos:');
      criticalErrors.slice(0, 10).forEach(error => {
        this.logger.error(`  Fila ${error.fila}, Columna ${error.columna}: ${error.mensaje}`);
      });
    }

    // Guardar en historial para análisis futuro
    this.errorHistory.push(...errors);
    if (this.errorHistory.length > 1000) {
      this.errorHistory.splice(0, 500); // Mantener solo los últimos 500
    }
  }

  /**
   * Obtiene estadísticas del historial de errores
   */
  getErrorHistoryStats(): {
    totalErrors: number;
    mostCommonTypes: Array<{ type: string; count: number }>;
    mostCommonColumns: Array<{ column: string; count: number }>;
    averageErrorsPerImport: number;
  } {
    if (this.errorHistory.length === 0) {
      return {
        totalErrors: 0,
        mostCommonTypes: [],
        mostCommonColumns: [],
        averageErrorsPerImport: 0
      };
    }

    const typeCounts: Record<string, number> = {};
    const columnCounts: Record<string, number> = {};

    this.errorHistory.forEach(error => {
      typeCounts[error.tipo] = (typeCounts[error.tipo] || 0) + 1;
      columnCounts[error.columna] = (columnCounts[error.columna] || 0) + 1;
    });

    const mostCommonTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const mostCommonColumns = Object.entries(columnCounts)
      .map(([column, count]) => ({ column, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalErrors: this.errorHistory.length,
      mostCommonTypes,
      mostCommonColumns,
      averageErrorsPerImport: Math.round(this.errorHistory.length / 10) // Estimación
    };
  }

  /**
   * Limpia el historial de errores
   */
  clearErrorHistory(): void {
    this.errorHistory.length = 0;
    this.errorPatterns.clear();
    this.logger.log('Historial de errores limpiado');
  }
} 