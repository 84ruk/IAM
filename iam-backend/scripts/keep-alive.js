#!/usr/bin/env node

/**
 * Script para mantener la aplicación Fly.io siempre activa
 * Este script hace pings periódicos al endpoint de health check
 * para evitar que la aplicación se apague por inactividad
 */

const https = require('https');
const http = require('http');

// Configuración
const config = {
  // URL de tu aplicación Fly.io (reemplaza con tu URL real)
  appUrl: process.env.FLY_APP_URL || 'https://iam-backend-baruk.fly.dev',
  
  // Intervalo entre pings (en milisegundos) - 5 minutos
  pingInterval: 5 * 60 * 1000,
  
  // Timeout para las peticiones (en milisegundos)
  timeout: 10000,
  
  // Endpoints a verificar
  endpoints: [
    '/health',
    '/health/database',
    '/health/complete'
  ],
  
  // Logs
  verbose: process.env.VERBOSE === 'true' || false
};

/**
 * Función para hacer ping a un endpoint
 */
async function pingEndpoint(url, endpoint) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${url}${endpoint}`;
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(fullUrl, {
      timeout: config.timeout,
      headers: {
        'User-Agent': 'Fly-Keep-Alive/1.0'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = res.statusCode >= 200 && res.statusCode < 300;
        
        if (config.verbose) {
          console.log(`[${new Date().toISOString()}] ${endpoint}: ${res.statusCode} - ${success ? 'OK' : 'ERROR'}`);
        }
        
        resolve({
          endpoint,
          statusCode: res.statusCode,
          success,
          responseTime: Date.now() - startTime,
          data: data.length > 100 ? data.substring(0, 100) + '...' : data
        });
      });
    });
    
    const startTime = Date.now();
    
    req.on('error', (error) => {
      if (config.verbose) {
        console.error(`[${new Date().toISOString()}] ${endpoint}: ERROR - ${error.message}`);
      }
      reject({
        endpoint,
        error: error.message,
        success: false
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject({
        endpoint,
        error: 'Timeout',
        success: false
      });
    });
  });
}

/**
 * Función principal para mantener la aplicación activa
 */
async function keepAlive() {
  console.log(`[${new Date().toISOString()}] 🚀 Iniciando Keep-Alive para: ${config.appUrl}`);
  console.log(`[${new Date().toISOString()}] ⏰ Intervalo de ping: ${config.pingInterval / 1000} segundos`);
  
  let consecutiveFailures = 0;
  const maxFailures = 3;
  
  const pingAll = async () => {
    try {
      const results = await Promise.allSettled(
        config.endpoints.map(endpoint => pingEndpoint(config.appUrl, endpoint))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;
      
      if (failed === 0) {
        consecutiveFailures = 0;
        console.log(`[${new Date().toISOString()}] ✅ Ping exitoso: ${successful}/${results.length} endpoints respondieron`);
      } else {
        consecutiveFailures++;
        console.warn(`[${new Date().toISOString()}] ⚠️  Ping parcial: ${successful}/${results.length} endpoints respondieron (fallos consecutivos: ${consecutiveFailures})`);
        
        if (consecutiveFailures >= maxFailures) {
          console.error(`[${new Date().toISOString()}] 🚨 Demasiados fallos consecutivos (${consecutiveFailures}). Verificando estado...`);
          
          // Intentar un ping de emergencia
          try {
            const emergencyResult = await pingEndpoint(config.appUrl, '/health');
            if (emergencyResult.success) {
              console.log(`[${new Date().toISOString()}] ✅ Ping de emergencia exitoso, reseteando contador`);
              consecutiveFailures = 0;
            }
          } catch (error) {
            console.error(`[${new Date().toISOString()}] 🚨 Ping de emergencia falló: ${error.message}`);
          }
        }
      }
      
      // Mostrar detalles si hay errores y verbose está activado
      if (config.verbose && failed > 0) {
        results.forEach((result, index) => {
          if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)) {
            console.error(`[${new Date().toISOString()}] ❌ ${config.endpoints[index]}: ${result.status === 'rejected' ? result.reason.error : result.value.error || 'Status code: ' + result.value.statusCode}`);
          }
        });
      }
      
    } catch (error) {
      consecutiveFailures++;
      console.error(`[${new Date().toISOString()}] 🚨 Error en ping: ${error.message}`);
    }
  };
  
  // Ejecutar inmediatamente
  await pingAll();
  
  // Configurar intervalo
  setInterval(pingAll, config.pingInterval);
  
  // Manejar señales de terminación
  process.on('SIGINT', () => {
    console.log(`[${new Date().toISOString()}] 👋 Deteniendo Keep-Alive...`);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log(`[${new Date().toISOString()}] 👋 Deteniendo Keep-Alive...`);
    process.exit(0);
  });
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  keepAlive().catch(error => {
    console.error(`[${new Date().toISOString()}] 🚨 Error fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { keepAlive, pingEndpoint }; 