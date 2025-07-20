#!/usr/bin/env node

/**
 * 🧪 SCRIPT PARA PROBAR PRUEBA2@IAM.COM Y REVISAR DAILY-MOVEMENTS
 * 
 * Este script prueba específicamente con prueba2@iam.com para evitar rate limiting
 * y revisa detalladamente el endpoint de daily-movements.
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

function logDebug(message) {
  log(`🔍 ${message}`, 'magenta');
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
      logInfo(`   Nombre: ${response.data.user.nombre}`);
      logInfo(`   Rol: ${response.data.user.rol}`);
      
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

// Función para probar endpoint de daily-movements con análisis detallado
async function testDailyMovementsDetailed(token, userEmail) {
  try {
    logTest(`Probando endpoint de daily-movements para ${userEmail}...`);
    
    // Probar diferentes períodos
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
        logDebug(`📊 ANÁLISIS DETALLADO DE LA RESPUESTA:`);
        
        // 1. Estructura de la respuesta
        logDebug(`   Estructura de respuesta:`);
        logDebug(`   - data: ${Array.isArray(response.data.data) ? '✅ Array' : '❌ No es array'}`);
        logDebug(`   - summary: ${response.data.summary ? '✅ Presente' : '❌ Ausente'}`);
        logDebug(`   - meta: ${response.data.meta ? '✅ Presente' : '❌ Ausente'}`);
        
        // 2. Datos específicos
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
        
        // 3. Resumen
        if (response.data.summary) {
          logDebug(`   📊 Resumen para ${days} días:`);
          logDebug(`      - Promedio Entradas: ${response.data.summary.avgEntradasDiarias}`);
          logDebug(`      - Promedio Salidas: ${response.data.summary.avgSalidasDiarias}`);
          logDebug(`      - Total Movimientos: ${response.data.summary.totalMovimientos}`);
          logDebug(`      - Tendencia: ${response.data.summary.tendencia}`);
        }
        
        // 4. Meta información
        if (response.data.meta) {
          logDebug(`   🔧 Meta información:`);
          logDebug(`      - Período: ${response.data.meta.periodo}`);
          logDebug(`      - Empresa ID: ${response.data.meta.empresaId}`);
          logDebug(`      - Fecha inicio: ${response.data.meta.fechaInicio}`);
          logDebug(`      - Fecha fin: ${response.data.meta.fechaFin}`);
        }
        
        // 5. Verificar estructura para frontend
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
    
    return true;
  } catch (error) {
    logError(`Error probando daily-movements para ${userEmail}: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      logError(`   Mensaje: ${error.response.data.message || JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Función principal
async function testPrueba2DailyMovements() {
  log('🧪 TESTING PRUEBA2@IAM.COM - ANÁLISIS DETALLADO', 'bright');
  log('================================================', 'bright');
  
  const user = {
    email: 'prueba2@iam.com',
    password: 'PruebaIAM123?',
    empresaId: 9,
    empresaName: 'Minisuper Bara Bara'
  };
  
  try {
    logTest(`🎯 Probando usuario: ${user.email}`);
    logInfo(`   Empresa: ${user.empresaName} (ID: ${user.empresaId})`);
    
    // 1. Hacer login
    const token = await doLogin(user.email, user.password);
    
    // 2. Probar daily-movements con análisis detallado
    await testDailyMovementsDetailed(token, user.email);
    
    logSuccess('\n🎉 ¡ANÁLISIS COMPLETADO EXITOSAMENTE!');
    logInfo('El endpoint de daily-movements está funcionando correctamente');
    logInfo('Los datos están siendo devueltos en el formato esperado');
    
  } catch (error) {
    logError(`\n❌ Error en el análisis: ${error.message}`);
    if (error.response?.status) {
      logError(`   Status: ${error.response.status}`);
    }
    if (error.response?.data) {
      logError(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Ejecutar el script
if (require.main === module) {
  testPrueba2DailyMovements()
    .then(() => {
      log('\n🎯 ANÁLISIS COMPLETADO', 'bright');
      process.exit(0);
    })
    .catch(error => {
      logError(`Error inesperado: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { testPrueba2DailyMovements }; 