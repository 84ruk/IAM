export interface OpcionesProcesamientoConfig {
  maxRegistros: number;
  columnasRequeridas: string[];
  validarEncabezados: boolean;
  ignorarFilasVacias: boolean;
  normalizarEncabezados: boolean;
  maxTamanoArchivo: number; // en bytes
  timeoutProcesamiento: number; // en milisegundos
  maxErroresPermitidos: number;
  habilitarAutocorreccion: boolean;
  nivelConfianzaMinimo: number;
}

export interface ConfiguracionLogging {
  nivel: 'debug' | 'info' | 'warn' | 'error';
  habilitarLogsDetallados: boolean;
  habilitarMetricas: boolean;
  maxLogsPorTrabajo: number;
  retencionLogs: number; // en días
}

export interface ConfiguracionCache {
  habilitado: boolean;
  ttl: number; // en segundos
  maxEntries: number;
  cleanupInterval: number; // en segundos
}

export interface ConfiguracionColas {
  batchSize: number;
  concurrency: number;
  retryAttempts: number;
  timeout: number;
  backoffDelay: number;
  maxJobsInQueue: number;
}

export interface ConfiguracionValidacion {
  validacionEstricta: boolean;
  permitirValoresPorDefecto: boolean;
  validarReferencias: boolean;
  validarDuplicados: boolean;
  maxErroresPorRegistro: number;
}

export interface ConfiguracionImportacion {
  productos: OpcionesProcesamientoConfig;
  proveedores: OpcionesProcesamientoConfig;
  movimientos: OpcionesProcesamientoConfig;
  logging: ConfiguracionLogging;
  cache: ConfiguracionCache;
  colas: ConfiguracionColas;
  validacion: ConfiguracionValidacion;
}

export const CONFIGURACION_IMPORTACION: ConfiguracionImportacion = {
  productos: {
    maxRegistros: 10000,
    columnasRequeridas: ['nombre', 'stock', 'precioCompra', 'precioVenta'],
    validarEncabezados: true,
    ignorarFilasVacias: true,
    normalizarEncabezados: true,
    maxTamanoArchivo: 50 * 1024 * 1024, // 50MB
    timeoutProcesamiento: 300000, // 5 minutos
    maxErroresPermitidos: 100,
    habilitarAutocorreccion: true,
    nivelConfianzaMinimo: 70,
  },
  proveedores: {
    maxRegistros: 5000,
    columnasRequeridas: ['nombre'],
    validarEncabezados: true,
    ignorarFilasVacias: true,
    normalizarEncabezados: true,
    maxTamanoArchivo: 25 * 1024 * 1024, // 25MB
    timeoutProcesamiento: 180000, // 3 minutos
    maxErroresPermitidos: 50,
    habilitarAutocorreccion: true,
    nivelConfianzaMinimo: 75,
  },
  movimientos: {
    maxRegistros: 10000,
    columnasRequeridas: ['productoId', 'tipo', 'cantidad'],
    validarEncabezados: true,
    ignorarFilasVacias: true,
    normalizarEncabezados: true,
    maxTamanoArchivo: 50 * 1024 * 1024, // 50MB
    timeoutProcesamiento: 300000, // 5 minutos
    maxErroresPermitidos: 100,
    habilitarAutocorreccion: true,
    nivelConfianzaMinimo: 70,
  },
  logging: {
    nivel: 'info',
    habilitarLogsDetallados: true,
    habilitarMetricas: true,
    maxLogsPorTrabajo: 1000,
    retencionLogs: 30, // 30 días
  },
  cache: {
    habilitado: true,
    ttl: 1800, // 30 minutos
    maxEntries: 50, // Reducido de 100 a 50 para evitar problemas de memoria
    cleanupInterval: 600, // Aumentado de 300 a 600 segundos (10 minutos) para reducir frecuencia de limpieza
  },
  colas: {
    batchSize: 100,
    concurrency: 5,
    retryAttempts: 3,
    timeout: 30000, // 30 segundos
    backoffDelay: 1000, // 1 segundo
    maxJobsInQueue: 1000,
  },
  validacion: {
    validacionEstricta: false,
    permitirValoresPorDefecto: true,
    validarReferencias: true,
    validarDuplicados: true,
    maxErroresPorRegistro: 5,
  },
};

