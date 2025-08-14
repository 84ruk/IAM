import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface IOTAuditLog {
  deviceId: string;
  empresaId: number;
  endpoint: string;
  method: string;
  ip: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
  requestBody?: any;
  responseStatus?: number;
}

@Injectable()
export class IoTAuditService {
  private readonly logger = new Logger(IoTAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logIOTRequest(auditData: IOTAuditLog): Promise<void> {
    try {
      // Log en consola para debugging
      const statusIcon = auditData.success ? '✅' : '❌';
      const ipInfo = auditData.ip ? ` - IP: ${auditData.ip}` : '';
      const errorInfo = auditData.errorMessage ? ` - Error: ${auditData.errorMessage}` : '';
      
      this.logger.log(`${statusIcon} IoT Audit: ${auditData.method} ${auditData.endpoint} - Device: ${auditData.deviceId}${ipInfo}${errorInfo}`);

      // En producción, guardar en base de datos
      if (process.env.NODE_ENV === 'production') {
        try {
          await this.prisma.auditLog.create({
            data: {
              action: 'IOT_REQUEST',
              userId: 0, // Usuario sistema para IoT
              userEmail: 'iot@system.com',
              userName: 'IoT System',
              resource: 'IoT_DEVICE',
              resourceId: 0,
              empresaId: auditData.empresaId,
              empresaName: 'IoT System',
              details: JSON.stringify({
                deviceId: auditData.deviceId,
                endpoint: auditData.endpoint,
                method: auditData.method,
                ip: auditData.ip,
                userAgent: auditData.userAgent,
                success: auditData.success,
                errorMessage: auditData.errorMessage,
                requestBody: auditData.requestBody,
                responseStatus: auditData.responseStatus,
                timestamp: auditData.timestamp,
              }),
              ipAddress: auditData.ip,
              userAgent: auditData.userAgent || 'IoT Device',
            },
          });
          
          this.logger.debug(`📊 Auditoría IoT guardada en base de datos para dispositivo: ${auditData.deviceId}`);
        } catch (dbError) {
          this.logger.error(`❌ Error guardando auditoría IoT en BD: ${dbError.message}`);
          // No fallar la operación principal por error de auditoría
        }
      }

      // Alertar sobre patrones sospechosos
      await this.detectSuspiciousActivity(auditData);

    } catch (error) {
      this.logger.error(`❌ Error logging IoT audit para dispositivo ${auditData.deviceId}:`, error);
      // No fallar la operación principal por error de auditoría
    }
  }

  private async detectSuspiciousActivity(auditData: IOTAuditLog): Promise<void> {
    // Detectar múltiples fallos de autenticación
    if (!auditData.success) {
      const recentFailures = await this.prisma.auditLog.count({
        where: {
          action: 'IOT_REQUEST',
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Últimos 5 minutos
          },
        },
      });

      if (recentFailures >= 5) {
        this.logger.warn(`🚨 Posible ataque detectado: ${recentFailures} fallos de autenticación desde IP ${auditData.ip} en los últimos 5 minutos`);
        
        // Aquí podrías implementar bloqueo de IP, notificaciones, etc.
        await this.blockIP(auditData.ip);
      }
    }

    // Detectar actividad anormal por dispositivo (simplificado)
    const recentRequests = await this.prisma.auditLog.count({
      where: {
        action: 'IOT_REQUEST',
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Último minuto
        },
      },
    });

    if (recentRequests > 10) {
      this.logger.warn(`🚨 Actividad anormal detectada: Dispositivo ${auditData.deviceId} realizó ${recentRequests} peticiones en el último minuto`);
    }
  }

  private async blockIP(ip: string): Promise<void> {
    // Implementar bloqueo de IP (ejemplo básico)
    this.logger.warn(`🔒 IP ${ip} bloqueada por actividad sospechosa`);
    
    // En producción, podrías:
    // 1. Agregar IP a lista negra en Redis
    // 2. Configurar firewall
    // 3. Enviar notificación al administrador
  }

  async getDeviceActivity(deviceId: string, hours: number = 24): Promise<any[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.prisma.auditLog.findMany({
      where: {
        action: 'IOT_REQUEST',
        createdAt: {
          gte: since,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSuspiciousActivity(hours: number = 24): Promise<any[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Buscar patrones sospechosos
    return this.prisma.auditLog.findMany({
      where: {
        action: 'IOT_REQUEST',
        createdAt: {
          gte: since,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
