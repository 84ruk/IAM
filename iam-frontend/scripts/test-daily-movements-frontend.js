#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TESTING PARA FRONTEND DAILY-MOVEMENTS
 * 
 * Este script prueba la funcionalidad del frontend de daily-movements
 * para verificar que se conecte correctamente con el backend.
 */

const axios = require('axios');
require('dotenv').config();

// Configuración
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

// Función para hacer peticiones con manejo de errores
async function makeRequest(url, description) {
  try {
    logTest(`Probando: ${description}`);
    logInfo(`URL: ${url}`);
    
    const startTime = Date.now();
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true // Aceptar cualquier status code
    });
    const duration = Date.now() - startTime;
    
    if (response.status === 200) {
      logSuccess(`${description} - Status: ${response.status} (${duration}ms)`);
      return {
        success: true,
        status: response.status,
        data: response.data,
        duration
      };
    } else {
      logWarning(`${description} - Status: ${response.status} (${duration}ms)`);
      return {
        success: false,
        status: response.status,
        error: `HTTP ${response.status}`,
        duration
      };
    }
  } catch (error) {
    logError(`${description} - Error: ${error.code || error.message}`);
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

// Función principal de testing
async function testFrontendDailyMovements() {
  log('🎯 INICIANDO TESTING DEL FRONTEND DAILY-MOVEMENTS', 'bright');
  log('================================================', 'bright');
  
  logInfo(`Frontend URL: ${FRONTEND_URL}`);
  logInfo(`Backend URL: ${BACKEND_URL}`);
  
  const results = {
    frontend: [],
    backend: [],
    summary: {
      total: 0,
      success: 0,
      failed: 0
    }
  };
  
  // 🎯 TESTING FRONTEND
  log('\n🌐 TESTING FRONTEND (Páginas y Rutas)', 'magenta');
  log('====================================', 'magenta');
  
  const frontendEndpoints = [
    {
      url: `${FRONTEND_URL}/daily-movements`,
      description: 'Página principal de daily-movements'
    },
    {
      url: `${FRONTEND_URL}/daily-movements-advanced`,
      description: 'Página avanzada de daily-movements'
    },
    {
      url: `${FRONTEND_URL}/dashboard`,
      description: 'Dashboard principal'
    }
  ];
  
  for (const endpoint of frontendEndpoints) {
    const result = await makeRequest(endpoint.url, endpoint.description);
    results.frontend.push({ ...endpoint, ...result });
    results.summary.total++;
    
    if (result.success) {
      results.summary.success++;
    } else {
      results.summary.failed++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 🔧 TESTING BACKEND (Endpoints que usa el frontend)
  log('\n🔧 TESTING BACKEND (Endpoints del Frontend)', 'cyan');
  log('==========================================', 'cyan');
  
  const backendEndpoints = [
    {
      url: `${BACKEND_URL}/dashboard-cqrs/daily-movements?days=7`,
      description: 'API daily-movements (7 días)'
    },
    {
      url: `${BACKEND_URL}/dashboard-cqrs/daily-movements?days=15`,
      description: 'API daily-movements (15 días)'
    },
    {
      url: `${BACKEND_URL}/dashboard-cqrs/daily-movements?days=30`,
      description: 'API daily-movements (30 días)'
    },
    {
      url: `${BACKEND_URL}/dashboard-cqrs/kpis`,
      description: 'API KPIs básicos'
    },
    {
      url: `${BACKEND_URL}/dashboard-cqrs/financial-kpis`,
      description: 'API KPIs financieros'
    }
  ];
  
  for (const endpoint of backendEndpoints) {
    const result = await makeRequest(endpoint.url, endpoint.description);
    results.backend.push({ ...endpoint, ...result });
    results.summary.total++;
    
    if (result.success) {
      results.summary.success++;
    } else {
      results.summary.failed++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // 📊 RESUMEN DE RESULTADOS
  log('\n📊 RESUMEN DE RESULTADOS', 'bright');
  log('========================', 'bright');
  
  log(`Total de endpoints probados: ${results.summary.total}`);
  log(`✅ Exitosos: ${results.summary.success}`);
  log(`❌ Fallidos: ${results.summary.failed}`);
  
  // 🎯 ANÁLISIS DE FRONTEND
  log('\n🎯 ANÁLISIS DE FRONTEND', 'cyan');
  log('======================', 'cyan');
  
  const frontendSuccess = results.frontend.filter(r => r.success).length;
  const frontendFailed = results.frontend.filter(r => !r.success).length;
  
  log(`Frontend - Exitosos: ${frontendSuccess}/${results.frontend.length}`);
  log(`Frontend - Fallidos: ${frontendFailed}/${results.frontend.length}`);
  
  if (frontendFailed > 0) {
    logWarning('Páginas del frontend con problemas:');
    results.frontend
      .filter(r => !r.success)
      .forEach(r => logError(`  - ${r.description}: ${r.error}`));
  }
  
  // 🔧 ANÁLISIS DE BACKEND
  log('\n🔧 ANÁLISIS DE BACKEND', 'magenta');
  log('=====================', 'magenta');
  
  const backendSuccess = results.backend.filter(r => r.success).length;
  const backendFailed = results.backend.filter(r => !r.success).length;
  
  log(`Backend - Exitosos: ${backendSuccess}/${results.backend.length}`);
  log(`Backend - Fallidos: ${backendFailed}/${results.backend.length}`);
  
  if (backendFailed > 0) {
    logWarning('Endpoints del backend con problemas:');
    results.backend
      .filter(r => !r.success)
      .forEach(r => logError(`  - ${r.description}: ${r.error}`));
  }
  
  // 🔍 VERIFICACIÓN DE DATOS
  log('\n🔍 VERIFICACIÓN DE DATOS', 'yellow');
  log('========================', 'yellow');
  
  const dailyMovementsEndpoints = results.backend.filter(r => 
    r.description.includes('daily-movements') && r.success
  );
  
  if (dailyMovementsEndpoints.length > 0) {
    logInfo('Endpoints de daily-movements funcionando:');
    dailyMovementsEndpoints.forEach(endpoint => {
      logInfo(`  - ${endpoint.description}`);
      
      // Verificar estructura de datos si hay respuesta
      if (endpoint.data) {
        const hasData = endpoint.data.data && Array.isArray(endpoint.data.data);
        const hasSummary = endpoint.data.summary && typeof endpoint.data.summary === 'object';
        const hasMeta = endpoint.data.meta && typeof endpoint.data.meta === 'object';
        
        logInfo(`    📊 Datos: ${hasData ? '✅' : '❌'} (${endpoint.data.data?.length || 0} registros)`);
        logInfo(`    📈 Resumen: ${hasSummary ? '✅' : '❌'}`);
        logInfo(`    🔧 Meta: ${hasMeta ? '✅' : '❌'}`);
      }
    });
  }
  
  // 🚨 DETECCIÓN DE PROBLEMAS
  log('\n🚨 DETECCIÓN DE PROBLEMAS', 'red');
  log('========================', 'red');
  
  const problems = [];
  
  // Verificar si el frontend está funcionando
  if (frontendFailed > 0) {
    problems.push('❌ Páginas del frontend no están accesibles');
  }
  
  // Verificar si el backend está funcionando
  if (backendFailed > 0) {
    problems.push('❌ Endpoints del backend no están respondiendo');
  }
  
  // Verificar si daily-movements específicamente funciona
  const dailyMovementsWorking = results.backend.some(r => 
    r.description.includes('daily-movements') && r.success
  );
  
  if (!dailyMovementsWorking) {
    problems.push('❌ Endpoint de daily-movements no está funcionando');
  }
  
  if (problems.length === 0) {
    logSuccess('No se detectaron problemas críticos');
  } else {
    problems.forEach(problem => logError(problem));
  }
  
  // 💡 RECOMENDACIONES
  log('\n💡 RECOMENDACIONES', 'green');
  log('==================', 'green');
  
  if (frontendFailed > 0) {
    logWarning('1. Verificar que el servidor de desarrollo esté corriendo (npm run dev)');
    logWarning('2. Verificar que el puerto 3000 esté disponible');
    logWarning('3. Revisar logs del servidor de desarrollo');
  }
  
  if (backendFailed > 0) {
    logWarning('4. Verificar que el backend esté corriendo en el puerto 3001');
    logWarning('5. Revisar logs del backend para errores específicos');
    logWarning('6. Verificar configuración de CORS');
  }
  
  if (!dailyMovementsWorking) {
    logWarning('7. Verificar que el endpoint /dashboard-cqrs/daily-movements esté funcionando');
    logWarning('8. Revisar logs del backend para errores de BigInt');
  }
  
  logInfo('9. Verificar que las variables de entorno estén configuradas correctamente');
  logInfo('10. Probar con un token JWT válido para endpoints protegidos');
  
  log('\n🎯 TESTING COMPLETADO', 'bright');
  log('====================', 'bright');
  
  return results;
}

// Ejecutar el testing si el script se ejecuta directamente
if (require.main === module) {
  testFrontendDailyMovements()
    .then(results => {
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      logError(`Error en el testing: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { testFrontendDailyMovements }; 