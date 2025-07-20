// Tipos basados en la estructura real del backend

// KPIs básicos - GET /dashboard-cqrs/kpis
export interface KPIData {
  totalProductos: number;
  productosStockBajo: number;
  movimientosUltimoMes: number;
  valorTotalInventario: number;
  margenPromedio: number;
  rotacionInventario: number;
  timestamp: string;
}

// KPIs financieros - GET /dashboard-cqrs/financial-kpis
export interface FinancialKPIs {
  margenBruto: number;
  margenNeto: number;
  roiInventario: number;
  rotacionInventario: number;
  diasInventario: number;
  capitalTrabajo: number;
  costoAlmacenamiento: number;
  costoOportunidad: number;
  eficienciaOperativa: number;
}

// KPIs de industria - GET /dashboard-cqrs/industry-kpis
export interface IndustryKPIs {
  industria: string;
  configuracion: any;
  kpisDisponibles: string[];
  alertasActivas: string[];
  sensoresConfigurados: string[];
  colores: {
    primary: string;
    secondary: string;
    accent: string;
  };
  metricasPrincipales: {
    totalProductos: number;
    valorInventario: number;
    eficiencia: number;
    alertas: number;
  };
}

// KPIs predictivos - GET /dashboard-cqrs/predictive-kpis
export interface PredictiveKPIs {
  prediccionDemanda: Array<{
    productoId: number;
    nombre: string;
    demandaEstimada: number;
    confianza: number;
  }>;
  prediccionQuiebres: Array<{
    productoId: number;
    nombre: string;
    fechaPrediccion: Date;
    probabilidad: number;
  }>;
  tendenciasVentas: {
    tendencia: 'CRECIENTE' | 'ESTABLE' | 'DECRECIENTE';
    porcentajeCambio: number;
    periodo: string;
  };
  estacionalidad: Array<{
    mes: string;
    factorEstacional: number;
  }>;
}

// Datos completos del dashboard - GET /dashboard-cqrs/data
export interface DashboardData {
  kpis: KPIData;
  financialKpis: FinancialKPIs;
  industryKpis?: IndustryKPIs;
  predictiveKpis?: PredictiveKPIs;
}

// Tipos adicionales para UI mejorada
export interface KPICardData {
  title: string;
  value: string | number;
  icon: any;
  iconColor: string;
  valueColor?: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
  error?: boolean;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TrendData {
  fecha: string;
  ventas: number;
  inventario: number;
}

export interface ProductDetail {
  id: number;
  mes: string;
  producto: string;
  inicio: number;
  movimientos: number;
  final: number;
  estado: 'optimal' | 'warning' | 'critical';
  categoria: string;
  proveedor: string;
}

export interface Recommendation {
  type: 'stockout' | 'low-rotation' | 'reorder' | 'marketing';
  icon: any;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  priority: 'high' | 'medium' | 'low';
}

// Configuración de filtros
export interface KPIFilters {
  periodo: 'mes' | 'trimestre' | 'año';
  industria: string;
  mostrarFinancieros: boolean;
  mostrarPredictivos: boolean;
  categoria?: string;
  proveedor?: string;
  estado?: string;
}

// Estados de carga
export interface LoadingState {
  kpis: boolean;
  financial: boolean;
  industry: boolean;
  predictive: boolean;
}

// Estados de error
export interface ErrorState {
  kpis: string | null;
  financial: string | null;
  industry: string | null;
  predictive: string | null;
} 

// Movimientos diarios - GET /dashboard-cqrs/daily-movements
export interface DailyMovementData {
  fecha: string;
  entradas: number;
  salidas: number;
  neto: number;
  valorEntradas: number;
  valorSalidas: number;
  valorNeto: number;
}

export interface DailyMovementsSummary {
  avgEntradasDiarias: number;
  avgSalidasDiarias: number;
  diaMaxActividad: string;
  totalMovimientos: number;
  tendencia: 'CRECIENTE' | 'DECRECIENTE' | 'ESTABLE';
}

export interface DailyMovementsResponse {
  data: DailyMovementData[];
  summary: DailyMovementsSummary;
  meta: {
    empresaId: number;
    source: string;
    generatedAt: string;
    daysRequested: number;
    totalDays: number;
  };
} 