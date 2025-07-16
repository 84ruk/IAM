import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DateRange } from './dashboard-stats.dto';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  VIEW = 'VIEW',
}

export enum AuditResource {
  USER = 'USER',
  EMPRESA = 'EMPRESA',
  PRODUCTO = 'PRODUCTO',
  AUTH = 'AUTH',
}

export class GetAuditLogsQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsEnum(DateRange)
  @Transform(({ value }) => value || DateRange.SEVEN_DAYS)
  range?: DateRange = DateRange.SEVEN_DAYS;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsEnum(AuditResource)
  resource?: AuditResource;

  @IsOptional()
  @IsString()
  user?: string;
}

export class AuditLogResponseDto {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: number;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  empresaId?: number;
  empresaName?: string;
}

export class AuditStatsResponseDto {
  totalLogs: number;
  logsToday: number;
  logsThisWeek: number;
  logsThisMonth: number;
  topActions: Array<{
    action: string;
    count: number;
    percentage: number;
  }>;
  topUsers: Array<{
    userId: number;
    userName: string;
    userEmail: string;
    actionCount: number;
  }>;
  topResources: Array<{
    resource: string;
    count: number;
    percentage: number;
  }>;
}

export class AuditLogsPaginatedResponseDto {
  logs: AuditLogResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
