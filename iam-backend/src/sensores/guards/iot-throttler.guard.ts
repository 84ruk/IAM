import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class IoTThrottlerGuard extends ThrottlerGuard {
  protected getThrottleOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    
    // Para endpoints IoT, permitir más peticiones
    if (req.url.startsWith('/iot/')) {
      return [
        {
          ttl: 60000, // 1 minuto
          limit: 30, // 30 peticiones por minuto para IoT
        },
        {
          ttl: 3600000, // 1 hora
          limit: 300, // 300 peticiones por hora para IoT
        },
      ];
    }
    
    // Para otros endpoints, usar configuración por defecto
    return [
      {
        ttl: 60000,
        limit: 10,
      },
      {
        ttl: 3600000,
        limit: 100,
      },
    ];
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Usar deviceId como tracker para dispositivos IoT
    if (req.url.startsWith('/iot/') && req.body?.deviceId) {
      return `iot:${req.body.deviceId}`;
    }
    
    // Para otros endpoints, usar IP
    return req.ips.length ? req.ips[0] : req.ip;
  }
}
