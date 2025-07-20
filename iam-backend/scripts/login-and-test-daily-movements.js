#!/usr/bin/env node

/**
 * 🔐 SCRIPT PARA LOGIN REAL Y TESTING DE DAILY-MOVEMENTS
 * 
 * Este script hace login real con prueba@iam.com y PruebaIAM123?
 * y luego prueba el endpoint de daily-movements.
 */

const axios = require('axios');
require('dotenv').config();

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

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

// Función para hacer login real
async function doRealLogin() {
  try {
    logTest('Haciendo login real con prueba@iam.com...');
    
    const loginData = {
      email: 'prueba@iam.com',
      password: 'PruebaIAM123?'
    };
    
    const response = await axios.post(`${BASE_URL}/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.access_token) {
      logSuccess('Login exitoso');
      logInfo(`Token obtenido: ${response.data.access_token.substring(0, 50)}...`);
      logInfo(`Usuario: ${response.data.user.email}`);
      logInfo(`Empresa: ${response.data.user.empresaId}`);
      
      return response.data.access_token;
    } else {
      throw new Error('No se recibió token en la respuesta');
    }
  } catch (error) {
    logError(`Error en login: ${error.response?.status || error.code}`);
    if (error.response?.data) {
      logError(`Mensaje: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
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
async function loginAndTestDailyMovements() {
  log('🎯 INICIANDO LOGIN REAL Y TESTING DE DAILY-MOVEMENTS', 'bright');
  log('==================================================', 'bright');
  
  try {
    // 1. Hacer login real
    const token = await doRealLogin();
    
    // 2. Probar endpoint /auth/me para verificar token
    logTest('Verificando token con /auth/me...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (meResponse.data) {
      logSuccess('Token verificado correctamente');
      logInfo(`Usuario autenticado: ${meResponse.data.email}`);
      logInfo(`Empresa ID: ${meResponse.data.empresaId}`);
    }
    
    const results = [];
    
    // 3. 🎯 TESTING ENDPOINTS DE DAILY-MOVEMENTS
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
      const result = await makeRequest(endpoint.url, endpoint.description, token);
      results.push({ ...endpoint, ...result });
      
      // Pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 4. 📊 RESUMEN DE RESULTADOS
    log('\n📊 RESUMEN DE RESULTADOS', 'bright');
    log('========================', 'bright');
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    log(`Total de endpoints probados: ${totalCount}`);
    log(`✅ Exitosos: ${successCount}`);
    log(`❌ Fallidos: ${totalCount - successCount}`);
    
    // 5. 🎯 ANÁLISIS DE DATOS
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
    
    // 6. 🚨 DETECCIÓN DE PROBLEMAS
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
    
    // 7. 💡 RECOMENDACIONES
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
    
    if (hasData) {
      logSuccess('6. ¡El frontend debería mostrar datos correctamente ahora!');
      logSuccess('7. Los datos están siendo devueltos correctamente por el backend');
    }
    
    log('\n🎯 TESTING COMPLETADO', 'bright');
    log('====================', 'bright');
    
    return { token, results };
    
  } catch (error) {
    logError(`Error en el proceso: ${error.message}`);
    throw error;
  }
}

// Ejecutar el testing si el script se ejecuta directamente
if (require.main === module) {
  loginAndTestDailyMovements()
    .then(({ token, results }) => {
      const hasErrors = results.some(r => !r.success);
      logInfo(`Token para usar en el frontend: ${token}`);
      process.exit(hasErrors ? 1 : 0);
    })
    .catch(error => {
      logError(`Error en el testing: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { loginAndTestDailyMovements }; 