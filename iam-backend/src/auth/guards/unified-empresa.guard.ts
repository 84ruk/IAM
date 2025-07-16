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

// Configuración de endpoints para optimizar validaciones
const ENDPOINT_CONFIG = {
  // Endpoints que siempre requieren empresa (CRUD de datos)
  ALWAYS_REQUIRE_EMPRESA: new Set([
    '/productos',
    '/proveedores',
    '/movimientos',
    '/pedidos',
    '/inventario',
    '/dashboard',
    '/empresas',
  ]),

  // Endpoints que pueden funcionar sin empresa
  CAN_WORK_WITHOUT_EMPRESA: new Set([
    '/auth/me',
    '/auth/needs-setup',
    '/auth/setup-empresa',
    '/auth/logout',
    '/auth/google/status',
    '/users', // Para admin global
  ]),

  // Endpoints de setup y configuración
  SETUP_ENDPOINTS: new Set([
    '/auth/setup-empresa',
    '/auth/needs-setup',
    '/empresas/create',
  ]),
} as const;

@Injectable()
export class UnifiedEmpresaGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private jwtAuditService: JwtAuditService,
    private empresaCache: EmpresaCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtUser = request.user;
    const currentUrl = request.url;
    const method = request.method;

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
    const validationResult = this.determineValidationStrategy(
      currentUrl,
      isEmpresaRequired,
    );

    // 4. Aplicar la estrategia de validación correspondiente
    switch (validationResult.strategy) {
      case 'SKIP_VALIDATION':
        return true;

      case 'REQUIRE_EMPRESA':
        return await this.validateEmpresaAccess(
          user,
          request,
          validationResult.reason,
        );

      case 'ALLOW_WITHOUT_EMPRESA':
        return true;

      case 'CONDITIONAL_VALIDATION':
        return await this.validateConditionalAccess(
          user,
          request,
          validationResult.reason,
        );

      default:
        return await this.validateEmpresaAccess(
          user,
          request,
          'default_requirement',
        );
    }
  }

  /**
   * Determina la estrategia de validación basada en el endpoint y configuración
   */
  private determineValidationStrategy(
    url: string,
    isEmpresaRequired: boolean,
  ): {
    strategy:
      | 'SKIP_VALIDATION'
      | 'REQUIRE_EMPRESA'
      | 'ALLOW_WITHOUT_EMPRESA'
      | 'CONDITIONAL_VALIDATION';
    reason: string;
  } {
    // Si el endpoint requiere empresa explícitamente
    if (isEmpresaRequired) {
      return { strategy: 'REQUIRE_EMPRESA', reason: 'explicit_requirement' };
    }

    // Verificar si es un endpoint de setup
    if (ENDPOINT_CONFIG.SETUP_ENDPOINTS.has(url)) {
      return { strategy: 'CONDITIONAL_VALIDATION', reason: 'setup_endpoint' };
    }

    // Verificar si puede funcionar sin empresa
    if (ENDPOINT_CONFIG.CAN_WORK_WITHOUT_EMPRESA.has(url)) {
      return {
        strategy: 'ALLOW_WITHOUT_EMPRESA',
        reason: 'can_work_without_empresa',
      };
    }

    // Verificar si siempre requiere empresa
    if (ENDPOINT_CONFIG.ALWAYS_REQUIRE_EMPRESA.has(url)) {
      return { strategy: 'REQUIRE_EMPRESA', reason: 'always_required' };
    }

    // Por defecto, requerir empresa para endpoints autenticados
    return { strategy: 'REQUIRE_EMPRESA', reason: 'default_requirement' };
  }

  /**
   * Validación condicional para endpoints de setup
   */
  private async validateConditionalAccess(
    user: JwtUser,
    request: any,
    reason: string,
  ): Promise<boolean> {
    if (!user) {
      this.logGuardAccess(0, 'unknown', false, {
        reason: 'no_user_in_request',
        path: request.url,
        method: request.method,
      });
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Para endpoints de setup, permitir acceso si no tiene empresa configurada
    if (!user.empresaId) {
      this.logGuardAccess(user.id, user.email, true, {
        reason: 'setup_allowed_without_empresa',
        path: request.url,
        method: request.method,
      });
      return true;
    }

    // Si ya tiene empresa, validar que existe
    return await this.validateEmpresaAccess(user, request, reason);
  }

  /**
   * Validación principal de acceso a empresa
   */
  private async validateEmpresaAccess(
    user: JwtUser,
    request: any,
    reason: string,
  ): Promise<boolean> {
    if (!user) {
      this.logGuardAccess(0, 'unknown', false, {
        reason: 'no_user_in_request',
        path: request.url,
        method: request.method,
      });
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Si el usuario no tiene empresa configurada, denegar acceso
    if (!user.empresaId) {
      this.logGuardAccess(user.id, user.email, false, {
        reason: 'no_empresa_id',
        path: request.url,
        method: request.method,
        validationReason: reason,
      });

      throw new ForbiddenException({
        message:
          'Se requiere configurar una empresa para acceder a este recurso',
        code: 'EMPRESA_REQUIRED',
        needsSetup: true,
        redirectTo: '/setup-empresa',
      });
    }

    // Validación optimizada usando cache
    try {
      const empresa = await this.empresaCache.getEmpresa(user.empresaId);

      if (!empresa) {
        this.logEmpresaValidation(user.id, user.email, user.empresaId, false, {
          reason: 'empresa_not_found',
          path: request.url,
          method: request.method,
        });

        throw new ForbiddenException({
          message: 'La empresa asociada no existe o ha sido eliminada',
          code: 'EMPRESA_NOT_FOUND',
          needsSetup: true,
          redirectTo: '/setup-empresa',
        });
      }

      // Log de acceso exitoso
      this.logGuardAccess(user.id, user.email, true, {
        empresaId: user.empresaId,
        empresaName: empresa.nombre,
        path: request.url,
        method: request.method,
        validationReason: reason,
      });

      return true;
    } catch (error) {
      // Si es un error de ForbiddenException, re-lanzarlo
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // Para otros errores (DB, etc.), log y denegar acceso
      this.logGuardAccess(user.id, user.email, false, {
        reason: 'validation_error',
        error: error.message,
        path: request.url,
        method: request.method,
      });

      throw new ForbiddenException({
        message: 'Error al validar la empresa',
        code: 'EMPRESA_VALIDATION_ERROR',
        needsSetup: true,
        redirectTo: '/setup-empresa',
      });
    }
  }

  /**
   * Métodos de logging optimizados
   */
  private logGuardAccess(
    userId: number,
    email: string,
    success: boolean,
    metadata: any,
  ): void {
    this.jwtAuditService.logGuardAccess(
      userId,
      email,
      'UnifiedEmpresaGuard',
      success,
      metadata,
    );
  }

  private logEmpresaValidation(
    userId: number,
    email: string,
    empresaId: number,
    success: boolean,
    metadata: any,
  ): void {
    this.jwtAuditService.logEmpresaValidation(
      userId,
      email,
      empresaId,
      success,
      metadata,
    );
  }
}
