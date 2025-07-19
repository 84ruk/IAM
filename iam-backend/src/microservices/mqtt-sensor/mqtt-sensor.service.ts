import { Injectable, Logger, Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { SensoresService, TipoSensor } from '../../sensores/sensores.service';
import { CreateSensorLecturaDto } from '../../sensores/dto/create-sensor.dto';
import mqttConfig from '../../config/mqtt.config';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttSensorService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(MqttSensorService.name);
  private client: mqtt.MqttClient | null = null;
  private isEnabled = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 segundos

  constructor(
    private readonly sensoresService: SensoresService,
    @Inject(mqttConfig.KEY)
    private readonly config: ConfigType<typeof mqttConfig>,
  ) {}

  async onModuleInit() {
    await this.initializeMqttConnection();
  }

  private async initializeMqttConnection(): Promise<void> {
    try {
      // Verificar si MQTT está habilitado
      if (!this.isMqttEnabled()) {
        this.logger.log('MQTT está deshabilitado. Para habilitarlo, configure MQTT_ENABLED=true y las variables MQTT_HOST y MQTT_PORT');
        return;
      }

      this.isEnabled = true;
      this.logger.log(`Iniciando conexión MQTT a: ${this.config.url}`);

      // Configurar opciones de conexión
      const options: mqtt.IClientOptions = {
        reconnectPeriod: 0, // Deshabilitar reconexión automática
        connectTimeout: this.config.connectTimeout,
        clean: true,
      };

      this.client = mqtt.connect(this.config.url, options);

      this.client.on('connect', () => {
        this.logger.log('Conectado al broker MQTT');
        this.reconnectAttempts = 0; // Resetear contador de intentos
        
        this.client!.subscribe('esp32/temperatura_humedad', (err) => {
          if (err) {
            this.logger.error('Error al suscribirse al tópico', err);
          } else {
            this.logger.log('Suscrito al tópico esp32/temperatura_humedad');
          }
        });
      });

      this.client.on('message', (topico, mensaje) => {
        this.manejarMensajeEntrante(topico, mensaje.toString());
      });

      this.client.on('error', (err) => {
        this.logger.error('Error en la conexión MQTT', err);
        this.handleConnectionError();
      });

      this.client.on('close', () => {
        this.logger.warn('Conexión MQTT cerrada');
        this.handleConnectionError();
      });

      this.client.on('offline', () => {
        this.logger.warn('Cliente MQTT desconectado');
        this.handleConnectionError();
      });

    } catch (error) {
      this.logger.error('Error inicializando conexión MQTT:', error);
      this.handleConnectionError();
    }
  }

  private isMqttEnabled(): boolean {
    // Verificar si MQTT está habilitado en la configuración
    if (!this.config.enabled) {
      return false;
    }

    // Verificar si las variables de entorno están configuradas
    if (!this.config.host || !this.config.port) {
      return false;
    }

    // Verificar que el host no sea localhost por defecto si no está configurado explícitamente
    if (this.config.host === 'localhost' && !process.env.MQTT_HOST) {
      return false;
    }

    return true;
  }

  private handleConnectionError(): void {
    if (!this.isEnabled) return;

    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.config.maxReconnectAttempts) {
      this.logger.warn(`Intento de reconexión ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} en ${this.config.reconnectPeriod/1000} segundos...`);
      
      setTimeout(() => {
        this.initializeMqttConnection();
      }, this.config.reconnectPeriod);
    } else {
      this.logger.error(`Máximo número de intentos de reconexión alcanzado (${this.config.maxReconnectAttempts}). MQTT deshabilitado.`);
      this.isEnabled = false;
      this.client = null;
    }
  }

  async manejarMensajeEntrante(topico: string, mensaje: string): Promise<void> {
    if (!this.isEnabled || !this.client) {
      this.logger.warn('MQTT no está habilitado o no hay conexión activa');
      return;
    }

    try {
      this.logger.log(`Mensaje recibido en el tópico ${topico}: ${mensaje}`);
      const datos = JSON.parse(mensaje);

      // Validar los datos
      if (!datos.temperatura || !datos.humedad) {
        this.logger.error('Formato de datos inválido: se requiere temperatura y humedad');
        return;
      }

      if (datos.temperatura < -50 || datos.temperatura > 100) {
        this.logger.error('Temperatura fuera de rango: -50°C a 100°C');
        return;
      }

      if (datos.humedad < 0 || datos.humedad > 100) {
        this.logger.error('Humedad fuera de rango: 0% a 100%');
        return;
      }

      // Crear DTO para la temperatura
      const lecturaTemperaturaDto: CreateSensorLecturaDto = {
        tipo: TipoSensor.TEMPERATURA,
        valor: datos.temperatura,
        unidad: '°C',
      };

      // Crear DTO para la humedad
      const lecturaHumedadDto: CreateSensorLecturaDto = {
        tipo: TipoSensor.HUMEDAD,
        valor: datos.humedad,
        unidad: '%',
      };

      // Registrar las lecturas
      // Asumiendo un empresaId por defecto por ahora, reemplazar con la lógica real para determinar el empresaId
      const empresaId = 1;
      await this.sensoresService.registrarLectura(lecturaTemperaturaDto, empresaId);
      await this.sensoresService.registrarLectura(lecturaHumedadDto, empresaId);

    } catch (error) {
      this.logger.error('Error procesando el mensaje MQTT:', error);
    }
  }

  // Método público para verificar el estado del servicio
  getStatus(): { enabled: boolean; connected: boolean; reconnectAttempts: number } {
    return {
      enabled: this.isEnabled,
      connected: this.client?.connected || false,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Método para habilitar/deshabilitar manualmente
  async toggleMqtt(enabled: boolean): Promise<void> {
    if (enabled && !this.isEnabled) {
      this.reconnectAttempts = 0;
      await this.initializeMqttConnection();
    } else if (!enabled && this.isEnabled) {
      this.isEnabled = false;
      if (this.client) {
        this.client.end();
        this.client = null;
      }
      this.logger.log('MQTT deshabilitado manualmente');
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.logger.log('Desconectando del broker MQTT...');
      this.client.end();
      this.logger.log('Desconectado del broker MQTT');
    }
  }
}