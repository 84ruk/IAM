import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtUser } from '../interfaces/jwt-user.interface';
import { SKIP_EMPRESA_CHECK_KEY } from '../decorators/skip-empresa-check.decorator';
import { EMPRESA_REQUIRED_KEY } from '../decorators/empresa-required.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuditService } from '../jwt-audit.service';
import { EmpresaCacheService } from '../empresa-cache.service';

@Injectable()
export class EmpresaGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private jwtAuditService: JwtAuditService,
    private empresaCache: EmpresaCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtUser = request.user;

    // 1. Verificar si el endpoint está marcado para saltar la verificación
    const skipEmpresaCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_EMPRESA_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipEmpresaCheck) {
      return true;
    }

    // 2. Verificar si el endpoint requiere empresa explícitamente
    const isEmpresaRequired = this.reflector.getAllAndOverride<boolean>(
      EMPRESA_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 3. Lógica inteligente basada en el tipo de endpoint
    const currentUrl = request.url;
    const method = request.method;

    // Endpoints que siempre requieren empresa (CRUD de datos)
    const alwaysRequireEmpresa = [
      '/productos',
      '/proveedores',
      '/movimientos',
      '/pedidos',
      '/inventario',
      '/dashboard',
      '/empresas',
    ];

    // Endpoints que pueden funcionar sin empresa
    const canWorkWithoutEmpresa = [
      '/auth/me',
      '/auth/needs-setup',
      '/auth/setup-empresa',
      '/auth/logout',
      '/auth/google/status',
      '/users', // Para admin global
    ];

    // Si el endpoint requiere empresa explícitamente
    if (isEmpresaRequired) {
      return await this.validateEmpresaAccess(
        user,
        request,
        'explicit_requirement',
      );
    }

    // Si el endpoint puede funcionar sin empresa
    if (
      canWorkWithoutEmpresa.some((endpoint) => currentUrl.startsWith(endpoint))
    ) {
      return true;
    }

    // Si el endpoint siempre requiere empresa
    if (
      alwaysRequireEmpresa.some((endpoint) => currentUrl.startsWith(endpoint))
    ) {
      return await this.validateEmpresaAccess(user, request, 'always_required');
    }

    // Por defecto, requerir empresa para endpoints autenticados
    return await this.validateEmpresaAccess(
      user,
      request,
      'default_requirement',
    );
  }

  private async validateEmpresaAccess(
    user: JwtUser,
    request: any,
    reason: string,
  ): Promise<boolean> {
    if (!user) {
      this.jwtAuditService.logGuardAccess(0, 'unknown', 'EmpresaGuard', false, {
        reason: 'no_user_in_request',
        path: request.url,
        method: request.method,
      });
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Si el usuario no tiene empresa configurada, denegar acceso
    if (!user?.empresaId) {
      this.jwtAuditService.logGuardAccess(
        user.id,
        user.email,
        'EmpresaGuard',
        false,
        {
          reason: 'no_empresa_id',
          path: request.url,
          method: request.method,
          validationReason: reason,
        },
      );

      throw new ForbiddenException({
        message:
          'Se requiere configurar una empresa para acceder a este recurso',
        code: 'EMPRESA_REQUIRED',
        needsSetup: true,
        redirectTo: '/setup-empresa',
      });
    }

    // Validación adicional: verificar que la empresa existe y está activa usando cache
    try {
      const empresa = await this.empresaCache.getEmpresa(user.empresaId);

      if (!empresa) {
        this.jwtAuditService.logEmpresaValidation(
          user.id,
          user.email,
          user.empresaId,
          false,
          {
            reason: 'empresa_not_found',
            path: request.url,
            method: request.method,
          },
        );

        throw new ForbiddenException({
          message: 'La empresa asociada no existe o ha sido eliminada',
          code: 'EMPRESA_NOT_FOUND',
          needsSetup: true,
          redirectTo: '/setup-empresa',
        });
      }

      // Log de acceso exitoso
      this.jwtAuditService.logGuardAccess(
        user.id,
        user.email,
        'EmpresaGuard',
        true,
        {
          empresaId: user.empresaId,
          empresaName: empresa.nombre,
          path: request.url,
          method: request.method,
          validationReason: reason,
        },
      );

      return true;
    } catch (error) {
      // Si es un error de ForbiddenException, re-lanzarlo
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // Para otros errores (DB, etc.), log y denegar acceso
      this.jwtAuditService.logGuardAccess(
        user.id,
        user.email,
        'EmpresaGuard',
        false,
        {
          reason: 'validation_error',
          error: error.message,
          path: request.url,
          method: request.method,
        },
      );

      throw new ForbiddenException({
        message: 'Error al validar la empresa',
        code: 'EMPRESA_VALIDATION_ERROR',
        needsSetup: true,
        redirectTo: '/setup-empresa',
      });
    }
  }
}
