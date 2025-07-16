import {
  IsEnum,
  IsInt,
  Min,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { TipoMovimiento } from '@prisma/client';
import { Type } from 'class-transformer';

export class CrearMovimientoPorCodigoBarrasDto {
  @IsEnum(TipoMovimiento, {
    message: 'tipo debe ser ENTRADA o SALIDA',
  })
  tipo: TipoMovimiento;

  @Type(() => Number)
  @IsInt({ message: 'cantidad debe ser un número entero' })
  @Min(1, { message: 'cantidad debe ser al menos 1' })
  cantidad: number;

  @IsString({ message: 'codigoBarras debe ser un texto' })
  @IsNotEmpty({ message: 'codigoBarras es requerido' })
  codigoBarras: string;

  @IsOptional()
  @IsString({ message: 'motivo debe ser un texto' })
  motivo?: string;

  @IsOptional()
  @IsString({ message: 'descripcion debe ser un texto' })
  descripcion?: string;
}
