import { Controller, Get, Post, Body, Request, Logger, Res, UnauthorizedException, UseGuards, Req } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { Response } from 'express';
import { ESP32SensorService } from './esp32-sensor.service';
import { CreateSensorLecturaMultipleDto } from './dto/create-sensor-lectura-multiple.dto';
import { PrismaService } from '../prisma/prisma.service';
import { IoTThrottlerGuard } from './guards/iot-throttler.guard';
import { IoTAuditService } from './services/iot-audit.service';

@Controller('iot')
export class IoTController {
  private readonly logger = new Logger(IoTController.name);

  constructor(
    private readonly esp32SensorService: ESP32SensorService,
    private readonly prisma: PrismaService,
    private readonly iotAuditService: IoTAuditService
  ) {}

  @Public()
  @Get('config')
  async getConfig(@Request() req) {
    this.logger.log(`🔧 Obteniendo configuración desde: ${req.protocol}://${req.get('host')}/iot/config`);
    
    try {
      const config = await this.esp32SensorService.obtenerConfiguracionESP32('default');
      
      // Obtener la IP real del servidor desde la request
      const serverIP = this.getServerIP(req);
      const baseUrl = `http://${serverIP}:3001`;
      
      // Actualizar la configuración con la IP correcta
      const updatedConfig = {
        ...config,
        api: {
          ...config.api,
          baseUrl: baseUrl
        }
      };
      
      this.logger.log(`✅ Configuración enviada con IP: ${baseUrl}`);
      return updatedConfig;
    } catch (error) {
      this.logger.error(`❌ Error obteniendo configuración: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @Get('health')
  async healthCheck(@Request() req) {
    const clientIP = req.ip || req.connection.remoteAddress;
    this.logger.log(`🏥 Health check desde IP: ${clientIP}`);
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      serverIP: this.getServerIP(req),
      clientIP: clientIP
    };
  }

  @Public()
  @Get('server-info')
  async getServerInfo(@Request() req) {
    const serverIP = this.getServerIP(req);
    const clientIP = req.ip || req.connection.remoteAddress;
    
    this.logger.log(`ℹ️ Información del servidor solicitada desde: ${clientIP}`);
    
    return {
      serverIP: serverIP,
      serverPort: 3001,
      baseUrl: `http://${serverIP}:3001`,
      timestamp: new Date().toISOString(),
      endpoints: {
        config: `/iot/config`,
        health: `/iot/health`,
        lecturas: `/iot/lecturas`,
        registrar: `/iot/registrar-sensor`
      }
    };
  }

  /**
   * Detecta automáticamente la IP del servidor
   */
  private getServerIP(req: any): string {
    // Intentar obtener la IP desde diferentes fuentes
    let serverIP = '192.168.0.4'; // IP por defecto
    
    try {
      // 1. Intentar obtener desde headers personalizados
      const forwardedIP = req.headers['x-forwarded-for'];
      if (forwardedIP) {
        serverIP = forwardedIP.split(',')[0].trim();
        this.logger.log(`📍 IP detectada desde X-Forwarded-For: ${serverIP}`);
        return serverIP;
      }

      // 2. Intentar obtener desde la request
      if (req.get('host')) {
        const host = req.get('host');
        if (host.includes(':')) {
          serverIP = host.split(':')[0];
          this.logger.log(`📍 IP detectada desde Host: ${serverIP}`);
          return serverIP;
        }
      }

      // 3. Intentar obtener desde la conexión
      if (req.connection && req.connection.localAddress) {
        serverIP = req.connection.localAddress;
        this.logger.log(`📍 IP detectada desde Connection: ${serverIP}`);
        return serverIP;
      }

      // 4. Intentar obtener desde el socket
      if (req.socket && req.socket.localAddress) {
        serverIP = req.socket.localAddress;
        this.logger.log(`📍 IP detectada desde Socket: ${serverIP}`);
        return serverIP;
      }

      // 5. Detección automática usando interfaces de red
      const networkInterfaces = require('os').networkInterfaces();
      for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const netInterface of interfaces) {
          if (netInterface.family === 'IPv4' && !netInterface.internal) {
            serverIP = netInterface.address;
            this.logger.log(`📍 IP detectada automáticamente: ${serverIP}`);
            return serverIP;
          }
        }
      }

      this.logger.warn(`⚠️ No se pudo detectar IP automáticamente, usando IP por defecto: ${serverIP}`);
      return serverIP;
      
    } catch (error) {
      this.logger.error(`❌ Error detectando IP: ${error.message}`);
      return serverIP;
    }
  }

  // Endpoint público para dispositivos IoT con validación por API key
  @Public()
  @UseGuards(IoTThrottlerGuard)
  @Post('lecturas')
  async recibirLecturasIoT(@Body() dto: CreateSensorLecturaMultipleDto, @Req() req: Request) {
    const clientIP = this.getClientIP(req);
    let success = false;
    let errorMessage: string | undefined;

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
        errorMessage = 'Dispositivo no encontrado o inactivo';
        this.logger.warn(`Dispositivo no encontrado o inactivo: ${dto.deviceId}`);
        throw new UnauthorizedException('Dispositivo no autorizado');
      }

      // Validar que el API token coincide (opcional, para mayor seguridad)
      if (dispositivo.apiToken && dispositivo.apiToken !== dto.apiToken) {
        errorMessage = 'Token de dispositivo inválido';
        this.logger.warn(`Token inválido para dispositivo: ${dto.deviceId}`);
        throw new UnauthorizedException('Token de dispositivo inválido');
      }

      this.logger.log(`Lecturas autorizadas para dispositivo: ${dto.deviceId}`);
      const result = await this.esp32SensorService.registrarLecturasMultiples(dto);
      success = true;
      
      // Registrar auditoría exitosa
      await this.iotAuditService.logIOTRequest({
        deviceId: dto.deviceId,
        empresaId: dto.empresaId,
        endpoint: '/iot/lecturas',
        method: 'POST',
        ip: clientIP,
        userAgent: req.headers['user-agent'],
        success: true,
        timestamp: new Date(),
        requestBody: dto,
        responseStatus: 200,
      });

      return result;
    } catch (error) {
      // Registrar auditoría de error
      await this.iotAuditService.logIOTRequest({
        deviceId: dto.deviceId,
        empresaId: dto.empresaId,
        endpoint: '/iot/lecturas',
        method: 'POST',
        ip: clientIP,
        userAgent: req.headers['user-agent'],
        success: false,
        errorMessage: errorMessage || error.message,
        timestamp: new Date(),
        requestBody: dto,
        responseStatus: 401,
      });

      throw error;
    }
  }

  private getClientIP(req: any): string {
    return req.headers['x-forwarded-for'] as string ||
           req.headers['x-real-ip'] as string ||
           (req.connection && req.connection.remoteAddress) ||
           (req.socket && req.socket.remoteAddress) ||
           '0.0.0.0';
  }

  // Endpoint público para obtener configuración de dispositivos IoT
  @Public()
  @Post('config')
  async obtenerConfiguracionIoT(@Body() data: { deviceId: string; apiToken: string; empresaId: number }) {
    // Validar que el dispositivo existe y está activo
    const dispositivo = await this.prisma.dispositivoIoT.findFirst({
      where: {
        deviceId: data.deviceId,
        apiToken: data.apiToken,
        activo: true,
        empresaId: data.empresaId
      }
    });

    if (!dispositivo) {
      this.logger.warn(`Configuración solicitada para dispositivo no autorizado: ${data.deviceId}`);
      throw new UnauthorizedException('Dispositivo no autorizado');
    }

    return this.esp32SensorService.obtenerConfiguracionESP32(data.deviceId);
  }
}
