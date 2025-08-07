import { IsOptional, IsNumber, IsString, IsBoolean, IsArray, Min, Max } from 'class-validator';

export class UmbralAlertaDto {
  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(100)
  temperaturaMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(100)
  temperaturaMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  humedadMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  humedadMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pesoMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pesoMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  presionMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  presionMax?: number;
}

export class ConfigurarAlertaDto {
  @IsString()
  tipoAlerta: string;

  @IsNumber()
  ubicacionId: number;

  @IsOptional()
  @IsNumber()
  sensorId?: number;

  @IsOptional()
  @IsNumber()
  productoId?: number;

  @IsBoolean()
  activo: boolean = true;

  @IsArray()
  @IsString({ each: true })
  destinatarios: string[] = [];

  @IsArray()
  @IsString({ each: true })
  destinatariosSMS: string[] = [];

  @IsString()
  frecuencia: string = 'INMEDIATA'; // INMEDIATA, DIARIA, SEMANAL

  @IsOptional()
  @IsNumber()
  ventanaEsperaMinutos?: number;

  @IsOptional()
  umbralCritico?: UmbralAlertaDto;

  @IsOptional()
  @IsString()
  mensajePersonalizado?: string;

  @IsOptional()
  @IsString()
  mensajeSMS?: string;

  @IsOptional()
  @IsBoolean()
  enviarSMS?: boolean = false;

  @IsOptional()
  @IsString()
  prioridadSMS?: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
}

export class CrearAlertaDto {
  @IsString()
  tipo: string;

  @IsString()
  mensaje: string;

  @IsString()
  nivel: string; // BAJA, MEDIA, ALTA, CRITICA

  @IsNumber()
  empresaId: number;

  @IsOptional()
  @IsNumber()
  ubicacionId?: number;

  @IsOptional()
  @IsNumber()
  sensorId?: number;

  @IsOptional()
  @IsNumber()
  productoId?: number;

  @IsOptional()
  configuracion?: Record<string, any>;
}

export interface AlertaConfigurada {
  id: number;
  tipoAlerta: string;
  ubicacionId: number;
  sensorId?: number;
  productoId?: number;
  activo: boolean;
  destinatarios: string[];
  frecuencia: string;
  ventanaEsperaMinutos?: number;
  umbralCritico?: UmbralAlertaDto;
  mensajePersonalizado?: string;
  empresaId: number;
  createdAt: Date;
  updatedAt: Date;
} 