import { 
  IsInt, 
  Min, 
  IsNotEmpty, 
  IsPositive, 
  Max 
} from 'class-validator';
import { Type } from 'class-transformer';

export class CrearPedidoDto {
  @Type(() => Number)
  @IsInt({ message: 'El ID del producto debe ser un número entero' })
  @IsPositive({ message: 'El ID del producto debe ser un número positivo' })
  @IsNotEmpty({ message: 'El ID del producto es requerido' })
  productoId: number;

  @Type(() => Number)
  @IsInt({ message: 'El ID del proveedor debe ser un número entero' })
  @IsPositive({ message: 'El ID del proveedor debe ser un número positivo' })
  @IsNotEmpty({ message: 'El ID del proveedor es requerido' })
  proveedorId: number;

  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  @Max(999999, { message: 'La cantidad no puede exceder 999,999' })
  @IsNotEmpty({ message: 'La cantidad es requerida' })
  cantidad: number;
}
