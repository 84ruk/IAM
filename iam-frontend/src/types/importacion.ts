export enum ImportacionEventType {
  TRABAJO_CREADO = 'TRABAJO_CREADO',
  TRABAJO_ACTUALIZADO = 'TRABAJO_ACTUALIZADO',
  PROGRESO_ACTUALIZADO = 'PROGRESO_ACTUALIZADO',
  TRABAJO_COMPLETADO = 'TRABAJO_COMPLETADO',
  TRABAJO_ERROR = 'TRABAJO_ERROR',
  ERROR_VALIDACION = 'ERROR_VALIDACION',
  ESTADISTICAS_ACTUALIZADAS = 'ESTADISTICAS_ACTUALIZADAS',
  // Nuevos eventos para funcionalidades avanzadas
  TRABAJO_CANCELADO = 'TRABAJO_CANCELADO',
  ERRORES_RESUELTOS = 'ERRORES_RESUELTOS',
  LOGS_ACTUALIZADOS = 'LOGS_ACTUALIZADOS',
  ESTADISTICAS_RENDIMIENTO = 'ESTADISTICAS_RENDIMIENTO',
  TRABAJO_PAUSADO = 'TRABAJO_PAUSADO',
  TRABAJO_REANUDADO = 'TRABAJO_REANUDADO',
  VALIDACION_TIEMPO_REAL = 'VALIDACION_TIEMPO_REAL',
  SUGERENCIAS_AUTOMATICAS = 'SUGERENCIAS_AUTOMATICAS',
}

export interface ImportacionWebSocketEvent {
  event: ImportacionEventType;
  trabajoId?: string;
  data?: any;
  timestamp: string;
  empresaId?: string;
  usuarioId?: string;
  metadata?: {
    velocidad?: number;
    tiempoEstimado?: number;
    etapa?: string;
    errores?: any[];
    sugerencias?: string[];
    logs?: any[];
  };
}

export interface TrabajoImportacion {
  id: string;
  tipo: 'productos' | 'proveedores' | 'movimientos';
  estado: 'pendiente' | 'procesando' | 'completado' | 'error' | 'cancelado' | 'pausado';
  empresaId: number;
  usuarioId: number;
  archivoOriginal: string;
  totalRegistros: number;
  registrosProcesados: number;
  registrosExitosos: number;
  registrosConError: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  progreso: number;
  mensaje?: string;
  errores?: string[];
  logs?: LogEntry[];
  estadisticas?: EstadisticasRendimiento;
}

export interface LogEntry {
  id: string;
  trabajoId: string;
  nivel: 'info' | 'warning' | 'error' | 'debug';
  mensaje: string;
  timestamp: string;
  metadata?: any;
  etapa?: string;
}

export interface EstadisticasRendimiento {
  velocidadPromedio: number;
  velocidadActual: number;
  tiempoEstimado: number;
  tiempoTranscurrido: number;
  eficiencia: number;
  erroresPorMinuto: number;
  registrosPorSegundo: number;
  usoMemoria: number;
  usoCPU: number;
}

export interface SugerenciaAutomatica {
  tipo: 'formato' | 'validacion' | 'correccion' | 'optimizacion';
  mensaje: string;
  accion: string;
  confianza: number;
  aplicable: boolean;
}

export interface ResolucionErrores {
  erroresResueltos: number;
  erroresPendientes: number;
  sugerencias: SugerenciaAutomatica[];
  tiempoResolucion: number;
  eficiencia: number;
} 