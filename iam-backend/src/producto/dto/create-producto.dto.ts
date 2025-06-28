import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoProducto, UnidadMedida } from "@prisma/client";

export class CreateProductoDto {
  @IsString({ message: 'nombre debe ser un texto' })
  @IsNotEmpty({ message: 'nombre es requerido' })
  nombre: string;
  
  @IsOptional()
  @IsString({ message: 'descripcion debe ser un texto' })
  descripcion?: string;
  
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'proveedorId debe ser un número' })
  proveedorId?: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'precioCompra debe ser un número' })
  @Min(0, { message: 'precioCompra no puede ser negativo' })
  precioCompra: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'precioVenta debe ser un número' })
  @Min(0, { message: 'precioVenta no puede ser negativo' })
  precioVenta: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'stock debe ser un número' })
  @Min(0, { message: 'stock no puede ser negativo' })
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'stockMinimo debe ser un número' })
  @Min(0, { message: 'stockMinimo no puede ser negativo' })
  stockMinimo?: number;

  @IsString({ message: 'unidad debe ser un texto' })
  @IsNotEmpty({ message: 'unidad es requerida' })
  @IsEnum(UnidadMedida, {
    message: 'unidad debe ser UNIDAD, KILO, LITRO, CAJA o PAQUETE',
  })
  unidad: UnidadMedida;

  @IsOptional()
  @IsString({ message: 'etiqueta debe ser un texto' })
  etiqueta?: string;

  @IsOptional()
  @IsString({ message: 'codigoBarras debe ser un texto' })
  codigoBarras?: string;

  @IsOptional()
  @IsString({ message: 'rfid debe ser un texto' })
  rfid?: string;

  @IsOptional()
  @IsString({ message: 'ubicacion debe ser un texto' })
  ubicacion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'temperaturaOptima debe ser un número' })
  temperaturaOptima?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'humedadOptima debe ser un número' })
  humedadOptima?: number;


  @IsOptional()
  @IsString({ message: 'sku debe ser un texto' })
  sku?: string;
  
  @IsOptional()
  @IsString({ message: 'talla debe ser un texto' })
  talla?: string;

  @IsOptional()
  @IsString({ message: 'color debe ser un texto' })
  color?: string;

  @IsOptional()
  @IsEnum(TipoProducto, { message: 'categoria debe ser GENERICO, ROPA, ALIMENTO o ELECTRONICO' })
  tipoProducto?: TipoProducto;

}
