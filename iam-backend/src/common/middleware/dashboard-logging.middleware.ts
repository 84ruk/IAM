import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 🎯 MIDDLEWARE DE LOGGING PARA DASHBOARD
 * 
 * Este middleware registra todas las peticiones relacionadas con el dashboard
 * para facilitar el debugging de problemas de routing y performance.
 * 
 * Características:
 * - ✅ Logging detallado de requests
 * - ✅ Identificación de controladores
 * - ✅ Medición de tiempo de respuesta
 * - ✅ Detección de errores
 * - ✅ Filtrado por rutas específicas
 */
@Injectable()
export class DashboardLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DashboardLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, headers, query, body } = req;
    
    // 🎯 Solo loggear requests relacionados con dashboard
    if (originalUrl.includes('dashboard')) {
      this.logger.log(`🎯 [DASHBOARD REQUEST] ${method} ${originalUrl}`);
      this.logger.log(`📊 Query params: ${JSON.stringify(query)}`);
      this.logger.log(`🔐 Auth header: ${headers.authorization ? 'Present' : 'Missing'}`);
      
      // ✅ Corregido: Verificar que body existe antes de acceder a length
      const bodySize = body ? JSON.stringify(body).length : 0;
      this.logger.log(`📦 Body size: ${bodySize} bytes`);
      
      // 🕐 Medir tiempo de respuesta
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const { statusCode } = res;
        
        if (statusCode >= 400) {
          this.logger.error(`❌ [DASHBOARD ERROR] ${method} ${originalUrl} - ${statusCode} (${duration}ms)`);
        } else {
          this.logger.log(`✅ [DASHBOARD SUCCESS] ${method} ${originalUrl} - ${statusCode} (${duration}ms)`);
        }
        
        // 📈 Logging adicional para endpoints críticos
        if (originalUrl.includes('daily-movements')) {
          this.logger.log(`📈 [DAILY MOVEMENTS] Endpoint: ${originalUrl}, Status: ${statusCode}, Duration: ${duration}ms`);
        }
        
        if (originalUrl.includes('dashboard-cqrs')) {
          this.logger.log(`🎯 [CQRS] Endpoint: ${originalUrl}, Status: ${statusCode}, Duration: ${duration}ms`);
        }
      });
    }
    
    next();
  }
} 