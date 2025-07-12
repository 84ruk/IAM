import { IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { DateRange } from './dashboard-stats.dto';

export class GetStatsQueryDto {
  @IsOptional()
  @IsEnum(DateRange)
  @Transform(({ value }) => value || DateRange.THIRTY_DAYS)
  range?: DateRange = DateRange.THIRTY_DAYS;
}

export class SystemStatsResponseDto {
  overview: {
    totalUsers: number;
    totalEmpresas: number;
    totalProductos: number;
    totalMovimientos: number;
    activeUsers: number;
    inactiveUsers: number;
    activePercentage: number;
  };
  growth: {
    usersGrowth: number;
    empresasGrowth: number;
    productosGrowth: number;
    movimientosGrowth: number;
  };
  usersByRole: Array<{
    rol: string;
    count: number;
    label: string;
    percentage: number;
  }>;
  empresasByIndustry: Array<{
    industry: string;
    count: number;
    percentage: number;
  }>;
  activityByMonth: Array<{
    month: string;
    users: number;
    empresas: number;
    productos: number;
    movimientos: number;
  }>;
  topEmpresas: Array<{
    id: number;
    nombre: string;
    TipoIndustria: string;
    totalUsers: number;
    totalProductos: number;
    totalMovimientos: number;
  }>;
  systemMetrics: {
    uptime: string;
    responseTime: string;
    errorRate: string;
    lastBackup: string;
    storageUsed: string;
    storageTotal: string;
  };
} 