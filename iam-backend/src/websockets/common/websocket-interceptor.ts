import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WebSocketInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WebSocketInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const client: Socket = context.switchToWs().getClient();
    const eventName = context.switchToWs().getData()?.event || 'unknown';
    const user = client.data.user;
    
    const startTime = Date.now();
    
    this.logger.log(`WebSocket Event: ${eventName} - User: ${user?.email || 'unknown'} - Socket: ${client.id}`);

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        this.logger.log(`WebSocket Event Completed: ${eventName} - Duration: ${duration}ms`);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(`WebSocket Event Error: ${eventName} - Duration: ${duration}ms - Error: ${error.message}`);
        
        // Convertir errores a formato WebSocket
        if (error instanceof WsException) {
          return throwError(() => error);
        }
        
        // Convertir errores HTTP a WebSocket
        return throwError(() => new WsException({
          message: error.message || 'Error interno del servidor',
          status: error.status || 500,
          timestamp: new Date().toISOString(),
        }));
      }),
    );
  }
} 