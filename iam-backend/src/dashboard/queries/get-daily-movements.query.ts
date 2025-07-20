export class GetDailyMovementsQuery {
  constructor(
    public readonly empresaId: number,
    public readonly userRole?: string,
    public readonly days?: number,
    public readonly forceRefresh?: boolean,
  ) {}
} 