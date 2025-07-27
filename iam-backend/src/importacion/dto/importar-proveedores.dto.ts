import {
  IsBoolean,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type, Expose } from 'class-transformer';

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
  @IsBoolean()
  sobrescribirExistentes: boolean = false;

  @Expose()
  @IsBoolean()
  validarSolo: boolean = false;

  @Expose()
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

  // Transformar strings a booleanos si es necesario
  constructor() {
    // Asegurar que los campos booleanos sean booleanos reales
    if (typeof this.sobrescribirExistentes === 'string') {
      this.sobrescribirExistentes = this.sobrescribirExistentes === 'true';
    }
    if (typeof this.validarSolo === 'string') {
      this.validarSolo = this.validarSolo === 'true';
    }
    if (typeof this.notificarEmail === 'string') {
      this.notificarEmail = this.notificarEmail === 'true';
    }
  }
} 