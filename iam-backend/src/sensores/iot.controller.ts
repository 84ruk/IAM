import { Controller, Post, Body, Get, Req, UseGuards, Logger, UnauthorizedException, Param, Query } from '@nestjs/common';
import { IoTThrottlerGuard } from './guards/iot-throttler.guard';
import { CreateSensorLecturaMultipleDto } from './dto/create-sensor-lectura-multiple.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';
import { Request } from 'express';
import { IoTAuditService } from './services/iot-audit.service';
import { IoTConfigService } from './services/iot-config.service';
import { URLConfigService } from '../common/services/url-config.service';
import { ESP32SensorService } from './esp32-sensor.service';

@Controller('iot')
export class IoTController {
  private readonly logger = new Logger(IoTController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly iotAudit: IoTAuditService,
    private readonly iotConfig: IoTConfigService,
    private readonly urlConfig: URLConfigService,
    private readonly esp32Service: ESP32SensorService,
  ) {}

  /**
   * Endpoint para obtener información del servidor (IP, puerto, endpoints)
   */
  @Public()
  @Get('server-info')
  async getServerInfo(@Req() req: Request) {
    const clientIP = this.getClientIP(req);
    this.logger.log(`🔧 Obteniendo información del servidor desde: ${req.protocol}://${req.get('host')}/iot/server-info - IP: ${clientIP}`);
    
    try {
      // 🌐 Usar URLConfigService para obtener la IP correcta
      const localIP = await this.urlConfig.detectLocalIP();
      
      this.logger.log(`🌐 IP del servidor detectada automáticamente: ${localIP}`);
      
      return {
        serverIP: localIP,
        serverPort: 443, // Puerto HTTPS estándar
        baseUrl: `https://api.iaminventario.com.mx`, // SIEMPRE usar URL de producción sin puerto
        timestamp: new Date().toISOString(),
        endpoints: {
          config: `/iot/config`,
          health: `/iot/health`,
          lecturas: `/iot/lecturas`,
          registrar: `/iot/registrar-sensor`
        },
        clientInfo: {
          ip: clientIP,
          userAgent: req.headers['user-agent'] || 'No especificado',
          protocol: req.protocol,
          host: req.get('host')
        }
      };
    } catch (error) {
      this.logger.error(`❌ Error obteniendo información del servidor: ${error.message}`);
      
      // Fallback a IP por defecto
      const fallbackIP = '192.168.0.11';
      this.logger.warn(`⚠️ Usando IP por defecto: ${fallbackIP}`);
      
      return {
        serverIP: fallbackIP,
        serverPort: 443, // Puerto HTTPS estándar
        baseUrl: `https://api.iaminventario.com.mx`, // SIEMPRE usar URL de producción sin puerto
        timestamp: new Date().toISOString(),
        endpoints: {
          config: `/iot/config`,
          health: `/iot/health`,
          lecturas: `/iot/lecturas`,
          registrar: `/iot/registrar-sensor`
        },
        clientInfo: {
          ip: clientIP,
          userAgent: req.headers['user-agent'] || 'No especificado',
          protocol: req.protocol,
          host: req.get('host')
        }
      };
    }
  }