export class ImportacionConfigService {
  private static configuracion: ConfiguracionImportacion = CONFIGURACION_IMPORTACION;

  static getOpcionesProcesamiento(tipo: 'productos' | 'proveedores' | 'movimientos'): OpcionesProcesamientoConfig {
    return this.configuracion[tipo];
  }

  static getOpcionesProcesamientoProductos(): OpcionesProcesamientoConfig {
    return this.configuracion.productos;
  }

  static getOpcionesProcesamientoProveedores(): OpcionesProcesamientoConfig {
    return this.configuracion.proveedores;
  }

  static getOpcionesProcesamientoMovimientos(): OpcionesProcesamientoConfig {
    return this.configuracion.movimientos;
  }

  static getConfiguracionLogging(): ConfiguracionLogging {
    return this.configuracion.logging;
  }

  static getConfiguracionCache(): ConfiguracionCache {
    return this.configuracion.cache;
  }

  static getConfiguracionColas(): ConfiguracionColas {
    return this.configuracion.colas;
  }

  static getConfiguracionValidacion(): ConfiguracionValidacion {
    return this.configuracion.validacion;
  }

  static getConfiguracionCompleta(): ConfiguracionImportacion {
    return this.configuracion;
  }

  static actualizarConfiguracion(nuevaConfiguracion: Partial<ConfiguracionImportacion>): void {
    this.configuracion = {
      ...this.configuracion,
      ...nuevaConfiguracion,
    };
  }

  static actualizarConfiguracionTipo(
    tipo: 'productos' | 'proveedores' | 'movimientos',
    nuevaConfiguracion: Partial<OpcionesProcesamientoConfig>
  ): void {
    this.configuracion[tipo] = {
      ...this.configuracion[tipo],
      ...nuevaConfiguracion,
    };
  }

  static obtenerConfiguracionPorEntorno(entorno: string): ConfiguracionImportacion {
    const configuracionBase = { ...CONFIGURACION_IMPORTACION };

    switch (entorno) {
      case 'development':
        configuracionBase.logging.nivel = 'debug';
        configuracionBase.logging.habilitarLogsDetallados = true;
        configuracionBase.productos.maxRegistros = 1000;
        configuracionBase.proveedores.maxRegistros = 500;
        configuracionBase.movimientos.maxRegistros = 1000;
        break;

      case 'testing':
        configuracionBase.logging.nivel = 'warn';
        configuracionBase.logging.habilitarLogsDetallados = false;
        configuracionBase.cache.habilitado = false;
        configuracionBase.productos.maxRegistros = 100;
        configuracionBase.proveedores.maxRegistros = 50;
        configuracionBase.movimientos.maxRegistros = 100;
        break;

      case 'production':
        configuracionBase.logging.nivel = 'info';
        configuracionBase.logging.habilitarLogsDetallados = false;
        configuracionBase.cache.habilitado = true;
        configuracionBase.colas.concurrency = 3;
        configuracionBase.validacion.validacionEstricta = true;
        break;

      default:
        // Usar configuración por defecto
        break;
    }

    return configuracionBase;
  }

