import {
  IsBoolean,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Expose, Exclude, Transform } from 'class-transformer';
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
  @IsString()
  configuracionEspecifica?: string;

  @IsOptional()
  @IsObject()
  opciones?: any; // Para capturar propiedades adicionales del frontend

  // Método para parsear la configuración específica
  getConfiguracionEspecifica(): ConfiguracionEspecificaProductos | undefined {
    if (!this.configuracionEspecifica) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(this.configuracionEspecifica);
      return {
        tipoValidacion: parsed.tipoValidacion || TipoValidacionProducto.ESTRICTA,
        validarPrecios: parsed.validarPrecios ?? true,
        validarStock: parsed.validarStock ?? true,
        generarSKUAutomatico: parsed.generarSKUAutomatico ?? false,
        prefijoSKU: parsed.prefijoSKU || 'PROD',
        crearProveedorSiNoExiste: parsed.crearProveedorSiNoExiste ?? false,
      };
    } catch (error) {
      // Si hay error en el parsing, usar valores por defecto
      return {
        tipoValidacion: TipoValidacionProducto.ESTRICTA,
        validarPrecios: true,
        validarStock: true,
        generarSKUAutomatico: false,
        prefijoSKU: 'PROD',
        crearProveedorSiNoExiste: false,
      };
    }
  }
} 