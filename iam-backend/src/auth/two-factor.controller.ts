import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TwoFactorService } from './services/two-factor.service';
import { JwtUser } from './interfaces/jwt-user.interface';
import {
  SetupTwoFactorDto,
  VerifyTwoFactorDto,
  EnableTwoFactorDto,
  DisableTwoFactorDto,
  RegenerateBackupCodesDto,
  TwoFactorSetupResponseDto,
  TwoFactorVerificationResponseDto,
  TwoFactorStatsResponseDto,
} from './dto/two-factor.dto';

@ApiTags('Two-Factor Authentication')
@Controller('auth/2fa')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @Post('setup')
  @ApiOperation({ summary: 'Configurar autenticación de dos factores' })
  @ApiResponse({
    status: 201,
    description: '2FA configurado exitosamente',
    type: TwoFactorSetupResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async setupTwoFactor(
    @CurrentUser() user: JwtUser,
    @Body() dto: SetupTwoFactorDto,
  ): Promise<TwoFactorSetupResponseDto> {
    try {
      const userId = dto.userId || user.id;

      // Verificar que el usuario solo puede configurar 2FA para sí mismo
      if (userId !== user.id && user.rol !== 'SUPERADMIN') {
        throw new BadRequestException(
          'No tienes permisos para configurar 2FA para otros usuarios',
        );
      }

      const setup = await this.twoFactorService.setupTwoFactor(userId);

      return {
        secret: setup.secret,
        qrCode: setup.qrCode,
        backupCodes: setup.backupCodes,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código 2FA' })
  @ApiResponse({
    status: 200,
    description: 'Código verificado',
    type: TwoFactorVerificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Código inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async verifyTwoFactor(
    @CurrentUser() user: JwtUser,
    @Body() dto: VerifyTwoFactorDto,
  ): Promise<TwoFactorVerificationResponseDto> {
    try {
      const userId = dto.userId || user.id;

      // Verificar que el usuario solo puede verificar 2FA para sí mismo
      if (userId !== user.id && user.rol !== 'SUPERADMIN') {
        throw new BadRequestException(
          'No tienes permisos para verificar 2FA para otros usuarios',
        );
      }

      const result = await this.twoFactorService.verifyTwoFactor(
        userId,
        dto.token,
      );

      return {
        isValid: result.isValid,
        backupCodeUsed: result.backupCodeUsed,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Habilitar 2FA después de verificación' })
  @ApiResponse({ status: 200, description: '2FA habilitado exitosamente' })
  @ApiResponse({ status: 400, description: 'Código inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async enableTwoFactor(
    @CurrentUser() user: JwtUser,
    @Body() dto: EnableTwoFactorDto,
  ): Promise<{ message: string }> {
    try {
      // Verificar el código primero
      const verification = await this.twoFactorService.verifyTwoFactor(
        user.id,
        dto.token,
      );

      if (!verification.isValid) {
        throw new BadRequestException('Código de verificación inválido');
      }

      // Habilitar 2FA
      await this.twoFactorService.enableTwoFactor(user.id);

      return {
        message: 'Autenticación de dos factores habilitada exitosamente',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deshabilitar 2FA' })
  @ApiResponse({ status: 200, description: '2FA deshabilitado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Código inválido o confirmación requerida',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async disableTwoFactor(
    @CurrentUser() user: JwtUser,
    @Body() dto: DisableTwoFactorDto,
  ): Promise<{ message: string }> {
    try {
      if (!dto.confirm) {
        throw new BadRequestException(
          'Debes confirmar la deshabilitación de 2FA',
        );
      }

      // Verificar el código primero
      const verification = await this.twoFactorService.verifyTwoFactor(
        user.id,
        dto.token,
      );

      if (!verification.isValid) {
        throw new BadRequestException('Código de verificación inválido');
      }

      // Deshabilitar 2FA
      await this.twoFactorService.disableTwoFactor(user.id);

      return {
        message: 'Autenticación de dos factores deshabilitada exitosamente',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('backup-codes/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerar códigos de respaldo' })
  @ApiResponse({
    status: 200,
    description: 'Códigos de respaldo regenerados',
    schema: {
      type: 'object',
      properties: {
        backupCodes: {
          type: 'array',
          items: { type: 'string' },
          example: ['A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2'],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Código inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async regenerateBackupCodes(
    @CurrentUser() user: JwtUser,
    @Body() dto: RegenerateBackupCodesDto,
  ): Promise<{ backupCodes: string[] }> {
    try {
      // Verificar el código primero
      const verification = await this.twoFactorService.verifyTwoFactor(
        user.id,
        dto.token,
      );

      if (!verification.isValid) {
        throw new BadRequestException('Código de verificación inválido');
      }

      // Regenerar códigos de respaldo
      const backupCodes = await this.twoFactorService.regenerateBackupCodes(
        user.id,
      );

      return { backupCodes };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Obtener estado de 2FA' })
  @ApiResponse({
    status: 200,
    description: 'Estado de 2FA',
    type: TwoFactorStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getTwoFactorStatus(
    @CurrentUser() user: JwtUser,
  ): Promise<TwoFactorStatsResponseDto> {
    try {
      const stats = await this.twoFactorService.getTwoFactorStats(user.id);

      return {
        isEnabled: stats.isEnabled,
        setupCompleted: stats.setupCompleted,
        lastUsed: stats.lastUsed,
        lastUsedBackupCode: stats.lastUsedBackupCode,
        backupCodesRemaining: stats.backupCodesRemaining,
        enabledAt: stats.enabledAt,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('status/:userId')
  @ApiOperation({
    summary: 'Obtener estado de 2FA de otro usuario (solo SUPERADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de 2FA del usuario',
    type: TwoFactorStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async getTwoFactorStatusForUser(
    @CurrentUser() user: JwtUser,
    userId: number,
  ): Promise<TwoFactorStatsResponseDto> {
    try {
      // Solo SUPERADMIN puede ver el estado de 2FA de otros usuarios
      if (user.rol !== 'SUPERADMIN') {
        throw new BadRequestException(
          'No tienes permisos para ver el estado de 2FA de otros usuarios',
        );
      }

      const stats = await this.twoFactorService.getTwoFactorStats(userId);

      return {
        isEnabled: stats.isEnabled,
        setupCompleted: stats.setupCompleted,
        lastUsed: stats.lastUsed,
        lastUsedBackupCode: stats.lastUsedBackupCode,
        backupCodesRemaining: stats.backupCodesRemaining,
        enabledAt: stats.enabledAt,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
