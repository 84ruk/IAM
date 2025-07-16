import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsArray,
  MaxLength,
  MinLength,
  Matches,
  ValidateIf,
  IsPositive,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoProducto, UnidadMedida } from '@prisma/client';

// Validador personalizado para campos específicos de industria
export class IndustriaValidator {
  static validateTemperatura(value: number, tipoIndustria: string): boolean {
    switch (tipoIndustria) {
      case 'ALIMENTOS':
        return value >= -10 && value <= 50;
      case 'FARMACIA':
        return value >= 2 && value <= 25;
      default:
        return value >= -50 && value <= 100;
    }
  }

  static validateHumedad(value: number, tipoIndustria: string): boolean {
    switch (tipoIndustria) {
      case 'FARMACIA':
        return value >= 30 && value <= 70;
      default:
        return value >= 0 && value <= 100;
    }
  }

  static validateTalla(value: string): boolean {
    const tallasValidas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    return tallasValidas.includes(value.toUpperCase());
  }

  static validateColor(value: string): boolean {
    const coloresValidos = [
      'Negro',
      'Blanco',
      'Rojo',
      'Azul',
      'Verde',
      'Amarillo',
      'Gris',
      'Marrón',
    ];
    return coloresValidos.includes(value);
  }
}

export class CreateProductoDto {
  @IsString({ message: 'nombre debe ser un texto' })
  @IsNotEmpty({ message: 'nombre es requerido' })
  @MinLength(2, { message: 'nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'nombre no puede exceder 100 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()]+$/, {
    message: 'nombre contiene caracteres no permitidos',
  })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'descripcion debe ser un texto' })
  @MaxLength(500, { message: 'descripcion no puede exceder 500 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()!?]+$/, {
    message: 'descripcion contiene caracteres no permitidos',
  })
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'proveedorId debe ser un número' })
  @IsPositive({ message: 'proveedorId debe ser un número positivo' })
  proveedorId?: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'precioCompra debe ser un número' })
  @Min(0, { message: 'precioCompra no puede ser negativo' })
  @Max(999999.99, { message: 'precioCompra no puede exceder 999,999.99' })
  precioCompra: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'precioVenta debe ser un número' })
  @Min(0, { message: 'precioVenta no puede ser negativo' })
  @Max(999999.99, { message: 'precioVenta no puede exceder 999,999.99' })
  precioVenta: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'stock debe ser un número' })
  @Min(0, { message: 'stock no puede ser negativo' })
  @Max(999999, { message: 'stock no puede exceder 999,999' })
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'stockMinimo debe ser un número' })
  @Min(0, { message: 'stockMinimo no puede ser negativo' })
  @Max(999999, { message: 'stockMinimo no puede exceder 999,999' })
  stockMinimo?: number;

  @IsString({ message: 'unidad debe ser un texto' })
  @IsNotEmpty({ message: 'unidad es requerida' })
  @IsEnum(UnidadMedida, {
    message: 'unidad debe ser UNIDAD, KILO, LITRO, CAJA o PAQUETE',
  })
  unidad: UnidadMedida;

  @IsOptional()
  @IsArray({ message: 'etiquetas debe ser un array' })
  @IsString({ each: true, message: 'cada etiqueta debe ser un texto' })
  @MaxLength(10, {
    each: true,
    message: 'cada etiqueta no puede exceder 10 caracteres',
  })
  @MinLength(1, {
    each: true,
    message: 'cada etiqueta debe tener al menos 1 carácter',
  })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]+$/, {
    each: true,
    message: 'etiquetas contienen caracteres no permitidos',
  })
  etiquetas?: string[];

  @IsOptional()
  @IsString({ message: 'codigoBarras debe ser un texto' })
  @MaxLength(50, { message: 'codigoBarras no puede exceder 50 caracteres' })
  @Matches(/^[0-9\-_]+$/, {
    message:
      'codigoBarras solo puede contener números, guiones y guiones bajos',
  })
  codigoBarras?: string;

  @IsOptional()
  @IsString({ message: 'rfid debe ser un texto' })
  @MaxLength(50, { message: 'rfid no puede exceder 50 caracteres' })
  @Matches(/^[a-zA-Z0-9\-_]+$/, {
    message:
      'rfid solo puede contener letras, números, guiones y guiones bajos',
  })
  rfid?: string;

  @IsOptional()
  @IsString({ message: 'ubicacion debe ser un texto' })
  @MaxLength(100, { message: 'ubicacion no puede exceder 100 caracteres' })
  @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()]+$/, {
    message: 'ubicacion contiene caracteres no permitidos',
  })
  ubicacion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'temperaturaOptima debe ser un número' })
  @ValidateIf((o) => o.temperaturaOptima !== undefined)
  @Min(-50, { message: 'temperaturaOptima no puede ser menor a -50°C' })
  @Max(100, { message: 'temperaturaOptima no puede ser mayor a 100°C' })
  temperaturaOptima?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'humedadOptima debe ser un número' })
  @ValidateIf((o) => o.humedadOptima !== undefined)
  @Min(0, { message: 'humedadOptima no puede ser menor a 0%' })
  @Max(100, { message: 'humedadOptima no puede ser mayor a 100%' })
  humedadOptima?: number;

  @IsOptional()
  @IsString({ message: 'sku debe ser un texto' })
  @MaxLength(50, { message: 'sku no puede exceder 50 caracteres' })
  @Matches(/^[a-zA-Z0-9\-_]+$/, {
    message: 'sku solo puede contener letras, números, guiones y guiones bajos',
  })
  sku?: string;

  @IsOptional()
  @IsString({ message: 'talla debe ser un texto' })
  @MaxLength(10, { message: 'talla no puede exceder 10 caracteres' })
  @ValidateIf((o) => o.talla !== undefined)
  talla?: string;

  @IsOptional()
  @IsString({ message: 'color debe ser un texto' })
  @MaxLength(20, { message: 'color no puede exceder 20 caracteres' })
  @ValidateIf((o) => o.color !== undefined)
  color?: string;

  @IsOptional()
  @IsEnum(TipoProducto, {
    message: 'tipoProducto debe ser GENERICO, ROPA, ALIMENTO o ELECTRONICO',
  })
  tipoProducto?: TipoProducto;

  // Validaciones de negocio
  @ValidateIf(
    (o) => o.precioVenta !== undefined && o.precioCompra !== undefined,
  )
  @IsNumber({}, { message: 'precioVenta debe ser mayor al precio de compra' })
  @Min(0, { message: 'precioVenta debe ser mayor al precio de compra' })
  get precioVentaValidado(): number {
    return this.precioVenta >= this.precioCompra ? this.precioVenta : 0;
  }
}
