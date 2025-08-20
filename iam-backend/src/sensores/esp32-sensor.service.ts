import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeveridadAlerta } from '@prisma/client';
import { CreateSensorLecturaMultipleDto, SensorReadingDto } from './dto/create-sensor-lectura-multiple.dto';
import { ESP32ConfiguracionDto as ESP32Configuracion } from './dto/esp32-configuracion.dto';
import { ARDUINO_CODE_TEMPLATE } from './templates/arduino-code.template';
import { SensorTipo, Sensor, SensorLectura } from '@prisma/client';
import { SensorConfiguracion, CONFIGURACIONES_PREDEFINIDAS } from './dto/create-sensor.dto';
import { SensoresGateway } from '../websockets/sensores/sensores.gateway';
import { CreateSensorLecturaDto } from './dto/create-sensor-lectura.dto';
import { URLConfigService } from '../common/services/url-config.service';

export interface SensorData {
  id: number;
  tipo: SensorTipo;
  valor: number;
  unidad: string;
  sensorId: number;
  productoId?: number;
  productoNombre?: string;
  fecha: Date;
  estado: 'NORMAL' | 'ALERTA' | 'CRITICO';
  mensaje: string;
}

@Injectable()
export class ESP32SensorService {
  private readonly logger = new Logger(ESP32SensorService.name);

  constructor(
    private prisma: PrismaService,
    private urlConfig: URLConfigService,
    private sensoresGateway: SensoresGateway // Remover el ? para hacer la dependencia obligatoria
  ) {
    this.logger.log(`🔧 ESP32SensorService inicializado - Gateway disponible: ${!!this.sensoresGateway}`);
  }

  /**
   * 🚀 Registra múltiples lecturas de sensores desde un dispositivo ESP32
   */
  async registrarLecturasMultiples(dto: CreateSensorLecturaMultipleDto): Promise<{
    totalLecturas: number;
    alertasGeneradas: number;
    lecturas: SensorData[];
    dispositivo: { deviceId: string; deviceName: string; ubicacionId: number; empresaId: number; };
  }> {
    try {
      this.logger.log(`📊 Recibiendo lecturas múltiples del dispositivo: ${dto.deviceId}`);

      // Validar datos de entrada
      this.validarDatosLecturasMultiples(dto);

      const lecturas: SensorData[] = [];
      let alertasGeneradas = 0;

      // Procesar cada lectura de sensor
      for (const [nombreSensor, valor] of Object.entries(dto.sensors)) {
        try {
          const lecturaProcesada = await this.procesarLecturaIndividual(
            nombreSensor,
            valor,
            dto
          );

          if (lecturaProcesada) {
            lecturas.push(lecturaProcesada);
            if (lecturaProcesada.estado !== 'NORMAL') {
              alertasGeneradas++;
            }
          }
        } catch (error) {
          this.logger.error(`Error procesando lectura del sensor ${nombreSensor}:`, error);
        }
      }

      this.logger.log(`✅ Procesadas ${lecturas.length} lecturas, ${alertasGeneradas} alertas generadas`);

      // Emitir lecturas por WebSocket en tiempo real
      await this.emitirLecturasPorWebSocket(lecturas, dto.empresaId, dto.ubicacionId);

      return {
        totalLecturas: lecturas.length,
        alertasGeneradas,
        lecturas,
        dispositivo: {
          deviceId: dto.deviceId,
          deviceName: dto.deviceName,
          ubicacionId: dto.ubicacionId,
          empresaId: dto.empresaId,
        },
      };

    } catch (error) {
      this.logger.error('Error registrando lecturas múltiples:', error);
      throw error;
    }
  }

