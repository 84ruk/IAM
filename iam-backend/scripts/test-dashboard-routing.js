#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TESTING PARA DASHBOARD ROUTING
 * 
 * Este script verifica el funcionamiento correcto de los endpoints del dashboard
 * y ayuda a identificar problemas de routing entre los controladores.
 * 
 * Uso:
 * node scripts/test-dashboard-routing.js
 */

const axios = require('axios');

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_TOKEN = process.env.TEST_TOKEN || 'test-token';

// Headers para las peticiones
const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

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
    const response = await axios.get(url, { headers });
    const duration = Date.now() - startTime;
    
    logSuccess(`${description} - Status: ${response.status} (${duration}ms)`);
    
    // Verificar que la respuesta viene del controlador correcto
    if (response.data && response.data.controller) {
      logInfo(`Controlador: ${response.data.controller}`);
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
async function testDashboardRouting() {
  log('🎯 INICIANDO TESTING DE DASHBOARD ROUTING', 'bright');
  log('==========================================', 'bright');
  
  const results = {
    cqrs: [],
    legacy: [],
    summary: {
      total: 0,
      success: 0,
      failed: 0
    }
  };
  
  // 🎯 TESTING ENDPOINTS CQRS
  log('\n📊 TESTING ENDPOINTS CQRS (Nuevo Sistema)', 'magenta');
  log('==========================================', 'magenta');
  
  const cqrsEndpoints = [
    {
      url: `${BASE_URL}/dashboard-cqrs/test`,
      description: 'Test endpoint CQRS'
    },
    {
      url: `${BASE_URL}/dashboard-cqrs/test-daily-movements`,
      description: 'Test daily-movements CQRS'
    },
    {
      url: `${BASE_URL}/dashboard-cqrs/daily-movements?days=7`,
      description: 'Daily movements CQRS'
    },
    {
      url: `${BASE_URL}/dashboard-cqrs/kpis`,
      description: 'KPIs CQRS'
    },
    {
      url: `${BASE_URL}/dashboard-cqrs/financial-kpis`,
      description: 'Financial KPIs CQRS'
    },
    {
      url: `${BASE_URL}/dashboard-cqrs/industry-kpis`,
      description: 'Industry KPIs CQRS'
    },
    {
      url: `${BASE_URL}/dashboard-cqrs/predictive-kpis`,
      description: 'Predictive KPIs CQRS'
    },
    {
      url: `${BASE_URL}/dashboard-cqrs/filter-options`,
      description: 'Filter options CQRS'
    },
    {
      url: `${BASE_URL}/dashboard-cqrs/cache/stats`,
      description: 'Cache stats CQRS'
    }
  ];
  
  for (const endpoint of cqrsEndpoints) {
    const result = await makeRequest(endpoint.url, endpoint.description);
    results.cqrs.push({ ...endpoint, ...result });
    results.summary.total++;
    
    if (result.success) {
      results.summary.success++;
    } else {
      results.summary.failed++;
    }
    
    // Pausa entre requests para no sobrecargar el servidor
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // ⚠️ TESTING ENDPOINTS LEGACY (Solo para comparación)
  log('\n⚠️  TESTING ENDPOINTS LEGACY (Sistema Anterior)', 'yellow');
  log('===============================================', 'yellow');
  
  const legacyEndpoints = [
    {
      url: `${BASE_URL}/dashboard/kpis`,
      description: 'KPIs Legacy'
    },
    {
      url: `${BASE_URL}/dashboard/financial-kpis`,
      description: 'Financial KPIs Legacy'
    },
    {
      url: `${BASE_URL}/dashboard/industry-kpis`,
      description: 'Industry KPIs Legacy'
    }
  ];
  
  for (const endpoint of legacyEndpoints) {
    const result = await makeRequest(endpoint.url, endpoint.description);
    results.legacy.push({ ...endpoint, ...result });
    results.summary.total++;
    
    if (result.success) {
      results.summary.success++;
    } else {
      results.summary.failed++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 📊 RESUMEN DE RESULTADOS
  log('\n📊 RESUMEN DE RESULTADOS', 'bright');
  log('========================', 'bright');
  
  log(`Total de endpoints probados: ${results.summary.total}`);
  log(`✅ Exitosos: ${results.summary.success}`);
  log(`❌ Fallidos: ${results.summary.failed}`);
  
  // 🎯 ANÁLISIS DE ENDPOINTS CQRS
  log('\n🎯 ANÁLISIS DE ENDPOINTS CQRS', 'cyan');
  log('============================', 'cyan');
  
  const cqrsSuccess = results.cqrs.filter(r => r.success).length;
  const cqrsFailed = results.cqrs.filter(r => !r.success).length;
  
  log(`CQRS - Exitosos: ${cqrsSuccess}/${results.cqrs.length}`);
  log(`CQRS - Fallidos: ${cqrsFailed}/${results.cqrs.length}`);
  
  if (cqrsFailed > 0) {
    logWarning('Endpoints CQRS con problemas:');
    results.cqrs
      .filter(r => !r.success)
      .forEach(r => logError(`  - ${r.description}: ${r.error}`));
  }
  
  // 🔍 VERIFICACIÓN DE CONTROLADORES
  log('\n🔍 VERIFICACIÓN DE CONTROLADORES', 'magenta');
  log('================================', 'magenta');
  
  const cqrsControllers = results.cqrs
    .filter(r => r.success && r.data && r.data.controller)
    .map(r => r.data.controller);
  
  const uniqueControllers = [...new Set(cqrsControllers)];
  
  log(`Controladores únicos encontrados: ${uniqueControllers.length}`);
  uniqueControllers.forEach(controller => {
    logInfo(`  - ${controller}`);
  });
  
  // 🚨 DETECCIÓN DE PROBLEMAS
  log('\n🚨 DETECCIÓN DE PROBLEMAS', 'red');
  log('========================', 'red');
  
  const problems = [];
  
  // Verificar si daily-movements CQRS está funcionando
  const dailyMovementsCQRS = results.cqrs.find(r => r.description.includes('Daily movements CQRS'));
  if (dailyMovementsCQRS && !dailyMovementsCQRS.success) {
    problems.push('❌ Endpoint /dashboard-cqrs/daily-movements no está funcionando');
  }
  
  // Verificar si test-daily-movements CQRS está funcionando
  const testDailyMovementsCQRS = results.cqrs.find(r => r.description.includes('Test daily-movements CQRS'));
  if (testDailyMovementsCQRS && !testDailyMovementsCQRS.success) {
    problems.push('❌ Endpoint /dashboard-cqrs/test-daily-movements no está funcionando');
  }
  
  // Verificar si hay conflictos de routing
  const legacyDailyMovements = results.legacy.find(r => r.description.includes('daily-movements'));
  if (legacyDailyMovements && legacyDailyMovements.success) {
    problems.push('⚠️  Endpoint legacy de daily-movements está respondiendo (posible conflicto)');
  }
  
  if (problems.length === 0) {
    logSuccess('No se detectaron problemas críticos');
  } else {
    problems.forEach(problem => logError(problem));
  }
  
  // 💡 RECOMENDACIONES
  log('\n💡 RECOMENDACIONES', 'green');
  log('==================', 'green');
  
  if (cqrsFailed > 0) {
    logWarning('1. Revisar logs del servidor para errores específicos');
    logWarning('2. Verificar que el servidor esté ejecutándose en el puerto correcto');
    logWarning('3. Comprobar que el token de autenticación sea válido');
  }
  
  if (problems.length > 0) {
    logWarning('4. Revisar el orden de registro de módulos en app.module.ts');
    logWarning('5. Verificar que no haya conflictos de nombres de rutas');
    logWarning('6. Comprobar que los guards estén funcionando correctamente');
  }
  
  logInfo('7. Usar el middleware de logging para debugging detallado');
  logInfo('8. Verificar que los handlers CQRS estén registrados correctamente');
  
  log('\n🎯 TESTING COMPLETADO', 'bright');
  log('====================', 'bright');
  
  return results;
}

// Ejecutar el testing si el script se ejecuta directamente
if (require.main === module) {
  testDashboardRouting()
    .then(results => {
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      logError(`Error en el testing: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { testDashboardRouting }; 