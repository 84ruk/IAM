import { IsInt, IsEnum, Min, IsOptional, IsString } from 'class-validator';

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

  @IsOptional()
  @IsString()
  motivo?: string;
}
