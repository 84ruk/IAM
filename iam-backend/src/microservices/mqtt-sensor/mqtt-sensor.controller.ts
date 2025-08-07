import { Controller, Get, Post, Body, UseGuards, Param, Delete, Query, Request, Patch, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { MqttSensorService } from './mqtt-sensor.service';
import { EmqxApiService, EmqxDevice } from './emqx-api.service';
import { SensoresService } from '../../sensores/sensores.service';
import { ESP32AutoConfigService, ESP32AutoConfig } from './esp32-auto-config.service';
import { ESP32BaseCodeService } from './esp32-base-code.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import { Public } from '../../auth/decorators/public.decorator';
import { CreateSensorDto, CreateSensorSimpleDto, SensorConfiguracion, CONFIGURACIONES_PREDEFINIDAS } from '../../sensores/dto/create-sensor.dto';
import { CreateSensorLecturaDto } from '../../sensores/dto/create-sensor-lectura.dto';
import { SensorWithLocation } from '../../sensores/interfaces/sensor-with-location.interface';
import { SensorTipo } from '@prisma/client';

interface ToggleMqttDto {
  enabled: boolean;
}

interface CreateDeviceDto {
  username: string;
  password: string;
}

interface UpdateSensorDto {
  nombre?: string;
  tipo?: SensorTipo;
  ubicacionId?: number;
  activo?: boolean;
  configuracion?: SensorConfiguracion;
}

interface SensorWithDeviceResponse {
  sensor: SensorWithLocation;
  dispositivo: EmqxDevice | null;
  message: string;
}

interface QueryFilters {
  tipo?: SensorTipo;
  productoId?: string;
  desde?: string;
  hasta?: string;
  limite?: string;
  ubicacionId?: string;
}

interface DashboardQuery {
  desde?: string;
  hasta?: string;
  limite?: string;
  ubicacionId?: string;
  tipo?: string;
}

@Controller('mqtt-sensor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MqttSensorController {
  private readonly logger = new Logger(MqttSensorController.name);
  constructor(
    private readonly mqttSensorService: MqttSensorService,
    private readonly emqxApiService: EmqxApiService,
    private readonly sensoresService: SensoresService,
    private readonly esp32AutoConfigService: ESP32AutoConfigService,
    private readonly esp32BaseCodeService: ESP32BaseCodeService,
    private readonly prisma: PrismaService,
  ) {}

  // ===========================================
  // ENDPOINTS DE ESTADO Y CONFIGURACIÓN MQTT
  // ===========================================

  @Get('status')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  getStatus() {
    return this.mqttSensorService.getStatus();
  }

  @Post('toggle')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async toggleMqtt(@Body() toggleDto: ToggleMqttDto) {
    await this.mqttSensorService.toggleMqtt(toggleDto.enabled);
    return {
      message: `MQTT ${toggleDto.enabled ? 'habilitado' : 'deshabilitado'} exitosamente`,
      status: this.mqttSensorService.getStatus(),
    };
  }

  // ===========================================
  // ENDPOINTS DE GESTIÓN DE DISPOSITIVOS EMQX
  // ===========================================

  @Get('devices')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async getDevices() {
    try {
      if (!this.emqxApiService.isApiConfigured()) {
        return {
          error: 'API EMQX no configurada',
          message: 'Configure MQTT_APP_ID, MQTT_APP_SECRET y MQTT_API_ENDPOINT',
        };
      }
      return await this.emqxApiService.getDevices();
    } catch (error) {
      return {
        error: 'Error obteniendo dispositivos',
        message: error.message,
      };
    }
  }

  @Get('devices/:deviceId/stats')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async getDeviceStats(@Param('deviceId') deviceId: string) {
    try {
      if (!this.emqxApiService.isApiConfigured()) {
        return {
          error: 'API EMQX no configurada',
          message: 'Configure MQTT_APP_ID, MQTT_APP_SECRET y MQTT_API_ENDPOINT',
        };
      }
      return await this.emqxApiService.getDeviceStats(deviceId);
    } catch (error) {
      return {
        error: 'Error obteniendo estadísticas del dispositivo',
        message: error.message,
      };
    }
  }

  @Post('devices')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async createDevice(@Body() createDeviceDto: CreateDeviceDto) {
    try {
      if (!this.emqxApiService.isApiConfigured()) {
        return {
          error: 'API EMQX no configurada',
          message: 'Configure MQTT_APP_ID, MQTT_APP_SECRET y MQTT_API_ENDPOINT',
        };
      }
      return await this.emqxApiService.createDevice(
        createDeviceDto.username,
        createDeviceDto.password,
      );
    } catch (error) {
      return {
        error: 'Error creando dispositivo',
        message: error.message,
      };
    }
  }

  @Delete('devices/:username')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async deleteDevice(@Param('username') username: string) {
    try {
      if (!this.emqxApiService.isApiConfigured()) {
        return {
          error: 'API EMQX no configurada',
          message: 'Configure MQTT_APP_ID, MQTT_APP_SECRET y MQTT_API_ENDPOINT',
        };
      }
      const success = await this.emqxApiService.deleteDevice(username);
      return {
        success,
        message: success ? 'Dispositivo eliminado exitosamente' : 'Error eliminando dispositivo',
      };
    } catch (error) {
      return {
        error: 'Error eliminando dispositivo',
        message: error.message,
      };
    }
  }

  @Get('broker/stats')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async getBrokerStats() {
    try {
      if (!this.emqxApiService.isApiConfigured()) {
        return {
          error: 'API EMQX no configurada',
          message: 'Configure MQTT_APP_ID, MQTT_APP_SECRET y MQTT_API_ENDPOINT',
        };
      }
      return await this.emqxApiService.getBrokerStats();
    } catch (error) {
      return {
        error: 'Error obteniendo estadísticas del broker',
        message: error.message,
      };
    }
  }

  // ===========================================
  // ENDPOINTS DE GESTIÓN DE SENSORES
  // ===========================================

  @Post('sensores/registrar')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async registrarSensor(@Body() createSensorDto: CreateSensorDto, @Request() req) {
    try {
      const user = req.user as JwtUser;
      return await this.sensoresService.registrarSensor(createSensorDto, user.empresaId!);
    } catch (error) {
      return {
        error: 'Error registrando sensor',
        message: error.message,
      };
    }
  }

  @Post('sensores/registrar-con-dispositivo')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async registrarSensorConDispositivo(
    @Body() data: { 
      sensor: CreateSensorDto; 
      dispositivo?: { username?: string; password?: string; }
    }, 
    @Request() req
  ) {
    try {
      const user = req.user as JwtUser;
      const { sensor, dispositivo } = data;

      // Registrar el sensor primero
      const sensorRegistrado = await this.sensoresService.registrarSensor(sensor, user.empresaId!);

      // Crear dispositivo EMQX si está configurado
      let dispositivoEMQX: EmqxDevice | null = null;
      if (this.emqxApiService.isApiConfigured() && dispositivo) {
        try {
          const username = dispositivo.username || `sensor_${sensorRegistrado.id}`;
          const password = dispositivo.password || `pass_${sensorRegistrado.id}_${Date.now()}`;
          
          dispositivoEMQX = await this.emqxApiService.createDevice(username, password);
        } catch (emqxError) {
          // Log del error pero no fallar la operación
          console.warn('Error creando dispositivo EMQX:', emqxError);
        }
      }

      return {
        sensor: sensorRegistrado,
        dispositivo: dispositivoEMQX,
        message: 'Sensor registrado exitosamente' + (dispositivoEMQX ? ' con dispositivo EMQX' : ''),
      };
    } catch (error) {
      return {
        error: 'Error registrando sensor con dispositivo',
        message: error.message,
      };
    }
  }

  @Get('sensores/listar')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerSensores(@Request() req, @Query('ubicacionId') ubicacionId?: string) {
    try {
      const user = req.user as JwtUser;
      const ubicacionIdNum = ubicacionId ? parseInt(ubicacionId) : undefined;
      return await this.sensoresService.obtenerSensores(user.empresaId!, ubicacionIdNum);
    } catch (error) {
      return {
        error: 'Error obteniendo sensores',
        message: error.message,
      };
    }
  }

  @Get('sensores/sensor/:id')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerSensor(@Param('id') id: string, @Request() req) {
    try {
      const user = req.user as JwtUser;
      return await this.sensoresService.obtenerSensor(+id, user.empresaId!);
    } catch (error) {
      return {
        error: 'Error obteniendo sensor',
        message: error.message,
      };
    }
  }

  @Patch('sensores/sensor/:id')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async actualizarSensor(
    @Param('id') id: string,
    @Body() updateData: UpdateSensorDto,
    @Request() req,
  ) {
    try {
      const user = req.user as JwtUser;
      return await this.sensoresService.actualizarSensor(+id, updateData, user.empresaId!);
    } catch (error) {
      return {
        error: 'Error actualizando sensor',
        message: error.message,
      };
    }
  }

  @Delete('sensores/sensor/:id')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async eliminarSensor(@Param('id') id: string, @Request() req) {
    try {
      const user = req.user as JwtUser;
      return await this.sensoresService.eliminarSensor(+id, user.empresaId!);
    } catch (error) {
      return {
        error: 'Error eliminando sensor',
        message: error.message,
      };
    }
  }

  // ===========================================
  // ENDPOINTS DE LECTURAS DE SENSORES
  // ===========================================

  @Post('lecturas/registrar')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async recibirLectura(@Body() dto: CreateSensorLecturaDto, @Request() req) {
    try {
      const user = req.user as JwtUser;
      return await this.sensoresService.registrarLectura(dto, user.empresaId!);
    } catch (error) {
      return {
        error: 'Error registrando lectura',
        message: error.message,
      };
    }
  }

  @Get('lecturas/listar')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerLecturas(@Request() req, @Query() query: QueryFilters) {
    try {
      const user = req.user as JwtUser;
      const filtros = {
        tipo: query.tipo,
        productoId: query.productoId ? parseInt(query.productoId) : undefined,
        desde: query.desde ? new Date(query.desde) : undefined,
        hasta: query.hasta ? new Date(query.hasta) : undefined,
        limite: query.limite ? parseInt(query.limite) : 100,
      };
      
      return await this.sensoresService.obtenerLecturas(user.empresaId!, filtros);
    } catch (error) {
      return {
        error: 'Error obteniendo lecturas',
        message: error.message,
      };
    }
  }

  @Post('lecturas/simular')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async simularLectura(@Request() req, @Body() data: { productoId?: number }) {
    try {
      const user = req.user as JwtUser;
      return await this.sensoresService.simularLectura(user.empresaId!, data.productoId);
    } catch (error) {
      return {
        error: 'Error simulando lectura',
        message: error.message,
      };
    }
  }

  // ===========================================
  // ENDPOINTS DE ANALYTICS Y ALERTAS
  // ===========================================

  @Get('analytics')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerAnalytics(@Request() req) {
    try {
      const user = req.user as JwtUser;
      return await this.sensoresService.obtenerAnalytics(user.empresaId!);
    } catch (error) {
      return {
        error: 'Error obteniendo analytics',
        message: error.message,
      };
    }
  }

  @Get('alertas')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerAlertas(@Request() req) {
    try {
      const user = req.user as JwtUser;
      return await this.sensoresService.obtenerAlertas(user.empresaId!);
    } catch (error) {
      return {
        error: 'Error obteniendo alertas',
        message: error.message,
      };
    }
  }

  // ===========================================
  // ENDPOINTS DE DASHBOARD
  // ===========================================

  @Get('dashboard/ubicaciones')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerDashboardUbicaciones(@Request() req) {
    try {
      const user = req.user as JwtUser;
      return await this.sensoresService.obtenerDashboardUbicaciones(user.empresaId!);
    } catch (error) {
      return {
        error: 'Error obteniendo dashboard de ubicaciones',
        message: error.message,
      };
    }
  }

  @Get('dashboard/ubicacion/:id/tiempo-real')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerDashboardTiempoReal(
    @Param('id') id: string,
    @Request() req,
    @Query() query: DashboardQuery,
  ) {
    try {
      const user = req.user as JwtUser;
      const opciones = {
        desde: query.desde ? new Date(query.desde) : undefined,
        hasta: query.hasta ? new Date(query.hasta) : undefined,
        limite: query.limite ? parseInt(query.limite) : undefined,
      };
      return await this.sensoresService.obtenerDashboardTiempoReal(+id, user.empresaId!, opciones);
    } catch (error) {
      return {
        error: 'Error obteniendo dashboard tiempo real',
        message: error.message,
      };
    }
  }

  @Get('dashboard/alertas')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerDashboardAlertas(
    @Request() req,
    @Query() query: DashboardQuery,
  ) {
    try {
      const user = req.user as JwtUser;
      const filtros = {
        ubicacionId: query.ubicacionId ? parseInt(query.ubicacionId) : undefined,
        tipo: query.tipo,
        desde: query.desde ? new Date(query.desde) : undefined,
        hasta: query.hasta ? new Date(query.hasta) : undefined,
      };
      return await this.sensoresService.obtenerDashboardAlertas(user.empresaId!, filtros);
    } catch (error) {
      return {
        error: 'Error obteniendo dashboard de alertas',
        message: error.message,
      };
    }
  }

  // ===========================================
  // ENDPOINTS DE MONITOREO EN TIEMPO REAL
  // ===========================================

  @Get('monitoreo/estado')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerEstadoMonitoreo(@Request() req) {
    try {
      const user = req.user as JwtUser;
      const mqttStatus = this.mqttSensorService.getStatus();
      const analytics = await this.sensoresService.obtenerAnalytics(user.empresaId!);
      const alertas = await this.sensoresService.obtenerAlertas(user.empresaId!);
      
      return {
        mqtt: mqttStatus,
        analytics,
        alertasActivas: alertas.length,
        ultimaActualizacion: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: 'Error obteniendo estado de monitoreo',
        message: error.message,
      };
    }
  }

  @Get('monitoreo/estadisticas')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerEstadisticasMonitoreo(@Request() req) {
    try {
      const user = req.user as JwtUser;
      const brokerStats = this.emqxApiService.isApiConfigured() 
        ? await this.emqxApiService.getBrokerStats() 
        : null;
      
      return {
        broker: brokerStats,
        sensores: await this.sensoresService.obtenerAnalytics(user.empresaId!),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: 'Error obteniendo estadísticas de monitoreo',
        message: error.message,
      };
    }
  }

  // ===========================================
  // ENDPOINTS DE CONFIGURACIÓN Y AYUDA
  // ===========================================

  @Get('configuraciones')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerConfiguraciones() {
    try {
      return {
        configuraciones: CONFIGURACIONES_PREDEFINIDAS,
        tipos_sensores: Object.keys(CONFIGURACIONES_PREDEFINIDAS),
        message: 'Configuraciones predefinidas disponibles'
      };
    } catch (error) {
      return {
        error: 'Error obteniendo configuraciones',
        message: error.message,
      };
    }
  }

  @Get('configuracion/:tipo')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerConfiguracionPorTipo(@Param('tipo') tipo: string) {
    try {
      const sensorTipo = tipo.toUpperCase() as SensorTipo;
      if (!CONFIGURACIONES_PREDEFINIDAS[sensorTipo]) {
        return {
          error: 'Tipo de sensor no válido',
          message: `Tipos disponibles: ${Object.keys(CONFIGURACIONES_PREDEFINIDAS).join(', ')}`,
        };
      }

      return {
        tipo: sensorTipo,
        configuracion: CONFIGURACIONES_PREDEFINIDAS[sensorTipo],
        message: `Configuración para sensor tipo ${sensorTipo}`
      };
    } catch (error) {
      return {
        error: 'Error obteniendo configuración',
        message: error.message,
      };
    }
  }

  // ===========================================
  // ENDPOINTS DE REGISTRO SIMPLIFICADO
  // ===========================================

  @Post('sensores/registrar-simple')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async registrarSensorSimple(@Body() createSensorDto: CreateSensorSimpleDto, @Request() req) {
    try {
      const user = req.user as JwtUser;
      const sensor = await this.sensoresService.registrarSensorSimple(createSensorDto, user.empresaId!);
      
      return {
        sensor,
        message: 'Sensor registrado exitosamente con configuración automática',
        configuracion_aplicada: CONFIGURACIONES_PREDEFINIDAS[createSensorDto.tipo]
      };
    } catch (error) {
      return {
        error: 'Error registrando sensor simple',
        message: error.message,
      };
    }
  }

  @Post('sensores/registrar-rapido')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async registrarSensorRapido(@Body() data: {
    nombre: string;
    tipo: SensorTipo;
    ubicacionId: number;
    descripcion?: string;
  }, @Request() req) {
    try {
      const user = req.user as JwtUser;
      
      // Crear DTO simple con configuración automática
      const dtoSimple: CreateSensorSimpleDto = {
        nombre: data.nombre,
        tipo: data.tipo,
        ubicacionId: data.ubicacionId,
        descripcion: data.descripcion
      };

      const sensor = await this.sensoresService.registrarSensorSimple(dtoSimple, user.empresaId!);
      
      return {
        sensor,
        message: 'Sensor registrado rápidamente con configuración automática',
        configuracion_aplicada: CONFIGURACIONES_PREDEFINIDAS[data.tipo],
        proximos_pasos: [
          'El sensor está listo para recibir lecturas',
          'Puede configurar alertas personalizadas',
          'Puede ajustar la configuración si es necesario'
        ]
      };
    } catch (error) {
      return {
        error: 'Error registrando sensor rápido',
        message: error.message,
      };
    }
  }

  @Post('sensores/registrar-multiple')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async registrarSensoresMultiple(@Body() data: {
    sensores: CreateSensorSimpleDto[];
    ubicacionId?: number; // Si se proporciona, se aplica a todos los sensores
  }, @Request() req) {
    try {
      const user = req.user as JwtUser;
      const resultados: Array<{
        success: boolean;
        sensor?: SensorWithLocation;
        configuracion?: SensorConfiguracion;
        nombre?: string;
        error?: string;
      }> = [];

      for (const sensorData of data.sensores) {
        try {
          const dto: CreateSensorSimpleDto = {
            ...sensorData,
            ubicacionId: data.ubicacionId || sensorData.ubicacionId
          };

          const sensor = await this.sensoresService.registrarSensorSimple(dto, user.empresaId!);
          resultados.push({
            success: true,
            sensor,
            configuracion: CONFIGURACIONES_PREDEFINIDAS[sensorData.tipo]
          });
        } catch (error) {
          resultados.push({
            success: false,
            nombre: sensorData.nombre,
            error: error.message
          });
        }
      }

      const exitosos = resultados.filter(r => r.success).length;
      const fallidos = resultados.filter(r => !r.success).length;

      return {
        resultados,
        resumen: {
          total: data.sensores.length,
          exitosos,
          fallidos
        },
        message: `Registro múltiple completado: ${exitosos} exitosos, ${fallidos} fallidos`
      };
    } catch (error) {
      return {
        error: 'Error en registro múltiple',
        message: error.message,
      };
    }
  }

  // ===========================================
  // ENDPOINTS DE CONFIGURACIÓN AUTOMÁTICA ESP32
  // ===========================================

  @Post('esp32/configuracion-automatica')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async generarConfiguracionAutomatica(@Body() config: ESP32AutoConfig, @Request() req) {
    try {
      const user = req.user as JwtUser;
      
      // Validar que la ubicación pertenece a la empresa del usuario
      // Aquí podrías agregar validación adicional si es necesario
      
      const resultado = await this.esp32AutoConfigService.generarConfiguracionAutomatica(config);
      
      if (resultado.success) {
        return {
          ...resultado,
          instrucciones: [
            '1. Conecta tu ESP32 a la corriente',
            '2. El ESP32 creará una red WiFi llamada "ESP32_Config"',
            '3. Conéctate a esa red WiFi desde tu teléfono/computadora',
            '4. Abre un navegador y ve a: 192.168.4.1',
            '5. Escanea el código QR que aparece en la pantalla',
            '6. El ESP32 se configurará automáticamente',
            '7. Verifica en el dashboard que los datos lleguen'
          ],
          tiempoEstimado: '2-3 minutos'
        };
      }
      
      return resultado;
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  @Get('esp32/config/:deviceId')
  async obtenerConfiguracionESP32(@Param('deviceId') deviceId: string) {
    return await this.esp32AutoConfigService.obtenerConfiguracionESP32(deviceId);
  }

  @Get('esp32/status/:deviceId')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async verificarEstadoESP32(@Param('deviceId') deviceId: string) {
    return await this.esp32AutoConfigService.verificarEstadoESP32(deviceId);
  }

  // ===========================================
  // ENDPOINTS DE CÓDIGO BASE ESP32
  // ===========================================

  @Get('esp32/codigo-base')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerCodigoBase(@Res() res: Response) {
    try {
      const codigo = this.esp32BaseCodeService.generateBaseCode();
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="esp32-base-code.ino"');
      res.send(codigo);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error generando código base: ${error.message}`,
      });
    }
  }

  @Get('esp32/instrucciones-instalacion')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerInstruccionesInstalacion(@Res() res: Response) {
    try {
      const instrucciones = this.esp32BaseCodeService.generateInstallationInstructions();
      
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', 'attachment; filename="instrucciones-instalacion-esp32.md"');
      res.send(instrucciones);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error generando instrucciones: ${error.message}`,
      });
    }
  }

  @Post('esp32/codigo-personalizado')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async generarCodigoPersonalizado(
    @Body() config: {
      sensores: { tipo: string; nombre: string; pin: number }[];
    },
    @Res() res: Response
  ) {
    try {
      const codigoSensores = this.esp32BaseCodeService.generateSensorCode(config.sensores);
      
      res.json({
        success: true,
        codigo: codigoSensores,
        message: 'Código personalizado generado exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error generando código personalizado: ${error.message}`,
      });
    }
  }

  // ===========================================
  // ENDPOINT PÚBLICO PARA ESP32
  // ===========================================

  @Public()
  @Get('esp32/config/:token')
  async obtenerConfiguracionESP32Public(@Param('token') token: string) {
    try {
      // Validar que el token tenga formato válido
      if (!token || token.length < 20) {
        return {
          success: false,
          message: 'Token inválido',
        };
      }

      const resultado = await this.esp32AutoConfigService.obtenerConfiguracionESP32(token);
      
      if (resultado.success) {
        this.logger.log(`Configuración obtenida para token: ${token}`);
      } else {
        this.logger.warn(`Configuración no encontrada para token: ${token}`);
      }
      
      return resultado;
    } catch (error) {
      this.logger.error(`Error obteniendo configuración para token ${token}: ${error.message}`);
      return {
        success: false,
        message: 'Error interno del servidor',
      };
    }
  }

  // ===========================================
  // ENDPOINTS DE ESTADÍSTICAS Y MONITOREO
  // ===========================================

  @Get('esp32/estadisticas')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerEstadisticasDispositivos(@Query('ubicacionId') ubicacionId?: string) {
    try {
      const ubicacionIdNum = ubicacionId ? parseInt(ubicacionId) : undefined;
      const estadisticas = await this.esp32AutoConfigService.obtenerEstadisticasDispositivos(ubicacionIdNum);
      
      return {
        success: true,
        estadisticas,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas: ${error.message}`);
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  @Post('esp32/estado/:deviceId')
  @Public()
  async actualizarEstadoDesdeESP32(
    @Param('deviceId') deviceId: string,
    @Body() estado: any
  ) {
    try {
      await this.esp32AutoConfigService.actualizarEstadoDesdeESP32(deviceId, estado);
      
      return {
        success: true,
        message: 'Estado actualizado correctamente',
      };
    } catch (error) {
      this.logger.error(`Error actualizando estado desde ESP32: ${error.message}`);
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  @Get('esp32/dispositivos')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerDispositivosESP32(@Request() req) {
    try {
      const user = req.user as JwtUser;
      
      // Obtener dispositivos de la empresa del usuario
      const dispositivos = await this.prisma.dispositivoIoT.findMany({
        where: {
          ubicacion: {
            empresaId: user.empresaId,
          },
          tipo: 'ESP32',
        },
        include: {
          ubicacion: {
            select: {
              nombre: true,
            },
          },
          sensores: {
            where: {
              activo: true,
            },
            select: {
              id: true,
              nombre: true,
              tipo: true,
            },
          },
        },
        orderBy: {
          ultimaActualizacion: 'desc',
        },
      });

      // Obtener estado de cada dispositivo
      const dispositivosConEstado = await Promise.all(
        dispositivos.map(async (dispositivo) => {
          const estado = await this.esp32AutoConfigService.verificarEstadoESP32(dispositivo.deviceId);
          return {
            ...dispositivo,
            estado,
          };
        })
      );

      return {
        success: true,
        dispositivos: dispositivosConEstado,
        total: dispositivosConEstado.length,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo dispositivos ESP32: ${error.message}`);
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  @Get('esp32/dispositivo/:deviceId')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async obtenerDispositivoESP32(@Param('deviceId') deviceId: string, @Request() req) {
    try {
      const user = req.user as JwtUser;
      
      const dispositivo = await this.prisma.dispositivoIoT.findFirst({
        where: {
          deviceId,
          tipo: 'ESP32',
          ubicacion: {
            empresaId: user.empresaId,
          },
        },
        include: {
          ubicacion: {
            select: {
              nombre: true,
            },
          },
          sensores: {
            where: {
              activo: true,
            },
            include: {
              lecturas: {
                orderBy: {
                  fecha: 'desc',
                },
                take: 10,
              },
            },
          },
        },
      });

      if (!dispositivo) {
        return {
          success: false,
          message: 'Dispositivo no encontrado',
        };
      }

      const estado = await this.esp32AutoConfigService.verificarEstadoESP32(deviceId);

      return {
        success: true,
        dispositivo: {
          ...dispositivo,
          estado,
        },
      };
    } catch (error) {
      this.logger.error(`Error obteniendo dispositivo ESP32: ${error.message}`);
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  @Delete('esp32/dispositivo/:deviceId')
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  async eliminarDispositivoESP32(@Param('deviceId') deviceId: string, @Request() req) {
    try {
      const user = req.user as JwtUser;
      
      // Verificar que el dispositivo pertenece a la empresa del usuario
      const dispositivo = await this.prisma.dispositivoIoT.findFirst({
        where: {
          deviceId,
          tipo: 'ESP32',
          ubicacion: {
            empresaId: user.empresaId,
          },
        },
      });

      if (!dispositivo) {
        return {
          success: false,
          message: 'Dispositivo no encontrado',
        };
      }

      // Eliminar dispositivo y sus sensores asociados
      await this.prisma.$transaction([
        // Eliminar lecturas de sensores
        this.prisma.sensorLectura.deleteMany({
          where: {
            sensor: {
              dispositivoIoTId: dispositivo.id,
            },
          },
        }),
        // Eliminar sensores
        this.prisma.sensor.deleteMany({
          where: {
            dispositivoIoTId: dispositivo.id,
          },
        }),
        // Eliminar dispositivo
        this.prisma.dispositivoIoT.delete({
          where: {
            id: dispositivo.id,
          },
        }),
      ]);

      this.logger.log(`Dispositivo ESP32 eliminado: ${deviceId}`);

      return {
        success: true,
        message: 'Dispositivo eliminado correctamente',
      };
    } catch (error) {
      this.logger.error(`Error eliminando dispositivo ESP32: ${error.message}`);
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }
} 