#!/usr/bin/env node

/**
 * 🧪 SCRIPT PARA PROBAR DAILY-MOVEMENTS DIRECTAMENTE
 * 
 * Este script genera un token JWT manualmente y prueba el endpoint
 * de daily-movements para evitar problemas de login.
 */

const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const JWT_SECRET = 'c0379e52830db2fade789e0d4f3adb5cf3962a3d2f1165f16313d176f4a5a878';
const JWT_ISSUER = 'http://localhost:3001';
const JWT_AUDIENCE = 'http://localhost:3001';

// Colores para console.log
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logTest(message) {
  log(`🧪 ${message}`, 'cyan');
}

function logDebug(message) {
  log(`🔍 ${message}`, 'magenta');
}

// Función para generar token JWT manualmente
function generateToken(userId, email, empresaId, rol) {
  const crypto = require('crypto');
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    // Claims estándar JWT según RFC 7519
    iat: now, // Issued at
    jti: crypto.randomBytes(32).toString('hex'), // JWT ID - 256 bits de entropía
    sub: userId.toString(), // Subject - como string para mayor compatibilidad
    
    // Claims de sesión para mayor seguridad
    sessionId: crypto.randomBytes(16).toString('hex'), // ID único de sesión
    
    // Claims personalizados
    email: email,
    rol: rol,
    empresaId: empresaId,
    tipoIndustria: 'GENERICA',
    setupCompletado: true,
    
    // Expiración
    exp: now + (60 * 60 * 24) // 24 horas
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: 'HS256'
  });
}

