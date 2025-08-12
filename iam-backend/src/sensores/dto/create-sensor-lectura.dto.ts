import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  Min,
  Max,
  IsPositive,
  Matches,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SensorTipo } from '@prisma/client';

// Usar el mismo enum que Prisma para evitar incompatibilidades
export type TipoSensor = SensorTipo;

export class CreateSensorLecturaDto {
  @IsEnum(SensorTipo, {
    message: 'El tipo debe ser TEMPERATURA, HUMEDAD, PESO o PRESION',
  })
  @IsNotEmpty({ message: 'El tipo de sensor es requerido' })
  tipo: SensorTipo;

  @Type(() => Number)
  @IsNumber({}, { message: 'El valor debe ser un número' })
  @IsNotEmpty({ message: 'El valor es requerido' })
  @Min(-1000, { message: 'El valor no puede ser menor a -1000' })
  @Max(10000, { message: 'El valor no puede ser mayor a 10000' })
  valor: number;

  @IsString({ message: 'La unidad debe ser un texto' })
  @IsNotEmpty({ message: 'La unidad es requerida' })
  @Length(1, 20, { message: 'La unidad debe tener entre 1 y 20 caracteres' })
  @Matches(/^[a-zA-Z0-9\/°%]+$/, {
    message: 'La unidad contiene caracteres no permitidos',
  })
  unidad: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del producto debe ser un número' })
  @Min(0, { message: 'El ID del producto debe ser 0 o un número positivo' })
  productoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del sensor debe ser un número' })
  @Min(0, { message: 'El ID del sensor debe ser 0 o un número positivo' })
  sensorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID de la ubicación debe ser un número' })
  @IsPositive({ message: 'El ID de la ubicación debe ser un número positivo' })
  ubicacionId?: number;
} 