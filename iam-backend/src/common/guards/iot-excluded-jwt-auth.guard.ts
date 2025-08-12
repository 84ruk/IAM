import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class IoTExcludedJwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    
    // 🔧 EXCLUIR rutas IoT del JWT auth
    if (url.startsWith('/sensores/iot/') || 
        url.startsWith('/iot/') ||
        url.includes('/iot/')) {
      console.log(`🔓 Ruta IoT detectada, omitiendo JWT auth: ${url}`);
      return true; // Permitir acceso sin JWT para rutas IoT
    }
    
    // Para todas las demás rutas, permitir acceso (el JWT auth se aplicará después)
    console.log(`🔐 Ruta no IoT, permitiendo acceso: ${url}`);
    return true;
  }
}
