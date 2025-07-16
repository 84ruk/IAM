import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { securityConfig } from '../../config/security.config';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  private rateLimiters: Map<string, any> = new Map();
  private speedLimiter: any;

  constructor() {
    this.initializeLimiters();
  }

  private initializeLimiters() {
    // NUEVO: Rate limiting obligatorio en producción
    if (securityConfig.rateLimit.mandatory) {
      this.logger.log('🔒 Rate limiting obligatorio activado');
    }

    // NUEVO: Crear rate limiters específicos por tipo de acción
    this.createActionSpecificLimiters();

    // Speed Limiter - Ralentiza las peticiones después del límite
    this.speedLimiter = slowDown({
      windowMs: securityConfig.slowDown.windowMs,
      delayAfter: securityConfig.slowDown.delayAfter,
      delayMs: () => securityConfig.slowDown.delayMs,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (req: Request) => {
        // Usar IP real considerando proxies
        return req.headers['x-forwarded-for'] as string || req.ip || req.connection.remoteAddress || 'unknown';
      },
    });
  }

  private createActionSpecificLimiters() {
    // Rate limiter para login
    this.rateLimiters.set('login', rateLimit({
      windowMs: securityConfig.rateLimit.limits.login.windowMs,
      max: securityConfig.rateLimit.limits.login.max,
      skipSuccessfulRequests: true,
      skipFailedRequests: false,
      message: {
        error: 'Demasiados intentos de login. Intenta de nuevo más tarde.',
        retryAfter: Math.ceil(securityConfig.rateLimit.limits.login.blockDuration / 1000),
        blockDuration: securityConfig.rateLimit.limits.login.blockDuration,
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        this.logger.warn(`Rate limit de login excedido para IP: ${req.ip}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          environment: process.env.NODE_ENV,
          limit: securityConfig.rateLimit.limits.login.max,
          windowMs: securityConfig.rateLimit.limits.login.windowMs,
        });
        res.status(429).json({
          error: 'Demasiados intentos de login. Intenta de nuevo más tarde.',
          retryAfter: Math.ceil(securityConfig.rateLimit.limits.login.blockDuration / 1000),
          blockDuration: securityConfig.rateLimit.limits.login.blockDuration,
        });
      },
    }));

    // Rate limiter para registro
    this.rateLimiters.set('register', rateLimit({
      windowMs: securityConfig.rateLimit.limits.register.windowMs,
      max: securityConfig.rateLimit.limits.register.max,
      skipSuccessfulRequests: true,
      skipFailedRequests: false,
      message: {
        error: 'Demasiados intentos de registro. Intenta de nuevo más tarde.',
        retryAfter: Math.ceil(securityConfig.rateLimit.limits.register.blockDuration / 1000),
        blockDuration: securityConfig.rateLimit.limits.register.blockDuration,
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        this.logger.warn(`Rate limit de registro excedido para IP: ${req.ip}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          environment: process.env.NODE_ENV,
          limit: securityConfig.rateLimit.limits.register.max,
          windowMs: securityConfig.rateLimit.limits.register.windowMs,
        });
        res.status(429).json({
          error: 'Demasiados intentos de registro. Intenta de nuevo más tarde.',
          retryAfter: Math.ceil(securityConfig.rateLimit.limits.register.blockDuration / 1000),
          blockDuration: securityConfig.rateLimit.limits.register.blockDuration,
        });
      },
    }));

    // Rate limiter para reset de contraseña
    this.rateLimiters.set('passwordReset', rateLimit({
      windowMs: securityConfig.rateLimit.limits.passwordReset.windowMs,
      max: securityConfig.rateLimit.limits.passwordReset.max,
      skipSuccessfulRequests: true,
      skipFailedRequests: false,
      message: {
        error: 'Demasiados intentos de reset de contraseña. Intenta de nuevo más tarde.',
        retryAfter: Math.ceil(securityConfig.rateLimit.limits.passwordReset.blockDuration / 1000),
        blockDuration: securityConfig.rateLimit.limits.passwordReset.blockDuration,
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        this.logger.warn(`Rate limit de reset de contraseña excedido para IP: ${req.ip}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          environment: process.env.NODE_ENV,
          limit: securityConfig.rateLimit.limits.passwordReset.max,
          windowMs: securityConfig.rateLimit.limits.passwordReset.windowMs,
        });
        res.status(429).json({
          error: 'Demasiados intentos de reset de contraseña. Intenta de nuevo más tarde.',
          retryAfter: Math.ceil(securityConfig.rateLimit.limits.passwordReset.blockDuration / 1000),
          blockDuration: securityConfig.rateLimit.limits.passwordReset.blockDuration,
        });
      },
    }));

    // Rate limiter general para API
    this.rateLimiters.set('api', rateLimit({
      windowMs: securityConfig.rateLimit.limits.api.windowMs,
      max: securityConfig.rateLimit.limits.api.max,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: {
        error: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
        retryAfter: Math.ceil(securityConfig.rateLimit.limits.api.blockDuration / 1000),
        blockDuration: securityConfig.rateLimit.limits.api.blockDuration,
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        this.logger.warn(`Rate limit general excedido para IP: ${req.ip}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          environment: process.env.NODE_ENV,
          limit: securityConfig.rateLimit.limits.api.max,
          windowMs: securityConfig.rateLimit.limits.api.windowMs,
        });
        res.status(429).json({
          error: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
          retryAfter: Math.ceil(securityConfig.rateLimit.limits.api.blockDuration / 1000),
          blockDuration: securityConfig.rateLimit.limits.api.blockDuration,
        });
      },
    }));

    // Rate limiter para admin
    this.rateLimiters.set('admin', rateLimit({
      windowMs: securityConfig.rateLimit.limits.admin.windowMs,
      max: securityConfig.rateLimit.limits.admin.max,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: {
        error: 'Demasiadas peticiones de administración desde esta IP.',
        retryAfter: Math.ceil(securityConfig.rateLimit.limits.admin.blockDuration / 1000),
        blockDuration: securityConfig.rateLimit.limits.admin.blockDuration,
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        this.logger.warn(`Rate limit de admin excedido para IP: ${req.ip}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          environment: process.env.NODE_ENV,
          limit: securityConfig.rateLimit.limits.admin.max,
          windowMs: securityConfig.rateLimit.limits.admin.windowMs,
        });
        res.status(429).json({
          error: 'Demasiadas peticiones de administración desde esta IP.',
          retryAfter: Math.ceil(securityConfig.rateLimit.limits.admin.blockDuration / 1000),
          blockDuration: securityConfig.rateLimit.limits.admin.blockDuration,
        });
      },
    }));
  }

  private getRateLimiterForPath(path: string): any {
    // Determinar qué rate limiter usar basado en la ruta
    if (path.includes('/auth/login')) {
      return this.rateLimiters.get('login');
    }
    if (path.includes('/auth/register') || path.includes('/auth/register-empresa')) {
      return this.rateLimiters.get('register');
    }
    if (path.includes('/auth/forgot-password') || path.includes('/auth/reset-password')) {
      return this.rateLimiters.get('passwordReset');
    }
    if (path.includes('/admin') || path.includes('/super-admin')) {
      return this.rateLimiters.get('admin');
    }
    return this.rateLimiters.get('api');
  }

  use(req: Request, res: Response, next: NextFunction) {
    // NUEVO: Rate limiting obligatorio en producción
    if (securityConfig.rateLimit.mandatory) {
      // Log de seguridad para peticiones sospechosas
      this.logSecurityEvents(req);

      // Obtener el rate limiter apropiado para la ruta
      const rateLimiter = this.getRateLimiterForPath(req.path);

      // Aplicar rate limiting específico
      rateLimiter(req, res, (err: any) => {
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
    } else {
      // En desarrollo, solo aplicar headers de seguridad
      this.addSecurityHeaders(res);
      next();
    }
  }

  private addSecurityHeaders(res: Response) {
    // Headers de seguridad adicionales
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }

  private logSecurityEvents(req: Request) {
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /<script/i, // XSS attempts
      /union\s+select/i, // SQL injection
      /eval\s*\(/i, // Code injection
      /document\.cookie/i, // Cookie theft attempts
      /javascript:/i, // JavaScript protocol
      /vbscript:/i, // VBScript protocol
      /onload\s*=/i, // Event handlers
      /onerror\s*=/i, // Event handlers
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
      this.logger.warn('🚨 Actividad sospechosa detectada', {
        ip: req.ip,
        userAgent,
        path,
        suspiciousUserAgent,
        suspiciousPath,
        suspiciousQuery: !!suspiciousQuery,
        suspiciousBody: !!suspiciousBody,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      });
    }

    // Log de peticiones a rutas sensibles
    const sensitiveRoutes = ['/auth/login', '/auth/register', '/admin', '/super-admin', '/auth/forgot-password'];
    if (sensitiveRoutes.some(route => path.includes(route))) {
      this.logger.log('🔒 Acceso a ruta sensible', {
        ip: req.ip,
        path,
        method: req.method,
        userAgent,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      });
    }
  }
} 