import { IsString, IsNumber, IsArray, IsBoolean, IsNotEmpty, ValidateNested, IsOptional, MinLength, MaxLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SensorConfigDto {
  @ApiProperty({
    description: 'Tipo de sensor',
    example: 'TEMPERATURA',
    enum: ['TEMPERATURA', 'HUMEDAD', 'PESO', 'PRESION', 'PROXIMIDAD', 'LUZ', 'SONIDO', 'MOVIMIENTO']
  })
  @IsNotEmpty({ message: 'El tipo de sensor es requerido' })
  @IsString({ message: 'El tipo de sensor debe ser un texto' })
  tipo: string;

  @ApiProperty({
    description: 'Nombre del sensor',
    example: 'Sensor Temperatura Principal',
    minLength: 3,
    maxLength: 50
  })
  @IsNotEmpty({ message: 'El nombre del sensor es requerido' })
  @IsString({ message: 'El nombre del sensor debe ser un texto' })
  @MinLength(3, { message: 'El nombre del sensor debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El nombre del sensor no puede tener más de 50 caracteres' })
  nombre: string;

  @ApiProperty({
    description: 'Pin GPIO del ESP32 donde está conectado el sensor',
    example: 4,
    minimum: 0,
    maximum: 39
  })
  @IsNotEmpty({ message: 'El pin del sensor es requerido' })
  @IsNumber({}, { message: 'El pin debe ser un número' })
  @Min(0, { message: 'El pin debe ser mayor o igual a 0' })
  @Max(39, { message: 'El pin debe ser menor o igual a 39' })
  pin: number;

  @ApiProperty({
    description: 'Indica si el sensor está habilitado',
    example: true
  })
  @IsBoolean({ message: 'El estado del sensor debe ser verdadero o falso' })
  enabled: boolean;
}

export class ESP32AutoConfigDto {
  @ApiProperty({
    description: 'Nombre del dispositivo ESP32',
    example: 'ESP32-Almacen-Principal',
    minLength: 3,
    maxLength: 30
  })
  @IsNotEmpty({ message: 'El nombre del dispositivo es requerido' })
  @IsString({ message: 'El nombre del dispositivo debe ser un texto' })
  @MinLength(3, { message: 'El nombre del dispositivo debe tener al menos 3 caracteres' })
  @MaxLength(30, { message: 'El nombre del dispositivo no puede tener más de 30 caracteres' })
  deviceName: string;

  @ApiProperty({
    description: 'SSID de la red WiFi',
    example: 'MiRedWiFi',
    minLength: 1,
    maxLength: 32
  })
  @IsNotEmpty({ message: 'El SSID de WiFi es requerido' })
  @IsString({ message: 'El SSID de WiFi debe ser un texto' })
  @MinLength(1, { message: 'El SSID de WiFi no puede estar vacío' })
  @MaxLength(32, { message: 'El SSID de WiFi no puede tener más de 32 caracteres' })
  wifiSSID: string;

  @ApiProperty({
    description: 'Contraseña de la red WiFi',
    example: 'miContraseñaSegura123',
    minLength: 8,
    maxLength: 63
  })
  @IsNotEmpty({ message: 'La contraseña de WiFi es requerida' })
  @IsString({ message: 'La contraseña de WiFi debe ser un texto' })
  @MinLength(8, { message: 'La contraseña de WiFi debe tener al menos 8 caracteres' })
  @MaxLength(63, { message: 'La contraseña de WiFi no puede tener más de 63 caracteres' })
  wifiPassword: string;

  @ApiProperty({
    description: 'ID de la ubicación donde se instalará el ESP32',
    example: 1,
    minimum: 1
  })
  @IsNotEmpty({ message: 'La ubicación es requerida' })
  @IsNumber({}, { message: 'La ubicación debe ser un número' })
  @Min(1, { message: 'La ubicación debe ser mayor a 0' })
  ubicacionId: number;

  @ApiProperty({
    description: 'Lista de sensores a configurar en el ESP32',
    type: [SensorConfigDto],
    minItems: 1,
    maxItems: 10
  })
  @IsArray({ message: 'Los sensores deben ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => SensorConfigDto)
  @IsNotEmpty({ message: 'Debe incluir al menos un sensor' })
  sensores: SensorConfigDto[];
}

export class ESP32ConfigResponseDto {
  @ApiProperty({
    description: 'Indica si la configuración fue exitosa',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Configuración generada exitosamente'
  })
  message: string;

  @ApiProperty({
    description: 'URL de configuración para el ESP32',
    example: 'https://api.midominio.com/config/abc123',
    required: false
  })
  @IsOptional()
  configUrl?: string;

  @ApiProperty({
    description: 'Código QR en formato base64',
    required: false
  })
  @IsOptional()
  qrCode?: string;

  @ApiProperty({
    description: 'Credenciales MQTT generadas',
    required: false
  })
  @IsOptional()
  credentials?: {
    mqttUsername: string;
    mqttPassword: string;
    mqttTopic: string;
  };

  @ApiProperty({
    description: 'Instrucciones paso a paso para el usuario',
    type: [String],
    required: false
  })
  @IsOptional()
  instrucciones?: string[];

  @ApiProperty({
    description: 'Tiempo estimado para completar la configuración',
    example: '2-3 minutos',
    required: false
  })
  @IsOptional()
  tiempoEstimado?: string;
}



