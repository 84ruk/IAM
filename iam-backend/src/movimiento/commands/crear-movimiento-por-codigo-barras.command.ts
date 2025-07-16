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

export class CrearMovimientoPorCodigoBarrasCommand {
  @IsEnum(TipoMovimiento)
  @IsNotEmpty()
  tipo: TipoMovimiento;

  @IsInt()
  @IsPositive()
  cantidad: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  codigoBarras: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;
}
