import { IsOptional, IsString, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { Rol } from '@prisma/client';

export class QueryUsersDto {
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser un texto' })
  search?: string;

  @IsOptional()
  @IsEnum(Rol, { message: 'El rol debe ser válido' })
  rol?: Rol;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  activo?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'La página debe ser un número' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  @Max(100, { message: 'El límite no puede exceder 100' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'El orden debe ser un texto' })
  orderBy?: string = 'createdAt';

  @IsOptional()
  @IsString({ message: 'La dirección del orden debe ser un texto' })
  orderDirection?: 'asc' | 'desc' = 'desc';
} 