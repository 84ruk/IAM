import {
  IsEnum,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsPositive,
} from 'class-validator';
import { TipoMovimiento } from '@prisma/client';
import { Type } from 'class-transformer';

export class CrearMovimientoDto {
  @IsEnum(TipoMovimiento, {
    message: 'tipo debe ser ENTRADA o SALIDA',
  })
  tipo: TipoMovimiento;

  @Type(() => Number)
  @IsInt({ message: 'cantidad debe ser un número entero' })
  @Min(1, { message: 'cantidad debe ser al menos 1' })
  @Max(999999, { message: 'cantidad no puede exceder 999,999' })
  cantidad: number;

  @Type(() => Number)
  @IsInt({ message: 'productoId debe ser un número entero' })
  @IsPositive({ message: 'productoId debe ser un número positivo' })
  productoId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'proveedorId debe ser un número entero' })
  @IsPositive({ message: 'proveedorId debe ser un número positivo' })
  proveedorId?: number;

  @IsOptional()
  @IsString({ message: 'motivo debe ser un texto' })
  @MinLength(3, { message: 'motivo debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'motivo no puede exceder 200 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()!?]+$/, { 
    message: 'motivo contiene caracteres no permitidos' 
  })
  motivo?: string;

  @IsOptional()
  @IsString({ message: 'descripcion debe ser un texto' })
  @MaxLength(500, { message: 'descripcion no puede exceder 500 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()!?]+$/, { 
    message: 'descripcion contiene caracteres no permitidos' 
  })
  descripcion?: string;
}
