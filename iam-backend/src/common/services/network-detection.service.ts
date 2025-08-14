import { Injectable, Logger } from '@nestjs/common';
import { networkInterfaces } from 'os';

export interface NetworkInfo {
  localIP: string;
  externalIP?: string;
  networkInterface: string;
  isLocalNetwork: boolean;
}

@Injectable()
export class NetworkDetectionService {
  private readonly logger = new Logger(NetworkDetectionService.name);
  private cachedNetworkInfo: NetworkInfo | null = null;
  private lastCacheUpdate: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Detecta automáticamente la IP local del servidor
   */
  async detectLocalIP(): Promise<NetworkInfo> {
    // 🔍 Verificar si estamos en producción
    if (this.isProductionEnvironment()) {
      this.logger.debug('🌍 Entorno de producción detectado, saltando detección de IP local');
      return this.getProductionNetworkInfo();
    }

    // Verificar cache
    if (this.cachedNetworkInfo && this.isCacheValid()) {
      this.logger.debug(`🔍 Usando IP local cacheada: ${this.cachedNetworkInfo.localIP}`);
      return this.cachedNetworkInfo;
    }

    try {
      const networkInfo = this.scanNetworkInterfaces();
      
      if (networkInfo) {
        this.cachedNetworkInfo = networkInfo;
        this.lastCacheUpdate = Date.now();
        
        this.logger.log(`🌐 IP local detectada automáticamente: ${networkInfo.localIP} (${networkInfo.networkInterface})`);
        return networkInfo;
      }

      // Fallback a IP por defecto
      const fallbackIP = this.getFallbackIP();
      this.logger.warn(`⚠️ No se pudo detectar IP local, usando fallback: ${fallbackIP}`);
      
      return {
        localIP: fallbackIP,
        networkInterface: 'fallback',
        isLocalNetwork: true
      };

    } catch (error) {
      this.logger.error(`❌ Error detectando IP local: ${error.message}`);
      
      // Fallback a IP por defecto
      const fallbackIP = this.getFallbackIP();
      return {
        localIP: fallbackIP,
        networkInterface: 'error-fallback',
        isLocalNetwork: true
      };
    }
  }

