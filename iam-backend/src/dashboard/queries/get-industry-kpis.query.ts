export class GetIndustryKpisQuery {
  constructor(
    public readonly empresaId: number,
    public readonly industry?: string,
    public readonly userRole?: string,
    public readonly forceRefresh?: boolean,
  ) {}
} 