import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum DateRange {
  ONE_DAY = '1d',
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NINETY_DAYS = '90d',
  ONE_YEAR = '1y',
}

export class DashboardStatsQueryDto {
  @IsOptional()
  @IsEnum(DateRange)
  @Transform(({ value }) => value || DateRange.THIRTY_DAYS)
  range?: DateRange = DateRange.THIRTY_DAYS;
}

export class DashboardStatsResponseDto {
  overview: {
    totalUsers: number;
    totalEmpresas: number;
    activeUsers: number;
    inactiveUsers: number;
    activePercentage: number;
    totalProductos: number;
    totalMovimientos: number;
  };
  usersByRole: Array<{
    rol: string;
    count: number;
    label: string;
  }>;
  empresasByIndustry: Array<{
    industry: string;
    count: number;
  }>;
  recentUsers: Array<{
    id: number;
    nombre: string;
    email: string;
    rol: string;
    createdAt: string;
    empresa: {
      id: number;
      nombre: string;
    };
  }>;
  recentEmpresas: Array<{
    id: number;
    nombre: string;
    TipoIndustria: string;
    fechaCreacion: string;
  }>;
  systemHealth: {
    status: 'healthy' | 'warning' | 'error';
    message: string;
    uptime: string;
    lastBackup: string;
  };
}
