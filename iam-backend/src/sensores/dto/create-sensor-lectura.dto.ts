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
} from 'class-validator';
import { Type } from 'class-transformer';
import { SensorTipo } from '@prisma/client';

export enum TipoSensor {
  PESO = 'PESO',
  TEMPERATURA = 'TEMPERATURA',
  HUMEDAD = 'HUMEDAD',
  RFID = 'RFID',
}

export class CreateSensorLecturaDto {
  @IsEnum(TipoSensor, {
    message: 'El tipo debe ser PESO, TEMPERATURA, HUMEDAD o RFID',
  })
  @IsNotEmpty({ message: 'El tipo de sensor es requerido' })
  tipo: TipoSensor;

  @Type(() => Number)
  @IsNumber({}, { message: 'El valor debe ser un número' })
  @IsNotEmpty({ message: 'El valor es requerido' })
  @Min(-1000, { message: 'El valor no puede ser menor a -1000' })
  @Max(10000, { message: 'El valor no puede ser mayor a 10000' })
  valor: number;

  @IsString({ message: 'La unidad debe ser un texto' })
  @IsNotEmpty({ message: 'La unidad es requerida' })
  @Min(1, { message: 'La unidad debe tener al menos 1 carácter' })
  @Max(20, { message: 'La unidad no puede exceder 20 caracteres' })
  @Matches(/^[a-zA-Z0-9\/°%]+$/, {
    message: 'La unidad contiene caracteres no permitidos',
  })
  unidad: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del producto debe ser un número' })
  @IsPositive({ message: 'El ID del producto debe ser un número positivo' })
  productoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del sensor debe ser un número' })
  @IsPositive({ message: 'El ID del sensor debe ser un número positivo' })
  sensorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID de la ubicación debe ser un número' })
  @IsPositive({ message: 'El ID de la ubicación debe ser un número positivo' })
  ubicacionId?: number;
} 