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
    if (!req.url.startsWith('/iot/')) {
      return next();
    }

    const clientIP = this.getClientIP(req);
    this.logger.debug(`🔍 Validando IP para endpoint IoT: ${clientIP} - URL: ${req.url}`);

    // En desarrollo, permitir todas las IPs
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug('✅ Modo desarrollo: permitiendo todas las IPs');
      return next();
    }

    // Verificar si es una IP conocida de ESP32
    if (this.esp32KnownIPs.includes(clientIP)) {
      this.logger.debug(`✅ IP de ESP32 conocida permitida: ${clientIP}`);
      return next();
    }

    // En producción, validar IPs permitidas
    if (!this.isIPAllowed(clientIP)) {
      this.logger.warn(`❌ IP no permitida para endpoint IoT: ${clientIP}`);
      this.logger.warn(`📡 Endpoint: ${req.url}`);
      this.logger.warn(`🌐 User-Agent: ${req.headers['user-agent']}`);
      
      // En lugar de bloquear, permitir con advertencia para ESP32
      if (this.isLikelyESP32(req)) {
        this.logger.warn(`⚠️ IP no permitida pero parece ESP32, permitiendo acceso`);
        return next();
      }
      
      throw new ForbiddenException('IP no autorizada para dispositivos IoT');
    }

    this.logger.debug(`✅ IP autorizada para endpoint IoT: ${clientIP}`);
    next();
  }

  private getClientIP(req: Request): string {
    // Obtener IP real considerando proxies
    return req.headers['x-forwarded-for'] as string ||
           req.headers['x-real-ip'] as string ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           '0.0.0.0';
  }

  private isLikelyESP32(req: Request): boolean {
    const userAgent = req.headers['user-agent'] || '';
    const isESP32 = userAgent.includes('ESP32') || 
                    userAgent.includes('Arduino') || 
                    userAgent.includes('ESP8266') ||
                    userAgent.includes('IoT') ||
                    userAgent.includes('Sensor');
    
    // También verificar por headers específicos de ESP32
    const hasESP32Headers = req.headers['x-esp32-device'] || 
                           req.headers['x-device-type'] === 'esp32';
    
    return isESP32 || !!hasESP32Headers;
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
}
