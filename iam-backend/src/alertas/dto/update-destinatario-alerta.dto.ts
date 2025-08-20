import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { TipoDestinatarioAlerta } from '@prisma/client';

export class UpdateDestinatarioAlertaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEnum(TipoDestinatarioAlerta)
  tipo?: TipoDestinatarioAlerta;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
