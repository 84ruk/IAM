import {
  IsBoolean,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoValidacionProveedor {
  ESTRICTA = 'estricta',
  FLEXIBLE = 'flexible',
  SOLO_VALIDACION = 'solo_validacion',
}

export class ConfiguracionEspecificaProveedores {
  @IsOptional()
  @IsEnum(TipoValidacionProveedor)
  tipoValidacion?: TipoValidacionProveedor = TipoValidacionProveedor.ESTRICTA;

  @IsOptional()
  @IsBoolean()
  validarEmail?: boolean = true;

  @IsOptional()
  @IsBoolean()
  validarTelefono?: boolean = false;

  @IsOptional()
  @IsBoolean()
  normalizarTelefonos?: boolean = true;

  @IsOptional()
  @IsString()
  formatoTelefono?: string = 'MX'; // MX, US, etc.
}

export class ImportarProveedoresDto {
  @IsBoolean()
  sobrescribirExistentes: boolean = false;

  @IsBoolean()
  validarSolo: boolean = false;

  @IsBoolean()
  notificarEmail: boolean = false;

  @IsOptional()
  @IsEmail()
  emailNotificacion?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConfiguracionEspecificaProveedores)
  @IsObject()
  configuracionEspecifica?: ConfiguracionEspecificaProveedores;
} 