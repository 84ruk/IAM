import { IsArray, IsBoolean, IsEmail, IsEnum, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class HorarioBlackoutDto {
  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;

  @IsArray()
  @IsNumber({}, { each: true })
  diasSemana: number[];
}

export class ConfiguracionSistemaAlertasDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNumber()
  empresaId: number;

  @IsBoolean()
  sistemaActivado: boolean;

  @IsBoolean()
  modoDebug: boolean;

  @IsBoolean()
  escalamientoAutomatico: boolean;

  @IsNumber()
  tiempoEscalamientoMinutos: number;

  @IsNumber()
  maximoNivelEscalamiento: number;

  @IsArray()
  @IsEnum(['EMAIL', 'SMS', 'WEBSOCKET', 'PUSH'], { each: true })
  canalesHabilitados: Array<'EMAIL' | 'SMS' | 'WEBSOCKET' | 'PUSH'>;

  @IsArray()
  @IsEmail({}, { each: true })
  destinatariosPrincipales: string[];

  @IsArray()
  @IsEmail({}, { each: true })
  destinatariosSupervisores: string[];

  @IsArray()
  @IsEmail({}, { each: true })
  destinatariosAdministradores: string[];

  @IsString()
  plantillaEmailNormal: string;

  @IsString()
  plantillaEmailCritica: string;

  @IsString()
  plantillaSMSNormal: string;

  @IsString()
  plantillaSMSCritica: string;

  @IsNumber()
  maximoReintentos: number;

  @IsNumber()
  intervaloReintentosMinutos: number;

  @IsObject()
  @ValidateNested()
  @Type(() => HorarioBlackoutDto)
  horarioBlackout: HorarioBlackoutDto;

  @IsBoolean()
  agruparAlertas: boolean;

  @IsNumber()
  ventanaAgrupacionMinutos: number;

  @IsOptional()
  umbralCritico?: Record<string, any>;

  @IsOptional()
  configuracionNotificacion?: Record<string, any>;
}
