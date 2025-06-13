import { IsInt, Min } from 'class-validator';

export class CrearPedidoDto {
  @IsInt()
  productoId: number;

  @IsInt()
  proveedorId: number;

  @IsInt()
  @Min(1)
  cantidad: number;
}
