import { IsString, IsEnum, IsOptional, IsNotEmpty, ValidateIf } from 'class-validator';
import { TipoIndustria } from '@prisma/client';

export class SetupEmpresaDto {
  @IsString()
  @IsNotEmpty()
  nombreEmpresa: string;

  @IsEnum(TipoIndustria)
  tipoIndustria: TipoIndustria;

  @ValidateIf((o) => o.rfc !== undefined && o.rfc !== null && o.rfc.trim() !== '')
  @IsString()
  @IsNotEmpty({ message: 'El RFC no puede estar vacío si se proporciona' })
  rfc?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  telefono?: string;
} 