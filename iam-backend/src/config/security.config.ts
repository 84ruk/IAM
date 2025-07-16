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
    // Configuración obligatoria
    mandatory: boolean;
    // Diferentes límites por tipo de acción
    limits: {
      login: { windowMs: number; max: number; blockDuration: number };
      register: { windowMs: number; max: number; blockDuration: number };
      passwordReset: { windowMs: number; max: number; blockDuration: number };
      api: { windowMs: number; max: number; blockDuration: number };
      admin: { windowMs: number; max: number; blockDuration: number };
    };
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
  // NUEVO: Configuración de seguridad avanzada
  advanced: {
    enableTwoFactor: boolean;
    enableAuditLog: boolean;
    enableSecurityMonitoring: boolean;
    enableAutomatedTesting: boolean;
    sessionTimeout: number;
    maxConcurrentSessions: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
      preventCommonPasswords: boolean;
    };
  };
}

class SecurityConfigValidator {
  static validateRequiredEnvVar(
    name: string,
    value: string | undefined,
  ): string {
    if (!value) {
      throw new Error(`Variable de entorno requerida no encontrada: ${name}`);
    }
    return value;
  }

  static validateJwtSecret(secret: string): string {
    if (secret.length < 32) {
      throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
    }
    return secret;
  }

  static validateOrigins(origins: string[]): string[] {
    if (!origins || origins.length === 0) {
      throw new Error('Al menos un origen CORS debe ser especificado');
    }
    return origins;
  }
}

export const securityConfig: SecurityConfig = {
  jwt: {
    secret: SecurityConfigValidator.validateJwtSecret(
      SecurityConfigValidator.validateRequiredEnvVar(
        'JWT_SECRET',
        process.env.JWT_SECRET,
      ),
    ),
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    issuer: SecurityConfigValidator.validateRequiredEnvVar(
      'JWT_ISSUER',
      process.env.JWT_ISSUER,
    ),
    audience: SecurityConfigValidator.validateRequiredEnvVar(
      'JWT_AUDIENCE',
      process.env.JWT_AUDIENCE,
    ),
    refreshSecret: SecurityConfigValidator.validateJwtSecret(
      SecurityConfigValidator.validateRequiredEnvVar(
        'JWT_REFRESH_SECRET',
        process.env.JWT_REFRESH_SECRET,
      ),
    ),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    allowedOrigins: SecurityConfigValidator.validateOrigins(
      process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
        : [process.env.FRONTEND_URL || 'http://localhost:3000'],
    ),
    credentials: true,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max:
      process.env.NODE_ENV === 'development'
        ? parseInt(process.env.RATE_LIMIT_MAX || '1000') // 1,000 requests en desarrollo
        : parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests en producción
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    // NUEVO: Rate limiting obligatorio
    mandatory:
      process.env.NODE_ENV === 'production' ||
      process.env.FORCE_RATE_LIMIT === 'true',
    // NUEVO: Límites específicos por acción
    limits: {
      login: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 5, // 5 intentos
        blockDuration: 30 * 60 * 1000, // 30 minutos de bloqueo
      },
      register: {
        windowMs: 60 * 60 * 1000, // 1 hora
        max: 3, // 3 intentos
        blockDuration: 2 * 60 * 60 * 1000, // 2 horas de bloqueo
      },
      passwordReset: {
        windowMs: 60 * 60 * 1000, // 1 hora
        max: 3, // 3 intentos
        blockDuration: 2 * 60 * 60 * 1000, // 2 horas de bloqueo
      },
      api: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: process.env.NODE_ENV === 'development' ? 1000 : 100,
        blockDuration: 15 * 60 * 1000, // 15 minutos de bloqueo
      },
      admin: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 50, // 50 requests para admin
        blockDuration: 30 * 60 * 1000, // 30 minutos de bloqueo
      },
    },
  },
  slowDown: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    delayAfter: process.env.NODE_ENV === 'development' ? 100 : 20, // Más restrictivo
    delayMs: process.env.NODE_ENV === 'development' ? 200 : 1000, // Delay mayor
  },
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
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
  // NUEVO: Configuración de seguridad avanzada
  advanced: {
    enableTwoFactor: process.env.ENABLE_2FA === 'true',
    enableAuditLog: process.env.ENABLE_AUDIT_LOG !== 'false', // Habilitado por defecto
    enableSecurityMonitoring: process.env.ENABLE_SECURITY_MONITORING === 'true',
    enableAutomatedTesting: process.env.ENABLE_AUTOMATED_TESTING === 'true',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hora en ms
    maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5'),
    passwordPolicy: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '12'),
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
      requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
      requireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS !== 'false',
      preventCommonPasswords: process.env.PASSWORD_PREVENT_COMMON !== 'false',
    },
  },
};
