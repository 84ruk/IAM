import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ValidationError } from 'class-validator';

@Injectable()
export class ValidationLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ValidationLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { url, method, body } = request;

    this.logger.log(`🔍 Interceptando ${method} ${url}`);
    this.logger.log(`📦 Body recibido:`, JSON.stringify(body, null, 2));

    return next.handle().pipe(
      catchError(error => {
        if (error?.response?.message && Array.isArray(error.response.message)) {
          this.logger.error(`❌ Errores de validación en ${method} ${url}:`);
          error.response.message.forEach((err: any) => {
            this.logger.error(`  - ${err}`);
          });
          this.logger.error(`📦 Body que causó el error:`, JSON.stringify(body, null, 2));
        } else if (error?.message) {
          this.logger.error(`❌ Error en ${method} ${url}: ${error.message}`);
          this.logger.error(`📦 Body que causó el error:`, JSON.stringify(body, null, 2));
        }
        
        return throwError(() => error);
      })
    );
  }
}
