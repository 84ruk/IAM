import { Injectable, Logger, Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { SensoresService, TipoSensor } from '../../sensores/sensores.service';
import { CreateSensorLecturaDto } from '../../sensores/dto/create-sensor-lectura.dto';
import { PrismaService } from '../../prisma/prisma.service';
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
    private readonly prisma: PrismaService,
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
        // Configuración TLS/SSL para EMQX
        ...(this.config.useTls && {
          rejectUnauthorized: false, // Para desarrollo, en producción debería ser true
          protocol: 'mqtts',
        }),
        // Configuración de autenticación
        ...(this.config.username && this.config.password && {
          username: this.config.username,
          password: this.config.password,
        }),
      };

      this.client = mqtt.connect(this.config.url, options);

      this.client.on('connect', () => {
        this.logger.log('Conectado al broker MQTT');
        this.reconnectAttempts = 0; // Resetear contador de intentos
        
        // Suscribirse a tópicos de sensores
        this.subscribeToTopics();
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

  private subscribeToTopics(): void {
    if (!this.client) return;

    // Tópicos para sensores
    const topics = [
      'esp32/temperatura_humedad',
      'empresa/+/ubicacion/+/sensor/+/lectura',
      'sensor/+/data',
      'iot/+/sensor/+/reading'
    ];

    topics.forEach(topic => {
      this.client!.subscribe(topic, (err) => {
        if (err) {
          this.logger.error(`Error al suscribirse al tópico ${topic}:`, err);
        } else {
          this.logger.log(`Suscrito al tópico: ${topic}`);
        }
      });
    });
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

      // Extraer información del tópico
      const topicoInfo = this.extraerInfoTopico(topico);
      if (!topicoInfo) {
        this.logger.error('Formato de tópico inválido');
        return;
      }

      // Validar que la empresa existe
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: topicoInfo.empresaId },
      });
      if (!empresa) {
        this.logger.error(`Empresa ${topicoInfo.empresaId} no encontrada`);
        return;
      }

      // Validar que la ubicación existe y pertenece a la empresa
      if (topicoInfo.ubicacionId) {
        const ubicacion = await this.prisma.ubicacion.findFirst({
          where: { 
            id: topicoInfo.ubicacionId, 
            empresaId: topicoInfo.empresaId,
            activa: true 
          },
        });
        if (!ubicacion) {
          this.logger.error(`Ubicación ${topicoInfo.ubicacionId} no encontrada para empresa ${topicoInfo.empresaId}`);
          return;
        }
      }

      // Validar que el sensor existe y pertenece a la empresa
      if (topicoInfo.sensorId) {
        const sensor = await this.prisma.sensor.findFirst({
          where: { 
            id: topicoInfo.sensorId, 
            empresaId: topicoInfo.empresaId,
            activo: true 
          },
        });
        if (!sensor) {
          this.logger.error(`Sensor ${topicoInfo.sensorId} no encontrado para empresa ${topicoInfo.empresaId}`);
          return;
        }
      }

      // Procesar datos según el tipo de sensor
      await this.procesarDatosSensor(datos, topicoInfo);

    } catch (error) {
      this.logger.error('Error procesando el mensaje MQTT:', error);
    }
  }

  private extraerInfoTopico(topico: string): { empresaId: number; ubicacionId?: number; sensorId?: number } | null {
    // Formato esperado: empresa/{empresaId}/ubicacion/{ubicacionId}/sensor/{sensorId}/lectura
    const partes = topico.split('/');
    
    if (partes.length < 4) {
      return null;
    }

    const empresaId = parseInt(partes[1]);
    if (isNaN(empresaId)) {
      return null;
    }

    const info: { empresaId: number; ubicacionId?: number; sensorId?: number } = { empresaId };

    // Buscar ubicacionId
    const ubicacionIndex = partes.indexOf('ubicacion');
    if (ubicacionIndex !== -1 && ubicacionIndex + 1 < partes.length) {
      const ubicacionId = parseInt(partes[ubicacionIndex + 1]);
      if (!isNaN(ubicacionId)) {
        info.ubicacionId = ubicacionId;
      }
    }

    // Buscar sensorId
    const sensorIndex = partes.indexOf('sensor');
    if (sensorIndex !== -1 && sensorIndex + 1 < partes.length) {
      const sensorId = parseInt(partes[sensorIndex + 1]);
      if (!isNaN(sensorId)) {
        info.sensorId = sensorId;
      }
    }

    return info;
  }

  private async procesarDatosSensor(datos: any, topicoInfo: { empresaId: number; ubicacionId?: number; sensorId?: number }) {
    try {
      // Procesar temperatura
      if (datos.temperatura !== undefined) {
        const lecturaTemperaturaDto: CreateSensorLecturaDto = {
          tipo: TipoSensor.TEMPERATURA,
          valor: datos.temperatura,
          unidad: '°C',
          sensorId: topicoInfo.sensorId,
          ubicacionId: topicoInfo.ubicacionId,
        };

        await this.sensoresService.registrarLectura(lecturaTemperaturaDto, topicoInfo.empresaId);
        this.logger.log(`Temperatura registrada: ${datos.temperatura}°C para empresa ${topicoInfo.empresaId}`);
      }

      // Procesar humedad
      if (datos.humedad !== undefined) {
        const lecturaHumedadDto: CreateSensorLecturaDto = {
          tipo: TipoSensor.HUMEDAD,
          valor: datos.humedad,
          unidad: '%',
          sensorId: topicoInfo.sensorId,
          ubicacionId: topicoInfo.ubicacionId,
        };

        await this.sensoresService.registrarLectura(lecturaHumedadDto, topicoInfo.empresaId);
        this.logger.log(`Humedad registrada: ${datos.humedad}% para empresa ${topicoInfo.empresaId}`);
      }

      // Procesar peso
      if (datos.peso !== undefined) {
        const lecturaPesoDto: CreateSensorLecturaDto = {
          tipo: TipoSensor.PESO,
          valor: datos.peso,
          unidad: 'kg',
          sensorId: topicoInfo.sensorId,
          ubicacionId: topicoInfo.ubicacionId,
        };

        await this.sensoresService.registrarLectura(lecturaPesoDto, topicoInfo.empresaId);
        this.logger.log(`Peso registrado: ${datos.peso}kg para empresa ${topicoInfo.empresaId}`);
      }

    } catch (error) {
      this.logger.error('Error procesando datos del sensor:', error);
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