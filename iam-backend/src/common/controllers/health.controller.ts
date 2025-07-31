import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check básico' })
  @ApiResponse({ status: 200, description: 'Servidor funcionando correctamente' })
  async getHealth(@Res() res: Response) {
    try {
      // Respuesta rápida sin verificar base de datos
      const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        service: 'iam-backend'
      };

      res.status(HttpStatus.OK).json(healthData);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Error en health check',
        timestamp: new Date().toISOString()
      });
    }
  }

  @Get('complete')
  @ApiOperation({ summary: 'Health check completo del sistema' })
  @ApiResponse({ status: 200, description: 'Sistema completamente funcional' })
  @ApiResponse({ status: 503, description: 'Sistema con problemas' })
  async getCompleteHealth(@Res() res: Response) {
    try {
      // Verificar conexión a base de datos
      const dbHealth = await this.prismaService.checkConnection();
      
      // Obtener estadísticas del sistema
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      const healthData = {
        status: dbHealth.status === 'ok' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        service: 'iam-backend',
        services: {
          database: {
            status: dbHealth.status,
            message: dbHealth.message,
            poolStats: dbHealth.poolStats,
          },
          system: {
            memory: {
              used: Math.round(memUsage.heapUsed / 1024 / 1024),
              total: Math.round(memUsage.heapTotal / 1024 / 1024),
              external: Math.round(memUsage.external / 1024 / 1024),
              rss: Math.round(memUsage.rss / 1024 / 1024),
              unit: 'MB'
            },
            cpu: {
              user: Math.round(cpuUsage.user / 1000),
              system: Math.round(cpuUsage.system / 1000),
              unit: 'ms'
            }
          }
        },
        checks: {
          database: dbHealth.status === 'ok',
          memory: memUsage.heapUsed < 500 * 1024 * 1024, // Menos de 500MB
          uptime: process.uptime() > 0
        }
      };

      const statusCode = dbHealth.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
      res.status(statusCode).json(healthData);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'unhealthy',
        message: 'Error verificando salud del sistema',
        error: error.message,
        timestamp: new Date().toISOString(),
        checks: {
          database: false,
          memory: true,
          uptime: process.uptime() > 0
        }
      });
    }
  }

  @Get('database')
  @ApiOperation({ summary: 'Health check específico de base de datos' })
  @ApiResponse({ status: 200, description: 'Base de datos funcionando' })
  @ApiResponse({ status: 503, description: 'Problemas con la base de datos' })
  async getDatabaseHealth(@Res() res: Response) {
    try {
      const dbHealth = await this.prismaService.checkConnection();
      
      const response = {
        status: dbHealth.status,
        message: dbHealth.message,
        timestamp: new Date().toISOString(),
        poolStats: dbHealth.poolStats,
      };

      const statusCode = dbHealth.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
      res.status(statusCode).json(response);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Error verificando salud de la base de datos',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  @Get('connections')
  @ApiOperation({ summary: 'Estadísticas del pool de conexiones' })
  @ApiResponse({ status: 200, description: 'Estadísticas del pool' })
  async getConnectionStats(@Res() res: Response) {
    try {
      const dbHealth = await this.prismaService.checkConnection();
      
      res.status(HttpStatus.OK).json({
        status: 'success',
        data: {
          poolStats: dbHealth.poolStats,
          lastCheck: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Error obteniendo estadísticas de conexiones',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
} 