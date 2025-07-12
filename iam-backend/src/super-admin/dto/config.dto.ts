import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsEmail } from 'class-validator';

export class SystemConfigDto {
  security: {
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    enableTwoFactor: boolean;
    enableAuditLog: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableEmailNotifications: boolean;
  };
  system: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    maxFileSize: number;
    allowedFileTypes: string[];
    backupFrequency: string;
    backupRetention: number;
    enableAutoBackup: boolean;
  };
  notifications: {
    enableEmailAlerts: boolean;
    enableSystemAlerts: boolean;
    alertThreshold: number;
    notifyOnUserCreation: boolean;
    notifyOnUserDeletion: boolean;
    notifyOnSystemErrors: boolean;
  };
}

export class TestEmailDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

export class ConfigResponseDto {
  success: boolean;
  message: string;
  config?: SystemConfigDto;
} 