  /**
   * 🔧 NUEVO: Registra lecturas de sensores desde ESP32 con headers automáticos
   */
  async registrarLecturaESP32(dto: CreateSensorLecturaDto, empresaId: number): Promise<SensorData> {
    try {
      this.logger.log(`🤖 Lectura recibida de ESP32: ${dto.tipo} - Valor: ${dto.valor}${dto.unidad}`);
      
      // Validar datos de lectura
      if (!dto.tipo || dto.valor === undefined || !dto.unidad) {
        throw new Error('Datos de lectura incompletos');
      }

      // Validar que la ubicación pertenece a la empresa
      if (dto.ubicacionId) {
        const ubicacion = await this.prisma.ubicacion.findFirst({
          where: { id: dto.ubicacionId, empresaId, activa: true },
        });
        if (!ubicacion) {
          throw new Error('Ubicación no encontrada o no pertenece a la empresa');
        }
      }

      // Convertir TipoSensor a SensorTipo
      const sensorTipo = dto.tipo;

      const data: {
        tipo: SensorTipo;
        valor: number;
        unidad: string;
        empresaId: number;
        productoId?: number;
        sensorId?: number;
        ubicacionId?: number;
      } = {
        tipo: sensorTipo,
        valor: dto.valor,
        unidad: dto.unidad,
        empresaId,
      };

      if (dto.productoId) {
        data.productoId = dto.productoId;
      }

      if (dto.sensorId) {
        data.sensorId = dto.sensorId;
      }

      if (dto.ubicacionId) {
        data.ubicacionId = dto.ubicacionId;
      }

      // Crear la lectura en la base de datos
      const lectura = await this.prisma.sensorLectura.create({
        data,
      });

      this.logger.log(`✅ Lectura de ESP32 registrada: ${lectura.id}`);

      // Procesar alertas si es necesario
      const alertaGenerada = await this.procesarAlertasSensor(lectura, empresaId);

      // Emitir por WebSocket
      if (this.sensoresGateway) {
        await this.sensoresGateway.emitirLecturaSensor({
          id: lectura.id,
          tipo: lectura.tipo,
          valor: lectura.valor,
          unidad: lectura.unidad,
          sensorId: lectura.sensorId,
          productoId: lectura.productoId || undefined, // Convertir null a undefined
          ubicacionId: lectura.ubicacionId,
          empresaId: lectura.empresaId,
          fecha: lectura.fecha,
          estado: alertaGenerada ? 'ALERTA' : 'NORMAL',
          mensaje: alertaGenerada ? `Alerta generada: ${alertaGenerada}` : 'Lectura normal', // Valor por defecto
        }, empresaId);
      }

      return {
        id: lectura.id,
        tipo: lectura.tipo,
        valor: lectura.valor,
        unidad: lectura.unidad,
        sensorId: lectura.sensorId || 0,
        productoId: lectura.productoId || undefined, // Convertir null a undefined
        productoNombre: undefined,
        fecha: lectura.fecha,
        estado: alertaGenerada ? 'ALERTA' : 'NORMAL',
        mensaje: alertaGenerada ? `Alerta generada: ${alertaGenerada}` : 'Lectura normal', // Valor por defecto
      };

    } catch (error) {
      this.logger.error('Error registrando lectura de ESP32:', error);
      throw error;
    }
  }

  /**
   * 🚀 Genera código Arduino personalizado basado en la configuración
   */
  async generarCodigoArduino(config: ESP32Configuracion): Promise<{
    success: boolean;
    message: string;
    codigoArduino: string;
    configFile: string;
    metadata: { deviceName: string; deviceId: string; sensoresConfigurados: number; fechaGeneracion: string; };
  }> {
    try {
      this.logger.log(`Generando código Arduino para dispositivo: ${config.deviceName}`);

      // Validar configuración
      this.validarConfiguracionESP32(config);

      // Normalizar baseUrl desde entorno si aplica
      const envBase = await this.urlConfig.getIoTBackendURL();
      const normalizedConfig = {
        ...config,
        api: {
          ...config.api,
          baseUrl: (envBase || config.api.baseUrl || '').replace(/\/$/, ''),
          endpoint: (() => {
            const ep = (config.api.endpoint || '/iot/lecturas').trim();
            if (!ep || ep.toLowerCase() === 'null' || ep.toLowerCase() === 'undefined') return '/iot/lecturas';
            return ep.startsWith('/') ? ep : `/${ep}`;
          })(),
        }
      };

      // Guardar configuración en la base de datos
      await this.guardarConfiguracionESP32(normalizedConfig as any);

      // Generar código Arduino personalizado
      const codigoArduino = ARDUINO_CODE_TEMPLATE(normalizedConfig);
      
      // Generar archivo de configuración JSON (para compatibilidad)
      const configFile = JSON.stringify(config, null, 2);

      const metadata = {
        deviceName: config.deviceName,
        deviceId: config.deviceId,
        sensoresConfigurados: config.sensores.filter(s => s.enabled).length,
        fechaGeneracion: new Date().toISOString()
      };

      return {
        success: true,
        message: 'Código Arduino generado correctamente',
        codigoArduino,
        configFile,
        metadata
      };

    } catch (error) {
      this.logger.error('Error generando código Arduino:', error);
      return {
        success: false,
        message: 'Error generando código Arduino',
        codigoArduino: '',
        configFile: '',
        metadata: {
          deviceName: '',
          deviceId: '',
          sensoresConfigurados: 0,
          fechaGeneracion: new Date().toISOString()
        }
      };
    }
  }

