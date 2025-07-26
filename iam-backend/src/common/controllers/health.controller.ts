import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RedisHealthService } from '../services/redis-health.service';

@ApiTags('Health')
@Controller('system-health')
export class HealthController {
  constructor(
    private readonly redisHealthService: RedisHealthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Verificar salud general del sistema' })
  @ApiResponse({ status: 200, description: 'Sistema saludable' })
  @ApiResponse({ status: 503, description: 'Sistema con problemas' })
  async checkHealth(@Res() res: Response) {
    try {
      const redisHealth = await this.redisHealthService.checkHealth();
      const memoryUsage = process.memoryUsage();

      const isHealthy = redisHealth.isConnected && redisHealth.successRate > 95;

      const healthData = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          redis: {
            status: redisHealth.isConnected ? 'connected' : 'disconnected',
            latency: redisHealth.latency,
            successRate: redisHealth.successRate,
            memoryUsage: redisHealth.memoryUsage,
            uptime: redisHealth.uptime,
            totalCommands: redisHealth.totalCommands,
            failedCommands: redisHealth.failedCommands,
            lastError: redisHealth.lastError,
          },
          system: {
            memory: {
              used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
              total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
              external: Math.round(memoryUsage.external / 1024 / 1024),
              rss: Math.round(memoryUsage.rss / 1024 / 1024),
            },
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform,
          },
        },
        recommendations: this.redisHealthService.getRecommendations(redisHealth),
      };

      const statusCode = isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
      
      res.status(statusCode).json(healthData);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Error verificando salud del sistema',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('redis')
  @ApiOperation({ summary: 'Verificar salud específica de Redis' })
  @ApiResponse({ status: 200, description: 'Estado de Redis' })
  async checkRedisHealth(@Res() res: Response) {
    try {
      const redisHealth = await this.redisHealthService.checkHealth();
      const recommendations = this.redisHealthService.getRecommendations(redisHealth);

      const response = {
        status: redisHealth.isConnected ? 'connected' : 'disconnected',
        data: redisHealth,
        recommendations,
        timestamp: new Date().toISOString(),
      };

      const statusCode = redisHealth.isConnected ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
      res.status(statusCode).json(response);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Error verificando salud de Redis',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('system')
  @ApiOperation({ summary: 'Obtener estadísticas del sistema' })
  @ApiResponse({ status: 200, description: 'Estadísticas del sistema' })
  async getSystemStats(@Res() res: Response) {
    try {
      const memoryUsage = process.memoryUsage();
      
      res.status(HttpStatus.OK).json({
        status: 'success',
        data: {
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024),
            rss: Math.round(memoryUsage.rss / 1024 / 1024),
          },
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
          pid: process.pid,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Error obteniendo estadísticas del sistema',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
} 