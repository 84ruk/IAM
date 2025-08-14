import { Injectable, NestMiddleware, Logger, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class IPValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IPValidationMiddleware.name);
  
  // IPs permitidas para dispositivos IoT (redes locales y ESP32)
  private readonly allowedNetworks = [
    '192.168.0.0/16',  // Red local común
    '10.0.0.0/8',      // Red privada clase A
    '172.16.0.0/12',   // Red privada clase B
    '127.0.0.1',       // Localhost
    '0.0.0.0',         // Todas las IPs (para desarrollo)
  ];

  // IPs específicas de ESP32 conocidas
  private readonly esp32KnownIPs = [
    '192.168.4.1',     // ESP32 AP mode
    '192.168.1.100',   // ESP32 común
    '192.168.1.101',   // ESP32 común
    '192.168.1.102',   // ESP32 común
  ];

  use(req: Request, res: Response, next: NextFunction) {
    // Solo aplicar a endpoints IoT
    const url = req.url as string;
    const method = req.method;
    
    this.logger.log(`🔍 Middleware IPValidation - URL: ${url} - Method: ${method}`);
    
    // 🔍 Detectar rutas IoT de manera más robusta
    const isIoTRoute = this.isIoTRoute(url);
    this.logger.log(`🔍 ¿Es ruta IoT? ${url} -> ${isIoTRoute ? '✅ SÍ' : '❌ NO'}`);
    
    if (!isIoTRoute) {
      this.logger.log(`⏭️ No es ruta IoT, saltando middleware: ${url}`);
      return next();
    }

    const clientIP = this.getClientIP(req);
    this.logger.log(`🔍 Validando IP para endpoint IoT: ${clientIP} - URL: ${url} - Method: ${method}`);
    this.logger.log(`🌐 User-Agent: ${req.headers['user-agent'] || 'No especificado'}`);
    this.logger.log(`🔑 Headers ESP32: x-empresa-id=${req.headers['x-empresa-id']}, x-device-type=${req.headers['x-device-type']}`);

    // 🎯 POLÍTICA PERMISIVA: Permitir TODOS los endpoints IoT
    this.logger.log(`✅ Endpoint IoT detectado, permitiendo acceso desde IP: ${clientIP}`);
    this.logger.log(`🌐 URL: ${url}`);
    this.logger.log(`🤖 User-Agent: ${req.headers['user-agent'] || 'No especificado'}`);
    
    // Siempre permitir acceso a endpoints IoT
    this.logger.log(`✅ Acceso permitido para endpoint IoT: ${url}`);
    return next();
  }

  private getClientIP(req: Request): string {
    // Obtener IP real considerando proxies
    return (req.headers['x-forwarded-for'] as string) ||
           (req.headers['x-real-ip'] as string) ||
           ((req as any).connection?.remoteAddress) ||
           ((req as any).socket?.remoteAddress) ||
           '0.0.0.0';
  }

  private isLikelyESP32(req: Request): boolean {
    const userAgent = (req.headers['user-agent'] as string) || '';
    const isESP32 = userAgent.includes('ESP32') || 
                    userAgent.includes('Arduino') || 
                    userAgent.includes('ESP8266') ||
                    userAgent.includes('IoT') ||
                    userAgent.includes('Sensor') ||
                    userAgent.includes('ESP32HTTPClient') ||
                    userAgent.includes('HTTPClient');
    
    // También verificar por headers específicos de ESP32
    const hasESP32Headers = req.headers['x-esp32-device'] || 
                           req.headers['x-device-type'] === 'esp32' ||
                           req.headers['x-iot-device'] ||
                           req.headers['x-device-id'];
    
    // Verificar por contenido del body (para POST requests)
    const hasIoTBody = req.body && (
      req.body.deviceId || 
      req.body.apiToken || 
      req.body.empresaId ||
      req.body.sensors
    );
    
    return isESP32 || !!hasESP32Headers || !!hasIoTBody;
  }

  private hasValidIoTToken(req: Request): boolean {
    // Verificar si tiene token en headers o body
    const authHeader = req.headers.authorization;
    const hasAuthHeader = authHeader && (
      authHeader.startsWith('Bearer ') || 
      authHeader.startsWith('Token ')
    );
    
    const hasTokenInBody = req.body && req.body.apiToken;
    const hasDeviceId = req.body && req.body.deviceId;
    
    return hasAuthHeader || (hasTokenInBody && hasDeviceId);
  }

  private isConfigurationEndpoint(url: string): boolean {
    // Permitir endpoints de configuración para dispositivos IoT
    const configEndpoints = [
      '/iot/config',
      '/iot/health',
      '/iot/server-info'
    ];
    
    return configEndpoints.some(endpoint => url.includes(endpoint));
  }

  private isHealthEndpoint(url: string): boolean {
    // Permitir endpoints de health para dispositivos IoT
    const healthEndpoints = [
      '/iot/health', 
      '/iot/server-info',
      '/iot/stats'
    ];
    
    return healthEndpoints.some(endpoint => url.includes(endpoint));
  }

  private isReadingEndpoint(url: string): boolean {
    // Permitir endpoints de lecturas para dispositivos IoT
    const readingEndpoints = [
      '/iot/lecturas',
      '/iot/readings', 
      '/iot/data',
      '/iot/sensor-data'
    ];
    
    return readingEndpoints.some(endpoint => url.includes(endpoint));
  }

  private isIPAllowed(ip: string): boolean {
    // Simplificar para desarrollo - en producción usar librería como 'ip-range-check'
    return this.allowedNetworks.some(network => {
      if (network.includes('/')) {
        // Validación básica de CIDR (simplificada)
        return this.isInCIDRRange(ip, network);
      }
      return ip === network;
    });
  }

  private isInCIDRRange(ip: string, cidr: string): boolean {
    // Implementación simplificada - en producción usar librería especializada
    const [network, bits] = cidr.split('/');
    const networkParts = network.split('.').map(Number);
    const ipParts = ip.split('.').map(Number);
    
    // Validación básica para desarrollo
    return networkParts[0] === ipParts[0] && networkParts[1] === ipParts[1];
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
}
