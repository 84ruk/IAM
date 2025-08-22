import { IsNumber, IsOptional, IsString, IsEnum, IsBoolean, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SensorTipo } from '@prisma/client';

// 🚀 NUEVO: DTO para umbrales por rangos (sistema nuevo)
export class UmbralesSensorDto {
  @IsNumber()
  @Min(-1000)
  @Max(10000)
  rango_min: number;

  @IsNumber()
  @Min(-1000)
  @Max(10000)
  rango_max: number;

  @IsNumber()
  @Min(-1000)
  @Max(10000)
  umbral_alerta_bajo: number;

  @IsNumber()
  @Min(-1000)
  @Max(10000)
  umbral_alerta_alto: number;

  @IsNumber()
  @Min(-1000)
  @Max(10000)
  umbral_critico_bajo: number;

  @IsNumber()
  @Min(-1000)
  @Max(10000)
  umbral_critico_alto: number;

  @IsEnum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'])
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

  @IsNumber()
  @Min(1000)
  @Max(3600000)
  intervalo_lectura: number;

  @IsBoolean()
  alertasActivas: boolean;
}

// 🔧 COMPATIBILIDAD: DTO para umbrales específicos por tipo de sensor (sistema antiguo)
export class UmbralesSensorLegacyDto {
  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(100)
  temperaturaMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(100)
  temperaturaMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  humedadMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  humedadMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  pesoMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  pesoMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  presionMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  presionMax?: number;

  // Configuración de alertas
  @IsOptional()
  @IsBoolean()
  alertasActivas?: boolean = true;

  @IsOptional()
  @IsString()
  mensajeAlerta?: string;

  @IsOptional()
  @IsString()
  mensajeCritico?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  destinatarios?: string[];

  @IsOptional()
  @IsEnum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'])
  severidad?: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'MEDIA';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440)
  intervaloVerificacionMinutos?: number = 5;

  @IsOptional()
  @IsBoolean()
  configuracionNotificacionEmail?: boolean = true;

  @IsOptional()
  @IsBoolean()
  configuracionNotificacionSMS?: boolean = false;

  @IsOptional()
  @IsBoolean()
  configuracionNotificacionWebSocket?: boolean = true;
}

// DTO para configuración de notificaciones
export class ConfiguracionNotificacionesDto {
  @IsBoolean()
  email: boolean;

  @IsBoolean()
  sms: boolean;

  @IsBoolean()
  webSocket: boolean;
}

// DTO para configuración completa de umbrales por sensor
export class ConfiguracionUmbralesSensorDto {
  @IsNumber()
  sensorId: number;

  @IsEnum(SensorTipo)
  tipo: SensorTipo;

  @ValidateNested()
  @Type(() => UmbralesSensorDto)
  umbralCriticoes: UmbralesSensorDto;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

// DTO para configuración de umbrales por ubicación
export class ConfiguracionUmbralesUbicacionDto {
  @IsNumber()
  ubicacionId: number;

  @IsString()
  nombreUbicacion: string;

  @ValidateNested({ each: true })
  @Type(() => ConfiguracionUmbralesSensorDto)
  sensores: ConfiguracionUmbralesSensorDto[];

  @IsOptional()
  @IsBoolean()
  alertasGlobales?: boolean = true;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  destinatariosGlobales?: string[];
}

// DTO para respuesta de umbrales configurados
export class UmbralesConfiguradosDto {
  id: number;
  sensorId: number;
  tipo: SensorTipo;
  nombre: string;
  ubicacionId: number;
  ubicacionNombre: string;
  umbralCriticoes: UmbralesSensorDto;
  activo: boolean;
  ultimaActualizacion: Date;
  proximaVerificacion: Date;
}

// DTO para validación de umbrales
export class ValidacionUmbralesDto {
  @IsEnum(SensorTipo)
  tipo: SensorTipo;

  @IsNumber()
  valor: number;

  @IsString()
  unidad: string;

  @ValidateNested()
  @Type(() => UmbralesSensorDto)
  umbralCriticoes: UmbralesSensorDto;
}

// DTO para respuesta de validación
export class ResultadoValidacionUmbralesDto {
  cumpleUmbrales: boolean;
  estado: 'NORMAL' | 'ALERTA' | 'CRITICO';
  mensaje: string;
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  umbralCriticoesExcedidos: string[];
  recomendaciones: string[];
  proximaVerificacion: Date;
}

// DTO para configuración de alertas en tiempo real
export class ConfiguracionAlertasTiempoRealDto {
  @IsOptional()
  @IsBoolean()
  habilitarWebSocket?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(60000)
  intervaloActualizacionMs?: number = 5000;

  @IsOptional()
  @IsBoolean()
  historialAlertas?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(1000)
  maxHistorialAlertas?: number = 100;

  @IsOptional()
  @IsBoolean()
  persistirAlertas?: boolean = true;

  @IsOptional()
  @IsBoolean()
  configuracionNotificacionesPush?: boolean = false;
}

// DTO para configuración de umbrales por empresa
export class ConfiguracionUmbralesEmpresaDto {
  @IsNumber()
  empresaId: number;

  @ValidateNested({ each: true })
  @Type(() => ConfiguracionUmbralesUbicacionDto)
  ubicaciones: ConfiguracionUmbralesUbicacionDto[];

  @ValidateNested()
  @Type(() => ConfiguracionAlertasTiempoRealDto)
  alertasTiempoReal: ConfiguracionAlertasTiempoRealDto;

  @IsOptional()
  @IsString()
  politicaAlertas?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  administradoresAlertas?: string[];

  @IsOptional()
  @IsBoolean()
  modoPrueba?: boolean = false;
}

// 🚀 NUEVO: DTO para umbrales personalizados durante la creación de sensores
export class UmbralesPersonalizadosDto {
  @IsNumber()
  @Min(-1000)
  @Max(10000)
  rango_min: number;

  @IsNumber()
  @Min(-1000)
  @Max(10000)
  rango_max: number;

  @IsNumber()
  @Min(-1000)
  @Max(10000)
  umbral_alerta_bajo: number;

  @IsNumber()
  @Min(-1000)
  @Max(10000)
  umbral_alerta_alto: number;

  @IsNumber()
  @Min(-1000)
  @Max(10000)
  umbral_critico_bajo: number;

  @IsNumber()
  @Min(-1000)
  @Max(10000)
  umbral_critico_alto: number;

  @IsEnum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'])
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

  @IsNumber()
  @Min(1000)
  @Max(3600000)
  intervalo_lectura: number;

  @IsBoolean()
  alertasActivas: boolean;
}

// 🚀 NUEVO: DTO para configuración de notificaciones durante la creación
export class ConfiguracionNotificacionesCreacionDto {
  @IsOptional()
  @IsBoolean()
  email?: boolean = true;

  @IsOptional()
  @IsBoolean()
  sms?: boolean = true;

  @IsOptional()
  @IsBoolean()
  webSocket?: boolean = true;
}
