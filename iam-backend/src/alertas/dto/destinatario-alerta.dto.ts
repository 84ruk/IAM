import { IsString, IsEnum, IsOptional, IsEmail } from 'class-validator';
import { TipoDestinatarioAlerta } from '../enums/tipo-destinatario.enum';

export class DestinatarioAlertaDto {
  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsEnum(TipoDestinatarioAlerta)
  tipo: TipoDestinatarioAlerta;
}
