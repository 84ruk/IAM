import {
  IsBoolean,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  ValidateNested,
  IsObject,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { Type, Expose } from 'class-transformer';

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
  @IsBoolean()
  crearProveedorSiNoExiste?: boolean = true;

  @IsOptional()
  @IsBoolean()
  generarSKUAutomatico?: boolean = true;

  @IsOptional()
  @IsString()
  prefijoSKU?: string = 'PROD';

  @IsOptional()
  @IsString()
  motivoPorDefecto?: string = 'Importación masiva';

  @IsOptional()
  @IsBoolean()
  actualizarStockEnTiempoReal?: boolean = true;

  @IsOptional()
  @IsBoolean()
  usarPreciosDelMovimiento?: boolean = false;

  @IsOptional()
  @IsBoolean()
  crearCategoriaSiNoExiste?: boolean = true;

  @IsOptional()
  @IsString()
  descripcionPorDefecto?: string = 'Producto creado automáticamente desde importación';

  @IsOptional()
  @IsNumber()
  stockMinimoPorDefecto?: number = 0;

  @IsOptional()
  @IsBoolean()
  validarProveedorExistente?: boolean = true;

  @IsOptional()
  @IsBoolean()
  permitirMovimientosSinProducto?: boolean = false;
}

export class ImportarMovimientosDto {
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
  @Type(() => ConfiguracionEspecificaMovimientos)
  @IsObject()
  configuracionEspecifica?: ConfiguracionEspecificaMovimientos;

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