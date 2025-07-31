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
