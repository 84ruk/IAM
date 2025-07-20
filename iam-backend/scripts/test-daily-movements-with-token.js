#!/usr/bin/env node

/**
 * 🧪 SCRIPT PARA PROBAR DAILY-MOVEMENTS CON TOKEN VÁLIDO
 * 
 * Este script genera un token JWT válido para prueba@iam.com
 * y prueba el endpoint de daily-movements.
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'c0379e52830db2fade789e0d4f3adb5cf3962a3d2f1165f16313d176f4a5a878';
const JWT_ISSUER = process.env.JWT_ISSUER || 'http://localhost:3001';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'http://localhost:3001';

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

// Función para generar un token JWT válido para prueba@iam.com
function generateValidToken() {
  const payload = {
    id: 16, // ID del usuario prueba@iam.com
    email: 'prueba@iam.com',
    rol: 'ADMIN',
    empresaId: 8, // Empresa ID 8: Hamburguesas Tony
    sub: 16,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE
  };

  return jwt.sign(payload, JWT_SECRET, { 
    algorithm: 'HS256'
  });
}

// Función para hacer peticiones con manejo de errores
async function makeRequest(url, description, token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    logTest(`Probando: ${description}`);
    logInfo(`URL: ${url}`);
    
    const startTime = Date.now();
    const response = await axios.get(url, { headers });
    const duration = Date.now() - startTime;
    
    logSuccess(`${description} - Status: ${response.status} (${duration}ms)`);
    
    // Verificar estructura de datos
    if (response.data) {
      const hasData = response.data.data && Array.isArray(response.data.data);
      const hasSummary = response.data.summary && typeof response.data.summary === 'object';
      const hasMeta = response.data.meta && typeof response.data.meta === 'object';
      
      logInfo(`  📊 Datos: ${hasData ? '✅' : '❌'} (${response.data.data?.length || 0} registros)`);
      logInfo(`  📈 Resumen: ${hasSummary ? '✅' : '❌'}`);
      logInfo(`  🔧 Meta: ${hasMeta ? '✅' : '❌'}`);
      
      // Mostrar algunos datos de ejemplo
      if (hasData && response.data.data.length > 0) {
        logInfo('  📋 Ejemplo de datos:');
        response.data.data.slice(0, 3).forEach((item, index) => {
          logInfo(`    ${index + 1}. ${item.fecha}: Entradas=${item.entradas}, Salidas=${item.salidas}, Neto=${item.neto}`);
        });
      }
      
      // Mostrar resumen
      if (hasSummary) {
        logInfo('  📊 Resumen:');
        logInfo(`    - Promedio Entradas: ${response.data.summary.avgEntradasDiarias}`);
        logInfo(`    - Promedio Salidas: ${response.data.summary.avgSalidasDiarias}`);
        logInfo(`    - Total Movimientos: ${response.data.summary.totalMovimientos}`);
        logInfo(`    - Tendencia: ${response.data.summary.tendencia}`);
      }
    }
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      duration
    };
  } catch (error) {
    logError(`${description} - Error: ${error.response?.status || error.code}`);
    if (error.response?.data) {
      logError(`Mensaje: ${error.response.data.message || error.response.data}`);
    }
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

// Función principal de testing
async function testDailyMovementsWithToken() {
  log('🎯 INICIANDO TESTING DE DAILY-MOVEMENTS CON TOKEN VÁLIDO', 'bright');
  log('========================================================', 'bright');
  
  // Generar token válido para prueba@iam.com
  const validToken = generateValidToken();
  logInfo(`Token generado para: prueba@iam.com (ID: 16, Empresa: 8)`);
  logInfo(`JWT_SECRET usado: ${JWT_SECRET.substring(0, 20)}...`);
  logInfo(`JWT_ISSUER: ${JWT_ISSUER}`);
  logInfo(`JWT_AUDIENCE: ${JWT_AUDIENCE}`);
  
  const results = [];
  
  // 🎯 TESTING ENDPOINTS DE DAILY-MOVEMENTS
  log('\n📊 TESTING ENDPOINTS DE DAILY-MOVEMENTS', 'magenta');
  log('=====================================', 'magenta');
  
  const endpoints = [
    {
      url: `${BASE_URL}/dashboard-cqrs/daily-movements?days=7`,
      description: 'Daily movements (7 días)'
    },
    {
      url: `${BASE_URL}/dashboard-cqrs/daily-movements?days=15`,
      description: 'Daily movements (15 días)'
    },
    {
      url: `${BASE_URL}/dashboard-cqrs/daily-movements?days=30`,
      description: 'Daily movements (30 días)'
    }
  ];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.url, endpoint.description, validToken);
    results.push({ ...endpoint, ...result });
    
    // Pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 📊 RESUMEN DE RESULTADOS
  log('\n📊 RESUMEN DE RESULTADOS', 'bright');
  log('========================', 'bright');
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  log(`Total de endpoints probados: ${totalCount}`);
  log(`✅ Exitosos: ${successCount}`);
  log(`❌ Fallidos: ${totalCount - successCount}`);
  
  // 🎯 ANÁLISIS DE DATOS
  log('\n🎯 ANÁLISIS DE DATOS', 'cyan');
  log('===================', 'cyan');
  
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length > 0) {
    logSuccess('Endpoints funcionando correctamente:');
    successfulResults.forEach(result => {
      logInfo(`  - ${result.description}`);
      
      if (result.data && result.data.data) {
        const totalEntradas = result.data.data.reduce((sum, day) => sum + day.entradas, 0);
        const totalSalidas = result.data.data.reduce((sum, day) => sum + day.salidas, 0);
        const diasConDatos = result.data.data.filter(day => day.entradas > 0 || day.salidas > 0).length;
        
        logInfo(`    📊 Días con datos: ${diasConDatos}/${result.data.data.length}`);
        logInfo(`    📈 Total entradas: ${totalEntradas}`);
        logInfo(`    📉 Total salidas: ${totalSalidas}`);
        logInfo(`    💰 Valor total: $${result.data.data.reduce((sum, day) => sum + day.valorNeto, 0).toFixed(2)}`);
      }
    });
  } else {
    logWarning('No hay endpoints funcionando correctamente');
  }
  
  // 🚨 DETECCIÓN DE PROBLEMAS
  log('\n🚨 DETECCIÓN DE PROBLEMAS', 'red');
  log('========================', 'red');
  
  const problems = [];
  
  // Verificar si hay datos
  const hasData = successfulResults.some(r => 
    r.data && r.data.data && r.data.data.some(day => day.entradas > 0 || day.salidas > 0)
  );
  
  if (!hasData) {
    problems.push('❌ No hay datos de movimientos en los resultados');
  }
  
  // Verificar si hay errores
  const hasErrors = results.some(r => !r.success);
  if (hasErrors) {
    problems.push('❌ Algunos endpoints están fallando');
  }
  
  if (problems.length === 0) {
    logSuccess('No se detectaron problemas críticos');
  } else {
    problems.forEach(problem => logError(problem));
  }
  
  // 💡 RECOMENDACIONES
  log('\n💡 RECOMENDACIONES', 'green');
  log('==================', 'green');
  
  if (!hasData) {
    logWarning('1. Verificar que la consulta SQL esté funcionando correctamente');
    logWarning('2. Verificar que los filtros de fecha no estén excluyendo datos');
    logWarning('3. Verificar que los movimientos tengan fechas válidas');
  }
  
  if (hasErrors) {
    logWarning('4. Revisar logs del servidor para errores específicos');
    logWarning('5. Verificar que el token JWT sea válido');
  }
  
  logInfo('6. El frontend debería mostrar datos correctamente ahora');
  logInfo('7. Probar con diferentes períodos (7, 15, 30 días)');
  
  log('\n🎯 TESTING COMPLETADO', 'bright');
  log('====================', 'bright');
  
  return results;
}

// Ejecutar el testing si el script se ejecuta directamente
if (require.main === module) {
  testDailyMovementsWithToken()
    .then(results => {
      const hasErrors = results.some(r => !r.success);
      process.exit(hasErrors ? 1 : 0);
    })
    .catch(error => {
      logError(`Error en el testing: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { testDailyMovementsWithToken, generateValidToken }; 