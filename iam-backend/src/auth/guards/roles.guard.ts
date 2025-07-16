import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '@prisma/client';
import { JwtUser } from '../interfaces/jwt-user.interface';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user }: { user: JwtUser } = context.switchToHttp().getRequest();
    if (!requiredRoles.includes(user.rol)) {
      throw new ForbiddenException(
        `Acceso denegado: se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
      );
    }
    return requiredRoles.includes(user.rol);
  }
}
