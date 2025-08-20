import { IsBoolean, IsString, IsOptional, IsArray } from 'class-validator';

export class ConfiguracionNotificacionDto {
  @IsBoolean()
  email: boolean;

  @IsBoolean()
  sms: boolean;

  @IsBoolean()
  webSocket: boolean;

  @IsBoolean()
  @IsOptional()
  push?: boolean;
}

export class DestinatarioAlertaDto {
  @IsString()
  nombre: string;

  @IsString()
  email: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  tipo: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
}

export class ConfiguracionCompletaAlertaDto {
  @IsBoolean()
  activo: boolean;

  configuracionNotificacion: ConfiguracionNotificacionDto;

  @IsArray()
  destinatarios: DestinatarioAlertaDto[];
}
