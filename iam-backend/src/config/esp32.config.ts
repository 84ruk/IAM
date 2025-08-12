import { registerAs } from '@nestjs/config';

export default registerAs('esp32', () => ({
  // Configuración de endpoints para ESP32
  endpoints: {
    lectura: '/sensores/iot/lectura',
    registro: '/sensores/iot/registrar-sensor',
    configuracion: '/sensores/esp32-config',
    estado: '/sensores/esp32-status',
  },
  
  // Headers requeridos para ESP32
  headers: {
    empresaId: 'x-empresa-id',
    deviceType: 'x-device-type',
    esp32Device: 'x-esp32-device',
    version: 'x-esp32-version',
  },
  
  // Configuración de validación
  validation: {
    maxLecturasPorMinuto: 60,
    maxSensoresPorDispositivo: 10,
    timeoutLectura: 30000, // 30 segundos
  },
  
  // Configuración de logging
  logging: {
    enableDebug: process.env.ESP32_DEBUG === 'true',
    logLecturas: process.env.ESP32_LOG_LECTURAS !== 'false',
    logErrores: true,
  },
  
  // Configuración de seguridad
  security: {
    allowUnauthenticated: process.env.ESP32_ALLOW_UNAUTH === 'true',
    validateIP: process.env.ESP32_VALIDATE_IP !== 'false',
    whitelistIPs: process.env.ESP32_WHITELIST_IPS?.split(',') || [],
  },
}));
