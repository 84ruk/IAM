import { IsString, IsNumber, IsOptional, IsBoolean, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class NotificacionConfigDto {
  @IsBoolean()
  email: boolean;

  @IsBoolean()
  sms: boolean;

  @IsBoolean()
  webSocket: boolean;

  @IsOptional()
  @IsBoolean()
  push?: boolean;

  @IsOptional()
  @IsString()
  mensajeSMS?: string;

  @IsOptional()
  @IsString()
  mensajeEmail?: string;

  @IsOptional()
  @IsString()
  mensajeWebSocket?: string;

  @IsOptional()
  @IsString()
  mensajePush?: string;
}

export class UmbralCriticoDto {
  @IsOptional()
  @IsBoolean()
  enviarSMS?: boolean;

  @IsOptional()
  @IsString()
  mensajeSMS?: string;

  @IsOptional()
  @IsBoolean()
  enviarEmail?: boolean;

  @IsOptional()
  @IsString()
  mensajeEmail?: string;

  @IsOptional()
  @IsBoolean()
  enviarWebSocket?: boolean;

  @IsOptional()
  @IsString()
  mensajeWebSocket?: string;

  @IsOptional()
  @IsBoolean()
  enviarPush?: boolean;

  @IsOptional()
  @IsString()
  mensajePush?: string;

  @IsOptional()
  @IsNumber()
  temperaturaMin?: number;

  @IsOptional()
  @IsNumber()
  temperaturaMax?: number;

  @IsOptional()
  @IsNumber()
  humedadMin?: number;

  @IsOptional()
  @IsNumber()
  humedadMax?: number;

  @IsOptional()
  @IsNumber()
  presionMin?: number;

  @IsOptional()
  @IsNumber()
  presionMax?: number;
}

import { TipoDestinatarioAlerta } from '@prisma/client';

export class DestinatarioDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  nombre: string;

  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsEnum(TipoDestinatarioAlerta)
  tipo: TipoDestinatarioAlerta;

  @IsNumber()
  configuracionAlertaId: number;
}

export class ConfiguracionAlertaDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNumber()
  sensorId: number;

  @IsNumber()
  empresaId: number;

  @IsString()
  tipoAlerta: string;

  @IsBoolean()
  activo: boolean;

  @IsString()
  frecuencia: string;

  @IsOptional()
  @IsNumber()
  ventanaEsperaMinutos?: number;

  @IsOptional()
  umbral?: Record<string, any>;

  @IsOptional()
  notificacion?: Record<string, any>;

  @ValidateNested()
  @Type(() => UmbralCriticoDto)
  umbralCritico: UmbralCriticoDto;

  @ValidateNested()
  @Type(() => NotificacionConfigDto)
  configNotificacion: NotificacionConfigDto;

  @ValidateNested({ each: true })
  @Type(() => DestinatarioDto)
  destinatarios: DestinatarioDto[];
}
