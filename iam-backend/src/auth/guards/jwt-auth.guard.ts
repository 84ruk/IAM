import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    // Verificar si la ruta está marcada como pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug(
        `Ruta pública detectada: ${req.method} ${req.url}`,
      );
      return true;
    }

    // Log de información no sensible
    this.logger.debug(
      `Validando autenticación para: ${req.method} ${req.url}`,
    );

    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    if (err || !user) {
      this.logger.warn('Autenticación fallida', {
        reason: info?.message || 'Usuario no encontrado',
        path: context.switchToHttp().getRequest().url,
      });
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // Validación adicional de claims requeridos
    if (!user.id || !user.email || !user.rol) {
      this.logger.warn('Claims faltantes en token', {
        userId: user.id,
        userEmail: user.email,
        missingClaims: {
          id: !user.id,
          email: !user.email,
          rol: !user.rol,
        },
      });
      throw new UnauthorizedException(
        'Token malformado: claims requeridos faltantes',
      );
    }

    this.logger.log('Autenticación exitosa', {
      userId: user.id,
      userEmail: user.email,
      rol: user.rol,
      empresaId: user.empresaId,
    });

    return user;
  }
}
