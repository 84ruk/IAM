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

@Injectable()
export class SimpleEmpresaGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
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

    // 3. Lógica simplificada para configuracionNotificaciones
    const currentUrl = request.url;
    const method = request.method;

    // Endpoints que pueden funcionar sin empresa
    const canWorkWithoutEmpresa = [
      '/auth/me',
      '/auth/needs-setup',
      '/auth/setup-empresa',
      '/auth/logout',
      '/auth/google/status',
      '/users', // Para admin global
    ];

    // Si el endpoint puede funcionar sin empresa
    if (
      canWorkWithoutEmpresa.some((endpoint) => currentUrl.startsWith(endpoint))
    ) {
      return true;
    }

    // Para configuracionNotificaciones, siempre requerir empresa
    return await this.validateEmpresaAccess(user, request);
  }

  private async validateEmpresaAccess(
    user: JwtUser,
    request: any,
  ): Promise<boolean> {
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Si el usuario no tiene empresa configurada, denegar acceso
    if (!user?.empresaId) {
      throw new ForbiddenException({
        message:
          'Se requiere configurar una empresa para acceder a este recurso',
        code: 'EMPRESA_REQUIRED',
        needsSetup: true,
        redirectTo: '/setup-empresa',
      });
    }

    // Validación simplificada: verificar que la empresa existe
    try {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: user.empresaId },
        select: { id: true, nombre: true }
      });

      if (!empresa) {
        throw new ForbiddenException({
          message: 'La empresa asociada no existe o ha sido eliminada',
          code: 'EMPRESA_NOT_FOUND',
          needsSetup: true,
          redirectTo: '/setup-empresa',
        });
      }

      return true;
    } catch (error) {
      // Si es un error de ForbiddenException, re-lanzarlo
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // Para otros errores (DB, etc.), denegar acceso
      throw new ForbiddenException({
        message: 'Error al validar la empresa',
        code: 'EMPRESA_VALIDATION_ERROR',
        needsSetup: true,
        redirectTo: '/setup-empresa',
      });
    }
  }
} 