import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { TipoMovimiento } from '@prisma/client';

export class CrearMovimientoCommand {
  @IsEnum(TipoMovimiento)
  @IsNotEmpty()
  tipo: TipoMovimiento;

  @IsInt()
  @IsPositive()
  cantidad: number;

  @IsInt()
  @IsPositive()
  productoId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  proveedorId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @IsOptional()
  @IsString()
  fecha?: string;
}
