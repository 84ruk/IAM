import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as QRCode from 'qrcode';
import { Redis } from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface ESP32AutoConfig {
  deviceName: string;
  wifiSSID: string;
  wifiPassword: string;
  ubicacionId: number;
  sensores: {
    tipo: string;
    nombre: string;
    pin: number;
    enabled: boolean;
  }[];
}

export interface ESP32ConfigResponse {
  success: boolean;
  message: string;
  configUrl?: string;
  qrCode?: string;
  credentials?: {
    mqttUsername: string;
    mqttPassword: string;
    mqttTopic: string;
  };
  deviceId?: string;
  token?: string;
  expiresAt?: Date;
}

export interface ESP32DeviceStatus {
  deviceId: string;
  connected: boolean;
  lastSeen?: Date;
  dataReceived?: boolean;
  sensorCount?: number;
  uptime?: number;
  wifiRSSI?: number;
  mqttConnected?: boolean;
  lastDataTimestamp?: Date;
  errors?: string[];
}

@Injectable()
export class ESP32AutoConfigService {
  private readonly logger = new Logger(ESP32AutoConfigService.name);
  private redis: Redis;

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Inicializar Redis si está disponible
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
      this.logger.log('Redis conectado para almacenamiento temporal');
    } else {
      this.logger.warn('Redis no configurado, usando almacenamiento en memoria');
    }
  }

  /**
   * Genera configuración automática para ESP32 con configuración remota
   * El usuario solo necesita conectar el ESP32 a WiFi y escanear un QR
   */
  async generarConfiguracionAutomatica(config: ESP32AutoConfig): Promise<ESP32ConfigResponse> {
    try {
      console.log('🔍 [DEBUG] ESP32AutoConfigService - Received config:', JSON.stringify(config, null, 2));
      this.logger.log(`Generando configuración automática para dispositivo: ${config.deviceName}`);

      // 1. Generar credenciales MQTT únicas
      const deviceId = `esp32_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mqttUsername = deviceId;
      const mqttPassword = this.generarPasswordSeguro();
      const mqttTopic = `empresa/${config.ubicacionId}/esp32/${mqttUsername}/data`;

      // 2. Generar token de configuración temporal
      const configToken = this.generarTokenSeguro();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // 3. Crear configuración WiFi + MQTT + Sensores
      const wifiConfig = {
        deviceId,
        deviceName: config.deviceName,
        ssid: config.wifiSSID,
        password: config.wifiPassword,
        mqtt: {
          server: process.env.MQTT_HOST || 'h02f10fd.ala.us-east-1.emqxsl.com',
          port: parseInt(process.env.MQTT_PORT || '8883'),
          username: mqttUsername,
          password: mqttPassword,
          topic: mqttTopic,
        },
        sensores: config.sensores.filter(s => s.enabled).map(sensor => ({
          tipo: sensor.tipo,
          nombre: sensor.nombre,
          pin: sensor.pin,
          configuracion: this.obtenerConfiguracionSensor(sensor.tipo),
        })),
        intervalo: 30000, // 30 segundos
        ubicacionId: config.ubicacionId,
        empresaId: await this.obtenerEmpresaId(config.ubicacionId),
      };

      // 4. Generar URL de configuración remota
      const configUrl = this.generarUrlConfiguracionRemota(configToken);

      // 5. Generar QR Code con la URL de configuración
      const qrCode = await this.generarQRCode(configUrl);

      // 6. Guardar configuración temporal con token
      await this.guardarConfiguracionTemporal(configToken, wifiConfig, expiresAt);

      // 7. Registrar dispositivo en base de datos
      await this.registrarDispositivoEnBD(deviceId, config, mqttUsername);

      // 8. Actualizar KPIs
      await this.actualizarKPIs(config.ubicacionId, 'dispositivo_creado');

      this.logger.log(`Configuración generada exitosamente para ${config.deviceName}`);

      return {
        success: true,
        message: 'Configuración generada exitosamente',
        configUrl,
        qrCode,
        credentials: {
          mqttUsername,
          mqttPassword,
          mqttTopic,
        },
        deviceId,
        token: configToken,
        expiresAt,
      };

    } catch (error) {
      this.logger.error(`Error generando configuración automática: ${error.message}`);
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  /**
   * Endpoint para que el ESP32 obtenga su configuración automáticamente
   */
  async obtenerConfiguracionESP32(token: string): Promise<any> {
    try {
      // Buscar configuración temporal por token
      const config = await this.obtenerConfiguracionTemporal(token);
      
      if (!config) {
        throw new Error('Configuración no encontrada o expirada');
      }

      // Eliminar configuración temporal después de usarla
      await this.eliminarConfiguracionTemporal(token);

      // Actualizar estado del dispositivo
      await this.actualizarEstadoDispositivo(config.deviceId, {
        connected: true,
        lastSeen: new Date(),
        configurado: true,
      });

      // Actualizar KPIs
      await this.actualizarKPIs(config.ubicacionId, 'dispositivo_configurado');

      return {
        success: true,
        config,
        message: 'Configuración obtenida exitosamente',
      };

    } catch (error) {
      this.logger.error(`Error obteniendo configuración para ESP32: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Verificar si un ESP32 está conectado y funcionando
   */
  async verificarEstadoESP32(deviceId: string): Promise<ESP32DeviceStatus> {
    try {
      // Obtener estado desde Redis/cache
      const estado = await this.obtenerEstadoDispositivo(deviceId);
      
      if (!estado) {
        return {
          deviceId,
          connected: false,
          errors: ['Dispositivo no encontrado'],
        };
      }

      // Verificar si el dispositivo está enviando datos MQTT recientemente
      const ultimaLectura = await this.obtenerUltimaLectura(deviceId);
      const ahora = new Date();
      const tiempoDesdeUltimaLectura = ahora.getTime() - (ultimaLectura?.timestamp?.getTime() || 0);
      
      const dataReceived = tiempoDesdeUltimaLectura < 5 * 60 * 1000; // 5 minutos

      return {
        deviceId,
        connected: estado.connected || false,
        lastSeen: estado.lastSeen,
        dataReceived,
        sensorCount: estado.sensorCount || 0,
        uptime: estado.uptime || 0,
        wifiRSSI: estado.wifiRSSI,
        mqttConnected: estado.mqttConnected,
        lastDataTimestamp: ultimaLectura?.timestamp,
        errors: estado.errors || [],
      };

    } catch (error) {
      this.logger.error(`Error verificando estado ESP32: ${error.message}`);
      return {
        deviceId,
        connected: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Obtener estadísticas de dispositivos ESP32
   */
  async obtenerEstadisticasDispositivos(ubicacionId?: number): Promise<any> {
    try {
      const cacheKey = `esp32_stats:${ubicacionId || 'all'}`;
      
      // Intentar obtener desde cache
      if (this.redis) {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Obtener estadísticas de base de datos
      const stats = await this.calcularEstadisticasDispositivos(ubicacionId);

      // Guardar en cache por 5 minutos
      if (this.redis) {
        await this.redis.setex(cacheKey, 300, JSON.stringify(stats));
      }

      return stats;

    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas: ${error.message}`);
      return {
        total: 0,
        conectados: 0,
        desconectados: 0,
        errores: 0,
        sensoresActivos: 0,
      };
    }
  }

  /**
   * Actualizar estado de dispositivo desde ESP32
   */
  async actualizarEstadoDesdeESP32(deviceId: string, estado: any): Promise<void> {
    try {
      await this.actualizarEstadoDispositivo(deviceId, {
        ...estado,
        lastSeen: new Date(),
      });

      // Actualizar KPIs si hay cambios importantes
      if (estado.connected !== undefined) {
        await this.actualizarKPIs(estado.ubicacionId, estado.connected ? 'dispositivo_conectado' : 'dispositivo_desconectado');
      }

    } catch (error) {
      this.logger.error(`Error actualizando estado desde ESP32: ${error.message}`);
    }
  }

  // ===========================================
  // MÉTODOS PRIVADOS
  // ===========================================

  private generarPasswordSeguro(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private generarTokenSeguro(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  private generarUrlConfiguracionRemota(token: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return `${baseUrl}/api/mqtt-sensor/esp32/config/${token}`;
  }

  private async generarQRCode(url: string): Promise<string> {
    try {
      // Generar QR code como data URL
      const qrDataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrDataUrl;
    } catch (error) {
      this.logger.error(`Error generando QR code: ${error.message}`);
      // Fallback: retornar URL para que el frontend genere el QR
      return url;
    }
  }

  private async guardarConfiguracionTemporal(token: string, config: any, expiresAt: Date): Promise<void> {
    try {
      if (this.redis) {
        // Usar Redis si está disponible
        const configData = {
          config,
          timestamp: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
        };
        
        const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
        await this.redis.setex(
          `esp32_config:${token}`,
          ttl,
          JSON.stringify(configData)
        );
        
        this.logger.log(`Configuración guardada en Redis para token: ${token}`);
      } else {
        // Fallback a memoria
        if (!this.configuracionesTemporales) {
          this.configuracionesTemporales = new Map();
        }
        
        this.configuracionesTemporales.set(token, {
          config,
          timestamp: new Date(),
          expiresAt,
        });

        // Limpiar configuraciones antiguas
        this.limpiarConfiguracionesAntiguas();
      }
    } catch (error) {
      this.logger.error(`Error guardando configuración temporal: ${error.message}`);
      throw error;
    }
  }

  private async obtenerConfiguracionTemporal(token: string): Promise<any> {
    try {
      if (this.redis) {
        // Obtener de Redis
        const configData = await this.redis.get(`esp32_config:${token}`);
        
        if (!configData) {
          return null;
        }
        
        const parsed = JSON.parse(configData);
        const expiresAt = new Date(parsed.expiresAt);
        
        if (expiresAt < new Date()) {
          await this.redis.del(`esp32_config:${token}`);
          return null;
        }
        
        return parsed.config;
      } else {
        // Fallback a memoria
        if (!this.configuracionesTemporales) {
          return null;
        }

        const configData = this.configuracionesTemporales.get(token);
        if (!configData) {
          return null;
        }

        // Verificar expiración
        if (configData.expiresAt < new Date()) {
          this.configuracionesTemporales.delete(token);
          return null;
        }

        return configData.config;
      }
    } catch (error) {
      this.logger.error(`Error obteniendo configuración temporal: ${error.message}`);
      return null;
    }
  }

  private async eliminarConfiguracionTemporal(token: string): Promise<void> {
    try {
      if (this.redis) {
        // Eliminar de Redis
        await this.redis.del(`esp32_config:${token}`);
        this.logger.log(`Configuración eliminada de Redis para token: ${token}`);
      } else {
        // Fallback a memoria
        if (this.configuracionesTemporales) {
          this.configuracionesTemporales.delete(token);
        }
      }
    } catch (error) {
      this.logger.error(`Error eliminando configuración temporal: ${error.message}`);
    }
  }

  private limpiarConfiguracionesAntiguas(): void {
    if (!this.configuracionesTemporales) {
      return;
    }

    const ahora = new Date();

    for (const [token, configData] of this.configuracionesTemporales.entries()) {
      if (configData.expiresAt < ahora) {
        this.configuracionesTemporales.delete(token);
      }
    }
  }

  private obtenerConfiguracionSensor(tipo: string): any {
    const configuraciones = {
      TEMPERATURA: {
        libreria: 'DHT.h',
        pines: { data: 4 },
        intervalo: 30000,
        unidad: '°C',
        rango: { min: -40, max: 80 },
      },
      HUMEDAD: {
        libreria: 'DHT.h',
        pines: { data: 4 },
        intervalo: 30000,
        unidad: '%',
        rango: { min: 0, max: 100 },
      },
      PESO: {
        libreria: 'HX711.h',
        pines: { dout: 16, sck: 17 },
        intervalo: 60000,
        unidad: 'kg',
        rango: { min: 0, max: 50 },
        calibracion: { factor: 1.0, offset: 0.0 },
      },
      PRESION: {
        libreria: 'Adafruit_BMP280.h',
        pines: { sda: 21, scl: 22 },
        intervalo: 60000,
        unidad: 'hPa',
        rango: { min: 300, max: 1100 },
      },
    };

    return configuraciones[tipo] || configuraciones.TEMPERATURA;
  }

  private async obtenerEmpresaId(ubicacionId: number): Promise<number> {
    try {
      const ubicacion = await this.prisma.ubicacion.findUnique({
        where: { id: ubicacionId },
        select: { empresaId: true },
      });
      return ubicacion?.empresaId || 1;
    } catch (error) {
      this.logger.error(`Error obteniendo empresa ID: ${error.message}`);
      return 1;
    }
  }

  private async registrarDispositivoEnBD(deviceId: string, config: ESP32AutoConfig, mqttUsername: string): Promise<void> {
    try {
      // Registrar dispositivo en tabla de dispositivos IoT
      const dispositivo = await this.prisma.dispositivoIoT.upsert({
        where: { deviceId },
        update: {
          nombre: config.deviceName,
          tipo: 'ESP32',
          ubicacionId: config.ubicacionId,
          configuracion: {
            mqttUsername,
            sensores: config.sensores.filter(s => s.enabled),
          },
          ultimaActualizacion: new Date(),
        },
        create: {
          deviceId,
          nombre: config.deviceName,
          tipo: 'ESP32',
          ubicacionId: config.ubicacionId,
          configuracion: {
            mqttUsername,
            sensores: config.sensores.filter(s => s.enabled),
          },
          activo: true,
        },
      });

      // Registrar sensores asociados al dispositivo
      const sensoresHabilitados = config.sensores.filter(s => s.enabled);
      for (const sensorConfig of sensoresHabilitados) {
        await this.prisma.sensor.upsert({
          where: {
            id: -1, // Usar un ID que no existe para crear nuevo
          },
          update: {
            dispositivoIoTId: dispositivo.id,
            configuracion: {
              pin: sensorConfig.pin,
              tipo: sensorConfig.tipo,
            },
            activo: true,
          },
          create: {
            nombre: sensorConfig.nombre,
            tipo: sensorConfig.tipo as any, // Cast a SensorTipo
            ubicacionId: config.ubicacionId,
            empresaId: await this.obtenerEmpresaId(config.ubicacionId),
            dispositivoIoTId: dispositivo.id,
            configuracion: {
              pin: sensorConfig.pin,
              tipo: sensorConfig.tipo,
            },
            activo: true,
          },
        });
      }

      this.logger.log(`Dispositivo y sensores registrados en BD: ${deviceId}`);
    } catch (error) {
      this.logger.error(`Error registrando dispositivo en BD: ${error.message}`);
    }
  }

  private async actualizarEstadoDispositivo(deviceId: string, estado: any): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.setex(
          `esp32_status:${deviceId}`,
          300, // 5 minutos
          JSON.stringify({
            ...estado,
            lastUpdated: new Date().toISOString(),
          })
        );
      }
    } catch (error) {
      this.logger.error(`Error actualizando estado dispositivo: ${error.message}`);
    }
  }

  private async obtenerEstadoDispositivo(deviceId: string): Promise<any> {
    try {
      if (this.redis) {
        const estado = await this.redis.get(`esp32_status:${deviceId}`);
        return estado ? JSON.parse(estado) : null;
      }
      return null;
    } catch (error) {
      this.logger.error(`Error obteniendo estado dispositivo: ${error.message}`);
      return null;
    }
  }

  private async obtenerUltimaLectura(deviceId: string): Promise<any> {
    try {
      // Buscar última lectura en base de datos
      const ultimaLectura = await this.prisma.sensorLectura.findFirst({
        where: {
          sensor: {
            dispositivoIoTId: {
              not: null,
            },
          },
        },
        orderBy: {
          fecha: 'desc',
        },
        select: {
          fecha: true,
          valor: true,
        },
      });

      return ultimaLectura;
    } catch (error) {
      this.logger.error(`Error obteniendo última lectura: ${error.message}`);
      return null;
    }
  }

  private async calcularEstadisticasDispositivos(ubicacionId?: number): Promise<any> {
    try {
      const where = ubicacionId ? { ubicacionId } : {};

      const [total, conectados, sensoresActivos] = await Promise.all([
        this.prisma.dispositivoIoT.count({ where }),
        this.prisma.dispositivoIoT.count({ 
          where: { 
            ...where,
            activo: true,
            ultimaActualizacion: {
              gte: new Date(Date.now() - 5 * 60 * 1000), // Últimos 5 minutos
            },
          } 
        }),
        this.prisma.sensor.count({ 
          where: {
            dispositivoIoTId: {
              not: null,
            },
            activo: true,
          } 
        }),
      ]);

      return {
        total,
        conectados,
        desconectados: total - conectados,
        sensoresActivos,
        tasaConectividad: total > 0 ? (conectados / total) * 100 : 0,
      };
    } catch (error) {
      this.logger.error(`Error calculando estadísticas: ${error.message}`);
      return {
        total: 0,
        conectados: 0,
        desconectados: 0,
        sensoresActivos: 0,
        tasaConectividad: 0,
      };
    }
  }

  private async actualizarKPIs(ubicacionId: number, evento: string): Promise<void> {
    try {
      const kpiKey = `kpi:esp32:${ubicacionId}:${evento}`;
      
      if (this.redis) {
        // Incrementar contador en Redis
        await this.redis.incr(kpiKey);
        await this.redis.expire(kpiKey, 86400); // 24 horas
      }

      // También registrar en base de datos para análisis histórico
      try {
        await this.prisma.kpiEvento.create({
          data: {
            ubicacionId,
            tipo: 'ESP32',
            evento,
            timestamp: new Date(),
            metadata: {
              ubicacionId,
              evento,
            },
          },
        });
      } catch (dbError) {
        // Si hay error en BD, solo logear pero no fallar
        this.logger.warn(`Error guardando KPI en BD: ${dbError.message}`);
      }

      this.logger.log(`KPI actualizado: ${evento} para ubicación ${ubicacionId}`);
    } catch (error) {
      this.logger.error(`Error actualizando KPI: ${error.message}`);
    }
  }

  // Almacenamiento temporal en memoria (fallback)
  private configuracionesTemporales: Map<string, { config: any; timestamp: Date; expiresAt: Date }> | null = null;
} 