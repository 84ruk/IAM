import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsNotEmpty, Min, Max, IsPositive, ValidateNested, ArrayMinSize, Length, Matches, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { SensorTipo } from '@prisma/client';

export class SensorReadingDto {
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

export class CreateSensorLecturaMultipleDto {
  @IsString({ message: 'El ID del dispositivo debe ser un texto' })
  @IsNotEmpty({ message: 'El ID del dispositivo es requerido' })
  deviceId: string;

  @IsString({ message: 'El nombre del dispositivo debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del dispositivo es requerido' })
  deviceName: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'El ID de la ubicación debe ser un número' })
  @IsNotEmpty({ message: 'El ID de la ubicación es requerido' })
  ubicacionId: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'El ID de la empresa debe ser un número' })
  @IsNotEmpty({ message: 'El ID de la empresa es requerido' })
  empresaId: number;

  @IsString({ message: 'El token de API debe ser un texto' })
  @IsNotEmpty({ message: 'El token de API es requerido' })
  apiToken: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'El timestamp debe ser un número' })
  @IsNotEmpty({ message: 'El timestamp es requerido' })
  timestamp: number;

  @IsObject({ message: 'Los sensores deben ser un objeto' })
  @IsNotEmpty({ message: 'Los datos de sensores son requeridos' })
  sensors: Record<string, number>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SensorReadingDto)
  sensorDetails?: SensorReadingDto[];
}

