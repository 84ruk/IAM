import {
  IsBoolean,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  ValidateNested,
  IsObject,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoValidacionMovimiento {
  ESTRICTA = 'estricta',
  FLEXIBLE = 'flexible',
  SOLO_VALIDACION = 'solo_validacion',
}

export class ConfiguracionEspecificaMovimientos {
  @IsOptional()
  @IsEnum(TipoValidacionMovimiento)
  tipoValidacion?: TipoValidacionMovimiento = TipoValidacionMovimiento.ESTRICTA;

  @IsOptional()
  @IsBoolean()
  validarStock?: boolean = true;

  @IsOptional()
  @IsBoolean()
  permitirStockNegativo?: boolean = false;

  @IsOptional()
  @IsBoolean()
  validarFechas?: boolean = true;

  @IsOptional()
  @IsDateString()
  fechaMinima?: string;

  @IsOptional()
  @IsDateString()
  fechaMaxima?: string;

  @IsOptional()
  @IsBoolean()
  crearProductoSiNoExiste?: boolean = false;

  @IsOptional()
  @IsString()
  motivoPorDefecto?: string = 'Importación masiva';

  @IsOptional()
  @IsBoolean()
  actualizarStockEnTiempoReal?: boolean = true;
}

export class ImportarMovimientosDto {
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
  @Type(() => ConfiguracionEspecificaMovimientos)
  @IsObject()
  configuracionEspecifica?: ConfiguracionEspecificaMovimientos;
} 