  /**
   * Endpoint para health check del IoT
   */
  @Public()
  @Get('health')
  async healthCheck(@Req() req: Request) {
    const clientIP = this.getClientIP(req);
    this.logger.log(`🏥 Health check IoT desde IP: ${clientIP} - User-Agent: ${req.headers['user-agent'] || 'No especificado'}`);
    
    try {
      const localIP = await this.urlConfig.detectLocalIP();
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        serverIP: localIP,
        clientIP: clientIP,
        message: 'IoT endpoint funcionando correctamente',
        clientInfo: {
          userAgent: req.headers['user-agent'] || 'No especificado',
          protocol: req.protocol,
          host: req.get('host')
        }
      };
    } catch (error) {
      this.logger.error(`❌ Error en health check: ${error.message}`);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        clientIP: clientIP,
        error: error.message,
        clientInfo: {
          userAgent: req.headers['user-agent'] || 'No especificado',
          protocol: req.protocol,
          host: req.get('host')
        }
      };
    }
  }

  /**
   * Endpoint para obtener configuración básica del IoT
   */
  @Public()
  @Post('config')
  async obtenerConfiguracionIoT(@Body() data: { deviceId: string; apiToken: string; empresaId: number }, @Req() req: Request) {
    const clientIP = this.getClientIP(req);
    this.logger.log(`⚙️ Configuración solicitada para dispositivo: ${data.deviceId} desde IP: ${clientIP} - User-Agent: ${req.headers['user-agent'] || 'No especificado'}`);
    
    try {
      // Usar el nuevo servicio de configuración IoT
      const config = await this.iotConfig.getDeviceConfig(data.deviceId, data.apiToken, data.empresaId);
      
      this.logger.log(`✅ Configuración enviada para dispositivo: ${data.deviceId} con URL: ${config.api.baseUrl} desde IP: ${clientIP}`);

      // Registrar auditoría exitosa
      await this.iotAudit.logIOTRequest({
        deviceId: data.deviceId,
        empresaId: data.empresaId,
        endpoint: '/iot/config',
        method: 'POST',
        ip: clientIP,
        success: true,
        timestamp: new Date(),
        requestBody: data
      });

      return {
        ...config,
        clientInfo: {
          ip: clientIP,
          userAgent: req.headers['user-agent'] || 'No especificado'
        }
      };
    } catch (error: any) {
      this.logger.error(`❌ Error obteniendo configuración IoT: ${error?.message || 'Error desconocido'} para dispositivo: ${data.deviceId} desde IP: ${clientIP}`);
      
      // Registrar auditoría de error
      await this.iotAudit.logIOTRequest({
        deviceId: data.deviceId,
        empresaId: data.empresaId,
        endpoint: '/iot/config',
        method: 'POST',
        ip: clientIP,
        success: false,
        errorMessage: error?.message || 'Error desconocido',
        timestamp: new Date(),
        requestBody: data
      });
      
      throw error;
    }
  }

  /**
   * Endpoint público para dispositivos IoT con validación por API key
   */
  @Public()
  @UseGuards(IoTThrottlerGuard)
  @Post('lecturas')
  async recibirLecturasIoT(@Body() dto: CreateSensorLecturaMultipleDto, @Req() req: Request) {
    const clientIP = this.getClientIP(req);

    try {
      // Validar que el dispositivo existe y está activo
      const dispositivo = await this.prisma.dispositivoIoT.findFirst({
        where: {
          deviceId: dto.deviceId,
          activo: true,
          empresaId: dto.empresaId
        }
      });

      if (!dispositivo) {
        this.logger.warn(`Dispositivo no encontrado o inactivo: ${dto.deviceId}`);
        throw new UnauthorizedException('Dispositivo no autorizado');
      }

      // Validar que el API token coincide (opcional, para mayor seguridad)
      if (dispositivo.apiToken && dispositivo.apiToken !== dto.apiToken) {
        this.logger.warn(`Token inválido para dispositivo: ${dto.deviceId}`);
        throw new UnauthorizedException('Token de dispositivo inválido');
      }

      this.logger.log(`Lecturas autorizadas para dispositivo: ${dto.deviceId}`);

      // Procesar y registrar lecturas múltiples (persistir y emitir WS)
      const resultado = await this.esp32Service.registrarLecturasMultiples(dto);

      // Actualizar "ultimaLectura" del dispositivo
      try {
        await this.prisma.dispositivoIoT.update({
          where: { deviceId: dto.deviceId },
          data: { ultimaLectura: new Date() },
        });
      } catch (e) {
        this.logger.warn(`No se pudo actualizar ultimaLectura para ${dto.deviceId}: ${e?.message || e}`);
      }

      // Registrar auditoría exitosa usando IoTAuditService
      await this.iotAudit.logIOTRequest({
        deviceId: dto.deviceId,
        empresaId: dto.empresaId,
        endpoint: '/iot/lecturas',
        method: 'POST',
        ip: clientIP,
        success: true,
        timestamp: new Date(),
        requestBody: dto
      });
      
      return {
        success: true,
        message: 'Lecturas registradas correctamente',
        deviceId: dto.deviceId,
        totalLecturas: resultado.totalLecturas,
        alertasGeneradas: resultado.alertasGeneradas,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      // Registrar auditoría de error
      await this.iotAudit.logIOTRequest({
        deviceId: dto.deviceId,
        empresaId: dto.empresaId,
        endpoint: '/iot/lecturas',
        method: 'POST',
        ip: clientIP,
        success: false,
        errorMessage: (error?.message || 'Error desconocido'),
        timestamp: new Date(),
        requestBody: dto
      });
      throw error;
    }
  }

  /**
   * Endpoint para obtener estadísticas de dispositivos IoT
   */
  @Public()
  @Get('stats')
  async getIoTStats(@Req() req: Request) {
    const clientIP = this.getClientIP(req);
    this.logger.log(`📊 Estadísticas IoT solicitadas desde IP: ${clientIP}`);
    
    try {
      const stats = await this.iotConfig.getDeviceStats();
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        stats,
        clientInfo: {
          ip: clientIP,
          userAgent: req.headers['user-agent'] || 'No especificado'
        }
      };
    } catch (error) {
      this.logger.error(`❌ Error obteniendo estadísticas IoT: ${error.message}`);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        clientInfo: {
          ip: clientIP,
          userAgent: req.headers['user-agent'] || 'No especificado'
        }
      };
    }
  }

  /**
   * Endpoint para verificar estado de un dispositivo específico
   */
  @Public()
  @Get('device/:deviceId/status')
  async getDeviceStatus(
    @Req() req: Request, 
    @Param('deviceId') deviceId: string,
    @Query('apiToken') apiToken: string,
    @Query('empresaId') empresaId: string
  ) {
    const clientIP = this.getClientIP(req);
    
    this.logger.log(`🔍 Estado solicitado para dispositivo: ${deviceId} desde IP: ${clientIP}`);
    
    try {
      // Validar parámetros requeridos
      if (!apiToken || !empresaId) {
        throw new Error('apiToken y empresaId son requeridos como query parameters');
      }

      const empresaIdNum = parseInt(empresaId, 10);
      if (isNaN(empresaIdNum)) {
        throw new Error('empresaId debe ser un número válido');
      }

      // Buscar dispositivo
      const dispositivo = await this.prisma.dispositivoIoT.findFirst({
        where: {
          deviceId,
          apiToken,
          activo: true,
          empresaId: empresaIdNum
        }
      });

      if (!dispositivo) {
        throw new UnauthorizedException('Dispositivo no autorizado');
      }

      const lastSeen = dispositivo.ultimaLectura || dispositivo.updatedAt;
      const connected = Date.now() - lastSeen.getTime() < 5 * 60 * 1000; // 5 minutos

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        device: {
          deviceId: dispositivo.deviceId,
          deviceName: dispositivo.deviceName,
          connected,
          lastSeen: lastSeen.toISOString(),
          status: connected ? 'ONLINE' : 'OFFLINE',
          ubicacionId: dispositivo.ubicacionId,
          empresaId: dispositivo.empresaId
        },
        clientInfo: {
          ip: clientIP,
          userAgent: req.headers['user-agent'] || 'No especificado'
        }
      };
    } catch (error: any) {
      this.logger.error(`❌ Error obteniendo estado del dispositivo ${deviceId}: ${error.message}`);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        clientInfo: {
          ip: clientIP,
          userAgent: req.headers['user-agent'] || 'No especificado'
        }
      };
    }
  }

  /**
   * Obtiene la IP del cliente
   */
  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string) ||
           (req.headers['x-real-ip'] as string) ||
           ((req as any).connection?.remoteAddress) ||
           ((req as any).socket?.remoteAddress) ||
           '0.0.0.0';
  }
}
