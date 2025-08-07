// dto/create-sensor.dto.ts
import { IsString, IsEnum, IsNumber, IsOptional, IsNotEmpty, IsBoolean, IsObject, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { SensorTipo } from '@prisma/client';

export interface SensorConfiguracion {
  unidad?: string;
  rango_min?: number;
  rango_max?: number;
  precision?: number;
  intervalo_lectura?: number;
  umbral_alerta?: number;
  umbral_critico?: number;
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
    umbral_alerta: 35,
    umbral_critico: 40
  },
  HUMEDAD: {
    unidad: '%',
    rango_min: 0,
    rango_max: 100,
    precision: 0.1,
    intervalo_lectura: 30,
    umbral_alerta: 80,
    umbral_critico: 90
  },
  PESO: {
    unidad: 'kg',
    rango_min: 0,
    rango_max: 1000,
    precision: 0.01,
    intervalo_lectura: 60,
    umbral_alerta: 800,
    umbral_critico: 950
  },
  PRESION: {
    unidad: 'Pa',
    rango_min: 0,
    rango_max: 2000,
    precision: 1,
    intervalo_lectura: 30,
    umbral_alerta: 1500,
    umbral_critico: 1800
  }
};

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
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  configuracion?: SensorConfiguracion;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsString()
  fabricante?: string;

  @IsOptional()
  @IsString()
  @IsIn(['AUTOMATICO', 'MANUAL'], { message: 'El modo debe ser AUTOMATICO o MANUAL' })
  modo?: 'AUTOMATICO' | 'MANUAL' = 'AUTOMATICO';
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

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsString()
  fabricante?: string;
}
