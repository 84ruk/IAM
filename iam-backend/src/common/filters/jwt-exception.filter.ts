// src/common/filters/jwt-exception.filter.ts
import { ExceptionFilter, Catch, UnauthorizedException, ArgumentsHost } from '@nestjs/common';

@Catch(UnauthorizedException)
export class JwtExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    response.status(401).json({
      statusCode: 401,
      message: exception.message === 'jwt expired'
        ? 'Tu sesión ha expirado, por favor inicia sesión de nuevo.'
        : exception.message,
      error: 'No Autorizado',
    });
  }
}