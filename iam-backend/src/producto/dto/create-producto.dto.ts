import { UnidadMedida } from '@prisma/client';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateProductoDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber()
  precio: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsNumber()
  empresaId: number;

  @IsEnum(UnidadMedida)
  unidad: UnidadMedida;
  
}
