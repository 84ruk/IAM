export interface DailyMovementData {
  fecha: string;
  entradas: number;
  salidas: number;
  neto: number;
  valorEntradas: number;
  valorSalidas: number;
  valorNeto: number;
  // ✅ NUEVO: Información adicional para gráficas
  movimientosDetallados?: MovementDetail[];
  productosUnicos: number;
  proveedoresUnicos: number;
  margenPromedio: number;
  stockBajoCount: number;
}

export interface MovementDetail {
  productoId: number;
  productoNombre: string;
  tipoProducto: string;
  proveedorNombre?: string;
  cantidad: number;
  valor: number;
  motivo?: string;
  margen: number;
}

export interface DailyMovementsSummary {
  avgEntradasDiarias: number;
  avgSalidasDiarias: number;
  diaMaxActividad: string;
  totalMovimientos: number;
  tendencia: 'CRECIENTE' | 'DECRECIENTE' | 'ESTABLE';
  // ✅ NUEVO: Métricas adicionales
  valorTotalInventario: number;
  margenBrutoPromedio: number;
  productosMasVendidos: TopProduct[];
  proveedoresPrincipales: TopSupplier[];
  alertasStock: StockAlert[];
  distribucionPorTipo: TypeDistribution[];
}

export interface TopProduct {
  productoId: number;
  nombre: string;
  cantidadTotal: number;
  valorTotal: number;
  porcentaje: number;
}

export interface TopSupplier {
  proveedorId: number;
  nombre: string;
  cantidadTotal: number;
  valorTotal: number;
  porcentaje: number;
}

export interface StockAlert {
  productoId: number;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  diasRestantes: number;
  severidad: 'CRITICA' | 'ADVERTENCIA' | 'INFO';
}

export interface TypeDistribution {
  tipo: string;
  cantidad: number;
  valor: number;
  porcentaje: number;
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
    // ✅ NUEVO: Metadatos adicionales
    totalProductos: number;
    totalProveedores: number;
    rangoFechas: {
      inicio: string;
      fin: string;
    };
    filtrosAplicados?: any;
  };
} 