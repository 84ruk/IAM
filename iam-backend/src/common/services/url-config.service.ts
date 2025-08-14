import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface URLConfig {
  backendURL: string;
  frontendURL: string;
  apiURL: string;
  isProduction: boolean;
  timestamp: string;
}

@Injectable()
export class URLConfigService {
  private readonly logger = new Logger(URLConfigService.name);
  private cachedConfig: URLConfig | null = null;
  private lastCacheUpdate: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(private readonly configService: ConfigService) {}

  /**
   * Obtiene la configuración de URLs del sistema
   */
  async getURLConfig(): Promise<URLConfig> {
    // Verificar cache
    if (this.cachedConfig && this.isCacheValid()) {
      this.logger.debug(`🔍 Usando configuración de URLs cacheada`);
      return this.cachedConfig;
    }

    try {
      const config = this.buildURLConfig();
      
      this.cachedConfig = config;
      this.lastCacheUpdate = Date.now();
      
      this.logger.log(`🌐 Configuración de URLs actualizada: ${config.backendURL}`);
      return config;
    } catch (error) {
      this.logger.error(`❌ Error obteniendo configuración de URLs: ${error.message}`);
      return this.getFallbackConfig();
    }
  }

  /**
   * Construye la configuración de URLs desde variables de entorno
   */
  private buildURLConfig(): URLConfig {
    const isProduction = this.isProductionEnvironment();
    
    // 🎯 SIEMPRE usar URL de producción para dispositivos IoT
    const productionBackendURL = 'https://api.iaminventario.com.mx';
    const productionFrontendURL = 'https://app.iaminventario.com.mx';
    
    let backendURL: string;
    let frontendURL: string;
    
    if (isProduction) {
      backendURL = productionBackendURL;
      frontendURL = productionFrontendURL;
    } else {
      // En desarrollo, usar URLs locales pero mantener compatibilidad con IoT
      backendURL = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001';
      frontendURL = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      
      // Para dispositivos IoT, siempre usar producción
      if (this.isIoTRequest()) {
        backendURL = productionBackendURL;
        frontendURL = productionFrontendURL;
      }
    }

    const config: URLConfig = {
      backendURL,
      frontendURL,
      apiURL: backendURL,
      isProduction,
      timestamp: new Date().toISOString()
    };

    return config;
  }

  /**
   * Obtiene la URL del backend
   */
  async getBackendURL(): Promise<string> {
    const config = await this.getURLConfig();
    return config.backendURL;
  }

  /**
   * Obtiene la URL del frontend
   */
  async getFrontendURL(): Promise<string> {
    const config = await this.getURLConfig();
    return config.frontendURL;
  }

  /**
   * Obtiene la URL de la API
   */
  async getAPIURL(): Promise<string> {
    const config = await this.getURLConfig();
    return config.apiURL;
  }

  /**
   * Obtiene la URL del backend para dispositivos IoT (siempre producción)
   */
  async getIoTBackendURL(): Promise<string> {
    // Preferir variables de entorno si están definidas
    const envUrl =
      this.configService.get<string>('EXTERNAL_API_BASE_URL') ||
      this.configService.get<string>('BACKEND_PUBLIC_URL') ||
      this.configService.get<string>('API_URL') ||
      this.configService.get<string>('NEXT_PUBLIC_API_URL');

    if (envUrl) {
      this.logger.log(`🌐 Usando URL IoT desde entorno: ${envUrl}`);
      return envUrl.replace(/\/$/, '');
    }

    // Si no hay env, usar backendURL resuelto (respeta env/local/prod)
    const fallback = await this.getBackendURL();
    this.logger.log(`🌐 Usando URL IoT fallback: ${fallback}`);
    return fallback.replace(/\/$/, '');
  }

