import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import { Rol } from '@prisma/client';

// Roles que pueden acceder a datos financieros completos
const FINANCIAL_DATA_ROLES: Rol[] = ['SUPERADMIN', 'ADMIN'];

// Roles que pueden acceder a datos financieros limitados (solo ventas, no compras)
const LIMITED_FINANCIAL_ROLES: Rol[] = ['EMPLEADO'];

// Roles que NO pueden acceder a datos financieros
const NO_FINANCIAL_ACCESS_ROLES: Rol[] = ['PROVEEDOR'];

@Injectable()
export class FinancialDataGuard implements CanActivate {
  private readonly logger = new Logger(FinancialDataGuard.name);

  constructor(
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtUser = request.user;

    if (!user) {
      this.logger.warn('Acceso denegado: usuario no autenticado', {
        path: request.url,
        method: request.method,
        guard: 'FinancialDataGuard',
      });
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Verificar si el endpoint requiere acceso a datos financieros
    const requiresFinancialAccess = this.reflector.getAllAndOverride<boolean>(
      'requiresFinancialAccess',
      [context.getHandler(), context.getClass()],
    );

    // Si no requiere acceso financiero, permitir
    if (!requiresFinancialAccess) {
      return true;
    }

    // Verificar permisos basados en rol
    const hasFullAccess = FINANCIAL_DATA_ROLES.includes(user.rol);
    const hasLimitedAccess = LIMITED_FINANCIAL_ROLES.includes(user.rol);
    const hasNoAccess = NO_FINANCIAL_ACCESS_ROLES.includes(user.rol);

    if (hasNoAccess) {
      this.logger.warn('Acceso denegado a datos financieros', {
        userId: user.id,
        userEmail: user.email,
        rol: user.rol,
        path: request.url,
        method: request.method,
        guard: 'FinancialDataGuard',
        reason: 'rol_sin_permisos_financieros',
      });
      throw new ForbiddenException({
        message: 'No tienes permisos para acceder a datos financieros',
        code: 'FINANCIAL_DATA_ACCESS_DENIED',
        requiredRole: 'ADMIN o SUPERADMIN',
      });
    }

    // Log de acceso exitoso
    this.logger.log('Acceso a datos financieros autorizado', {
      userId: user.id,
      userEmail: user.email,
      rol: user.rol,
      path: request.url,
      method: request.method,
      guard: 'FinancialDataGuard',
      accessLevel: hasFullAccess ? 'full' : 'limited',
    });

    // Agregar información de acceso al request para uso posterior
    request.financialAccessLevel = hasFullAccess ? 'full' : 'limited';
    request.userRole = user.rol;

    return true;
  }
} 