  /**
   * 🔧 Obtiene la configuración de un ESP32 desde la base de datos
   */
  async obtenerConfiguracionESP32(deviceId: string): Promise<ESP32Configuracion> {
    try {
      this.logger.log(`Obteniendo configuración para dispositivo: ${deviceId}`);

      // Buscar configuración en la base de datos
      const configuracion = await this.prisma.dispositivoIoT.findUnique({
        where: { deviceId },
        include: {
          empresa: true,
          ubicacion: true,
        }
      });

      if (!configuracion) {
        throw new NotFoundException(`Configuración no encontrada para el dispositivo: ${deviceId}`);
      }

      // Convertir a formato ESP32Configuracion
      const config: ESP32Configuracion = {
        deviceId: configuracion.deviceId,
        deviceName: configuracion.deviceName,
        ubicacionId: configuracion.ubicacionId,
        empresaId: configuracion.empresaId,
        wifi: {
          ssid: configuracion.wifiSSID || '',
          password: configuracion.wifiPassword || ''
        },
        api: {
          baseUrl: await this.resolverBaseUrlExterna(configuracion.apiBaseUrl || ''),
          token: configuracion.apiToken || '',
          endpoint: this.resolverEndpointLecturas(configuracion.apiEndpoint || '')
        },
        sensores: configuracion.sensoresConfigurados as any[] || [],
        intervalo: configuracion.intervaloLecturas || 30000,
        timestamp: configuracion.updatedAt.toISOString()
      };

      return config;

    } catch (error) {
      this.logger.error(`Error obteniendo configuración para ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Normaliza la URL base que se envía al ESP32. Si en BD está en localhost/127.0.0.1
   * o viene vacía, se reemplaza por una URL externa configurable por entorno.
   */
  private async resolverBaseUrlExterna(guardada: string): Promise<string> {
    try {
      // Si la URL guardada es válida (no localhost), usarla
      if (guardada && !/(^https?:\/\/)?(localhost|127\.0\.0\.1)/i.test(guardada)) {
        this.logger.debug(`🔧 Usando URL guardada en BD: ${guardada}`);
        return guardada.replace(/\/+$/, '');
      }

      // 🔍 DETECTAR ENTORNO
      const isProduction = this.isProductionEnvironment();
      
      if (isProduction) {
        this.logger.log('🌍 Entorno de producción detectado, usando URL externa');
        return this.getProductionURL();
      } else {
        this.logger.log('🏠 Entorno de desarrollo detectado, usando IP local');
        return this.getDevelopmentURL();
      }

    } catch (error) {
      this.logger.error(`❌ Error resolviendo URL base: ${error.message}`);
      // Fallback final - SIEMPRE usar URL de producción sin puerto
      return 'https://api.iaminventario.com.mx';
    }
  }

  /**
   * 🌍 Obtiene URL para entornos de producción
   */
  private getProductionURL(): string {
    // 🎯 SIEMPRE usar la URL de producción
    const productionURL = 'https://api.iaminventario.com.mx';
    this.logger.log(`🌍 Usando URL de producción: ${productionURL}`);
    return productionURL;
  }

  /**
   * 🏠 Obtiene URL para entornos de desarrollo
   */
  private async getDevelopmentURL(): Promise<string> {
    // 🎯 En desarrollo también usar la URL de producción
    const productionURL = 'https://api.iaminventario.com.mx';
    this.logger.log(`🏠 En desarrollo, pero usando URL de producción: ${productionURL}`);
    return productionURL;
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
    const productionDomains = [
      'api.iaminventario.com.mx',
      'iaminventario.com.mx',
      'app.iaminventario.com.mx'
    ];
    
    // Verificar si alguna de las variables de entorno contiene dominios de producción
    const envVars = [
      process.env.EXTERNAL_API_BASE_URL,
      process.env.BACKEND_PUBLIC_URL,
      process.env.FRONTEND_URL,
      process.env.API_URL
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
   * Garantiza que el endpoint de lecturas sea el esperado y tenga prefijo '/'.
   */
  private resolverEndpointLecturas(endpoint: string): string {
    const porDefecto = '/iot/lecturas';
    if (!endpoint) return porDefecto;
    let limpio = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // Mapear endpoints antiguos a la ruta nueva pública para IoT
    if (/sensores\/lecturas-multiples/i.test(limpio)) {
      limpio = porDefecto;
    }
    return limpio;
  }

  /**
   * 📊 Obtiene el estado de un ESP32
   */
  async obtenerEstadoESP32(deviceId: string): Promise<{
    connected: boolean;
    lastSeen: string;
    status: string;
    deviceName: string;
    ubicacion: string;
  }> {
    try {
      const dispositivo = await this.prisma.dispositivoIoT.findUnique({
        where: { deviceId },
        include: {
          ubicacion: true,
        }
      });

      if (!dispositivo) {
        throw new NotFoundException(`Dispositivo no encontrado: ${deviceId}`);
      }

      const lastSeen = dispositivo.ultimaLectura || dispositivo.updatedAt;
      const connected = Date.now() - lastSeen.getTime() < 5 * 60 * 1000; // 5 minutos

      return {
        connected,
        lastSeen: lastSeen.toISOString(),
        status: connected ? 'ONLINE' : 'OFFLINE',
        deviceName: dispositivo.deviceName,
        ubicacion: dispositivo.ubicacion?.nombre || 'Sin ubicación'
      };

    } catch (error) {
      this.logger.error(`Error obteniendo estado para ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * 📈 Obtiene estadísticas generales de dispositivos ESP32
   */
  async obtenerEstadisticasESP32(): Promise<{
    totalDispositivos: number;
    dispositivosConectados: number;
    totalLecturas: number;
    alertasGeneradas: number;
  }> {
    try {
      const [
        totalDispositivos,
        dispositivosConectados,
        totalLecturas,
        alertasGeneradas
      ] = await Promise.all([
        this.prisma.dispositivoIoT.count(),
        this.prisma.dispositivoIoT.count({
          where: {
            ultimaLectura: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
            }
          }
        }),
        this.prisma.sensorLectura.count({
          where: {
            fecha: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
            }
          }
        }),
        this.prisma.alertaHistorial.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
            }
          }
        })
      ]);

      return {
        totalDispositivos,
        dispositivosConectados,
        totalLecturas,
        alertasGeneradas
      };

    } catch (error) {
      this.logger.error('Error obteniendo estadísticas ESP32:', error);
      throw error;
    }
  }

  /**
   * 🌐 Obtiene información de red detectada automáticamente
   */
  async obtenerInformacionRed(): Promise<{
    localIP: string;
    networkInterface: string;
    backendURL: string;
    frontendURL: string;
    isLocalNetwork: boolean;
    timestamp: string;
  }> {
    try {
      const localIP = await this.urlConfig.detectLocalIP();
      const backendURL = await this.urlConfig.getBackendURL();
      const frontendURL = await this.urlConfig.getFrontendURL();

      return {
        localIP,
        networkInterface: 'auto-detected',
        backendURL,
        frontendURL,
        isLocalNetwork: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error obteniendo información de red:', error);
      throw error;
    }
  }

  /**
   * 🔄 Fuerza la actualización de información de red
   */
  async actualizarInformacionRed(): Promise<{
    localIP: string;
    networkInterface: string;
    backendURL: string;
    frontendURL: string;
    isLocalNetwork: boolean;
    timestamp: string;
  }> {
    try {
      const localIP = await this.urlConfig.detectLocalIP();
      const backendURL = await this.urlConfig.getBackendURL();
      const frontendURL = await this.urlConfig.getFrontendURL();

      this.logger.log(`🔄 Información de red actualizada: ${localIP}`);

      return {
        localIP,
        networkInterface: 'auto-detected',
        backendURL,
        frontendURL,
        isLocalNetwork: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error actualizando información de red:', error);
      throw error;
    }
  }

  // ===========================================
  // MÉTODOS PRIVADOS
  // ===========================================

  private validarDatosLecturasMultiples(dto: CreateSensorLecturaMultipleDto): void {
    if (!dto.deviceId || !dto.deviceName || !dto.ubicacionId || !dto.empresaId) {
      throw new Error('Datos de dispositivo incompletos');
    }

    if (!dto.sensors || Object.keys(dto.sensors).length === 0) {
      throw new Error('No se proporcionaron lecturas de sensores');
    }

    if (!dto.timestamp || dto.timestamp <= 0) {
      throw new Error('Timestamp inválido');
    }
  }

  private async procesarLecturaIndividual(
    nombreSensor: string,
    valor: number,
    dto: CreateSensorLecturaMultipleDto
  ): Promise<SensorData | null> {
    try {
      // Determinar tipo de sensor basado en el nombre
      const tipoSensor = this.determinarTipoSensor(nombreSensor);
      const unidad = this.determinarUnidadSensor(tipoSensor);

      // Buscar o crear sensor en la base de datos
      const sensor = await this.buscarOCrearSensor(nombreSensor, tipoSensor, dto);

      // Crear la lectura
      const lectura = await this.prisma.sensorLectura.create({
        data: {
          tipo: tipoSensor,
          valor,
          unidad,
          sensorId: sensor.id,
          empresaId: dto.empresaId,
          ubicacionId: dto.ubicacionId,
          fecha: new Date(dto.timestamp),
        },
      });

      // Analizar la lectura para alertas
      const estado = this.analizarLectura(tipoSensor, valor);
      const mensaje = this.generarMensaje(tipoSensor, valor, estado);

      // Registrar alerta si es necesario
      if (estado !== 'NORMAL') {
        await this.registrarAlerta(sensor, valor, estado, mensaje, dto);
      }

      // Actualizar última lectura del dispositivo
      await this.prisma.dispositivoIoT.update({
        where: { deviceId: dto.deviceId },
        data: { ultimaLectura: new Date() }
      });

      return {
        id: lectura.id,
        tipo: lectura.tipo,
        valor: lectura.valor,
        unidad: lectura.unidad,
        sensorId: sensor.id,
        productoId: lectura.productoId || undefined,
        productoNombre: undefined,
        fecha: lectura.fecha,
        estado,
        mensaje,
      };

    } catch (error) {
      this.logger.error(`Error procesando lectura individual ${nombreSensor}:`, error);
      return null;
    }
  }

  private determinarTipoSensor(nombreSensor: string): SensorTipo {
    const nombreLower = nombreSensor.toLowerCase();
    
    if (nombreLower.includes('temp') || nombreLower.includes('temperatura')) {
      return 'TEMPERATURA';
    } else if (nombreLower.includes('hum') || nombreLower.includes('humedad')) {
      return 'HUMEDAD';
    } else if (nombreLower.includes('peso') || nombreLower.includes('weight')) {
      return 'PESO';
    } else if (nombreLower.includes('pres') || nombreLower.includes('presion')) {
      return 'PRESION';
    }
    
    return 'TEMPERATURA'; // Por defecto
  }

  private determinarUnidadSensor(tipo: SensorTipo): string {
    switch (tipo) {
      case 'TEMPERATURA': return '°C';
      case 'HUMEDAD': return '%';
      case 'PESO': return 'kg';
      case 'PRESION': return 'hPa';
      default: return 'unidades';
    }
  }

  private async buscarOCrearSensor(
    nombre: string,
    tipo: SensorTipo,
    dto: CreateSensorLecturaMultipleDto
  ): Promise<Sensor> {
    // Buscar sensor existente
    let sensor = await this.prisma.sensor.findFirst({
      where: {
        nombre,
        ubicacionId: dto.ubicacionId,
        empresaId: dto.empresaId,
      },
    });

    // Resolver dispositivo asociado (si existe)
    const dispositivo = await this.prisma.dispositivoIoT.findUnique({
      where: { deviceId: dto.deviceId },
      select: { id: true },
    });

    if (!sensor) {
      // Crear nuevo sensor
      const configuracion = CONFIGURACIONES_PREDEFINIDAS[tipo] || CONFIGURACIONES_PREDEFINIDAS.TEMPERATURA;
      
      sensor = await this.prisma.sensor.create({
        data: {
          nombre,
          tipo,
          descripcion: `Sensor ${tipo} automático - ${dto.deviceName}`,
          ubicacionId: dto.ubicacionId,
          empresaId: dto.empresaId,
          activo: true,
          dispositivoIoTId: dispositivo?.id ?? null,
        },
      });

      this.logger.log(`✅ Sensor creado automáticamente: ${nombre} (${tipo})`);
    } else if (!sensor.dispositivoIoTId && dispositivo?.id) {
      // Vincular sensor existente al dispositivo si aún no está vinculado
      sensor = await this.prisma.sensor.update({
        where: { id: sensor.id },
        data: { dispositivoIoTId: dispositivo.id },
      });
    }

    return sensor;
  }

  private analizarLectura(tipo: SensorTipo, valor: number): 'NORMAL' | 'ALERTA' | 'CRITICO' {
    const config = CONFIGURACIONES_PREDEFINIDAS[tipo];
    if (!config) return 'NORMAL';

    if (valor >= (config.umbral_critico || 100)) {
      return 'CRITICO';
    } else if (valor >= (config.umbral_alerta || 80)) {
      return 'ALERTA';
    }

    return 'NORMAL';
  }

  private generarMensaje(tipo: SensorTipo, valor: number, estado: string): string {
    const config = CONFIGURACIONES_PREDEFINIDAS[tipo];
    if (!config) return `Lectura: ${valor}`;

    switch (estado) {
      case 'CRITICO':
        return `¡CRÍTICO! ${tipo}: ${valor}${config.unidad} - Supera umbral crítico (${config.umbral_critico}${config.unidad})`;
      case 'ALERTA':
        return `¡ALERTA! ${tipo}: ${valor}${config.unidad} - Supera umbral de alerta (${config.umbral_alerta}${config.unidad})`;
      default:
        return `${tipo}: ${valor}${config.unidad} - Normal`;
    }
  }

  private async registrarAlerta(
    sensor: Sensor,
    valor: number,
    estado: string,
    mensaje: string,
    dto: CreateSensorLecturaMultipleDto
  ): Promise<void> {
    try {
      await this.prisma.alertaHistorial.create({
        data: {
          sensorId: sensor.id,
          tipo: estado as any,
          mensaje,
          valor: valor.toString(),
          empresaId: dto.empresaId,
          ubicacionId: dto.ubicacionId,
          titulo: `Alerta ${estado}`,
          severidad: estado as SeveridadAlerta,
          destinatarios: [],
          estado: 'ENVIADA',
        },
      });

      this.logger.log(`🚨 Alerta registrada: ${mensaje}`);
    } catch (error) {
      this.logger.error('Error registrando alerta:', error);
    }
  }

  private validarConfiguracionESP32(config: ESP32Configuracion): void {
    if (!config.deviceId || !config.deviceName) {
      throw new Error('DeviceId y DeviceName son requeridos');
    }

    if (!config.wifi.ssid || !config.wifi.password) {
      throw new Error('Configuración WiFi incompleta');
    }

    if (!config.api.baseUrl || !config.api.token) {
      throw new Error('Configuración API incompleta');
    }

    if (!config.sensores || config.sensores.length === 0) {
      throw new Error('Debe configurar al menos un sensor');
    }

    const sensoresHabilitados = config.sensores.filter(s => s.enabled);
    if (sensoresHabilitados.length === 0) {
      throw new Error('Debe habilitar al menos un sensor');
    }
  }

  private async guardarConfiguracionESP32(config: ESP32Configuracion): Promise<void> {
    try {
      const baseUrlNormalizada = await this.resolverBaseUrlExterna(config.api.baseUrl);
      const endpointNormalizado = this.resolverEndpointLecturas(config.api.endpoint);

      await this.prisma.dispositivoIoT.upsert({
        where: { deviceId: config.deviceId },
        update: {
          deviceName: config.deviceName,
          ubicacionId: config.ubicacionId,
          empresaId: config.empresaId,
          wifiSSID: config.wifi.ssid,
          wifiPassword: config.wifi.password,
          apiBaseUrl: baseUrlNormalizada,
          apiToken: config.api.token,
          apiEndpoint: endpointNormalizado,
          sensoresConfigurados: config.sensores as any,
          intervaloLecturas: config.intervalo,
          activo: true,
          ultimaLectura: new Date(),
        },
        create: {
          deviceId: config.deviceId,
          deviceName: config.deviceName,
          nombre: config.deviceName,
          ubicacionId: config.ubicacionId,
          empresaId: config.empresaId,
          wifiSSID: config.wifi.ssid,
          wifiPassword: config.wifi.password,
          apiBaseUrl: baseUrlNormalizada,
          apiToken: config.api.token,
          apiEndpoint: endpointNormalizado,
          sensoresConfigurados: config.sensores as any,
          intervaloLecturas: config.intervalo,
          activo: true,
          ultimaLectura: new Date(),
        },
      });

      this.logger.log(`✅ Configuración guardada para dispositivo: ${config.deviceId}`);
    } catch (error) {
      this.logger.error('Error guardando configuración ESP32:', error);
      throw error;
    }
  }

  /**
   * 🔧 NUEVO: Procesa alertas para una lectura de sensor
   */
  private async procesarAlertasSensor(lectura: SensorLectura, empresaId: number): Promise<string | null> {
    try {
      // Buscar el sensor asociado si existe
      if (lectura.sensorId) {
        const sensor = await this.prisma.sensor.findFirst({
          where: { id: lectura.sensorId, empresaId, activo: true }
        });

        if (sensor && sensor.configuracion) {
          // El campo configuracion existe en el modelo Sensor como Json?
          const config = sensor.configuracion as any;
          
          // Verificar umbrales de alerta si están configurados
          if (config.umbral_alerta && lectura.valor > config.umbral_alerta) {
            return `Valor ${lectura.valor}${lectura.unidad} supera umbral de alerta (${config.umbral_alerta}${lectura.unidad})`;
          }
          
          if (config.umbral_critico && lectura.valor > config.umbral_critico) {
            return `Valor ${lectura.valor}${lectura.unidad} supera umbral crítico (${config.umbral_critico}${lectura.unidad})`;
          }
        } else {
          // Si no hay configuración, usar umbrales por defecto
          if (lectura.tipo === 'TEMPERATURA') {
            const umbralAlerta = 35;
            const umbralCritico = 40;
            
            if (lectura.valor > umbralCritico) {
              return `Valor ${lectura.valor}${lectura.unidad} supera umbral crítico (${umbralCritico}${lectura.unidad})`;
            } else if (lectura.valor > umbralAlerta) {
              return `Valor ${lectura.valor}${lectura.unidad} supera umbral de alerta (${umbralAlerta}${lectura.unidad})`;
            }
          }
          
          if (lectura.tipo === 'HUMEDAD') {
            const umbralHumedadAlerta = 80;
            const umbralHumedadCritico = 90;
            
            if (lectura.valor > umbralHumedadCritico) {
              return `Valor ${lectura.valor}${lectura.unidad} supera umbral crítico (${umbralHumedadCritico}${lectura.unidad})`;
            } else if (lectura.valor > umbralHumedadAlerta) {
              return `Valor ${lectura.valor}${lectura.unidad} supera umbral de alerta (${umbralHumedadAlerta}${lectura.unidad})`;
            }
          }
        }
      }

      return null; // No hay alerta
    } catch (error) {
      this.logger.warn('Error procesando alertas del sensor:', error);
      return null;
    }
  }

  /**
   * 📡 Emite lecturas por WebSocket en tiempo real
   */
  private async emitirLecturasPorWebSocket(
    lecturas: SensorData[],
    empresaId: number,
    ubicacionId: number
  ): Promise<void> {
    try {
      this.logger.log(`📡 Iniciando emisión de ${lecturas.length} lecturas por WebSocket para empresa ${empresaId}`);

      // Emitir cada lectura individual
      for (const lectura of lecturas) {
        await this.sensoresGateway.emitirLecturaSensor({
          id: lectura.id,
          tipo: lectura.tipo,
          valor: lectura.valor,
          unidad: lectura.unidad,
          fecha: lectura.fecha,
          estado: lectura.estado,
          sensorId: lectura.sensorId, // corregido: antes usaba id de lectura
          ubicacionId: ubicacionId,
        }, empresaId);
      }

      // Emitir resumen de todas las lecturas
      await this.sensoresGateway.emitirEstadoSensores({
        tipo: 'LECTURAS_MULTIPLES',
        data: {
          totalLecturas: lecturas.length,
          ubicacionId: ubicacionId,
          lecturas: lecturas.map(l => ({
            id: l.id,
            tipo: l.tipo,
            valor: l.valor,
            unidad: l.unidad,
            estado: l.estado,
            fecha: l.fecha,
          })),
        },
        timestamp: new Date(),
      }, empresaId);

      this.logger.log(`📡 Emitidas ${lecturas.length} lecturas por WebSocket para empresa ${empresaId}`);
    } catch (error) {
      this.logger.error('Error emitiendo lecturas por WebSocket:', error);
    }
  }
}
