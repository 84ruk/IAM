import { IsString, IsNumber, IsObject, IsArray, IsNotEmpty, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class WifiConfigDto {
  @IsString()
  @IsNotEmpty()
  ssid: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ApiConfigDto {
  @IsString()
  @IsNotEmpty()
  baseUrl: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  endpoint: string;
}

export class SensorConfigDto {
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  pin: number;

  @IsNumber()
  pin2: number;

  @IsOptional()
  enabled: boolean;

  @IsNumber()
  umbralMin: number;

  @IsNumber()
  umbralMax: number;

  @IsString()
  @IsNotEmpty()
  unidad: string;

  @IsNumber()
  intervalo: number;
}

export class ESP32ConfiguracionDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @IsNumber()
  ubicacionId: number;

  @IsNumber()
  empresaId: number;

  @IsObject()
  @ValidateNested()
  @Type(() => WifiConfigDto)
  wifi: WifiConfigDto;

  @IsObject()
  @ValidateNested()
  @Type(() => ApiConfigDto)
  api: ApiConfigDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SensorConfigDto)
  sensores: SensorConfigDto[];

  @IsNumber()
  intervalo: number;

  @IsString()
  @IsNotEmpty()
  timestamp: string;
}

