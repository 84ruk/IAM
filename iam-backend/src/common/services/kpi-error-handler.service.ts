import { Injectable, Logger } from '@nestjs/common';

export interface KPIErrorContext {
  empresaId: number;
  operation: string;
  timestamp: Date;
  error: any;
}

@Injectable()
export class KPIErrorHandler {
  private readonly logger = new Logger(KPIErrorHandler.name);

  /**
   * Maneja errores específicos de KPIs con fallback
   */
  handleKPIError(error: any, context: string, empresaId: number): any {
    const errorContext: KPIErrorContext = {
      empresaId,
      operation: context,
      timestamp: new Date(),
      error
    };

    this.logger.error(`KPI Error in ${context}`, {
      empresaId,
      error: error.message,
      stack: error.stack,
      context
    });

    // Retornar datos básicos como fallback
    return this.getBasicKPIs(empresaId);
  }

  /**
   * Datos básicos de KPIs como fallback cuando hay errores
   */
  getBasicKPIs(empresaId: number) {
    return {
      totalProductos: 0,
      productosStockBajo: 0,
      movimientosUltimoMes: 0,
      valorTotalInventario: 0,
      margenPromedio: 0,
      rotacionInventario: 0,
      error: true,
      errorMessage: 'Error al calcular KPIs, mostrando datos básicos',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Valida que los datos de KPIs sean consistentes
   */
  validateKPIData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      this.logger.warn('KPI data is null or not an object');
      return false;
    }

    // Validar campos críticos
    const requiredFields = ['totalProductos', 'productosStockBajo', 'valorTotalInventario'];
    for (const field of requiredFields) {
      if (typeof data[field] !== 'number' || data[field] < 0) {
        this.logger.warn(`Invalid KPI field: ${field} = ${data[field]}`);
        return false;
      }
    }

    // Validar lógica de negocio
    if (data.productosStockBajo > data.totalProductos) {
      this.logger.warn('Productos con stock bajo no puede ser mayor al total');
      return false;
    }

    return true;
  }

  /**
   * Maneja errores de cache específicamente
   */
  handleCacheError(error: any, key: string, empresaId: number): any {
    this.logger.warn(`Cache error for key ${key}`, {
      empresaId,
      key,
      error: error.message
    });

    // Retornar datos básicos cuando falla el cache
    return this.getBasicKPIs(empresaId);
  }

  /**
   * Maneja errores de transacciones
   */
  handleTransactionError(error: any, operation: string, empresaId: number): never {
    this.logger.error(`Transaction error in ${operation}`, {
      empresaId,
      operation,
      error: error.message,
      stack: error.stack
    });

    // Re-lanzar el error para que sea manejado por el controlador
    throw error;
  }

  /**
   * Maneja errores de validación de datos
   */
  handleValidationError(error: any, data: any, empresaId: number): any {
    this.logger.warn(`Data validation error`, {
      empresaId,
      error: error.message,
      dataType: typeof data,
      dataKeys: data ? Object.keys(data) : 'null'
    });

    return this.getBasicKPIs(empresaId);
  }

  /**
   * Obtiene estadísticas de errores
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    lastError: string;
  } {
    // En una implementación real, esto vendría de una base de datos
    return {
      totalErrors: 0,
      errorsByType: {},
      lastError: new Date().toISOString()
    };
  }
} 