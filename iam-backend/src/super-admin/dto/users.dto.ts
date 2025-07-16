import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  EMPLEADO = 'EMPLEADO',
  PROVEEDOR = 'PROVEEDOR',
}

export enum UserStatus {
  ACTIVE = 'true',
  INACTIVE = 'false',
}

export class GetUsersQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  empresaId?: number;
}

export class BulkUserActionDto {
  @IsArray()
  @IsNumber({}, { each: true })
  userIds: number[];
}

export class UserResponseDto {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  createdAt: string;
  empresa?: {
    id: number;
    nombre: string;
    TipoIndustria: string;
  };
}

export class UsersPaginatedResponseDto {
  users: UserResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
