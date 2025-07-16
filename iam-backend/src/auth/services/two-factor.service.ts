import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SecureLoggerService } from '../../common/services/secure-logger.service';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  isValid: boolean;
  backupCodeUsed?: boolean;
}

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    private prisma: PrismaService,
    private secureLogger: SecureLoggerService
  ) {}

  /**
   * Generar secret para 2FA
   */
  private generateSecret(): string {
    return speakeasy.generateSecret({
      name: 'IAM Inventario',
      issuer: 'IAM System',
      length: 32
    }).base32;
  }

  /**
   * Generar códigos de respaldo
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Configurar 2FA para un usuario
   */
  async setupTwoFactor(userId: number): Promise<TwoFactorSetup> {
    try {
      const user = await this.prisma.usuario.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // Generar secret y códigos de respaldo
      const secret = this.generateSecret();
      const backupCodes = this.generateBackupCodes();

      // Generar QR code
      const otpauthUrl = speakeasy.otpauthURL({
        secret,
        label: user.email,
        issuer: 'IAM System',
        algorithm: 'sha1',
        digits: 6,
        period: 30
      });

      const qrCode = await QRCode.toDataURL(otpauthUrl);

      // Guardar secret y códigos de respaldo (encriptados)
      const encryptedSecret = this.encryptSecret(secret);
      const encryptedBackupCodes = backupCodes.map(code => this.encryptSecret(code));

      await this.prisma.twoFactorAuth.create({
        data: {
          userId,
          secret: encryptedSecret,
          backupCodes: encryptedBackupCodes,
          isEnabled: false, // Se habilita después de la verificación
          setupCompleted: false
        }
      });

      this.secureLogger.log(`2FA setup initiated for user ${userId}`, userId.toString());

      return {
        secret,
        qrCode,
        backupCodes
      };
    } catch (error) {
      this.logger.error(`Error setting up 2FA: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar código 2FA
   */
  async verifyTwoFactor(userId: number, token: string): Promise<TwoFactorVerification> {
    try {
      const twoFactorAuth = await this.prisma.twoFactorAuth.findUnique({
        where: { userId }
      });

      if (!twoFactorAuth) {
        throw new BadRequestException('2FA no configurado');
      }

      // Verificar si es un código de respaldo
      const backupCodes = twoFactorAuth.backupCodes.map(code => this.decryptSecret(code));
      const isBackupCode = backupCodes.includes(token.toUpperCase());

      if (isBackupCode) {
        // Usar código de respaldo
        const updatedBackupCodes = backupCodes.filter(code => code !== token.toUpperCase());
        const encryptedBackupCodes = updatedBackupCodes.map(code => this.encryptSecret(code));

        await this.prisma.twoFactorAuth.update({
          where: { userId },
          data: {
            backupCodes: encryptedBackupCodes,
            lastUsedBackupCode: new Date()
          }
        });

        this.secureLogger.log(`Backup code used for user ${userId}`, userId.toString());

        return {
          isValid: true,
          backupCodeUsed: true
        };
      }

      // Verificar código TOTP
      const secret = this.decryptSecret(twoFactorAuth.secret);
      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2 // Ventana de 2 períodos (60 segundos)
      });

      if (isValid) {
        // Actualizar último uso
        await this.prisma.twoFactorAuth.update({
          where: { userId },
          data: {
            lastUsed: new Date()
          }
        });

        this.secureLogger.log(`2FA verification successful for user ${userId}`, userId.toString());
      } else {
        this.secureLogger.logSecurityError(`Invalid 2FA token for user ${userId}`, userId);
      }

      return {
        isValid,
        backupCodeUsed: false
      };
    } catch (error) {
      this.logger.error(`Error verifying 2FA: ${error.message}`);
      throw error;
    }
  }

  /**
   * Habilitar 2FA después de verificación exitosa
   */
  async enableTwoFactor(userId: number): Promise<void> {
    try {
      await this.prisma.twoFactorAuth.update({
        where: { userId },
        data: {
          isEnabled: true,
          setupCompleted: true,
          enabledAt: new Date()
        }
      });

      this.secureLogger.log(`2FA enabled for user ${userId}`, userId.toString());
    } catch (error) {
      this.logger.error(`Error enabling 2FA: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deshabilitar 2FA
   */
  async disableTwoFactor(userId: number): Promise<void> {
    try {
      await this.prisma.twoFactorAuth.update({
        where: { userId },
        data: {
          isEnabled: false,
          disabledAt: new Date()
        }
      });

      this.secureLogger.log(`2FA disabled for user ${userId}`, userId.toString());
    } catch (error) {
      this.logger.error(`Error disabling 2FA: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar si 2FA está habilitado para un usuario
   */
  async isTwoFactorEnabled(userId: number): Promise<boolean> {
    try {
      const twoFactorAuth = await this.prisma.twoFactorAuth.findUnique({
        where: { userId }
      });

      return twoFactorAuth?.isEnabled || false;
    } catch (error) {
      this.logger.error(`Error checking 2FA status: ${error.message}`);
      return false;
    }
  }

  /**
   * Generar nuevos códigos de respaldo
   */
  async regenerateBackupCodes(userId: number): Promise<string[]> {
    try {
      const twoFactorAuth = await this.prisma.twoFactorAuth.findUnique({
        where: { userId }
      });

      if (!twoFactorAuth) {
        throw new BadRequestException('2FA no configurado');
      }

      const newBackupCodes = this.generateBackupCodes();
      const encryptedBackupCodes = newBackupCodes.map(code => this.encryptSecret(code));

      await this.prisma.twoFactorAuth.update({
        where: { userId },
        data: {
          backupCodes: encryptedBackupCodes,
          backupCodesRegeneratedAt: new Date()
        }
      });

      this.secureLogger.log(`Backup codes regenerated for user ${userId}`, userId.toString());

      return newBackupCodes;
    } catch (error) {
      this.logger.error(`Error regenerating backup codes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de 2FA
   */
  async getTwoFactorStats(userId: number): Promise<{
    isEnabled: boolean;
    setupCompleted: boolean;
    lastUsed?: Date;
    lastUsedBackupCode?: Date;
    backupCodesRemaining: number;
    enabledAt?: Date;
  }> {
    try {
      const twoFactorAuth = await this.prisma.twoFactorAuth.findUnique({
        where: { userId }
      });

      if (!twoFactorAuth) {
        return {
          isEnabled: false,
          setupCompleted: false,
          backupCodesRemaining: 0
        };
      }

      return {
        isEnabled: twoFactorAuth.isEnabled,
        setupCompleted: twoFactorAuth.setupCompleted,
        lastUsed: twoFactorAuth.lastUsed || undefined,
        lastUsedBackupCode: twoFactorAuth.lastUsedBackupCode || undefined,
        backupCodesRemaining: twoFactorAuth.backupCodes.length,
        enabledAt: twoFactorAuth.enabledAt || undefined
      };
    } catch (error) {
      this.logger.error(`Error getting 2FA stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encriptar secret (simulación - en producción usar una clave real)
   */
  private encryptSecret(secret: string): string {
    // En producción, usar una clave de encriptación real
    const key = process.env.ENCRYPTION_KEY || 'default-key-32-chars-long';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Desencriptar secret
   */
  private decryptSecret(encryptedSecret: string): string {
    // En producción, usar una clave de encriptación real
    const key = process.env.ENCRYPTION_KEY || 'default-key-32-chars-long';
    const [ivHex, encrypted] = encryptedSecret.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
} 