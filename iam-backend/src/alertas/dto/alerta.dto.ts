import { IsString, IsNumber, IsOptional, IsArray, IsEnum } from 'class-validator';
import { SeveridadAlerta } from '@prisma/client';

export class CrearAlertaDto {
  @IsString()
  tipo: string;

  @IsEnum(SeveridadAlerta)
  severidad: SeveridadAlerta;

  @IsString()
  titulo: string;

  @IsString()
  mensaje: string;

  @IsOptional()
  @IsNumber()
  valor?: number;

  @IsOptional()
  @IsNumber()
  sensorId?: number;

  @IsOptional()
  @IsNumber()
  ubicacionId?: number;

  @IsOptional()
  @IsNumber()
  productoId?: number;

  @IsOptional()
  @IsArray()
  destinatarios?: string[];
}

export class ActualizarAlertaDto {
  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  mensaje?: string;

  @IsOptional()
  @IsArray()
  destinatarios?: string[];
}

export class ConfiguracionAlertaDto {
  @IsString()
  tipoAlerta: string;

  @IsNumber()
  umbralMinimo?: number;

  @IsNumber()
  umbralMaximo?: number;

  @IsNumber()
  umbralCriticoMinimo?: number;

  @IsNumber()
  umbralCriticoMaximo?: number;

  @IsNumber()
  ventanaEsperaMinutos?: number;

  @IsArray()
  destinatarios: number[];
}
