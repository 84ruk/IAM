export class GetKpisQuery {
  constructor(
    public readonly empresaId: number,
    public readonly userRole?: string,
    public readonly forceRefresh?: boolean,
  ) {}
} 