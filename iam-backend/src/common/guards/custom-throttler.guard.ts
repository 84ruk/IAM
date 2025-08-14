import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(CustomThrottlerGuard.name);

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const url = req.url;
    
    // 🔓 Para rutas IoT, usar deviceId como tracker (si está disponible)
    if (this.isIoTRoute(url)) {
      if (req.body?.deviceId) {
        const tracker = `iot:${req.body.deviceId}`;
        this.logger.log(`🔓 Ruta IoT detectada, usando deviceId como tracker: ${url} -> ${tracker}`);
        return tracker;
      } else {
        // Si no hay deviceId, usar IP pero con prefijo IoT
        const ip = req.ips.length ? req.ips[0] : req.ip;
        const tracker = `iot-ip:${ip}`;
        this.logger.log(`🔓 Ruta IoT sin deviceId, usando IP como tracker: ${url} -> ${tracker}`);
        return tracker;
      }
    }
    
    // Para otras rutas, usar IP normal
    const ip = req.ips.length ? req.ips[0] : req.ip;
    this.logger.log(`⏱️ Ruta no IoT, usando IP como tracker: ${url} -> ${ip}`);
    return ip;
  }

  protected getThrottleOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const url = req.url;
    
    // 🔓 EXCLUIR COMPLETAMENTE rutas IoT del throttling global
    if (this.isIoTRoute(url)) {
      this.logger.log(`🔓 Ruta IoT detectada, EXCLUYENDO del throttling: ${url}`);
      return [
        {
          ttl: 1000, // 1 segundo
          limit: 999999, // Límite muy alto (efectivamente sin límite)
        },
        {
          ttl: 60000, // 1 minuto
          limit: 999999, // Límite muy alto
        },
        {
          ttl: 3600000, // 1 hora
          limit: 999999, // Límite muy alto
        }
      ];
    }
    
    this.logger.log(`⏱️ Ruta no IoT, aplicando throttling normal: ${url}`);
    
    // Para otras rutas, usar configuración normal
    return [
      {
        ttl: 60000, // 1 minuto
        limit: 10, // 10 peticiones por minuto
      },
      {
        ttl: 3600000, // 1 hora
        limit: 100, // 100 peticiones por hora
      },
    ];
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
    
    this.logger.log(`🔍 Verificando si es ruta IoT: ${url} -> ${isIoT ? '✅ SÍ' : '❌ NO'}`);
    
    return isIoT;
  }

  // 🔓 Sobrescribir el método canActivate para logging adicional
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const url = req.url;
    const method = req.method;
    
    this.logger.log(`🔓 CustomThrottlerGuard - Procesando: ${method} ${url}`);
    
    if (this.isIoTRoute(url)) {
      this.logger.log(`🔓 Ruta IoT detectada, permitiendo acceso sin throttling: ${url}`);
      // 🔓 PARA RUTAS IoT, RETORNAR TRUE DIRECTAMENTE SIN APLICAR THROTTLING
      // Esto evita que el throttler global interfiera con los guards específicos de IoT
      return true;
    } else {
      this.logger.log(`⏱️ Ruta no IoT, aplicando throttling: ${url}`);
      return super.canActivate(context);
    }
  }
}

