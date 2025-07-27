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

export enum TipoImportacionUnificada {
  PRODUCTOS = 'productos',
  PROVEEDORES = 'proveedores',
  MOVIMIENTOS = 'movimientos',
}

export enum TipoValidacionUnificada {
  ESTRICTA = 'estricta',
  FLEXIBLE = 'flexible',
  SOLO_VALIDACION = 'solo_validacion',
}

// Configuraciones específicas unificadas
export class ConfiguracionEspecificaProductosUnificada {
  @IsOptional()
  @IsEnum(TipoValidacionUnificada)
  tipoValidacion?: TipoValidacionUnificada = TipoValidacionUnificada.ESTRICTA;

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

export class ConfiguracionEspecificaProveedoresUnificada {
  @IsOptional()
  @IsEnum(TipoValidacionUnificada)
  tipoValidacion?: TipoValidacionUnificada = TipoValidacionUnificada.ESTRICTA;

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
  formatoTelefono?: string = 'MX';
}

export class ConfiguracionEspecificaMovimientosUnificada {
  @IsOptional()
  @IsEnum(TipoValidacionUnificada)
  tipoValidacion?: TipoValidacionUnificada = TipoValidacionUnificada.ESTRICTA;

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

// DTO unificado principal
export class ImportacionUnificadaDto {
  @Expose()
  @IsEnum(TipoImportacionUnificada)
  tipo: TipoImportacionUnificada;

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
  @Type(() => ConfiguracionEspecificaProductosUnificada)
  @IsObject()
  configuracionProductos?: ConfiguracionEspecificaProductosUnificada;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ConfiguracionEspecificaProveedoresUnificada)
  @IsObject()
  configuracionProveedores?: ConfiguracionEspecificaProveedoresUnificada;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ConfiguracionEspecificaMovimientosUnificada)
  @IsObject()
  configuracionMovimientos?: ConfiguracionEspecificaMovimientosUnificada;

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

  // Método para obtener la configuración específica según el tipo
  getConfiguracionEspecifica(): Record<string, unknown> {
    switch (this.tipo) {
      case TipoImportacionUnificada.PRODUCTOS:
        return this.configuracionProductos ? this.configuracionProductos as Record<string, unknown> : {};
      case TipoImportacionUnificada.PROVEEDORES:
        return this.configuracionProveedores ? this.configuracionProveedores as Record<string, unknown> : {};
      case TipoImportacionUnificada.MOVIMIENTOS:
        return this.configuracionMovimientos ? this.configuracionMovimientos as Record<string, unknown> : {};
      default:
        return {};
    }
  }

  // Método para validar que la configuración específica corresponda al tipo
  validarConfiguracionEspecifica(): boolean {
    switch (this.tipo) {
      case TipoImportacionUnificada.PRODUCTOS:
        return !this.configuracionProveedores && !this.configuracionMovimientos;
      case TipoImportacionUnificada.PROVEEDORES:
        return !this.configuracionProductos && !this.configuracionMovimientos;
      case TipoImportacionUnificada.MOVIMIENTOS:
        return !this.configuracionProductos && !this.configuracionProveedores;
      default:
        return false;
    }
  }
} 