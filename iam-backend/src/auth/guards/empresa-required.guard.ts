import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtUser } from '../interfaces/jwt-user.interface';
import { EMPRESA_REQUIRED_KEY } from '../decorators/empresa-required.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuditService } from '../jwt-audit.service';
import { EmpresaCacheService } from '../empresa-cache.service';

@Injectable()
export class EmpresaRequiredGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private jwtAuditService: JwtAuditService,
    private empresaCache: EmpresaCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isEmpresaRequired = this.reflector.getAllAndOverride<boolean>(
      EMPRESA_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si el endpoint no requiere empresa, permitir acceso
    if (!isEmpresaRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtUser = request.user;

    if (!user) {
      this.jwtAuditService.logGuardAccess(0, 'unknown', 'EmpresaRequiredGuard', false, {
        reason: 'no_user_in_request',
        path: request.url,
        method: request.method,
      });
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Si el usuario no tiene empresa configurada, denegar acceso
    if (!user?.empresaId) {
      this.jwtAuditService.logGuardAccess(user.id, user.email, 'EmpresaRequiredGuard', false, {
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
      this.jwtAuditService.logGuardAccess(user.id, user.email, 'EmpresaRequiredGuard', true, {
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
      this.jwtAuditService.logGuardAccess(user.id, user.email, 'EmpresaRequiredGuard', false, {
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