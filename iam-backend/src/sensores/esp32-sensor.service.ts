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
import { SensorAlertManagerService } from '../alertas/services/sensor-alert-manager.service';
import { AlertasAvanzadasService } from '../alertas/alertas-avanzadas.service';

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
    private sensoresGateway: SensoresGateway,
    private sensorAlertManager: SensorAlertManagerService,
    private alertasAvanzadasService: AlertasAvanzadasService,
  ) {
    this.logger.log(`🔧 ESP32SensorService inicializado - Gateway disponible: ${!!this.sensoresGateway}`);
    this.logger.log(`🔧 ESP32SensorService inicializado - Alert Manager disponible: ${!!this.sensorAlertManager}`);
    this.logger.log(`🔧 ESP32SensorService inicializado - Alertas Avanzadas disponible: ${!!this.alertasAvanzadasService}`);
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
      this.logger.log(`🔍 DTO completo recibido:`, JSON.stringify(dto, null, 2));

      // Validar datos de entrada
      this.validarDatosLecturasMultiples(dto);

      const lecturas: SensorData[] = [];
      let alertasGeneradas = 0;

      // Procesar cada lectura de sensor
      for (const [nombreSensor, valor] of Object.entries(dto.sensors)) {
        try {
          this.logger.log(`🔧 Procesando sensor: ${nombreSensor} = ${valor}`);
          
          const lecturaProcesada = await this.procesarLecturaIndividual(
            nombreSensor,
            valor,
            dto
          );

          if (lecturaProcesada) {
            this.logger.log(`✅ Lectura procesada: ${nombreSensor} = ${valor}, estado: ${lecturaProcesada.estado}`);
            lecturas.push(lecturaProcesada);
            if (lecturaProcesada.estado !== 'NORMAL') {
              alertasGeneradas++;
              this.logger.log(`🚨 ALERTA GENERADA para sensor ${nombreSensor}: ${lecturaProcesada.mensaje}`);
            }
          } else {
            this.logger.warn(`⚠️ No se pudo procesar lectura del sensor: ${nombreSensor}`);
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

      // 🔧 NUEVO: Procesar alertas usando el sistema completo
      let alertaGenerada: any = null;
      let estado: 'NORMAL' | 'ALERTA' | 'CRITICO' = 'NORMAL';
      let mensaje = 'Lectura normal';

      try {
        // 🔧 CORREGIDO: Convertir la lectura a la interfaz correcta
        const lecturaParaAlertas = {
          sensorId: lectura.sensorId || 0,
          tipo: lectura.tipo,
          valor: lectura.valor,
          unidad: lectura.unidad,
          ubicacionId: lectura.ubicacionId || 0,
          productoId: lectura.productoId || undefined,
          timestamp: lectura.fecha
        };

        // Procesar alertas usando el SensorAlertManagerService
        const alertaResult = await this.sensorAlertManager.procesarLecturaSensor(lecturaParaAlertas, empresaId);
        
        if (alertaResult) {
          alertaGenerada = alertaResult;
          estado = 'ALERTA';
          mensaje = alertaResult.mensaje;
          this.logger.log(`🚨 Alerta generada por SensorAlertManager: ${alertaResult.id} - ${alertaResult.mensaje}`);
        }
      } catch (error) {
        this.logger.warn(`Error procesando alertas con SensorAlertManager: ${error.message}`);
        // Fallback al método anterior si falla
        const alertaFallback = await this.procesarAlertasSensor(lectura, empresaId);
        if (alertaFallback) {
          estado = 'ALERTA';
          mensaje = alertaFallback;
        }
      }

      // Emitir por WebSocket
      if (this.sensoresGateway) {
        await this.sensoresGateway.emitirLecturaSensor({
          id: lectura.id,
          tipo: lectura.tipo,
          valor: lectura.valor,
          unidad: lectura.unidad,
          sensorId: lectura.sensorId || undefined,
          productoId: lectura.productoId || undefined,
          ubicacionId: lectura.ubicacionId,
          empresaId: lectura.empresaId,
          fecha: lectura.fecha,
          estado: alertaGenerada ? 'ALERTA' : 'NORMAL',
          mensaje: alertaGenerada ? `Alerta generada: ${alertaGenerada}` : 'Lectura normal',
        }, empresaId);
      }

      return {
        id: lectura.id,
        tipo: lectura.tipo,
        valor: lectura.valor,
        unidad: lectura.unidad,
        sensorId: lectura.sensorId || 0,
        productoId: lectura.productoId || undefined,
        productoNombre: undefined,
        fecha: lectura.fecha,
        estado: alertaGenerada ? 'ALERTA' : 'NORMAL',
        mensaje: alertaGenerada ? `Alerta generada: ${alertaGenerada}` : 'Lectura normal',
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
      this.logger.log(`🚀 Iniciando generación de código Arduino para dispositivo: ${config.deviceName}`);
      this.logger.log(`🔍 Configuración recibida:`, JSON.stringify(config, null, 2));

      // Validar configuración
      this.validarConfiguracionESP32(config);

      // Normalizar baseUrl desde entorno si aplica
      const envBase = await this.urlConfig.getIoTBackendURL();
      this.logger.log(`🌐 URL base del entorno: ${envBase}`);
      
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

      this.logger.log(`🔧 Configuración normalizada:`, JSON.stringify(normalizedConfig, null, 2));

      // Guardar configuración en la base de datos
      await this.guardarConfiguracionESP32(normalizedConfig as any);

      // Generar código Arduino personalizado
      const codigoArduino = ARDUINO_CODE_TEMPLATE(normalizedConfig);
      
      // Generar archivo de configuración JSON (para compatibilidad)
      const configFile = JSON.stringify(config, null, 2);

      const metadata = {
        deviceName: config.deviceName,
        deviceId: config.deviceId,
        sensoresConfigurados: config.sensores.filter(s => s.enabled !== false).length,
        fechaGeneracion: new Date().toISOString()
      };

      this.logger.log(`✅ Código Arduino generado exitosamente para dispositivo: ${config.deviceId}`);

      return {
        success: true,
        message: 'Código Arduino generado correctamente',
        codigoArduino,
        configFile,
        metadata
      };

    } catch (error) {
      this.logger.error(`❌ Error generando código Arduino:`, error);
      this.logger.error(`❌ Stack trace:`, error.stack);
      
      return {
        success: false,
        message: `Error generando código Arduino: ${error.message}`,
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
      this.logger.log(`🔧 Iniciando procesamiento de lectura: ${nombreSensor} = ${valor}`);
      
      // Determinar tipo de sensor basado en el nombre
      const tipoSensor = this.determinarTipoSensor(nombreSensor);
      const unidad = this.determinarUnidadSensor(tipoSensor);
      
      this.logger.log(`🔍 Tipo sensor detectado: ${tipoSensor}, unidad: ${unidad}`);

      // Buscar o crear sensor en la base de datos
      const sensor = await this.buscarOCrearSensor(nombreSensor, tipoSensor, dto);
      this.logger.log(`🔍 Sensor encontrado/creado: ID ${sensor.id}, nombre: ${sensor.nombre}`);

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
      
      this.logger.log(`✅ Lectura creada en BD: ID ${lectura.id}, valor: ${valor}${unidad}`);

      // 🔧 NUEVO: Usar el sistema completo de alertas
      let alertaGenerada: any = null;
      let estado: 'NORMAL' | 'ALERTA' | 'CRITICO' = 'NORMAL';
      let mensaje = '';
      
      try {
        this.logger.log(`🚨 Intentando procesar alertas con SensorAlertManager...`);
        
        // Procesar alertas usando el SensorAlertManagerService
        if (sensor && sensor.activo) {
          try {
            // 🔧 CORREGIDO: Usar la interfaz LecturaSensor correcta
            const lecturaParaAlertas = {
              sensorId: sensor.id,
              tipo: lectura.tipo,
              valor: lectura.valor,
              unidad: lectura.unidad,
              ubicacionId: sensor.ubicacionId,
              productoId: lectura.productoId || undefined, // 🔧 CORREGIDO: convertir null a undefined
              timestamp: lectura.fecha // 🔧 CORREGIDO: usar timestamp en lugar de fecha
            };

            await this.sensorAlertManager.procesarLecturaSensor(lecturaParaAlertas, dto.empresaId);
            this.logger.log(`Alerta procesada para sensor ${sensor.id}`);
          } catch (error) {
            this.logger.error(`Error procesando alerta para sensor ${sensor.id}:`, error);
          }
        }
      } catch (error) {
        this.logger.warn(`⚠️ Error procesando alertas con SensorAlertManager: ${error.message}`);
        this.logger.warn(`🔄 Fallback al método anterior...`);
        
        // Fallback al método anterior si falla
        const alertaFallback = await this.procesarAlertasSensor(lectura, dto.empresaId);
        if (alertaFallback) {
          estado = 'ALERTA';
          mensaje = alertaFallback;
          this.logger.log(`⚠️ Alerta generada por método fallback: ${alertaFallback}`);
        }
      }

      // Si no hay alerta generada, usar el método anterior
      if (estado === 'NORMAL') {
        this.logger.log(`🔍 Evaluando lectura con configuración del sensor...`);
        estado = await this.analizarLecturaConConfiguracionReal(sensor, valor);
        mensaje = this.generarMensaje(sensor.tipo, valor, estado, sensor);
        this.logger.log(`🔍 Estado final: ${estado}, mensaje: ${mensaje}`);
      }

      // Si no hay alerta generada, usar el método anterior
      if (estado !== 'NORMAL' && !alertaGenerada) {
        this.logger.log(`🚨 Registrando alerta en historial...`);
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
      this.logger.error(`❌ Error procesando lectura individual ${nombreSensor}:`, error);
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
      
      // 🚀 NUEVO: Configurar alertas automáticamente para el nuevo sensor
      await this.configurarAlertasAutomaticas(sensor, dto.empresaId);
      
    } else if (!sensor.dispositivoIoTId && dispositivo?.id) {
      // Vincular sensor existente al dispositivo si aún no está vinculado
      sensor = await this.prisma.sensor.update({
        where: { id: sensor.id },
        data: { dispositivoIoTId: dispositivo.id },
      });
    }

    return sensor;
  }

  /**
   * 🚀 Configura automáticamente alertas para un sensor recién creado
   */
  private async configurarAlertasAutomaticas(sensor: Sensor, empresaId: number): Promise<void> {
    try {
      this.logger.log(`🔧 Configurando alertas automáticas para sensor ${sensor.nombre} (${sensor.tipo})`);
      
      // 1. Crear configuración de umbrales según el tipo de sensor
      let umbralesConfig: any;
      
      switch (sensor.tipo) {
        case 'TEMPERATURA':
          umbralesConfig = {
            tipo: 'TEMPERATURA',
            unidad: '°C',
            precision: 0.1,
            rango_min: 15,
            rango_max: 25,
            umbral_alerta_bajo: 18,
            umbral_alerta_alto: 22,
            umbral_critico_bajo: 15,
            umbral_critico_alto: 25,
            severidad: 'MEDIA',
            intervalo_lectura: 10000,
            alertasActivas: true
          };
          break;
        case 'HUMEDAD':
          umbralesConfig = {
            tipo: 'HUMEDAD',
            unidad: '%',
            precision: 0.1,
            rango_min: 30,
            rango_max: 80,
            umbral_alerta_bajo: 35,
            umbral_alerta_alto: 75,
            umbral_critico_bajo: 30,
            umbral_critico_alto: 80,
            severidad: 'MEDIA',
            intervalo_lectura: 30000,
            alertasActivas: true
          };
          break;
        case 'PESO':
          umbralesConfig = {
            tipo: 'PESO',
            unidad: 'kg',
            precision: 0.1,
            rango_min: 100,
            rango_max: 900,
            umbral_alerta_bajo: 150,
            umbral_alerta_alto: 850,
            umbral_critico_bajo: 100,
            umbral_critico_alto: 900,
            severidad: 'MEDIA',
            intervalo_lectura: 60000,
            alertasActivas: true
          };
          break;
        default:
          umbralesConfig = {
            tipo: sensor.tipo,
            unidad: 'unidad',
            precision: 0.1,
            rango_min: 0,
            rango_max: 100,
            umbral_alerta_bajo: 10,
            umbral_alerta_alto: 90,
            umbral_critico_bajo: 0,
            umbral_critico_alto: 100,
            severidad: 'MEDIA',
            intervalo_lectura: 30000,
            alertasActivas: true
          };
      }
      
      // 2. Crear configuración de alertas
      const configuracionAlerta = await this.prisma.configuracionAlerta.create({
        data: {
          empresaId: empresaId,
          sensorId: sensor.id,
          tipoAlerta: sensor.tipo,
          activo: true,
          frecuencia: 'IMMEDIATE',
          ventanaEsperaMinutos: 5,
          umbralCritico: umbralesConfig as any,
          configuracionNotificacion: {
            email: true,
            sms: true,
            webSocket: true
          } as any
        }
      });
      
      this.logger.log(`✅ Configuración de alertas creada: ${configuracionAlerta.id}`);
      
      // 3. Crear o vincular destinatarios por defecto
      await this.crearDestinatariosPorDefecto(sensor.id, empresaId, configuracionAlerta.id);
      
      this.logger.log(`✅ Configuración automática completada para sensor ${sensor.nombre}`);
      
    } catch (error) {
      this.logger.error(`❌ Error configurando alertas automáticas para sensor ${sensor.nombre}:`, error);
      // No fallar el proceso completo si falla la configuración de alertas
    }
  }

  /**
   * 🚀 Crea destinatarios por defecto para un sensor
   */
  private async crearDestinatariosPorDefecto(sensorId: number, empresaId: number, configuracionAlertaId: number): Promise<void> {
    try {
      // Buscar destinatarios existentes de la empresa
      const destinatariosExistentes = await this.prisma.destinatarioAlerta.findMany({
        where: { empresaId, activo: true }
      });
      
      if (destinatariosExistentes.length > 0) {
        // Vincular destinatarios existentes al sensor
        for (const destinatario of destinatariosExistentes) {
          await this.prisma.configuracionAlertaDestinatario.create({
            data: {
              configuracionAlertaId: configuracionAlertaId,
              destinatarioId: destinatario.id
            }
          });
        }
        this.logger.log(`✅ ${destinatariosExistentes.length} destinatarios existentes vinculados al sensor`);
      } else {
        // Crear destinatario por defecto basado en el usuario administrador de la empresa
        const adminEmpresa = await this.prisma.usuario.findFirst({
          where: { 
            empresaId: empresaId, 
            rol: 'ADMIN',
            activo: true 
          }
        });
        
        if (adminEmpresa) {
          const destinatarioDefecto = await this.prisma.destinatarioAlerta.create({
            data: {
              empresaId: empresaId,
              nombre: adminEmpresa.nombre,
              email: adminEmpresa.email,
              telefono: adminEmpresa.telefono || null,
              tipo: adminEmpresa.telefono ? 'AMBOS' : 'EMAIL',
              activo: true
            }
          });
          
          // Vincular al sensor
          await this.prisma.configuracionAlertaDestinatario.create({
            data: {
              configuracionAlertaId: configuracionAlertaId,
              destinatarioId: destinatarioDefecto.id
            }
          });
          
          this.logger.log(`✅ Destinatario por defecto creado: ${destinatarioDefecto.nombre}`);
        }
      }
    } catch (error) {
      this.logger.error(`❌ Error creando destinatarios por defecto:`, error);
    }
  }

  private analizarLectura(tipo: SensorTipo, valor: number): 'NORMAL' | 'ALERTA' | 'CRITICO' {
    const config = CONFIGURACIONES_PREDEFINIDAS[tipo];
    if (!config) return 'NORMAL';

    if (valor >= (config.umbralCritico_critico || 100)) {
      return 'CRITICO';
    } else if (valor >= (config.umbralCritico_alerta || 80)) {
      return 'ALERTA';
    }

    return 'NORMAL';
  }

  private async analizarLecturaConConfiguracionReal(
    sensor: Sensor, 
    valor: number
  ): Promise<'NORMAL' | 'ALERTA' | 'CRITICO'> {
    try {
      // 🔧 CORREGIDO: Leer configuración real del sensor desde la base de datos
      if (sensor.configuracion) {
        const config = sensor.configuracion as any;
        
        // 🔧 CORREGIDO: Usar nombres correctos de campos del ESP32
        const umbralAlerta = config.umbral_alerta || config.umbralCritico_alerta || config.umbralCritico_alerta;
        const umbralCritico = config.umbral_critico || config.umbralCritico_critico || config.umbralCritico_critico;
        
        this.logger.log(`🔍 Configuración sensor ${sensor.nombre}:`, JSON.stringify(config, null, 2));
        this.logger.log(`🔍 Evaluando sensor ${sensor.nombre}: valor=${valor}, umbral_alerta=${umbralAlerta}, umbral_critico=${umbralCritico}`);
        
        if (umbralCritico && valor >= umbralCritico) {
          this.logger.log(`🚨 CRÍTICO: ${valor} >= ${umbralCritico}`);
          return 'CRITICO';
        } else if (umbralAlerta && valor >= umbralAlerta) {
          this.logger.log(`⚠️ ALERTA: ${valor} >= ${umbralAlerta}`);
          return 'ALERTA';
        }
        
        this.logger.log(`✅ NORMAL: ${valor} < ${umbralAlerta || 'sin_umbral'}`);
        return 'NORMAL';
      }
      
      // Fallback a configuración predefinida si no hay configuración personalizada
      this.logger.warn(`⚠️ Sensor ${sensor.nombre} no tiene configuración personalizada, usando valores por defecto`);
      return this.analizarLectura(sensor.tipo, valor);
      
    } catch (error) {
      this.logger.error(`Error analizando lectura con configuración real:`, error);
      // Fallback a método anterior
      return this.analizarLectura(sensor.tipo, valor);
    }
  }

  private generarMensaje(tipo: SensorTipo, valor: number, estado: string, sensor?: Sensor): string {
    // 🔧 CORREGIDO: Usar configuración real del sensor si está disponible
    if (sensor && sensor.configuracion) {
      const config = sensor.configuracion as any;
      const umbralAlerta = config.umbral_alerta || config.umbralCritico_alerta;
      const umbralCritico = config.umbral_critico || config.umbralCritico_critico;
      const unidad = config.unidad || '°C';
      
      switch (estado) {
        case 'CRITICO':
          return `¡CRÍTICO! ${tipo}: ${valor}${unidad} - Supera umbral crítico (${umbralCritico}${unidad})`;
        case 'ALERTA':
          return `¡ALERTA! ${tipo}: ${valor}${unidad} - Supera umbral de alerta (${umbralAlerta}${unidad})`;
        default:
          return `${tipo}: ${valor}${unidad} - Normal`;
      }
    }
    
    // Fallback a configuración predefinida
    const config = CONFIGURACIONES_PREDEFINIDAS[tipo];
    if (!config) return `Lectura: ${valor}`;

    switch (estado) {
      case 'CRITICO':
        return `¡CRÍTICO! ${tipo}: ${valor}${config.unidad} - Supera umbral crítico (${config.umbralCritico_critico}${config.unidad})`;
      case 'ALERTA':
        return `¡ALERTA! ${tipo}: ${valor}${config.unidad} - Supera umbral de alerta (${config.umbralCritico_alerta}${config.unidad})`;
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
      // 🔧 CORREGIDO: Mapear estado a severidad correcta del enum
      let severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
      
      switch (estado.toUpperCase()) {
        case 'CRITICO':
          severidad = 'CRITICA';
          break;
        case 'ALERTA':
          severidad = 'ALTA';
          break;
        case 'NORMAL':
          severidad = 'BAJA';
          break;
        default:
          severidad = 'MEDIA';
      }

      await this.prisma.alertaHistorial.create({
        data: {
          sensorId: sensor.id,
          tipo: estado as any,
          mensaje,
          valor: valor.toString(),
          empresaId: dto.empresaId,
          ubicacionId: dto.ubicacionId,
          titulo: `Alerta ${estado}`,
          severidad: severidad, // ✅ Usar valor mapeado correcto
          destinatarios: [],
          estado: 'ENVIADA',
        },
      });

      this.logger.log(`🚨 Alerta registrada: ${mensaje} con severidad ${severidad}`);
    } catch (error) {
      this.logger.error('Error registrando alerta:', error);
    }
  }

  private validarConfiguracionESP32(config: ESP32Configuracion): void {
    try {
      this.logger.log(`🔍 Validando configuración ESP32 para dispositivo: ${config.deviceId}`);
      
      // Validar campos básicos
      if (!config.deviceId || !config.deviceName) {
        throw new Error('DeviceId y DeviceName son requeridos');
      }

      // Validar configuración WiFi
      if (!config.wifi || !config.wifi.ssid || !config.wifi.password) {
        throw new Error('Configuración WiFi incompleta: se requiere SSID y password');
      }

      // Validar configuración API
      if (!config.api || !config.api.baseUrl || !config.api.token) {
        throw new Error('Configuración API incompleta: se requiere baseUrl y token');
      }

      // Validar array de sensores
      if (!config.sensores || !Array.isArray(config.sensores) || config.sensores.length === 0) {
        throw new Error('Debe configurar al menos un sensor en el array de sensores');
      }

      // Validar cada sensor individualmente
      for (let i = 0; i < config.sensores.length; i++) {
        const sensor = config.sensores[i];
        if (!sensor) {
          throw new Error(`Sensor en posición ${i} es null o undefined`);
        }
        
        if (!sensor.tipo || !sensor.nombre || sensor.pin === undefined || sensor.pin2 === undefined) {
          throw new Error(`Sensor en posición ${i} tiene campos incompletos: tipo, nombre, pin y pin2 son requeridos`);
        }
        
                       if (sensor.umbralMin === undefined || sensor.umbralMax === undefined) {
                 throw new Error(`Sensor en posición ${i} tiene umbrales incompletos: umbralMin y umbralMax son requeridos`);
               }
        
        if (!sensor.unidad || sensor.intervalo === undefined) {
          throw new Error(`Sensor en posición ${i} tiene configuración incompleta: unidad e intervalo son requeridos`);
        }
      }

      // Validar que al menos un sensor esté habilitado
      const sensoresHabilitados = config.sensores.filter(s => s.enabled !== false); // enabled puede ser undefined, lo consideramos habilitado
      if (sensoresHabilitados.length === 0) {
        throw new Error('Debe habilitar al menos un sensor (enabled: true o undefined)');
      }

      // Validar campos adicionales
      if (config.ubicacionId === undefined || config.empresaId === undefined) {
        throw new Error('ubicacionId y empresaId son requeridos');
      }

      if (config.intervalo === undefined || config.intervalo <= 0) {
        throw new Error('intervalo debe ser un número mayor a 0');
      }

      this.logger.log(`✅ Configuración ESP32 validada correctamente para dispositivo: ${config.deviceId}`);
      
    } catch (error) {
      this.logger.error(`❌ Error validando configuración ESP32: ${error.message}`);
      this.logger.error(`❌ Configuración recibida:`, JSON.stringify(config, null, 2));
      throw new Error(`Validación de configuración falló: ${error.message}`);
    }
  }

  private async guardarConfiguracionESP32(config: ESP32Configuracion): Promise<void> {
    try {
      const baseUrlNormalizada = await this.resolverBaseUrlExterna(config.api.baseUrl);
      const endpointNormalizado = this.resolverEndpointLecturas(config.api.endpoint);

      // 1. Guardar configuración del dispositivo IoT
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

      // 2. 🔧 NUEVO: Crear sensores individuales y sus configuraciones de alertas
      for (const sensorConfig of config.sensores) {
        if (sensorConfig.enabled) {
          try {
            // Crear o actualizar sensor
            const sensor = await this.prisma.sensor.upsert({
              where: {
                nombre_ubicacionId: {
                  nombre: sensorConfig.nombre,
                  ubicacionId: config.ubicacionId
                }
              },
              update: {
                tipo: sensorConfig.tipo as any,
                descripcion: `Sensor ${sensorConfig.tipo} configurado desde ESP32`,
                ubicacionId: config.ubicacionId,
                activo: true,
                configuracion: {
                  unidad: sensorConfig.unidad,
                  rango_min: sensorConfig.umbralMin,
                  rango_max: sensorConfig.umbralMax,
                  precision: 0.1,
                  intervalo_lectura: sensorConfig.intervalo,
                  umbral_alerta: sensorConfig.umbralMax * 0.8,
                  umbral_critico: sensorConfig.umbralMax * 0.9
                }
              },
              create: {
                nombre: sensorConfig.nombre,
                tipo: sensorConfig.tipo as any,
                descripcion: `Sensor ${sensorConfig.tipo} configurado desde ESP32`,
                ubicacionId: config.ubicacionId,
                empresaId: config.empresaId,
                activo: true,
                configuracion: {
                  unidad: sensorConfig.unidad,
                  rango_min: sensorConfig.umbralMin,
                  rango_max: sensorConfig.umbralMax,
                  precision: 0.1,
                  intervalo_lectura: sensorConfig.intervalo,
                  umbral_alerta: sensorConfig.umbralMax * 0.8,
                  umbral_critico: sensorConfig.umbralMax * 0.9
                }
              }
            });

            this.logger.log(`✅ Sensor ${sensorConfig.nombre} creado/actualizado: ID ${sensor.id}`);

            // 3. 🔧 NUEVO: Crear configuración de alertas para el sensor
            try {
              // ✅ AHORA HABILITADO: Prisma está sincronizado
              await this.prisma.configuracionAlerta.upsert({
                where: {
                  sensorId: sensor.id
                },
                update: {
                  tipoAlerta: sensorConfig.tipo,
                  activo: true,
                  frecuencia: 'INMEDIATA',
                  // Campos JSON opcionales - guardar umbrales y configuración
                  umbralCritico: {
                    tipo: sensorConfig.tipo,
                    umbralMin: sensorConfig.umbralMin,
                    umbralMax: sensorConfig.umbralMax,
                    unidad: sensorConfig.unidad,
                    // 🔧 CORREGIDO: Configuración de notificaciones en umbralCritico
                    alertasActivas: true,
                    severidad: 'MEDIA',
                    intervaloVerificacionMinutos: 5,
                    configuracionNotificacionEmail: true,
                    configuracionNotificacionSMS: true,  // ✅ SMS habilitado por defecto
                    configuracionNotificacionWebSocket: true
                  } as any,
                  configuracionNotificacion: {
                    email: true,
                    sms: true,  // ✅ SMS habilitado por defecto
                    webSocket: true
                  } as any
                },
                create: {
                  empresaId: config.empresaId,
                  sensorId: sensor.id,
                  tipoAlerta: sensorConfig.tipo,
                  activo: true,
                  frecuencia: 'INMEDIATA',
                  // Campos JSON opcionales - guardar umbrales y configuración
                  umbralCritico: {
                    tipo: sensorConfig.tipo,
                    umbralMin: sensorConfig.umbralMin,
                    umbralMax: sensorConfig.umbralMax,
                    unidad: sensorConfig.unidad,
                    // 🔧 CORREGIDO: Configuración de notificaciones en umbralCritico
                    alertasActivas: true,
                    severidad: 'MEDIA',
                    intervaloVerificacionMinutos: 5,
                    configuracionNotificacionEmail: true,
                    configuracionNotificacionSMS: true,  // ✅ SMS habilitado por defecto
                    configuracionNotificacionWebSocket: true
                  } as any,
                  configuracionNotificacion: {
                    email: true,
                    sms: true,  // ✅ SMS habilitado por defecto
                    webSocket: true
                  } as any
                }
              });

              this.logger.log(`✅ Configuración de alertas creada para sensor ${sensorConfig.nombre}`);

              // 4. 🔧 NUEVO: Crear destinatarios por defecto para las alertas
              try {
                // ✅ AHORA HABILITADO: Depende de ConfiguracionAlerta
                await this.crearDestinatariosPorDefectoLegacy(sensor.id, config.empresaId);
                this.logger.log(`✅ Destinatarios por defecto creados para sensor ${sensorConfig.nombre}`);
              } catch (destinatarioError) {
                this.logger.warn(`⚠️ Error creando destinatarios por defecto para sensor ${sensorConfig.nombre}:`, destinatarioError);
                // No fallar el proceso completo si falla la creación de destinatarios
              }

            } catch (alertaError) {
              this.logger.warn(`⚠️ Error creando configuración de alertas para sensor ${sensorConfig.nombre}:`, alertaError);
              // No fallar el proceso completo si falla la creación de alertas
            }

          } catch (sensorError) {
            this.logger.error(`❌ Error creando/actualizando sensor ${sensorConfig.nombre}:`, sensorError);
            // Continuar con el siguiente sensor en lugar de fallar todo
          }
        }
      }

      this.logger.log(`✅ Configuración completa guardada para dispositivo: ${config.deviceId}`);
      this.logger.log(`✅ Sensores creados: ${config.sensores.filter(s => s.enabled).length}`);
      this.logger.log(`✅ Configuraciones de alertas creadas con SMS habilitado`);
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
          
          // Verificar umbralCriticoes de alerta si están configurados
          if (config.umbralCritico_alerta && lectura.valor > config.umbralCritico_alerta) {
            return `Valor ${lectura.valor}${lectura.unidad} supera umbralCritico de alerta (${config.umbralCritico_alerta}${lectura.unidad})`;
          }
          
          if (config.umbralCritico_critico && lectura.valor > config.umbralCritico_critico) {
            return `Valor ${lectura.valor}${lectura.unidad} supera umbralCritico crítico (${config.umbralCritico_critico}${lectura.unidad})`;
          }
        } else {
          // Si no hay configuración, usar umbralCriticoes por defecto
          if (lectura.tipo === 'TEMPERATURA') {
            const umbralCriticoAlerta = 35;
            const umbralCritico = 40;
            
            if (lectura.valor > umbralCritico) {
              return `Valor ${lectura.valor}${lectura.unidad} supera umbralCritico crítico (${umbralCritico}${lectura.unidad})`;
            } else if (lectura.valor > umbralCriticoAlerta) {
              return `Valor ${lectura.valor}${lectura.unidad} supera umbralCritico de alerta (${umbralCriticoAlerta}${lectura.unidad})`;
            }
          }
          
          if (lectura.tipo === 'HUMEDAD') {
            const umbralCriticoHumedadAlerta = 80;
            const umbralCriticoHumedadCritico = 90;
            
            if (lectura.valor > umbralCriticoHumedadCritico) {
              return `Valor ${lectura.valor}${lectura.unidad} supera umbralCritico crítico (${umbralCriticoHumedadCritico}${lectura.unidad})`;
            } else if (lectura.valor > umbralCriticoHumedadAlerta) {
              return `Valor ${lectura.valor}${lectura.unidad} supera umbralCritico de alerta (${umbralCriticoHumedadAlerta}${lectura.unidad})`;
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

  /**
   * 🔧 NUEVO: Crea destinatarios por defecto para un sensor (método legacy).
   * Esto asegura que las alertas tengan al menos un destinatario configurado.
   */
  private async crearDestinatariosPorDefectoLegacy(sensorId: number, empresaId: number): Promise<void> {
    try {
      // Buscar usuarios admin de la empresa para usar como destinatarios por defecto
      const usuariosAdmin = await this.prisma.usuario.findMany({
        where: {
          empresaId,
          rol: { in: ['ADMIN', 'SUPERADMIN'] },
          activo: true,
        },
        select: {
          id: true,
          email: true,
          nombre: true,
          telefono: true, // Incluir el campo de teléfono
        },
        take: 3, // Máximo 3 usuarios admin
      });

      if (usuariosAdmin.length === 0) {
        this.logger.warn(`⚠️ No hay usuarios admin en empresa ${empresaId} para configurar como destinatarios`);
        return;
      }

      // Obtener la configuración de alerta del sensor
      const configuracionAlerta = await this.prisma.configuracionAlerta.findFirst({
        where: { sensorId }
      });

      if (!configuracionAlerta) {
        this.logger.warn(`⚠️ No se encontró configuración de alerta para sensor ${sensorId}`);
        return;
      }

      // Crear destinatarios de alerta para cada usuario admin
      for (const usuario of usuariosAdmin) {
        try {
          // 🔧 CORREGIDO: Solo crear destinatario si tiene teléfono para SMS
          if (!usuario.telefono) {
            this.logger.log(`⚠️ Usuario ${usuario.email} no tiene teléfono, solo se configurará para email`);
            // Crear destinatario solo para email
            const destinatario = await this.prisma.destinatarioAlerta.upsert({
              where: {
                empresaId_email: {
                  empresaId,
                  email: usuario.email
                }
              },
              update: {
                nombre: usuario.nombre,
                activo: true,
                tipo: 'EMAIL' as any, // Solo email
              },
              create: {
                nombre: usuario.nombre,
                email: usuario.email,
                telefono: null,
                tipo: 'EMAIL' as any, // Solo email
                activo: true,
                empresaId,
              }
            });

            // Asociar el destinatario a la configuración de alerta
            await this.prisma.configuracionAlertaDestinatario.upsert({
              where: {
                configuracionAlertaId_destinatarioId: {
                  configuracionAlertaId: configuracionAlerta.id,
                  destinatarioId: destinatario.id
                }
              },
              update: {},
              create: {
                configuracionAlertaId: configuracionAlerta.id,
                destinatarioId: destinatario.id,
              }
            });

            this.logger.log(`✅ Destinatario ${usuario.email} (solo email) asociado a sensor ${sensorId}`);
          } else {
            // Usuario tiene teléfono, configurar para email y SMS
            const destinatario = await this.prisma.destinatarioAlerta.upsert({
              where: {
                empresaId_email: {
                  empresaId,
                  email: usuario.email
                }
              },
              update: {
                nombre: usuario.nombre,
                activo: true,
                telefono: usuario.telefono,
                tipo: 'AMBOS' as any, // Email y SMS
              },
              create: {
                nombre: usuario.nombre,
                email: usuario.email,
                telefono: usuario.telefono,
                tipo: 'AMBOS' as any, // Email y SMS
                activo: true,
                empresaId,
              }
            });

            // Asociar el destinatario a la configuración de alerta
            await this.prisma.configuracionAlertaDestinatario.upsert({
              where: {
                configuracionAlertaId_destinatarioId: {
                  configuracionAlertaId: configuracionAlerta.id,
                  destinatarioId: destinatario.id
                }
              },
              update: {},
              create: {
                configuracionAlertaId: configuracionAlerta.id,
                destinatarioId: destinatario.id,
              }
            });

            this.logger.log(`✅ Destinatario ${usuario.email} (email + SMS: ${usuario.telefono}) asociado a sensor ${sensorId}`);
          }
        } catch (error) {
          this.logger.warn(`⚠️ Error asociando destinatario ${usuario.email}:`, error);
        }
      }

      this.logger.log(`✅ ${usuariosAdmin.length} destinatarios por defecto configurados para sensor ${sensorId}`);
    } catch (error) {
      this.logger.error(`❌ Error creando destinatarios por defecto para sensor ${sensorId}:`, error);
      throw error;
    }
  }
}
