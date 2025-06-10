import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateMovimientoDto {
  @IsEnum(['ENTRADA', 'SALIDA'])
  tipo: 'ENTRADA' | 'SALIDA';

  @IsInt()
  cantidad: number;

  @IsInt()
  productoId: number;

  @IsOptional()
  @IsString()
  motivo?: string;
}
