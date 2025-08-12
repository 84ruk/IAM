import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';

@Injectable()
export class IoTExcludedThrottlerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    
    // 🔧 EXCLUIR rutas IoT del throttling
    if (url.startsWith('/sensores/iot/') || 
        url.startsWith('/iot/') ||
        url.includes('/iot/')) {
      console.log(`🔓 Ruta IoT detectada, omitiendo throttling: ${url}`);
      return true; // Permitir acceso sin throttling para rutas IoT
    }
    
    // Para todas las demás rutas, permitir acceso (el ThrottlerGuard global se encargará)
    console.log(`⏱️ Ruta no IoT, permitiendo acceso: ${url}`);
    return true;
  }
}

