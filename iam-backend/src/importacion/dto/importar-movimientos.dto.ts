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
import { Type, Expose, Transform } from 'class-transformer';

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
  @Type(() => ConfiguracionEspecificaMovimientos)
  @IsObject()
  configuracionEspecifica?: ConfiguracionEspecificaMovimientos;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        return {};
      }
    }
    return value || {};
  })
  @IsObject()
  opciones?: any; // Para capturar propiedades adicionales del frontend
} 