  /**
   * Devuelve la URL de WebSocket para IoT (wss://host/iot)
   */
  async getIoTSocketURL(): Promise<string> {
    const httpBase = await this.getIoTBackendURL();
    try {
      const u = new URL(httpBase.match(/^https?:\/\//) ? httpBase : `https://${httpBase}`);
      const wsProtocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${u.host}/iot`;
    } catch {
      // Fallback simple
      return `wss://${(httpBase || '').replace(/^https?:\/\//, '').replace(/\/$/, '')}/iot`;
    }
  }

  /**
   * Obtiene la URL del backend para desarrollo local
   */
  async getLocalBackendURL(port: number = 3001): Promise<string> {
    const localIP = await this.detectLocalIP();
    return `http://${localIP}:${port}`;
  }

  /**
   * Obtiene la URL del frontend para desarrollo local
   */
  async getLocalFrontendURL(port: number = 3000): Promise<string> {
    const localIP = await this.detectLocalIP();
    return `http://${localIP}:${port}`;
  }

  /**
   * Obtiene la URL del backend con puerto específico (para compatibilidad)
   */
  async getBackendBaseURL(port: number = 3001, useHTTPS: boolean = false): Promise<string> {
    const localIP = await this.detectLocalIP();
    const protocol = useHTTPS ? 'https' : 'http';
    return `${protocol}://${localIP}:${port}`;
  }

  /**
   * Obtiene la URL del frontend con puerto específico (para compatibilidad)
   */
  async getFrontendBaseURL(port: number = 3000, useHTTPS: boolean = false): Promise<string> {
    const localIP = await this.detectLocalIP();
    const protocol = useHTTPS ? 'https' : 'http';
    return `${protocol}://${localIP}:${port}`;
  }

  /**
   * Fuerza la actualización de información de red (para compatibilidad)
   */
  async refreshNetworkInfo(): Promise<{ localIP: string; networkInterface: string; isLocalNetwork: boolean }> {
    this.logger.log('🔄 Forzando actualización de información de red...');
    const localIP = await this.detectLocalIP();
    
    return {
      localIP,
      networkInterface: 'auto-detected',
      isLocalNetwork: true
    };
  }

  /**
   * Detecta la IP local del servidor
   */
  async detectLocalIP(): Promise<string> {
    try {
      // 🔍 Verificar si estamos en producción
      if (this.isProductionEnvironment()) {
        this.logger.debug('🌍 Entorno de producción detectado, saltando detección de IP local');
        return 'api.iaminventario.com.mx';
      }

      // Usar IP desde variable de entorno si está configurada
      const envIP = this.configService.get<string>('LOCAL_IP');
      if (envIP) {
        this.logger.debug(`🔧 Usando IP local desde variable de entorno: ${envIP}`);
        return envIP;
      }

      // IP por defecto para desarrollo
      const defaultIP = '192.168.0.11';
      this.logger.debug(`🔧 Usando IP local por defecto: ${defaultIP}`);
      return defaultIP;

    } catch (error) {
      this.logger.error(`❌ Error detectando IP local: ${error.message}`);
      return '192.168.0.11';
    }
  }

  /**
   * Fuerza la actualización del cache
   */
  async refreshConfig(): Promise<URLConfig> {
    this.logger.log('🔄 Forzando actualización de configuración de URLs...');
    this.cachedConfig = null;
    this.lastCacheUpdate = 0;
    return this.getURLConfig();
  }

  /**
   * Verifica si el cache es válido
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.CACHE_TTL;
  }

  /**
   * Detecta si estamos en un entorno de producción
   */
  private isProductionEnvironment(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const hasProductionDomain = this.hasProductionDomain();
    
    // 🎯 SIEMPRE comportarse como producción para dispositivos IoT
    if (this.isIoTRequest()) {
      return true;
    }
    
    return nodeEnv === 'production' || hasProductionDomain;
  }

  /**
   * Detecta si hay dominios de producción en la configuración
   */
  private hasProductionDomain(): boolean {
    const productionDomains = [
      'api.iaminventario.com.mx',
      'iaminventario.com.mx',
      'app.iaminventario.com.mx'
    ];
    
    const envVars = [
      this.configService.get<string>('EXTERNAL_API_BASE_URL'),
      this.configService.get<string>('BACKEND_PUBLIC_URL'),
      this.configService.get<string>('FRONTEND_URL'),
      this.configService.get<string>('NEXT_PUBLIC_API_URL')
    ];
    
    for (const envVar of envVars) {
      if (envVar) {
        for (const domain of productionDomains) {
          if (envVar.includes(domain)) {
            this.logger.debug(`🌍 Dominio de producción detectado: ${domain} en ${envVar}`);
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Detecta si la solicitud es de un dispositivo IoT
   */
  private isIoTRequest(): boolean {
    // Esta función puede ser expandida para detectar solicitudes IoT
    // Por ahora, siempre retorna true para mantener compatibilidad
    return true;
  }

  /**
   * Configuración de fallback en caso de error
   */
  private getFallbackConfig(): URLConfig {
    this.logger.warn('⚠️ Usando configuración de fallback');
    
    return {
      backendURL: 'https://api.iaminventario.com.mx',
      frontendURL: 'https://app.iaminventario.com.mx',
      apiURL: 'https://api.iaminventario.com.mx',
      isProduction: true,
      timestamp: new Date().toISOString()
    };
  }
}