  /**
   * Escanea todas las interfaces de red para encontrar la IP local
   */
  private scanNetworkInterfaces(): NetworkInfo | null {
    const interfaces = networkInterfaces();
    
    for (const [name, nets] of Object.entries(interfaces)) {
      if (!nets) continue;
      
      for (const net of nets) {
        // Filtrar solo IPv4 y interfaces activas
        if (net.family === 'IPv4' && !net.internal) {
          const ip = net.address;
          
          // Priorizar IPs de redes locales comunes
          if (this.isLocalNetworkIP(ip)) {
            this.logger.debug(`🔍 Interfaz ${name} - IP: ${ip} - Máscara: ${net.netmask}`);
            
            return {
              localIP: ip,
              networkInterface: name,
              isLocalNetwork: true
            };
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Verifica si una IP pertenece a una red local
   */
  private isLocalNetworkIP(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    
    // Redes locales comunes
    const localNetworks = [
      [192, 168, 0, 0, 16],    // 192.168.0.0/16
      [10, 0, 0, 0, 8],        // 10.0.0.0/8
      [172, 16, 0, 0, 12],     // 172.16.0.0/12
      [169, 254, 0, 0, 16],    // 169.254.0.0/16 (link-local)
    ];
    
    return localNetworks.some(([a, b, c, d, mask]) => {
      if (parts[0] === a && parts[1] === b) {
        if (mask === 8) return true;
        if (mask === 16) return parts[2] === c;
        if (mask === 12) return parts[1] >= 16 && parts[1] <= 31;
      }
      return false;
    });
  }

  /**
   * Obtiene IP de fallback desde variables de entorno o configuración
   */
  private getFallbackIP(): string {
    // Prioridad 1: Variable de entorno
    if (process.env.LOCAL_IP) {
      this.logger.debug(`🔧 Usando IP local desde variable de entorno: ${process.env.LOCAL_IP}`);
      return process.env.LOCAL_IP;
    }
    
    // Prioridad 2: IP por defecto común
    const defaultIP = '192.168.0.11';
    this.logger.debug(`🔧 Usando IP local por defecto: ${defaultIP}`);
    return defaultIP;
  }

  /**
   * Verifica si el cache es válido
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.CACHE_TTL;
  }

  /**
   * Fuerza la actualización del cache
   */
  async refreshNetworkInfo(): Promise<NetworkInfo> {
    this.logger.log('🔄 Forzando actualización de información de red...');
    this.cachedNetworkInfo = null;
    this.lastCacheUpdate = 0;
    return this.detectLocalIP();
  }

  /**
   * Obtiene la URL base para el backend
   */
  async getBackendBaseURL(port: number = 3001, useHTTPS: boolean = false): Promise<string> {
    const networkInfo = await this.detectLocalIP();
    const protocol = useHTTPS ? 'https' : 'http';
    return `${protocol}://${networkInfo.localIP}:${port}`;
  }

  /**
   * Obtiene la URL base para el frontend
   */
  async getFrontendBaseURL(port: number = 3000, useHTTPS: boolean = false): Promise<string> {
    const networkInfo = await this.detectLocalIP();
    const protocol = useHTTPS ? 'https' : 'http';
    return `${protocol}://${networkInfo.localIP}:${port}`;
  }

  /**
   * 🔍 Detecta si estamos en un entorno de producción
   */
  private isProductionEnvironment(): boolean {
    // 🎯 SIEMPRE comportarse como producción para el Arduino
    this.logger.debug(`🔍 Siempre usando comportamiento de producción para Arduino`);
    return true;
  }

  /**
   * 🔍 Detecta si hay dominios de producción en la configuración
   */
  private hasProductionDomain(): boolean {
    // 🎯 SIEMPRE detectar como producción
    this.logger.debug(`🔍 Siempre detectando como entorno de producción`);
    return true;
  }

  /**
   * ☁️ Detecta si estamos en una plataforma cloud
   */
  private isCloudPlatform(): boolean {
    const platform = process.platform;
    const env = process.env;
    
    // Detectar plataformas cloud comunes
    const cloudIndicators = [
      'VERCEL', 'NETLIFY', 'HEROKU', 'RAILWAY', 'FLY_IO',
      'AWS_LAMBDA', 'AZURE_FUNCTIONS', 'GOOGLE_CLOUD_FUNCTIONS',
      'DOCKER', 'KUBERNETES', 'ECS', 'EKS'
    ];
    
    const hasCloudEnv = cloudIndicators.some(key => !!env[key]);
    const isDocker = env.DOCKER === 'true' || !!env.KUBERNETES_SERVICE_HOST;
    
    return hasCloudEnv || isDocker;
  }

  /**
   * 🌍 Obtiene información de red para entornos de producción
   */
  private getProductionNetworkInfo(): NetworkInfo {
    // En producción, usar la URL externa configurada
    const externalURL = process.env.EXTERNAL_API_BASE_URL || process.env.BACKEND_PUBLIC_URL;
    
    if (externalURL) {
      this.logger.log(`🌍 Usando URL externa de producción: ${externalURL}`);
      return {
        localIP: externalURL.replace(/^https?:\/\//, '').replace(/:\d+$/, ''),
        networkInterface: 'production',
        isLocalNetwork: false
      };
    }
    
    // Fallback para producción sin URL externa
    this.logger.warn('⚠️ Entorno de producción sin URL externa configurada');
    return {
      localIP: 'api.iaminventario.com.mx', // Fallback a tu dominio
      networkInterface: 'production-fallback',
      isLocalNetwork: false
    };
  }
}
