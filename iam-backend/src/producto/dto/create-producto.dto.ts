import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsOptional()
  @IsString()
  descripcion?: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioCompra: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioVenta: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockMinimo?: number

  @IsString()
  @IsNotEmpty()
  @IsEnum(['UNIDAD', 'KILO', 'LITRO', 'CAJA', 'PAQUETE'])
  unidad: string

  @IsOptional()
  @IsString()
  categoria?: string

  @IsOptional()
  @IsString()
  codigoBarras?: string

  @IsOptional()
  @IsString()
  rfid?: string

  @IsOptional()
  @IsString()
  ubicacion?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  temperaturaOptima?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  humedadOptima?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  proveedorId?: number
}
