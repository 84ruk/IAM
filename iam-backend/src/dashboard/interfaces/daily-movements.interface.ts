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