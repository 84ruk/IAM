export class GetFinancialKpisCommand {
  constructor(
    public readonly empresaId: number,
    public readonly userRole?: string,
    public readonly period?: string,
    public readonly forceRefresh?: boolean,
  ) {}
} 