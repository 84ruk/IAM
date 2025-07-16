import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (user.rol !== 'SUPERADMIN') {
      throw new ForbiddenException(
        'Acceso denegado. Se requiere rol de Super Administrador',
      );
    }

    return true;
  }
}
