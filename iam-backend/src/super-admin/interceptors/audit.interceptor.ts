import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService } from '../audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;
    const method = request.method;
    const url = request.url;
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || 'Unknown';

    // Solo auditar si hay un usuario autenticado
    if (!user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (data) => {
        try {
          // Determinar la acción basada en el método HTTP y la URL
          const action = this.determineAction(method, url);
          const resource = this.determineResource(url);
          const details = this.generateDetails(method, url, data);

          // Solo auditar acciones específicas del super admin
          if (this.shouldAudit(url)) {
            await this.auditService.log({
              userId: user.id,
              userEmail: user.email,
              userName: user.nombre,
              action,
              resource,
              details,
              ipAddress,
              userAgent,
              empresaId: user.empresaId,
              empresaName: user.empresa?.nombre,
            });
          }
        } catch (error) {
          // No fallar la operación principal si la auditoría falla
          console.error('Error en auditoría:', error);
        }
      }),
    );
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'Unknown'
    );
  }

  private determineAction(method: string, url: string): string {
    if (method === 'GET') {
      if (url.includes('/audit/')) return 'VIEW';
      if (url.includes('/stats') || url.includes('/dashboard')) return 'VIEW';
      return 'VIEW';
    }
    if (method === 'POST') return 'CREATE';
    if (method === 'PUT') return 'UPDATE';
    if (method === 'DELETE') return 'DELETE';
    return 'UNKNOWN';
  }

  private determineResource(url: string): string {
    if (url.includes('/users')) return 'USER';
    if (url.includes('/empresas')) return 'EMPRESA';
    if (url.includes('/audit/')) return 'AUDIT';
    if (url.includes('/stats')) return 'STATS';
    if (url.includes('/config')) return 'SYSTEM';
    if (url.includes('/dashboard')) return 'DASHBOARD';
    return 'SYSTEM';
  }

  private generateDetails(method: string, url: string, data?: any): string {
    if (method === 'GET') {
      if (url.includes('/users')) return 'Consulta de usuarios';
      if (url.includes('/empresas')) return 'Consulta de empresas';
      if (url.includes('/audit/')) return 'Consulta de logs de auditoría';
      if (url.includes('/stats')) return 'Consulta de estadísticas';
      if (url.includes('/config')) return 'Consulta de configuración';
      if (url.includes('/dashboard')) return 'Consulta del dashboard';
      return 'Consulta del sistema';
    }

    if (method === 'POST') {
      if (url.includes('/config/test-email'))
        return 'Prueba de configuración de email';
      if (url.includes('/config/backup')) return 'Inicio de backup manual';
      return 'Creación de recurso';
    }

    if (method === 'PUT') {
      if (url.includes('/users/') && url.includes('/activate'))
        return 'Activación de usuario';
      if (url.includes('/users/') && url.includes('/deactivate'))
        return 'Desactivación de usuario';
      if (url.includes('/users/bulk/activate'))
        return 'Activación masiva de usuarios';
      if (url.includes('/users/bulk/deactivate'))
        return 'Desactivación masiva de usuarios';
      if (url.includes('/config'))
        return 'Actualización de configuración del sistema';
      return 'Actualización de recurso';
    }

    if (method === 'DELETE') {
      if (url.includes('/users/')) return 'Eliminación de usuario';
      if (url.includes('/users/bulk/delete'))
        return 'Eliminación masiva de usuarios';
      return 'Eliminación de recurso';
    }

    return 'Acción del sistema';
  }

  private shouldAudit(url: string): boolean {
    // Solo auditar endpoints específicos del super admin
    const auditEndpoints = [
      '/super-admin/users',
      '/super-admin/empresas',
      '/super-admin/audit',
      '/super-admin/stats',
      '/super-admin/config',
      '/super-admin/dashboard',
    ];

    return auditEndpoints.some((endpoint) => url.includes(endpoint));
  }
}
