import { IsBoolean, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolverErroresDto {
  @ApiProperty({
    description: 'Corregir automáticamente errores de formato',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  autoCorregir?: boolean;

  @ApiProperty({
    description: 'Usar valores por defecto para campos vacíos',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  usarValoresPorDefecto?: boolean;

  @ApiProperty({
    description: 'Nivel mínimo de confianza para correcciones automáticas (0-100)',
    example: 70,
    minimum: 0,
    maximum: 100,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  nivelConfianzaMinimo?: number;

  @ApiProperty({
    description: 'Tipo de corrección a aplicar',
    example: 'formato',
    required: false
  })
  @IsOptional()
  @IsString()
  tipoCorreccion?: string;

  @ApiProperty({
    description: 'Valores por defecto personalizados',
    example: { categoria: 'General', estado: 'Activo' },
    required: false
  })
  @IsOptional()
  valoresPorDefecto?: Record<string, any>;
} 