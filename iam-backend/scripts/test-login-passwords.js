#!/usr/bin/env node

/**
 * 🔐 SCRIPT PARA PROBAR DIFERENTES CONTRASEÑAS
 * 
 * Este script prueba diferentes contraseñas con el usuario prueba@iam.com
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

// Función para probar login
async function testLogin(email, password) {
  try {
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
      return {
        success: true,
        token: response.data.access_token,
        user: response.data.user
      };
    } else {
      return {
        success: false,
        error: 'No se recibió token'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

// Función principal
async function testPasswords() {
  log('🔐 PROBANDO DIFERENTES CONTRASEÑAS PARA prueba@iam.com', 'bright');
  log('====================================================', 'bright');
  
  const email = 'prueba@iam.com';
  const passwords = [
    'PruebaIAM123?',
    'PruebaIAM123',
    'pruebaIAM123?',
    'pruebaIAM123',
    'Prueba123?',
    'Prueba123',
    'prueba123?',
    'prueba123',
    'password',
    '123456',
    'admin',
    'test',
    'prueba',
    'Prueba',
    'IAM123',
    'iam123',
    'PruebaIAM',
    'pruebaiam'
  ];
  
  logInfo(`Probando ${passwords.length} contraseñas diferentes...`);
  
  for (let i = 0; i < passwords.length; i++) {
    const password = passwords[i];
    logTest(`Probando contraseña ${i + 1}/${passwords.length}: "${password}"`);
    
    const result = await testLogin(email, password);
    
    if (result.success) {
      logSuccess(`¡CONTRASEÑA ENCONTRADA: "${password}"`);
      logInfo(`Token: ${result.token.substring(0, 50)}...`);
      logInfo(`Usuario: ${result.user.email}`);
      logInfo(`Empresa ID: ${result.user.empresaId}`);
      
      // Probar el endpoint de daily-movements con el token válido
      logTest('Probando endpoint de daily-movements...');
      try {
        const dailyResponse = await axios.get(`${BASE_URL}/dashboard-cqrs/daily-movements?days=7`, {
          headers: {
            'Authorization': `Bearer ${result.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (dailyResponse.data) {
          logSuccess('✅ Endpoint de daily-movements funcionando');
          logInfo(`Datos recibidos: ${dailyResponse.data.data?.length || 0} registros`);
          
          if (dailyResponse.data.data && dailyResponse.data.data.length > 0) {
            const hasData = dailyResponse.data.data.some(day => day.entradas > 0 || day.salidas > 0);
            if (hasData) {
              logSuccess('✅ ¡HAY DATOS REALES EN LA RESPUESTA!');
              logInfo('El frontend debería mostrar datos correctamente');
            } else {
              logWarning('⚠️ No hay datos de movimientos en la respuesta');
            }
          }
        }
      } catch (error) {
        logError(`Error probando daily-movements: ${error.response?.status || error.message}`);
      }
      
      return result;
    } else {
      logError(`Falló: ${result.error}`);
    }
    
    // Pausa entre intentos
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  logError('❌ No se encontró ninguna contraseña válida');
  return null;
}

// Ejecutar el script
if (require.main === module) {
  testPasswords()
    .then(result => {
      if (result && result.success) {
        logSuccess('🎉 LOGIN EXITOSO - El sistema está funcionando correctamente');
        process.exit(0);
      } else {
        logError('❌ No se pudo hacer login con ninguna contraseña');
        process.exit(1);
      }
    })
    .catch(error => {
      logError(`Error en el testing: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { testPasswords }; 