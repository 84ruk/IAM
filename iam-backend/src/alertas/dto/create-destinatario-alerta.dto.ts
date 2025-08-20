import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { TipoDestinatarioAlerta } from '@prisma/client';

export class CreateDestinatarioAlertaDto {
  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsEnum(TipoDestinatarioAlerta)
  tipo: TipoDestinatarioAlerta; // 'EMAIL' | 'SMS' | 'AMBOS'

  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;
}
