// dto/create-sensor.dto.ts
import { IsString, IsEnum, IsNumber, IsOptional, IsNotEmpty, IsBoolean, IsObject, ValidateNested, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SensorTipo } from '@prisma/client';

export interface SensorConfiguracion {
  unidad?: string;
  rango_min?: number;
  rango_max?: number;
  precision?: number;
  intervalo_lectura?: number;
  umbralCritico_alerta?: number;
  umbralCritico_critico?: number;
  [key: string]: unknown;
}

// Configuraciones predefinidas por tipo de sensor
export const CONFIGURACIONES_PREDEFINIDAS: Record<SensorTipo, SensorConfiguracion> = {
  TEMPERATURA: {
    unidad: '°C',
    rango_min: -20,
    rango_max: 50,
    precision: 0.1,
    intervalo_lectura: 30,
    umbralCritico_alerta: 35,
    umbralCritico_critico: 40
  },
  HUMEDAD: {
    unidad: '%',
    rango_min: 0,
    rango_max: 100,
    precision: 0.1,
    intervalo_lectura: 30,
    umbralCritico_alerta: 80,
    umbralCritico_critico: 90
  },
  PESO: {
    unidad: 'kg',
    rango_min: 0,
    rango_max: 1000,
    precision: 0.01,
    intervalo_lectura: 60,
    umbralCritico_alerta: 800,
    umbralCritico_critico: 950
  },
  PRESION: {
    unidad: 'Pa',
    rango_min: 0,
    rango_max: 2000,
    precision: 1,
    intervalo_lectura: 30,
    umbralCritico_alerta: 1500,
    umbralCritico_critico: 1800
  }
};

// Clase para umbrales personalizados
export class UmbralesPersonalizadosDto {
  @IsOptional()
  @IsNumber({}, { message: 'El rango mínimo debe ser un número' })
  rango_min?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El rango máximo debe ser un número' })
  rango_max?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El umbral de alerta bajo debe ser un número' })
  umbral_alerta_bajo?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El umbral de alerta alto debe ser un número' })
  umbral_alerta_alto?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El umbral crítico bajo debe ser un número' })
  umbral_critico_bajo?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El umbral crítico alto debe ser un número' })
  umbral_critico_alto?: number;

  @IsOptional()
  @IsString({ message: 'La severidad debe ser un texto' })
  @IsIn(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'], { message: 'La severidad debe ser BAJA, MEDIA, ALTA o CRITICA' })
  severidad?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El intervalo de lectura debe ser un número' })
  @Min(1000, { message: 'El intervalo de lectura debe ser al menos 1000ms' })
  intervalo_lectura?: number;

  @IsOptional()
  @IsBoolean({ message: 'alertasActivas debe ser un booleano' })
  alertasActivas?: boolean;
}

export class CreateSensorDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del sensor es requerido' })
  nombre: string;

  @IsEnum(SensorTipo, { message: 'El tipo de sensor debe ser válido' })
  tipo: SensorTipo;

  @IsNumber()
  @IsNotEmpty({ message: 'El ID de la ubicación es requerido' })
  ubicacionId: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;

  @IsOptional()
  @IsObject({ message: 'La configuración debe ser un objeto válido' })
  configuracion?: any; // Simplificar la validación para evitar problemas

  @IsOptional()
  @IsString()
  descripcion?: string;

  // Remover campos que no existen en el modelo Prisma
  // @IsOptional()
  // @IsString()
  // modelo?: string;

  // @IsOptional()
  // @IsString()
  // fabricante?: string;

  @IsOptional()
  @IsString()
  @IsIn(['AUTOMATICO', 'MANUAL'], { message: 'El modo debe ser AUTOMATICO o MANUAL' })
  modo?: 'AUTOMATICO' | 'MANUAL' = 'AUTOMATICO';

  // 🚀 NUEVO: Umbrales personalizados durante la creación
  @IsOptional()
  @ValidateNested({ message: 'Los umbrales personalizados deben ser válidos' })
  @Type(() => UmbralesPersonalizadosDto)
  umbralesPersonalizados?: UmbralesPersonalizadosDto;

  // 🚀 NUEVO: Configuración de notificaciones personalizada
  @IsOptional()
  @IsObject({ message: 'La configuración de notificaciones debe ser un objeto' })
  configuracionNotificaciones?: {
    email?: boolean;
    sms?: boolean;
    webSocket?: boolean;
  };
}

// DTO simplificado para creación rápida
export class CreateSensorSimpleDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del sensor es requerido' })
  nombre: string;

  @IsEnum(SensorTipo, { message: 'El tipo de sensor debe ser válido' })
  tipo: SensorTipo;

  @IsNumber()
  @IsNotEmpty({ message: 'El ID de la ubicación es requerido' })
  ubicacionId: number;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
