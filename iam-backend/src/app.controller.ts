import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  @Get('health/database')
  async getDatabaseHealth() {
    this.logger.log('Verificando salud de la base de datos...');
    
    try {
      const dbStatus = await this.prisma.checkConnection();
      this.logger.log('Estado de la base de datos:', dbStatus);
      return dbStatus;
    } catch (error) {
      this.logger.error('Error al verificar salud de la base de datos:', error);
      throw error;
    }
  }
}
