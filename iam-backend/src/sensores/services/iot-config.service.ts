import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { URLConfigService } from '../../common/services/url-config.service';

export interface IoTDeviceConfig {
  deviceId: string;
  deviceName: string;
  empresaId: number;
  ubicacionId: number;
  api: {
    baseUrl: string;
    token: string;
    endpoints: {
      lecturas: string;
      config: string;
      health: string;
    };
  };
  wifi: {
    ssid: string;
    password: string;
  };
  sensores: any[];
  intervalo: number;
  timestamp: string;
  socketEnabled?: boolean;
}

@Injectable()
export class IoTConfigService {
  private readonly logger = new Logger(IoTConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly urlConfig: URLConfigService
  ) {}

  /**
   * Obtiene la configuración completa para un dispositivo IoT
   */
  async getDeviceConfig(deviceId: string, apiToken: string, empresaId: number): Promise<IoTDeviceConfig> {
    try {
      this.logger.log(`🔧 Obteniendo configuración para dispositivo: ${deviceId} - Empresa: ${empresaId}`);

      // Buscar dispositivo en la base de datos
      const dispositivo = await this.prisma.dispositivoIoT.findFirst({
        where: {
          deviceId,
          apiToken,
          activo: true,
          empresaId
        },
        include: {
          empresa: true,
          ubicacion: true,
        }
      });

      if (!dispositivo) {
        throw new Error(`Dispositivo no encontrado o no autorizado: ${deviceId}`);
      }

      // Validar que el dispositivo tenga un token válido
      if (!dispositivo.apiToken) {
        throw new Error(`Dispositivo ${deviceId} no tiene token de API configurado`);
      }

      // Obtener URL de producción para dispositivos IoT
      const productionURL = await this.urlConfig.getIoTBackendURL();

      // Construir configuración
      const config: IoTDeviceConfig = {
        deviceId: dispositivo.deviceId,
        deviceName: dispositivo.deviceName,
        empresaId: dispositivo.empresaId,
        ubicacionId: dispositivo.ubicacionId,
        api: {
          baseUrl: productionURL,
          token: dispositivo.apiToken, // Ahora sabemos que no es null
          endpoints: {
            lecturas: `/iot/lecturas`,
            config: `/iot/config`,
            health: `/iot/health`
          }
        },
        wifi: {
          ssid: dispositivo.wifiSSID || '',
          password: dispositivo.wifiPassword || ''
        },
        sensores: dispositivo.sensoresConfigurados as any[] || [],
        intervalo: dispositivo.intervaloLecturas || 30000,
        timestamp: new Date().toISOString(),
        socketEnabled: !!(dispositivo.configuracion as any)?.socketEnabled,
      };

      this.logger.log(`✅ Configuración generada para dispositivo: ${deviceId} con URL: ${productionURL}`);

      return config;

    } catch (error) {
      this.logger.error(`❌ Error obteniendo configuración para dispositivo ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Valida la configuración de un dispositivo IoT
   */
  async validateDeviceConfig(config: IoTDeviceConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validar campos requeridos
    if (!config.deviceId) errors.push('DeviceId es requerido');
    if (!config.deviceName) errors.push('DeviceName es requerido');
    if (!config.empresaId) errors.push('EmpresaId es requerido');
    if (!config.api.baseUrl) errors.push('URL de API es requerida');
    if (!config.api.token) errors.push('Token de API es requerido');

    // Validar URL de API
    if (config.api.baseUrl && !this.isValidURL(config.api.baseUrl)) {
      errors.push('URL de API no es válida');
    }

    // Validar configuración WiFi
    if (!config.wifi.ssid) errors.push('SSID de WiFi es requerido');
    if (!config.wifi.password) errors.push('Contraseña de WiFi es requerida');

    // Validar sensores
    if (!config.sensores || config.sensores.length === 0) {
      errors.push('Debe configurar al menos un sensor');
    }

    // Validar intervalo
    if (config.intervalo < 1000 || config.intervalo > 300000) {
      errors.push('Intervalo debe estar entre 1 y 300 segundos');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Actualiza la configuración de un dispositivo IoT
   */
  async updateDeviceConfig(deviceId: string, config: Partial<IoTDeviceConfig>): Promise<void> {
    try {
      this.logger.log(`🔄 Actualizando configuración para dispositivo: ${deviceId}`);

      const updateData: any = {};

      if (config.wifi) {
        updateData.wifiSSID = config.wifi.ssid;
        updateData.wifiPassword = config.wifi.password;
      }

      if (config.sensores) {
        updateData.sensoresConfigurados = config.sensores;
      }

      if (config.intervalo) {
        updateData.intervaloLecturas = config.intervalo;
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.dispositivoIoT.update({
          where: { deviceId },
          data: updateData
        });

        this.logger.log(`✅ Configuración actualizada para dispositivo: ${deviceId}`);
      }

    } catch (error) {
      this.logger.error(`❌ Error actualizando configuración para dispositivo ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de dispositivos IoT
   */
  async getDeviceStats(): Promise<{
    totalDevices: number;
    activeDevices: number;
    lastSeenDevices: number;
    devicesWithErrors: number;
  }> {
    try {
      const [
        totalDevices,
        activeDevices,
        lastSeenDevices,
        devicesWithErrors
      ] = await Promise.all([
        this.prisma.dispositivoIoT.count(),
        this.prisma.dispositivoIoT.count({ where: { activo: true } }),
        this.prisma.dispositivoIoT.count({
          where: {
            ultimaLectura: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
            }
          }
        }),
        this.prisma.dispositivoIoT.count({
          where: {
            activo: true,
            ultimaLectura: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Sin actividad en 24 horas
            }
          }
        })
      ]);

      return {
        totalDevices,
        activeDevices,
        lastSeenDevices,
        devicesWithErrors
      };

    } catch (error) {
      this.logger.error('❌ Error obteniendo estadísticas de dispositivos IoT:', error);
      throw error;
    }
  }

  /**
   * Verifica si una URL es válida
   */
  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
