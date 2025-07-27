import { Injectable, Logger } from '@nestjs/common';
import { ErrorImportacion } from '../../colas/interfaces/trabajo-importacion.interface';

export interface ErrorContext {
  empresaId: number;
  usuarioId: number;
  tipoImportacion: string;
  archivo: string;
  timestamp: Date;
}

export interface ErrorReport {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByColumn: Record<string, number>;
  criticalErrors: ErrorImportacion[];
  warnings: ErrorImportacion[];
  suggestions: string[];
}

@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);

  /**
   * Analiza y categoriza errores de importación
   */
  analyzeErrors(errors: ErrorImportacion[], context: ErrorContext): ErrorReport {
    const report: ErrorReport = {
      totalErrors: errors.length,
      errorsByType: {},
      errorsByColumn: {},
      criticalErrors: [],
      warnings: [],
      suggestions: []
    };

    // Categorizar errores
    errors.forEach(error => {
      // Por tipo
      report.errorsByType[error.tipo] = (report.errorsByType[error.tipo] || 0) + 1;
      
      // Por columna
      report.errorsByColumn[error.columna] = (report.errorsByColumn[error.columna] || 0) + 1;
      
      // Separar críticos de warnings
      if (this.isCriticalError(error)) {
        report.criticalErrors.push(error);
      } else {
        report.warnings.push(error);
      }
    });

    // Generar sugerencias
    report.suggestions = this.generateSuggestions(report, context);

    this.logger.log(`Análisis de errores completado: ${report.totalErrors} errores, ${report.criticalErrors.length} críticos`);

    return report;
  }

  /**
   * Determina si un error es crítico
   */
  private isCriticalError(error: ErrorImportacion): boolean {
    const criticalTypes = ['sistema', 'referencia'];
    const criticalColumns = ['nombre', 'id', 'empresaId'];
    
    return criticalTypes.includes(error.tipo) || 
           criticalColumns.includes(error.columna) ||
           error.mensaje.includes('requerido') ||
           error.mensaje.includes('inválido');
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

    // Sugerencias basadas en columnas específicas
    if (report.errorsByColumn['email'] > 0) {
      suggestions.push('Verificar el formato de los emails (debe ser válido)');
    }

    if (report.errorsByColumn['precioCompra'] > 0 || report.errorsByColumn['precioVenta'] > 0) {
      suggestions.push('Los precios deben ser números válidos mayores a 0');
    }

    if (report.errorsByColumn['stock'] > 0) {
      suggestions.push('El stock debe ser un número entero válido');
    }

    // Sugerencias basadas en proporción de errores
    const errorRate = report.totalErrors / 100; // Asumiendo 100 como base
    if (errorRate > 0.5) {
      suggestions.push('Alta tasa de errores. Considerar revisar la plantilla de importación');
    }

    if (report.criticalErrors.length > 0) {
      suggestions.push('Errores críticos detectados. Corregir antes de continuar con la importación');
    }

    return suggestions;
  }

  /**
   * Valida si los errores permiten continuar con la importación
   */
  canContinueWithErrors(errors: ErrorImportacion[], config: { allowPartialImport: boolean }): boolean {
    if (!config.allowPartialImport) {
      return errors.length === 0;
    }

    const criticalErrors = errors.filter(error => this.isCriticalError(error));
    return criticalErrors.length === 0;
  }

  /**
   * Filtra errores por severidad
   */
  filterErrorsBySeverity(errors: ErrorImportacion[], severity: 'all' | 'critical' | 'warning'): ErrorImportacion[] {
    switch (severity) {
      case 'critical':
        return errors.filter(error => this.isCriticalError(error));
      case 'warning':
        return errors.filter(error => !this.isCriticalError(error));
      default:
        return errors;
    }
  }

  /**
   * Agrupa errores por fila para mejor análisis
   */
  groupErrorsByRow(errors: ErrorImportacion[]): Record<number, ErrorImportacion[]> {
    return errors.reduce((groups, error) => {
      const fila = error.fila;
      if (!groups[fila]) {
        groups[fila] = [];
      }
      groups[fila].push(error);
      return groups;
    }, {} as Record<number, ErrorImportacion[]>);
  }

  /**
   * Genera un resumen ejecutivo de errores
   */
  generateErrorSummary(errors: ErrorImportacion[]): {
    total: number;
    critical: number;
    warnings: number;
    topIssues: Array<{ issue: string; count: number }>;
  } {
    const critical = errors.filter(e => this.isCriticalError(e)).length;
    const warnings = errors.length - critical;

    // Identificar problemas más comunes
    const issueCounts: Record<string, number> = {};
    errors.forEach(error => {
      const issue = `${error.columna}: ${error.tipo}`;
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });

    const topIssues = Object.entries(issueCounts)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total: errors.length,
      critical,
      warnings,
      topIssues
    };
  }

  /**
   * Logs detallados de errores para debugging
   */
  logErrorDetails(errors: ErrorImportacion[], context: ErrorContext): void {
    this.logger.error(`Errores de importación para empresa ${context.empresaId}:`);
    
    const summary = this.generateErrorSummary(errors);
    this.logger.error(`Resumen: ${summary.total} errores (${summary.critical} críticos, ${summary.warnings} warnings)`);
    
    if (summary.topIssues.length > 0) {
      this.logger.error('Problemas más comunes:');
      summary.topIssues.forEach(({ issue, count }) => {
        this.logger.error(`  - ${issue}: ${count} ocurrencias`);
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
  }
} 