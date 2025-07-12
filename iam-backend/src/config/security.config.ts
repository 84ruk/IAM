import { Logger } from '@nestjs/common';

export interface SecurityConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    issuer: string;
    audience: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  cors: {
    allowedOrigins: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
  slowDown: {
    windowMs: number;
    delayAfter: number;
    delayMs: number;
  };
  helmet: {
    contentSecurityPolicy: {
      directives: Record<string, string[]>;
    };
    hsts: {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
  };
}

class SecurityConfigValidator {
  private static logger = new Logger(SecurityConfigValidator.name);

  static validateRequiredEnvVar(name: string, value: string | undefined): string {
    if (!value || value.trim() === '') {
      const error = `Variable de entorno requerida ${name} no está definida`;
      this.logger.error(error);
      throw new Error(error);
    }
    return value;
  }

  static validateJwtSecret(secret: string): string {
    if (secret.length < 32) {
      const error = 'JWT_SECRET debe tener al menos 32 caracteres';
      this.logger.error(error);
      throw new Error(error);
    }
    return secret;
  }

  static validateOrigins(origins: string[]): string[] {
    if (origins.length === 0) {
      const error = 'Debe especificar al menos un origen permitido para CORS';
      this.logger.error(error);
      throw new Error(error);
    }
    return origins;
  }
}

export const securityConfig: SecurityConfig = {
  jwt: {
    secret: SecurityConfigValidator.validateJwtSecret(
      SecurityConfigValidator.validateRequiredEnvVar('JWT_SECRET', process.env.JWT_SECRET)
    ),
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    issuer: SecurityConfigValidator.validateRequiredEnvVar('JWT_ISSUER', process.env.JWT_ISSUER),
    audience: SecurityConfigValidator.validateRequiredEnvVar('JWT_AUDIENCE', process.env.JWT_AUDIENCE),
    refreshSecret: SecurityConfigValidator.validateJwtSecret(
      SecurityConfigValidator.validateRequiredEnvVar('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET)
    ),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    allowedOrigins: SecurityConfigValidator.validateOrigins(
      process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
        : [process.env.FRONTEND_URL || 'http://localhost:3000']
    ),
    credentials: true,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests por ventana
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  slowDown: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    delayAfter: 50, // Permitir 50 requests sin delay
    delayMs: 500, // Agregar 500ms de delay por request después del límite
  },
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://accounts.google.com"],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true,
    },
  },
};

// Validación adicional para entornos de producción
if (process.env.NODE_ENV === 'production') {
  const requiredProdVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_ISSUER',
    'JWT_AUDIENCE',
    'FRONTEND_URL',
  ];

  for (const varName of requiredProdVars) {
    SecurityConfigValidator.validateRequiredEnvVar(varName, process.env[varName]);
  }

  // Validaciones específicas de producción
  if (!process.env.FRONTEND_URL?.startsWith('https://')) {
    throw new Error('FRONTEND_URL debe usar HTTPS en producción');
  }
} 