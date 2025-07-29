import {
  IsBoolean,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Expose, Exclude } from 'class-transformer';
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
  generarSKUAutomatico?: boolean = true;

  @IsOptional()
  @IsString()
  prefijoSKU?: string = 'PROD';

  @IsOptional()
  @IsBoolean()
  crearProveedorSiNoExiste?: boolean = true;
}

export class ImportarProductosDto {
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
  @IsString()
  configuracionEspecifica?: string;

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
        generarSKUAutomatico: parsed.generarSKUAutomatico ?? true,
        prefijoSKU: parsed.prefijoSKU || 'PROD',
        crearProveedorSiNoExiste: parsed.crearProveedorSiNoExiste ?? true,
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