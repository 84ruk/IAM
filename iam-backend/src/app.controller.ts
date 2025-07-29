import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };
  }

  @Public()
  @Get('health/complete')
  async getCompleteHealth() {
    try {
      // Verificar conexión a base de datos
      const dbHealth = await this.prismaService.checkConnection();
      
      // Obtener estadísticas del sistema
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      return {
        status: dbHealth.status === 'ok' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
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
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        checks: {
          database: false,
          memory: true,
          uptime: process.uptime() > 0
        }
      };
    }
  }

  @Public()
  @Get('health/database')
  async getDatabaseHealth(): Promise<object> {
    const dbHealth = await this.prismaService.checkConnection();
    return {
      status: dbHealth.status,
      message: dbHealth.message,
      timestamp: new Date().toISOString(),
      poolStats: dbHealth.poolStats,
    };
  }

  @Public()
  @Get('health/connections')
  async getConnectionPoolStats(): Promise<object> {
    try {
      const poolStats = await this.prismaService.getConnectionPoolStats();
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        poolStats,
        recommendations: this.getPoolRecommendations(poolStats),
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Error al obtener estadísticas del pool de conexiones',
        error: error.message,
      };
    }
  }

  private getPoolRecommendations(poolStats: any): string[] {
    const recommendations: string[] = [];

    if (poolStats.activeConnections > 15) {
      recommendations.push('Muchas conexiones activas - considerar optimizar queries o aumentar el pool');
    }

    if (poolStats.idleConnections > 10) {
      recommendations.push('Muchas conexiones inactivas - considerar reducir el tamaño del pool');
    }

    if (poolStats.totalConnections > 20) {
      recommendations.push('Pool de conexiones cerca del límite - monitorear de cerca');
    }

    if (poolStats.activeConnections === 0 && poolStats.totalConnections > 0) {
      recommendations.push('Todas las conexiones están inactivas - pool funcionando correctamente');
    }

    return recommendations.length > 0 ? recommendations : ['Pool de conexiones funcionando óptimamente'];
  }
}
