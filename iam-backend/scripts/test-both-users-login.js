#!/usr/bin/env node

/**
 * 🧪 SCRIPT PARA PROBAR LOGIN CON AMBOS USUARIOS
 * 
 * Este script prueba el login con prueba@iam.com y prueba2@iam.com
 * y verifica que el sistema de daily-movements funcione correctamente.
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
async function doLogin(email, password) {
  try {
    logTest(`Haciendo login con ${email}...`);
    
    const loginData = {
      email,
      password
    };
    
    const response = await axios.post(`${BASE_URL}/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.access_token) {
      logSuccess(`Login exitoso para ${email}`);
      logInfo(`   Token: ${response.data.access_token.substring(0, 50)}...`);
      logInfo(`   Usuario: ${response.data.user.email}`);
      logInfo(`   Empresa ID: ${response.data.user.empresaId}`);
      
      return response.data.access_token;
    } else {
      throw new Error('No se recibió token en la respuesta');
    }
  } catch (error) {
    logError(`Error en login para ${email}: ${error.response?.status || error.code}`);
    if (error.response?.data) {
      logError(`   Mensaje: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Función para probar endpoint de daily-movements
async function testDailyMovements(token, userEmail) {
  try {
    logTest(`Probando endpoint de daily-movements para ${userEmail}...`);
    
    const response = await axios.get(`${BASE_URL}/dashboard-cqrs/daily-movements?days=7`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data) {
      logSuccess(`✅ Endpoint de daily-movements funcionando para ${userEmail}`);
      
      const hasData = response.data.data && Array.isArray(response.data.data);
      const hasSummary = response.data.summary && typeof response.data.summary === 'object';
      const hasMeta = response.data.meta && typeof response.data.meta === 'object';
      
      logInfo(`   📊 Datos: ${hasData ? '✅' : '❌'} (${response.data.data?.length || 0} registros)`);
      logInfo(`   📈 Resumen: ${hasSummary ? '✅' : '❌'}`);
      logInfo(`   🔧 Meta: ${hasMeta ? '✅' : '❌'}`);
      
      if (hasData && response.data.data.length > 0) {
        logInfo(`   📋 Datos de ejemplo para ${userEmail}:`);
        response.data.data.slice(0, 3).forEach((item, index) => {
          logInfo(`      ${index + 1}. ${item.fecha}: Entradas=${item.entradas}, Salidas=${item.salidas}, Neto=${item.neto}`);
        });
        
        const hasRealData = response.data.data.some(day => day.entradas > 0 || day.salidas > 0);
        if (hasRealData) {
          logSuccess(`   ✅ ¡HAY DATOS REALES para ${userEmail}!`);
        } else {
          logWarning(`   ⚠️ No hay datos de movimientos para ${userEmail}`);
        }
      }
      
      if (hasSummary) {
        logInfo(`   📊 Resumen para ${userEmail}:`);
        logInfo(`      - Promedio Entradas: ${response.data.summary.avgEntradasDiarias}`);
        logInfo(`      - Promedio Salidas: ${response.data.summary.avgSalidasDiarias}`);
        logInfo(`      - Total Movimientos: ${response.data.summary.totalMovimientos}`);
        logInfo(`      - Tendencia: ${response.data.summary.tendencia}`);
      }
      
      return response.data;
    } else {
      throw new Error('No se recibieron datos en la respuesta');
    }
  } catch (error) {
    logError(`Error probando daily-movements para ${userEmail}: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      logError(`   Mensaje: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Función principal
async function testBothUsers() {
  log('🧪 TESTING LOGIN CON AMBOS USUARIOS', 'bright');
  log('==================================', 'bright');
  
  const users = [
    {
      email: 'prueba@iam.com',
      password: 'PruebaIAM123?',
      empresaId: 8,
      empresaName: 'Hamburguesas Tony'
    },
    {
      email: 'prueba2@iam.com',
      password: 'PruebaIAM123?',
      empresaId: 9,
      empresaName: 'Minisuper Bara Bara'
    }
  ];
  
  const results = [];
  
  for (const user of users) {
    logTest(`\n🎯 Probando usuario: ${user.email}`);
    logInfo(`   Empresa: ${user.empresaName} (ID: ${user.empresaId})`);
    
    try {
      // 1. Hacer login
      const token = await doLogin(user.email, user.password);
      
      // 2. Probar daily-movements
      const dailyData = await testDailyMovements(token, user.email);
      
      results.push({
        email: user.email,
        success: true,
        token: token.substring(0, 50) + '...',
        empresaId: user.empresaId,
        empresaName: user.empresaName,
        hasData: dailyData && dailyData.data && dailyData.data.some(day => day.entradas > 0 || day.salidas > 0)
      });
      
      // Pausa entre usuarios
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      results.push({
        email: user.email,
        success: false,
        error: error.message,
        empresaId: user.empresaId,
        empresaName: user.empresaName
      });
    }
  }
  
  // Resumen final
  log('\n📊 RESUMEN FINAL', 'bright');
  log('===============', 'bright');
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  log(`Total de usuarios probados: ${totalCount}`);
  log(`✅ Exitosos: ${successCount}`);
  log(`❌ Fallidos: ${totalCount - successCount}`);
  
  results.forEach(result => {
    if (result.success) {
      logSuccess(`${result.email} - Login exitoso`);
      logInfo(`   Empresa: ${result.empresaName}`);
      logInfo(`   Tiene datos: ${result.hasData ? '✅' : '⚠️'}`);
    } else {
      logError(`${result.email} - Error: ${result.error}`);
      logInfo(`   Empresa: ${result.empresaName}`);
    }
  });
  
  // Información para el usuario
  log('\n💡 INFORMACIÓN PARA EL USUARIO', 'green');
  log('==============================', 'green');
  
  const successfulUsers = results.filter(r => r.success);
  if (successfulUsers.length > 0) {
    logSuccess('Usuarios funcionando correctamente:');
    successfulUsers.forEach(user => {
      logInfo(`   Email: ${user.email}`);
      logInfo(`   Contraseña: PruebaIAM123?`);
      logInfo(`   Empresa: ${user.empresaName}`);
    });
    
    logInfo('\nAhora puedes hacer login en el frontend con cualquiera de estos usuarios');
    logInfo('URL: http://localhost:3000/login');
    logInfo('Después del login, ir a: http://localhost:3000/daily-movements');
    
    const usersWithData = successfulUsers.filter(u => u.hasData);
    if (usersWithData.length > 0) {
      logSuccess('✅ Usuarios con datos disponibles:');
      usersWithData.forEach(user => {
        logInfo(`   ${user.email} (${user.empresaName})`);
      });
    } else {
      logWarning('⚠️ Ningún usuario tiene datos de movimientos');
    }
  } else {
    logError('❌ No hay usuarios funcionando correctamente');
  }
  
  return results;
}

// Ejecutar el script
if (require.main === module) {
  testBothUsers()
    .then(results => {
      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
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

module.exports = { testBothUsers }; 