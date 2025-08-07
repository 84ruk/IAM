import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateUbicacionDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la ubicación es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  descripcion?: string;
} 