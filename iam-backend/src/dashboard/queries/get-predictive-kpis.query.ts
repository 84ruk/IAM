export class GetPredictiveKpisQuery {
  constructor(
    public readonly empresaId: number,
    public readonly days?: number,
    public readonly userRole?: string,
    public readonly forceRefresh?: boolean,
  ) {}
} 