import { IsInt, IsPositive } from 'class-validator';

export class ObtenerMovimientoQuery {
  @IsInt()
  @IsPositive()
  id: number;
}
