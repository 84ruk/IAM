import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { TipoMovimiento, TipoPrecioMovimiento } from '@prisma/client';

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

  // ✅ NUEVO: Campos de precio para tracking financiero
  @IsOptional()
  @IsNumber({}, { message: 'precioUnitario debe ser un número válido' })
  @Min(0, { message: 'precioUnitario no puede ser negativo' })
  @Max(999999.99, { message: 'precioUnitario no puede exceder 999,999.99' })
  precioUnitario?: number;

  @IsOptional()
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
