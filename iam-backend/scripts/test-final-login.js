#!/usr/bin/env node

/**
 * 🎯 SCRIPT FINAL PARA PROBAR LOGIN Y DAILY-MOVEMENTS
 * 
 * Este script prueba el login con la nueva contraseña y verifica
 * que el endpoint de daily-movements funcione correctamente.
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

// Función para hacer login
async function doLogin() {
  try {
    logTest('Haciendo login con prueba@iam.com...');
    
    const loginData = {
      email: 'prueba@iam.com',
      password: 'PruebaIAM123!'
    };
    
    const response = await axios.post(`${BASE_URL}/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.access_token) {
      logSuccess('Login exitoso');
      logInfo(`Token: ${response.data.access_token.substring(0, 50)}...`);
      logInfo(`Usuario: ${response.data.user.email}`);
      logInfo(`Empresa ID: ${response.data.user.empresaId}`);
      
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

// Función para probar endpoint de daily-movements
async function testDailyMovements(token) {
  try {
    logTest('Probando endpoint de daily-movements...');
    
    const response = await axios.get(`${BASE_URL}/dashboard-cqrs/daily-movements?days=7`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data) {
      logSuccess('✅ Endpoint de daily-movements funcionando');
      
      const hasData = response.data.data && Array.isArray(response.data.data);
      const hasSummary = response.data.summary && typeof response.data.summary === 'object';
      const hasMeta = response.data.meta && typeof response.data.meta === 'object';
      
      logInfo(`📊 Datos: ${hasData ? '✅' : '❌'} (${response.data.data?.length || 0} registros)`);
      logInfo(`📈 Resumen: ${hasSummary ? '✅' : '❌'}`);
      logInfo(`🔧 Meta: ${hasMeta ? '✅' : '❌'}`);
      
      if (hasData && response.data.data.length > 0) {
        logInfo('📋 Datos de ejemplo:');
        response.data.data.slice(0, 3).forEach((item, index) => {
          logInfo(`   ${index + 1}. ${item.fecha}: Entradas=${item.entradas}, Salidas=${item.salidas}, Neto=${item.neto}`);
        });
        
        const hasRealData = response.data.data.some(day => day.entradas > 0 || day.salidas > 0);
        if (hasRealData) {
          logSuccess('✅ ¡HAY DATOS REALES EN LA RESPUESTA!');
          logSuccess('El frontend debería mostrar datos correctamente');
        } else {
          logWarning('⚠️ No hay datos de movimientos en la respuesta');
        }
      }
      
      if (hasSummary) {
        logInfo('📊 Resumen:');
        logInfo(`   - Promedio Entradas: ${response.data.summary.avgEntradasDiarias}`);
        logInfo(`   - Promedio Salidas: ${response.data.summary.avgSalidasDiarias}`);
        logInfo(`   - Total Movimientos: ${response.data.summary.totalMovimientos}`);
        logInfo(`   - Tendencia: ${response.data.summary.tendencia}`);
      }
      
      return response.data;
    } else {
      throw new Error('No se recibieron datos en la respuesta');
    }
  } catch (error) {
    logError(`Error probando daily-movements: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      logError(`Mensaje: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Función principal
async function testFinalSystem() {
  log('🎯 TESTING FINAL DEL SISTEMA', 'bright');
  log('============================', 'bright');
  
  try {
    // 1. Hacer login
    const token = await doLogin();
    
    // 2. Probar daily-movements
    const dailyData = await testDailyMovements(token);
    
    // 3. Resumen final
    log('\n🎉 RESUMEN FINAL', 'bright');
    log('===============', 'bright');
    
    logSuccess('✅ Login exitoso');
    logSuccess('✅ Endpoint de daily-movements funcionando');
    
    if (dailyData && dailyData.data && dailyData.data.some(day => day.entradas > 0 || day.salidas > 0)) {
      logSuccess('✅ Hay datos reales en la respuesta');
      logSuccess('✅ El frontend debería mostrar datos correctamente');
    } else {
      logWarning('⚠️ No hay datos de movimientos, pero el sistema funciona');
    }
    
    log('\n💡 INFORMACIÓN PARA EL USUARIO', 'green');
    log('==============================', 'green');
    logSuccess('El sistema está funcionando correctamente');
    logInfo('Credenciales para el frontend:');
    logInfo('   Email: prueba@iam.com');
    logInfo('   Contraseña: PruebaIAM123!');
    logInfo('   URL: http://localhost:3000/login');
    logInfo('   Después del login, ir a: http://localhost:3000/daily-movements');
    
    return { success: true, token, dailyData };
    
  } catch (error) {
    logError(`Error en el testing final: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Ejecutar el script
if (require.main === module) {
  testFinalSystem()
    .then(result => {
      if (result.success) {
        logSuccess('🎉 ¡SISTEMA FUNCIONANDO CORRECTAMENTE!');
        process.exit(0);
      } else {
        logError('❌ Error en el sistema');
        process.exit(1);
      }
    })
    .catch(error => {
      logError(`Error inesperado: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { testFinalSystem }; 