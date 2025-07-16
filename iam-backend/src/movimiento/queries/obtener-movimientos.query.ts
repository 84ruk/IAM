import { IsEnum, IsOptional } from 'class-validator';
import { TipoMovimiento } from '@prisma/client';

export class ObtenerMovimientosQuery {
  @IsOptional()
  @IsEnum(TipoMovimiento)
  tipo?: TipoMovimiento;
}
