import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtUser } from '../interfaces/jwt-user.interface';
import { SKIP_EMPRESA_CHECK_KEY } from '../decorators/skip-empresa-check.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuditService } from '../jwt-audit.service';
import { EmpresaCacheService } from '../empresa-cache.service';

@Injectable()
export class EmpresaSetupGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private jwtAuditService: JwtAuditService,
    private empresaCache: EmpresaCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si el endpoint está marcado para saltar la verificación
    const skipEmpresaCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_EMPRESA_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si está marcado para saltar, permitir acceso
    if (skipEmpresaCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtUser = request.user;

    if (!user) {
      this.jwtAuditService.logGuardAccess(0, 'unknown', 'EmpresaSetupGuard', false, {
        reason: 'no_user_in_request',
        path: request.url,
        method: request.method,
      });
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Para todos los demás endpoints, verificar que tenga empresa configurada
    if (!user?.empresaId) {
      this.jwtAuditService.logGuardAccess(user.id, user.email, 'EmpresaSetupGuard', false, {
        reason: 'no_empresa_id',
        path: request.url,
        method: request.method,
      });
      
      throw new ForbiddenException({
        message: 'Se requiere configurar una empresa para acceder a este recurso',
        code: 'EMPRESA_REQUIRED',
        needsSetup: true,
        redirectTo: '/setup-empresa'
      });
    }

    // Validación adicional: verificar que la empresa existe y está activa usando cache
    try {
      const empresa = await this.empresaCache.getEmpresa(user.empresaId);

      if (!empresa) {
        this.jwtAuditService.logEmpresaValidation(user.id, user.email, user.empresaId, false, {
          reason: 'empresa_not_found',
          path: request.url,
          method: request.method,
        });
        
        throw new ForbiddenException({
          message: 'La empresa asociada no existe o ha sido eliminada',
          code: 'EMPRESA_NOT_FOUND',
          needsSetup: true,
          redirectTo: '/setup-empresa'
        });
      }

      // Log de acceso exitoso
      this.jwtAuditService.logGuardAccess(user.id, user.email, 'EmpresaSetupGuard', true, {
        empresaId: user.empresaId,
        empresaName: empresa.nombre,
        path: request.url,
        method: request.method,
      });

      return true;
    } catch (error) {
      // Si es un error de ForbiddenException, re-lanzarlo
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // Para otros errores (DB, etc.), log y denegar acceso
      this.jwtAuditService.logGuardAccess(user.id, user.email, 'EmpresaSetupGuard', false, {
        reason: 'validation_error',
        error: error.message,
        path: request.url,
        method: request.method,
      });

      throw new ForbiddenException({
        message: 'Error al validar la empresa',
        code: 'EMPRESA_VALIDATION_ERROR',
        needsSetup: true,
        redirectTo: '/setup-empresa'
      });
    }
  }
} 