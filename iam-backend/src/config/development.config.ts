import { securityConfig } from './security.config';

export const developmentConfig = {
  ...securityConfig,
  
  // Configuración específica para desarrollo
  jwt: {
    ...securityConfig.jwt,
    expiresIn: '7d', // Tokens más largos para desarrollo
  },
  
  // Reducir alertas de seguridad en desarrollo
  advanced: {
    ...securityConfig.advanced,
    enableSecurityMonitoring: false, // Deshabilitar monitoreo en desarrollo
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas en desarrollo
    maxConcurrentSessions: 20, // Más sesiones permitidas en desarrollo
  },
  
  // Logging más detallado en desarrollo
  logging: {
    level: 'debug',
    securityAudit: false, // Deshabilitar auditoría en desarrollo
    databaseQueries: true,
    performance: true,
  },
  
  // Configuración de base de datos para desarrollo
  database: {
    connectionTimeout: 30000, // 30 segundos
    maxRetries: 5,
    retryDelay: 1000, // 1 segundo
  },
  
  // Configuración de rate limiting más permisiva para desarrollo
  rateLimit: {
    ...securityConfig.rateLimit,
    max: 10000, // 10,000 requests en desarrollo
    limits: {
      ...securityConfig.rateLimit.limits,
      login: {
        ...securityConfig.rateLimit.limits.login,
        max: 20, // 20 intentos en desarrollo
        blockDuration: 5 * 60 * 1000, // 5 minutos de bloqueo
      },
      api: {
        ...securityConfig.rateLimit.limits.api,
        max: 10000, // 10,000 requests en desarrollo
      },
    },
  },
}; 