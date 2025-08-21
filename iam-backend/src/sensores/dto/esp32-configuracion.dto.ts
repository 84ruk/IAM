import { IsString, IsNumber, IsObject, IsArray, IsNotEmpty, ValidateNested, IsOptional, IsBoolean, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class WifiConfigDto {
  @IsString({ message: 'SSID debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'SSID es requerido' })
  ssid: string;

  @IsString({ message: 'Password debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'Password es requerido' })
  password: string;
}

export class ApiConfigDto {
  @IsString({ message: 'baseUrl debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'baseUrl es requerido' })
  baseUrl: string;

  @IsString({ message: 'token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'token es requerido' })
  token: string;

  @IsString({ message: 'endpoint debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'endpoint es requerido' })
  endpoint: string;
}

export class SensorConfigDto {
  @IsString({ message: 'tipo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'tipo es requerido' })
  tipo: string;

  @IsString({ message: 'nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'nombre es requerido' })
  nombre: string;

  @IsNumber({}, { message: 'pin debe ser un número' })
  pin: number;

  @IsNumber({}, { message: 'pin2 debe ser un número' })
  pin2: number;

  @IsOptional()
  @IsBoolean({ message: 'enabled debe ser un booleano' })
  enabled?: boolean;

  // 🔧 CORREGIDO: Cambiar nombres para coincidir con el frontend
  @IsNumber({}, { message: 'umbralMin debe ser un número' })
  umbralMin: number;

  @IsNumber({}, { message: 'umbralMax debe ser un número' })
  umbralMax: number;

  @IsString({ message: 'unidad debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'unidad es requerida' })
  unidad: string;

  @IsNumber({}, { message: 'intervalo debe ser un número' })
  intervalo: number;
}

export class ESP32ConfiguracionDto {
  @IsString({ message: 'deviceId debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'deviceId es requerido' })
  deviceId: string;

  @IsString({ message: 'deviceName debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'deviceName es requerido' })
  deviceName: string;

  @IsNumber({}, { message: 'ubicacionId debe ser un número' })
  ubicacionId: number;

  @IsNumber({}, { message: 'empresaId debe ser un número' })
  empresaId: number;

  @IsObject({ message: 'wifi debe ser un objeto' })
  @ValidateNested({ message: 'wifi debe tener la estructura correcta' })
  @Type(() => WifiConfigDto)
  wifi: WifiConfigDto;

  @IsObject({ message: 'api debe ser un objeto' })
  @ValidateNested({ message: 'api debe tener la estructura correcta' })
  @Type(() => ApiConfigDto)
  api: ApiConfigDto;

  @IsArray({ message: 'sensores debe ser un array' })
  @ValidateNested({ each: true, message: 'cada sensor debe tener la estructura correcta' })
  @Type(() => SensorConfigDto)
  sensores: SensorConfigDto[];

  @IsNumber({}, { message: 'intervalo debe ser un número' })
  intervalo: number;

  @IsOptional()
  @IsString({ message: 'timestamp debe ser una cadena de texto' })
  timestamp?: string;
}

// 🔧 DTO más flexible para debugging
export class ESP32ConfiguracionDebugDto {
  @IsString({ message: 'deviceId debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'deviceId es requerido' })
  deviceId: string;

  @IsString({ message: 'deviceName debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'deviceName es requerido' })
  deviceName: string;

  @ValidateIf((o) => o.ubicacionId !== undefined)
  @IsNumber({}, { message: 'ubicacionId debe ser un número' })
  ubicacionId?: number;

  @ValidateIf((o) => o.empresaId !== undefined)
  @IsNumber({}, { message: 'empresaId debe ser un número' })
  empresaId?: number;

  @ValidateIf((o) => o.wifi !== undefined)
  @IsObject({ message: 'wifi debe ser un objeto' })
  @ValidateNested({ message: 'wifi debe tener la estructura correcta' })
  @Type(() => WifiConfigDto)
  wifi?: WifiConfigDto;

  @ValidateIf((o) => o.api !== undefined)
  @IsObject({ message: 'api debe ser un objeto' })
  @ValidateNested({ message: 'api debe tener la estructura correcta' })
  @Type(() => ApiConfigDto)
  api?: ApiConfigDto;

  @ValidateIf((o) => o.sensores !== undefined)
  @IsArray({ message: 'sensores debe ser un array' })
  @ValidateNested({ each: true, message: 'cada sensor debe tener la estructura correcta' })
  @Type(() => SensorConfigDto)
  sensores?: SensorConfigDto[];

  @ValidateIf((o) => o.intervalo !== undefined)
  @IsNumber({}, { message: 'intervalo debe ser un número' })
  intervalo?: number;

  @IsOptional()
  @IsString({ message: 'timestamp debe ser una cadena de texto' })
  timestamp?: string;
}

