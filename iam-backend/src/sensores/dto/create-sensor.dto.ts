// dto/create-sensor.dto.ts
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSensorLecturaDto {
  @IsEnum(['PESO', 'TEMPERATURA', 'HUMEDAD', 'RFID'])
  tipo: 'PESO' | 'TEMPERATURA' | 'HUMEDAD' | 'RFID';

  @IsNumber()
  valor: number;

  @IsString()
  unidad: string;

  @IsOptional()
  @IsNumber()
  productoId?: number;
}
