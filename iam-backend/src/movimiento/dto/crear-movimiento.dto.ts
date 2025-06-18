import { Type } from 'class-transformer';
import { IsInt, IsEnum, Min, IsOptional, IsString, IsNumber } from 'class-validator';

export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
}

export class CrearMovimientoDto {
  
  @IsInt()
  productoId: number;

  @IsEnum(TipoMovimiento)
  tipo: TipoMovimiento;

  @IsInt()
  @Min(1)
  cantidad: number;

  @Type(() => Number)
  @IsNumber()
  empresaId: number;

  @IsOptional()
  @IsString()
  motivo?: string;
}