  static validarConfiguracion(configuracion: ConfiguracionImportacion): string[] {
    const errores: string[] = [];

    // Validar configuraciones de productos
    if (configuracion.productos.maxRegistros <= 0) {
      errores.push('maxRegistros de productos debe ser mayor a 0');
    }
    if (configuracion.productos.maxTamanoArchivo <= 0) {
      errores.push('maxTamanoArchivo de productos debe ser mayor a 0');
    }
    if (configuracion.productos.timeoutProcesamiento <= 0) {
      errores.push('timeoutProcesamiento de productos debe ser mayor a 0');
    }

    // Validar configuraciones de proveedores
    if (configuracion.proveedores.maxRegistros <= 0) {
      errores.push('maxRegistros de proveedores debe ser mayor a 0');
    }
    if (configuracion.proveedores.maxTamanoArchivo <= 0) {
      errores.push('maxTamanoArchivo de proveedores debe ser mayor a 0');
    }
    if (configuracion.proveedores.timeoutProcesamiento <= 0) {
      errores.push('timeoutProcesamiento de proveedores debe ser mayor a 0');
    }

    // Validar configuraciones de movimientos
    if (configuracion.movimientos.maxRegistros <= 0) {
      errores.push('maxRegistros de movimientos debe ser mayor a 0');
    }
    if (configuracion.movimientos.maxTamanoArchivo <= 0) {
      errores.push('maxTamanoArchivo de movimientos debe ser mayor a 0');
    }
    if (configuracion.movimientos.timeoutProcesamiento <= 0) {
      errores.push('timeoutProcesamiento de movimientos debe ser mayor a 0');
    }

    // Validar configuraciones de logging
    if (configuracion.logging.maxLogsPorTrabajo <= 0) {
      errores.push('maxLogsPorTrabajo debe ser mayor a 0');
    }
    if (configuracion.logging.retencionLogs <= 0) {
      errores.push('retencionLogs debe ser mayor a 0');
    }

    // Validar configuraciones de cache
    if (configuracion.cache.ttl <= 0) {
      errores.push('cache.ttl debe ser mayor a 0');
    }
    if (configuracion.cache.maxEntries <= 0) {
      errores.push('cache.maxEntries debe ser mayor a 0');
    }
    if (configuracion.cache.cleanupInterval <= 0) {
      errores.push('cache.cleanupInterval debe ser mayor a 0');
    }

    // Validar configuraciones de colas
    if (configuracion.colas.batchSize <= 0) {
      errores.push('colas.batchSize debe ser mayor a 0');
    }
    if (configuracion.colas.concurrency <= 0) {
      errores.push('colas.concurrency debe ser mayor a 0');
    }
    if (configuracion.colas.retryAttempts <= 0) {
      errores.push('colas.retryAttempts debe ser mayor a 0');
    }
    if (configuracion.colas.timeout <= 0) {
      errores.push('colas.timeout debe ser mayor a 0');
    }
    if (configuracion.colas.maxJobsInQueue <= 0) {
      errores.push('colas.maxJobsInQueue debe ser mayor a 0');
    }

    // Validar configuraciones de validación
    if (configuracion.validacion.maxErroresPorRegistro <= 0) {
      errores.push('validacion.maxErroresPorRegistro debe ser mayor a 0');
    }

    return errores;
  }

  static obtenerConfiguracionOptimizada(tipo: 'productos' | 'proveedores' | 'movimientos'): OpcionesProcesamientoConfig {
    const configuracion = this.getOpcionesProcesamiento(tipo);
    
    // Aplicar optimizaciones basadas en el tipo
    switch (tipo) {
      case 'productos':
        return {
          ...configuracion,
          maxRegistros: Math.min(configuracion.maxRegistros, 5000), // Limitar para mejor rendimiento
          habilitarAutocorreccion: true,
          nivelConfianzaMinimo: 75,
        };
      
      case 'proveedores':
        return {
          ...configuracion,
          maxRegistros: Math.min(configuracion.maxRegistros, 2000),
          habilitarAutocorreccion: true,
          nivelConfianzaMinimo: 80,
        };
      
      case 'movimientos':
        return {
          ...configuracion,
          maxRegistros: Math.min(configuracion.maxRegistros, 3000),
          habilitarAutocorreccion: false, // Los movimientos suelen ser más críticos
          nivelConfianzaMinimo: 90,
        };
      
      default:
        return configuracion;
    }
  }
} 