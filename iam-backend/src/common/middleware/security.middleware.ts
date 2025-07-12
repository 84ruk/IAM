import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { securityConfig } from '../../config/security.config';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  private rateLimiter: any;
  private speedLimiter: any;

  constructor() {
    this.initializeLimiters();
  }

  private initializeLimiters() {
    // Rate Limiter - Bloquea completamente después del límite
    this.rateLimiter = rateLimit({
      windowMs: securityConfig.rateLimit.windowMs,
      max: securityConfig.rateLimit.max,
      skipSuccessfulRequests: securityConfig.rateLimit.skipSuccessfulRequests,
      skipFailedRequests: securityConfig.rateLimit.skipFailedRequests,
      message: {
        error: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
        retryAfter: Math.ceil(securityConfig.rateLimit.windowMs / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        this.logger.warn(`Rate limit excedido para IP: ${req.ip}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
        });
        res.status(429).json({
          error: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
          retryAfter: Math.ceil(securityConfig.rateLimit.windowMs / 1000),
        });
      },
    });

    // Speed Limiter - Ralentiza las peticiones después del límite
    this.speedLimiter = slowDown({
      windowMs: securityConfig.slowDown.windowMs,
      delayAfter: securityConfig.slowDown.delayAfter,
      delayMs: securityConfig.slowDown.delayMs,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (req: Request) => {
        // Usar IP real considerando proxies
        return req.headers['x-forwarded-for'] as string || req.ip || req.connection.remoteAddress || 'unknown';
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Log de seguridad para peticiones sospechosas
    this.logSecurityEvents(req);

    // Aplicar rate limiting
    this.rateLimiter(req, res, (err: any) => {
      if (err) {
        this.logger.error('Error en rate limiter:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      // Aplicar speed limiting
      this.speedLimiter(req, res, (err: any) => {
        if (err) {
          this.logger.error('Error en speed limiter:', err);
          return res.status(500).json({ error: 'Error interno del servidor' });
        }

        // Agregar headers de seguridad adicionales
        this.addSecurityHeaders(res);

        next();
      });
    });
  }

  private logSecurityEvents(req: Request) {
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /<script/i, // XSS attempts
      /union\s+select/i, // SQL injection
      /eval\s*\(/i, // Code injection
      /document\.cookie/i, // Cookie theft attempts
    ];

    const userAgent = req.get('User-Agent') || '';
    const path = req.path;
    const query = req.query;
    const body = req.body;

    // Verificar patrones sospechosos
    const suspiciousUserAgent = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    const suspiciousPath = suspiciousPatterns.some(pattern => pattern.test(path));
    const suspiciousQuery = query ? JSON.stringify(query).match(/[<>'"]/) : null;
    const suspiciousBody = body ? JSON.stringify(body).match(/[<>'"]/) : null;

    if (suspiciousUserAgent || suspiciousPath || suspiciousQuery || suspiciousBody) {
      this.logger.warn('Actividad sospechosa detectada', {
        ip: req.ip,
        userAgent,
        path,
        suspiciousUserAgent,
        suspiciousPath,
        suspiciousQuery: !!suspiciousQuery,
        suspiciousBody: !!suspiciousBody,
        timestamp: new Date().toISOString(),
      });
    }

    // Log de peticiones a rutas sensibles
    const sensitiveRoutes = ['/auth/login', '/auth/register', '/admin', '/super-admin'];
    if (sensitiveRoutes.some(route => path.includes(route))) {
      this.logger.log('Acceso a ruta sensible', {
        ip: req.ip,
        path,
        method: req.method,
        userAgent,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private addSecurityHeaders(res: Response) {
    // Headers de seguridad adicionales
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Remover headers que pueden revelar información del servidor
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
  }
} 