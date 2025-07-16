import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupTwoFactorDto {
  @ApiProperty({
    description: 'ID del usuario para configurar 2FA',
    example: 1,
  })
  @IsOptional()
  userId?: number;
}

export class VerifyTwoFactorDto {
  @ApiProperty({
    description: 'Código de verificación 2FA (6 dígitos)',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'El código debe tener exactamente 6 dígitos' })
  token: string;

  @ApiProperty({
    description: 'ID del usuario (opcional, se obtiene del token JWT)',
    example: 1,
    required: false,
  })
  @IsOptional()
  userId?: number;
}

export class EnableTwoFactorDto {
  @ApiProperty({
    description: 'Código de verificación para habilitar 2FA',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'El código debe tener exactamente 6 dígitos' })
  token: string;
}

export class DisableTwoFactorDto {
  @ApiProperty({
    description: 'Código de verificación para deshabilitar 2FA',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'El código debe tener exactamente 6 dígitos' })
  token: string;

  @ApiProperty({
    description: 'Confirmar deshabilitación',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  confirm: boolean;
}

export class RegenerateBackupCodesDto {
  @ApiProperty({
    description:
      'Código de verificación 2FA para regenerar códigos de respaldo',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'El código debe tener exactamente 6 dígitos' })
  token: string;
}

export class TwoFactorSetupResponseDto {
  @ApiProperty({
    description: 'Secret para configurar la aplicación 2FA',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string;

  @ApiProperty({
    description: 'QR code en formato data URL',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  qrCode: string;

  @ApiProperty({
    description: 'Códigos de respaldo (guardar de forma segura)',
    example: ['A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2'],
  })
  backupCodes: string[];
}

export class TwoFactorVerificationResponseDto {
  @ApiProperty({
    description: 'Si la verificación fue exitosa',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Si se usó un código de respaldo',
    example: false,
  })
  backupCodeUsed?: boolean;
}

export class TwoFactorStatsResponseDto {
  @ApiProperty({
    description: 'Si 2FA está habilitado',
    example: true,
  })
  isEnabled: boolean;

  @ApiProperty({
    description: 'Si el setup está completado',
    example: true,
  })
  setupCompleted: boolean;

  @ApiProperty({
    description: 'Último uso de 2FA',
    example: '2024-01-15T10:30:00Z',
  })
  lastUsed?: Date;

  @ApiProperty({
    description: 'Último uso de código de respaldo',
    example: '2024-01-15T10:30:00Z',
  })
  lastUsedBackupCode?: Date;

  @ApiProperty({
    description: 'Número de códigos de respaldo restantes',
    example: 8,
  })
  backupCodesRemaining: number;

  @ApiProperty({
    description: 'Fecha de habilitación',
    example: '2024-01-15T10:30:00Z',
  })
  enabledAt?: Date;
}
