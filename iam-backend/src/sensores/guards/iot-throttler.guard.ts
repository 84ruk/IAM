import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class IoTThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(IoTThrottlerGuard.name);

  protected getThrottleOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const url = req.url;
    
    this.logger.log(`🔓 IoTThrottlerGuard - Procesando: ${req.method} ${url}`);
    
    // 🔓 Para endpoints IoT, permitir más peticiones
    if (this.isIoTRoute(url)) {
      this.logger.log(`🔓 Ruta IoT detectada en IoTThrottlerGuard: ${url}`);
      return [
        {
          ttl: 60000, // 1 minuto
          limit: 999999, // Límite muy alto (efectivamente sin límite)
        },
        {
          ttl: 3600000, // 1 hora
          limit: 999999, // Límite muy alto
        },
      ];
    }
    
    this.logger.log(`⏱️ Ruta no IoT en IoTThrottlerGuard: ${url}`);
    
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
    const url = req.url;
    
    // 🔓 Usar deviceId como tracker para dispositivos IoT
    if (this.isIoTRoute(url) && req.body?.deviceId) {
      const tracker = `iot:${req.body.deviceId}`;
      this.logger.log(`🔓 IoTThrottlerGuard - Usando deviceId como tracker: ${url} -> ${tracker}`);
      return tracker;
    }
    
    // Para otros endpoints, usar IP
    const ip = req.ips.length ? req.ips[0] : req.ip;
    this.logger.log(`⏱️ IoTThrottlerGuard - Usando IP como tracker: ${url} -> ${ip}`);
    return ip;
  }

  private isIoTRoute(url: string): boolean {
    // 🔍 Detectar rutas IoT de manera más robusta
    const iotPatterns = [
      '/sensores/iot/',
      '/iot/',
      'iot/',
      'iot'
    ];
    
    const isIoT = iotPatterns.some(pattern => 
      url.toLowerCase().includes(pattern.toLowerCase())
    );
    
    this.logger.log(`🔍 IoTThrottlerGuard - Verificando si es ruta IoT: ${url} -> ${isIoT ? '✅ SÍ' : '❌ NO'}`);
    
    return isIoT;
  }
}
