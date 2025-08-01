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
  IsNumber,
} from 'class-validator';
import { TipoMovimiento, TipoPrecioMovimiento } from '@prisma/client';
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

  // ✅ NUEVO: Campos de precio para tracking financiero
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'precioUnitario debe ser un número válido' })
  @Min(0, { message: 'precioUnitario no puede ser negativo' })
  @Max(999999.99, { message: 'precioUnitario no puede exceder 999,999.99' })
  precioUnitario?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'precioTotal debe ser un número válido' })
  @Min(0, { message: 'precioTotal no puede ser negativo' })
  @Max(999999999.99, { message: 'precioTotal no puede exceder 999,999,999.99' })
  precioTotal?: number;

  @IsOptional()
  @IsEnum(TipoPrecioMovimiento, {
    message: 'tipoPrecio debe ser COMPRA, VENTA, AJUSTE o TRANSFERENCIA',
  })
  tipoPrecio?: TipoPrecioMovimiento;

  @IsOptional()
  @IsString({ message: 'motivo debe ser un texto' })
  @MinLength(3, { message: 'motivo debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'motivo no puede exceder 200 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()!?]+$/, {
    message: 'motivo contiene caracteres no permitidos',
  })
  motivo?: string;

  @IsOptional()
  @IsString({ message: 'descripcion debe ser un texto' })
  @MaxLength(500, { message: 'descripcion no puede exceder 500 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()!?]+$/, {
    message: 'descripcion contiene caracteres no permitidos',
  })
  descripcion?: string;
}
