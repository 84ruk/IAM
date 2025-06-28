import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtUser;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Solo SUPERADMIN y ADMIN pueden acceder
    if (user.rol !== 'SUPERADMIN' && user.rol !== 'ADMIN') {
      throw new ForbiddenException('Acceso denegado. Se requieren permisos de administrador');
    }

    return true;
  }
} 