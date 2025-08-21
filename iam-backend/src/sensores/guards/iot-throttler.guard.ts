import { Injectable, ExecutionContext, Logger, CanActivate } from '@nestjs/common';

@Injectable()
export class IoTThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(IoTThrottlerGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const url = req.url;
    
    // 🔓 Para endpoints IoT, SIEMPRE permitir acceso (sin throttling)
    if (this.isIoTRoute(url)) {
      this.logger.log(`🔓 IoTThrottlerGuard - PERMITIENDO acceso IoT SIN LÍMITES a: ${req.method} ${url}`);
      this.logger.log(`🔓 IoTThrottlerGuard - Device: ${req.body?.deviceId || 'N/A'}, IP: ${this.getClientIP(req)}`);
      return true; // 🔓 SIEMPRE permitir para IoT
    }
    
    this.logger.log(`⏱️ IoTThrottlerGuard - Ruta no IoT, permitiendo acceso normal: ${req.method} ${url}`);
    return true; // 🔓 Permitir acceso normal para otros endpoints
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

  private getClientIP(req: any): string {
    return (req.headers['x-forwarded-for'] as string) ||
           (req.headers['x-real-ip'] as string) ||
           ((req as any).connection?.remoteAddress) ||
           ((req as any).socket?.remoteAddress) ||
           '0.0.0.0';
  }
}
