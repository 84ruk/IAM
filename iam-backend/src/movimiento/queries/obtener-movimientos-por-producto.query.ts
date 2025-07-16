import { IsInt, IsPositive } from 'class-validator';

export class ObtenerMovimientosPorProductoQuery {
  @IsInt()
  @IsPositive()
  productoId: number;
}
