import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { SessionManagementService, SessionInfo } from './services/session-management.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtUser } from './interfaces/jwt-user.interface';

interface RevokeSessionDto {
  jti: string;
  reason?: string;
}

interface RevokeAllSessionsDto {
  reason?: string;
}

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionManagementController {
  constructor(private readonly sessionManagementService: SessionManagementService) {}

  /**
   * Obtener sesiones del usuario actual
   */
  @Get('my-sessions')
  async getMySessions(@CurrentUser() user: JwtUser): Promise<SessionInfo[]> {
    return this.sessionManagementService.getUserSessions(user.id);
  }

  /**
   * Obtener estadísticas de sesiones (solo ADMIN y SUPERADMIN)
   */
  @Get('stats')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async getSessionStats() {
    return this.sessionManagementService.getSessionStats();
  }

  /**
   * Revocar una sesión específica del usuario actual
   */
  @Delete('my-sessions/:jti')
  async revokeMySession(
    @Param('jti') jti: string,
    @Body() dto: RevokeSessionDto,
    @CurrentUser() user: JwtUser,
  ) {
    const success = await this.sessionManagementService.revokeSession(
      jti,
      user.id,
      dto.reason || 'user_request',
    );

    if (!success) {
      return { message: 'Sesión no encontrada o ya revocada' };
    }

    return { message: 'Sesión revocada exitosamente' };
  }

  /**
   * Revocar todas las sesiones del usuario actual excepto la actual
   */
  @Delete('my-sessions')
  async revokeAllMyOtherSessions(
    @Body() dto: RevokeAllSessionsDto,
    @CurrentUser() user: JwtUser,
    @Query('currentJti') currentJti: string,
  ) {
    if (!currentJti) {
      return { message: 'Se requiere el JTI de la sesión actual' };
    }

    const revokedCount = await this.sessionManagementService.revokeAllOtherSessions(
      user.id,
      currentJti,
    );

    return {
      message: `${revokedCount} sesiones revocadas exitosamente`,
      revokedCount,
    };
  }

  /**
   * Limpiar sesiones expiradas manualmente (solo SUPERADMIN)
   */
  @Post('cleanup')
  @Roles(Rol.SUPERADMIN)
  async cleanupExpiredSessions() {
    const result = await this.sessionManagementService.cleanupExpiredSessions();
    
    return {
      message: `Limpieza completada: ${result.total} sesiones eliminadas`,
      details: result,
    };
  }

  /**
   * Verificar límites de sesión del usuario actual
   */
  @Get('limits')
  async checkMySessionLimits(@CurrentUser() user: JwtUser) {
    return this.sessionManagementService.checkSessionLimits(user.id, user.rol);
  }
} 