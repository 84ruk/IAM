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

export enum TipoValidacionProducto {
  ESTRICTA = 'estricta',
  FLEXIBLE = 'flexible',
  SOLO_VALIDACION = 'solo_validacion',
}

export class ConfiguracionEspecificaProductos {
  @IsOptional()
  @IsEnum(TipoValidacionProducto)
  tipoValidacion?: TipoValidacionProducto = TipoValidacionProducto.ESTRICTA;

  @IsOptional()
  @IsBoolean()
  validarPrecios?: boolean = true;

  @IsOptional()
  @IsBoolean()
  validarStock?: boolean = true;

  @IsOptional()
  @IsBoolean()
  generarSKUAutomatico?: boolean = false;

  @IsOptional()
  @IsString()
  prefijoSKU?: string = 'PROD';

  @IsOptional()
  @IsBoolean()
  crearProveedorSiNoExiste?: boolean = false;
}

export class ImportarProductosDto {
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
  @Type(() => ConfiguracionEspecificaProductos)
  @IsObject()
  configuracionEspecifica?: ConfiguracionEspecificaProductos;
} 