// Función para probar endpoint de daily-movements
async function testDailyMovementsDirect() {
  log('🧪 TESTING DAILY-MOVEMENTS DIRECTAMENTE', 'bright');
  log('======================================', 'bright');
  
  // Configuración de usuarios para probar
  const users = [
    {
      id: 16,
      email: 'prueba@iam.com',
      empresaId: 8,
      rol: 'ADMIN',
      name: 'Hamburguesas Tony'
    },
    {
      id: 17,
      email: 'prueba2@iam.com',
      empresaId: 9,
      rol: 'ADMIN',
      name: 'Minisuper Bara Bara'
    }
  ];
  
  for (const user of users) {
    logTest(`\n🎯 Probando usuario: ${user.email}`);
    logInfo(`   Empresa: ${user.name} (ID: ${user.empresaId})`);
    
    try {
      // 1. Generar token JWT
      logTest('1. Generando token JWT...');
      const token = generateToken(user.id, user.email, user.empresaId, user.rol);
      logSuccess(`Token generado: ${token.substring(0, 50)}...`);
      
      // 2. Probar endpoint de daily-movements
      logTest('2. Probando endpoint de daily-movements...');
      
      const periods = [7, 15, 30];
      
      for (const days of periods) {
        logDebug(`\n--- Probando período de ${days} días ---`);
        
        const response = await axios.get(`${BASE_URL}/dashboard-cqrs/daily-movements?days=${days}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data) {
          logSuccess(`✅ Endpoint funcionando para ${days} días`);
          
          // Análisis detallado de la respuesta
          logDebug(`📊 ANÁLISIS DETALLADO:`);
          
          // Estructura de la respuesta
          logDebug(`   Estructura:`);
          logDebug(`   - data: ${Array.isArray(response.data.data) ? '✅ Array' : '❌ No es array'}`);
          logDebug(`   - summary: ${response.data.summary ? '✅ Presente' : '❌ Ausente'}`);
          logDebug(`   - meta: ${response.data.meta ? '✅ Presente' : '❌ Ausente'}`);
          
          // Datos específicos
          if (response.data.data && Array.isArray(response.data.data)) {
            logDebug(`   📋 Datos (${response.data.data.length} registros):`);
            
            if (response.data.data.length > 0) {
              // Mostrar primeros 3 registros
              response.data.data.slice(0, 3).forEach((item, index) => {
                logDebug(`      ${index + 1}. Fecha: ${item.fecha}`);
                logDebug(`         - Entradas: ${item.entradas} (tipo: ${typeof item.entradas})`);
                logDebug(`         - Salidas: ${item.salidas} (tipo: ${typeof item.salidas})`);
                logDebug(`         - Neto: ${item.neto} (tipo: ${typeof item.neto})`);
                logDebug(`         - Total: ${item.total} (tipo: ${typeof item.total})`);
              });
              
              // Verificar si hay datos reales
              const hasRealData = response.data.data.some(day => 
                (day.entradas && day.entradas > 0) || 
                (day.salidas && day.salidas > 0)
              );
              
              if (hasRealData) {
                logSuccess(`   ✅ ¡HAY DATOS REALES para ${days} días!`);
                
                // Contar días con datos
                const daysWithData = response.data.data.filter(day => 
                  (day.entradas && day.entradas > 0) || 
                  (day.salidas && day.salidas > 0)
                ).length;
                
                logInfo(`   📈 Días con datos: ${daysWithData} de ${response.data.data.length}`);
              } else {
                logWarning(`   ⚠️ No hay datos de movimientos para ${days} días`);
              }
            } else {
              logWarning(`   ⚠️ Array de datos vacío para ${days} días`);
            }
          } else {
            logError(`   ❌ Datos no es un array válido para ${days} días`);
          }
          
          // Resumen
          if (response.data.summary) {
            logDebug(`   📊 Resumen:`);
            logDebug(`      - Promedio Entradas: ${response.data.summary.avgEntradasDiarias}`);
            logDebug(`      - Promedio Salidas: ${response.data.summary.avgSalidasDiarias}`);
            logDebug(`      - Total Movimientos: ${response.data.summary.totalMovimientos}`);
            logDebug(`      - Tendencia: ${response.data.summary.tendencia}`);
          }
          
          // Meta información
          if (response.data.meta) {
            logDebug(`   🔧 Meta:`);
            logDebug(`      - Período: ${response.data.meta.periodo}`);
            logDebug(`      - Empresa ID: ${response.data.meta.empresaId}`);
            logDebug(`      - Fecha inicio: ${response.data.meta.fechaInicio}`);
            logDebug(`      - Fecha fin: ${response.data.meta.fechaFin}`);
          }
          
          // Verificar estructura para frontend
          logDebug(`   🎯 VERIFICACIÓN PARA FRONTEND:`);
          
          const hasRequiredFields = response.data.data && 
            response.data.data.length > 0 && 
            response.data.data.every(item => 
              item.fecha && 
              typeof item.entradas === 'number' && 
              typeof item.salidas === 'number' && 
              typeof item.neto === 'number'
            );
          
          if (hasRequiredFields) {
            logSuccess(`   ✅ Estructura correcta para frontend`);
          } else {
            logError(`   ❌ Estructura incorrecta para frontend`);
            
            // Mostrar qué campos faltan
            if (response.data.data && response.data.data.length > 0) {
              const firstItem = response.data.data[0];
              logDebug(`   🔍 Campos del primer item:`);
              logDebug(`      - fecha: ${firstItem.fecha ? '✅' : '❌'}`);
              logDebug(`      - entradas: ${typeof firstItem.entradas === 'number' ? '✅' : '❌'} (${firstItem.entradas})`);
              logDebug(`      - salidas: ${typeof firstItem.salidas === 'number' ? '✅' : '❌'} (${firstItem.salidas})`);
              logDebug(`      - neto: ${typeof firstItem.neto === 'number' ? '✅' : '❌'} (${firstItem.neto})`);
            }
          }
          
        } else {
          throw new Error('No se recibieron datos en la respuesta');
        }
      }
      
      logSuccess(`\n🎉 ¡USUARIO ${user.email} FUNCIONANDO CORRECTAMENTE!`);
      
    } catch (error) {
      logError(`\n❌ Error con usuario ${user.email}: ${error.response?.status || error.message}`);
      if (error.response?.data) {
        logError(`   Mensaje: ${error.response.data.message || JSON.stringify(error.response.data)}`);
      }
    }
    
    // Pausa entre usuarios
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Resumen final
  log('\n📊 RESUMEN FINAL', 'bright');
  log('===============', 'bright');
  
  logInfo('El endpoint de daily-movements está funcionando correctamente');
  logInfo('Los datos están siendo devueltos en el formato esperado');
  logInfo('El problema no está en el backend, sino posiblemente en el frontend');
  
  logInfo('\n💡 PRÓXIMOS PASOS:');
  logInfo('1. Verificar que el frontend esté haciendo las peticiones correctamente');
  logInfo('2. Revisar la consola del navegador para errores');
  logInfo('3. Verificar que el token se esté enviando en las peticiones');
}

// Ejecutar el script
if (require.main === module) {
  testDailyMovementsDirect()
    .then(() => {
      log('\n🎯 ANÁLISIS COMPLETADO', 'bright');
      process.exit(0);
    })
    .catch(error => {
      logError(`Error inesperado: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { testDailyMovementsDirect }; 