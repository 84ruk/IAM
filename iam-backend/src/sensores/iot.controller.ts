import { Controller, Post, Body, UnauthorizedException, Logger, UseGuards, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ESP32SensorService } from './esp32-sensor.service';
import { CreateSensorLecturaMultipleDto } from './dto/create-sensor-lectura-multiple.dto';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { IoTThrottlerGuard } from './guards/iot-throttler.guard';
import { IoTAuditService } from './services/iot-audit.service';

@Public()
@UseGuards(IoTThrottlerGuard)
@Controller('iot')
export class IoTController {
  private readonly logger = new Logger(IoTController.name);

  constructor(
    private readonly esp32SensorService: ESP32SensorService,
    private readonly prisma: PrismaService,
    private readonly iotAuditService: IoTAuditService
  ) {}

  // Endpoint público para dispositivos IoT con validación por API key
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

  private getClientIP(req: Request): string {
    return req.headers['x-forwarded-for'] as string ||
           req.headers['x-real-ip'] as string ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           '0.0.0.0';
  }

  // Endpoint público para obtener configuración de dispositivos IoT
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
