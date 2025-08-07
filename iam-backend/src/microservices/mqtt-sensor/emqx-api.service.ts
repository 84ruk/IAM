import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import mqttConfig from '../../config/mqtt.config';

export interface EmqxDevice {
  id: string;
  username: string;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmqxDeviceStats {
  connections: number;
  subscriptions: number;
  topics: number;
}

@Injectable()
export class EmqxApiService {
  private readonly logger = new Logger(EmqxApiService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(mqttConfig.KEY)
    private readonly config: ConfigType<typeof mqttConfig>,
  ) {}

  /**
   * Obtiene la lista de dispositivos conectados
   */
  async getDevices(): Promise<EmqxDevice[]> {
    try {
      if (!this.config.apiEndpoint || !this.config.appId || !this.config.appSecret) {
        throw new Error('Configuración de API EMQX incompleta');
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.config.apiEndpoint}/clients`, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.config.appId}:${this.config.appSecret}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        })
      );

      return response.data.data || [];
    } catch (error) {
      this.logger.error('Error obteniendo dispositivos de EMQX:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de un dispositivo específico
   */
  async getDeviceStats(deviceId: string): Promise<EmqxDeviceStats | null> {
    try {
      if (!this.config.apiEndpoint || !this.config.appId || !this.config.appSecret) {
        throw new Error('Configuración de API EMQX incompleta');
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.config.apiEndpoint}/clients/${deviceId}`, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.config.appId}:${this.config.appSecret}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        })
      );

      return response.data.data || null;
    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas del dispositivo ${deviceId}:`, error);
      return null;
    }
  }

  /**
   * Crea un nuevo usuario/dispositivo en EMQX
   */
  async createDevice(username: string, password: string): Promise<EmqxDevice> {
    try {
      if (!this.config.apiEndpoint || !this.config.appId || !this.config.appSecret) {
        throw new Error('Configuración de API EMQX incompleta');
      }

      const response = await firstValueFrom(
        this.httpService.post(`${this.config.apiEndpoint}/auth_username`, {
          username,
          password,
          is_superuser: false,
        }, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.config.appId}:${this.config.appSecret}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        })
      );

      return response.data.data;
    } catch (error) {
      this.logger.error('Error creando dispositivo en EMQX:', error);
      throw error;
    }
  }

  /**
   * Elimina un usuario/dispositivo de EMQX
   */
  async deleteDevice(username: string): Promise<boolean> {
    try {
      if (!this.config.apiEndpoint || !this.config.appId || !this.config.appSecret) {
        throw new Error('Configuración de API EMQX incompleta');
      }

      await firstValueFrom(
        this.httpService.delete(`${this.config.apiEndpoint}/auth_username/${username}`, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.config.appId}:${this.config.appSecret}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        })
      );

      return true;
    } catch (error) {
      this.logger.error(`Error eliminando dispositivo ${username} de EMQX:`, error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas generales del broker
   */
  async getBrokerStats(): Promise<any> {
    try {
      if (!this.config.apiEndpoint || !this.config.appId || !this.config.appSecret) {
        throw new Error('Configuración de API EMQX incompleta');
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.config.apiEndpoint}/stats`, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.config.appId}:${this.config.appSecret}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        })
      );

      return response.data.data || {};
    } catch (error) {
      this.logger.error('Error obteniendo estadísticas del broker EMQX:', error);
      throw error;
    }
  }

  /**
   * Verifica si la configuración de API está disponible
   */
  isApiConfigured(): boolean {
    return !!(this.config.apiEndpoint && this.config.appId && this.config.appSecret);
  }
} 