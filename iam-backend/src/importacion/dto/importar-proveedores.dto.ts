import {
  IsBoolean,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type, Expose, Transform } from 'class-transformer';

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
  @Expose()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1' || value === 'on';
    }
    return Boolean(value);
  })
  @IsBoolean()
  sobrescribirExistentes: boolean = false;

  @Expose()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1' || value === 'on';
    }
    return Boolean(value);
  })
  @IsBoolean()
  validarSolo: boolean = false;

  @Expose()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1' || value === 'on';
    }
    return Boolean(value);
  })
  @IsBoolean()
  notificarEmail: boolean = false;

  @Expose()
  @IsOptional()
  @IsEmail()
  emailNotificacion?: string;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ConfiguracionEspecificaProveedores)
  @IsObject()
  configuracionEspecifica?: ConfiguracionEspecificaProveedores;

  @IsOptional()
  @IsObject()
  opciones?: any; // Para capturar propiedades adicionales del frontend
} 