#!/usr/bin/env node

/**
 * Script de Pruebas para Mejoras ESP32 Auto-Configuration
 * 
 * Este script prueba todas las nuevas funcionalidades implementadas:
 * - Configuración remota automática
 * - Generación de QR en portal captivo
 * - Seguridad mejorada
 * - Configuración dinámica de sensores
 * - KPIs y estadísticas
 * - Monitoreo de dispositivos
 * 
 * Uso: node scripts/test-esp32-improvements.js
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@test.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin123';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

let authToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utilidades
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, success, details = '') {
  testResults.total++;
  if (success) {
    testResults.passed++;
    log(`✅ ${testName}`, 'green');
  } else {
    testResults.failed++;
    log(`❌ ${testName}`, 'red');
    if (details) log(`   ${details}`, 'red');
  }
  testResults.details.push({ testName, success, details });
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Tests
async function testAuthentication() {
  log('\n🔐 Probando autenticación...', 'cyan');
  
  const result = await makeRequest('POST', '/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  if (result.success && result.data.access_token) {
    authToken = result.data.access_token;
    logTest('Autenticación exitosa', true);
    return true;
  } else {
    logTest('Autenticación fallida', false, result.error?.message || 'Error desconocido');
    return false;
  }
}

async function testFetchLocations() {
  log('\n📍 Obteniendo ubicaciones...', 'cyan');
  
  const result = await makeRequest('GET', '/ubicaciones');
  
  if (result.success && result.data.ubicaciones && result.data.ubicaciones.length > 0) {
    logTest('Ubicaciones obtenidas', true, `${result.data.ubicaciones.length} ubicaciones encontradas`);
    return result.data.ubicaciones[0].id; // Retornar primera ubicación para tests
  } else {
    logTest('Error obteniendo ubicaciones', false, result.error?.message || 'No se encontraron ubicaciones');
    return null;
  }
}

async function testDownloadBaseCode() {
  log('\n📥 Descargando código base ESP32...', 'cyan');
  
  const result = await makeRequest('GET', '/mqtt-sensor/esp32/codigo-base');
  
  if (result.success && result.data && result.data.length > 1000) {
    // Guardar código base
    await fs.writeFile('esp32-base-code-improved.ino', result.data);
    logTest('Código base descargado', true, 'Archivo guardado como esp32-base-code-improved.ino');
    return true;
  } else {
    logTest('Error descargando código base', false, result.error?.message || 'Código base vacío o inválido');
    return false;
  }
}

async function testDownloadInstructions() {
  log('\n📋 Descargando instrucciones de instalación...', 'cyan');
  
  const result = await makeRequest('GET', '/mqtt-sensor/esp32/instrucciones-instalacion');
  
  if (result.success && result.data && result.data.includes('ESP32')) {
    await fs.writeFile('instrucciones-esp32-improved.md', result.data);
    logTest('Instrucciones descargadas', true, 'Archivo guardado como instrucciones-esp32-improved.md');
    return true;
  } else {
    logTest('Error descargando instrucciones', false, result.error?.message || 'Instrucciones inválidas');
    return false;
  }
}

async function testGenerateCustomCode() {
  log('\n🔧 Generando código personalizado...', 'cyan');
  
  const sensorConfig = {
    sensores: [
      { tipo: 'TEMPERATURA', nombre: 'Sensor_Temp_1', pin: 4 },
      { tipo: 'HUMEDAD', nombre: 'Sensor_Hum_1', pin: 4 },
      { tipo: 'PESO', nombre: 'Sensor_Peso_1', pin: 16 },
      { tipo: 'PRESION', nombre: 'Sensor_Pres_1', pin: 21 }
    ]
  };
  
  const result = await makeRequest('POST', '/mqtt-sensor/esp32/codigo-personalizado', sensorConfig);
  
  if (result.success && result.data && result.data.includes('DHT')) {
    await fs.writeFile('esp32-custom-code-improved.ino', result.data);
    logTest('Código personalizado generado', true, 'Archivo guardado como esp32-custom-code-improved.ino');
    return true;
  } else {
    logTest('Error generando código personalizado', false, result.error?.message || 'Código personalizado inválido');
    return false;
  }
}

async function testAutoConfiguration(ubicacionId) {
  log('\n🚀 Probando configuración automática mejorada...', 'cyan');
  
  const config = {
    deviceName: 'ESP32_Test_Improved',
    wifiSSID: 'TestWiFi',
    wifiPassword: 'testpassword123',
    ubicacionId: ubicacionId,
    sensores: [
      { tipo: 'TEMPERATURA', nombre: 'Temperatura_Ambiente', pin: 4, enabled: true },
      { tipo: 'HUMEDAD', nombre: 'Humedad_Ambiente', pin: 4, enabled: true },
      { tipo: 'PESO', nombre: 'Peso_Contenedor', pin: 16, enabled: false },
      { tipo: 'PRESION', nombre: 'Presion_Atmosferica', pin: 21, enabled: true }
    ]
  };
  
  const result = await makeRequest('POST', '/mqtt-sensor/esp32/configuracion-automatica', config);
  
  if (result.success && result.data.success && result.data.token) {
    logTest('Configuración automática generada', true, `Token: ${result.data.token.substring(0, 20)}...`);
    
    // Probar endpoint público con el token
    await testPublicConfigEndpoint(result.data.token);
    
    return result.data;
  } else {
    logTest('Error en configuración automática', false, result.error?.message || 'Configuración fallida');
    return null;
  }
}

async function testPublicConfigEndpoint(token) {
  log('\n🔓 Probando endpoint público de configuración...', 'cyan');
  
  const result = await makeRequest('GET', `/mqtt-sensor/esp32/config/${token}`);
  
  if (result.success && result.data.success && result.data.config) {
    logTest('Endpoint público funcional', true, 'Configuración obtenida correctamente');
    
    // Verificar que la configuración contiene los datos esperados
    const config = result.data.config;
    const hasRequiredFields = config.deviceId && config.mqtt && config.sensores;
    
    if (hasRequiredFields) {
      logTest('Configuración válida', true, `${config.sensores.length} sensores configurados`);
    } else {
      logTest('Configuración inválida', false, 'Faltan campos requeridos');
    }
    
    return true;
  } else {
    logTest('Error en endpoint público', false, result.error?.message || 'No se pudo obtener configuración');
    return false;
  }
}

async function testStatistics() {
  log('\n📊 Probando estadísticas de dispositivos...', 'cyan');
  
  const result = await makeRequest('GET', '/mqtt-sensor/esp32/estadisticas');
  
  if (result.success && result.data.success && result.data.estadisticas) {
    const stats = result.data.estadisticas;
    logTest('Estadísticas obtenidas', true, 
      `Total: ${stats.total}, Conectados: ${stats.conectados}, Tasa: ${stats.tasaConectividad?.toFixed(1)}%`);
    return true;
  } else {
    logTest('Error obteniendo estadísticas', false, result.error?.message || 'Estadísticas no disponibles');
    return false;
  }
}

async function testDeviceList() {
  log('\n📱 Probando lista de dispositivos...', 'cyan');
  
  const result = await makeRequest('GET', '/mqtt-sensor/esp32/dispositivos');
  
  if (result.success && result.data.success) {
    const dispositivos = result.data.dispositivos || [];
    logTest('Lista de dispositivos obtenida', true, `${dispositivos.length} dispositivos encontrados`);
    
    // Probar obtención de dispositivo específico si hay alguno
    if (dispositivos.length > 0) {
      await testDeviceDetails(dispositivos[0].deviceId);
    }
    
    return true;
  } else {
    logTest('Error obteniendo lista de dispositivos', false, result.error?.message || 'Lista no disponible');
    return false;
  }
}

async function testDeviceDetails(deviceId) {
  log('\n🔍 Probando detalles de dispositivo...', 'cyan');
  
  const result = await makeRequest('GET', `/mqtt-sensor/esp32/dispositivo/${deviceId}`);
  
  if (result.success && result.data.success && result.data.dispositivo) {
    const dispositivo = result.data.dispositivo;
    logTest('Detalles de dispositivo obtenidos', true, 
      `Dispositivo: ${dispositivo.nombre}, Sensores: ${dispositivo.sensores?.length || 0}`);
    return true;
  } else {
    logTest('Error obteniendo detalles de dispositivo', false, result.error?.message || 'Detalles no disponibles');
    return false;
  }
}

async function testDeviceStatusUpdate() {
  log('\n📡 Probando actualización de estado desde ESP32...', 'cyan');
  
  const mockStatus = {
    connected: true,
    wifiRSSI: -45,
    mqttConnected: true,
    numSensores: 3,
    uptime: 3600000, // 1 hora
    errors: []
  };
  
  const deviceId = 'esp32_test_device';
  const result = await makeRequest('POST', `/mqtt-sensor/esp32/estado/${deviceId}`, mockStatus);
  
  if (result.success && result.data.success) {
    logTest('Estado actualizado correctamente', true, 'Estado del dispositivo actualizado');
    return true;
  } else {
    logTest('Error actualizando estado', false, result.error?.message || 'No se pudo actualizar estado');
    return false;
  }
}

async function testQRCodeGeneration() {
  log('\n🔍 Probando generación de códigos QR...', 'cyan');
  
  // Simular configuración para generar QR
  const config = {
    deviceName: 'ESP32_QR_Test',
    wifiSSID: 'TestWiFi',
    wifiPassword: 'testpass',
    ubicacionId: 1,
    sensores: [{ tipo: 'TEMPERATURA', nombre: 'Temp', pin: 4, enabled: true }]
  };
  
  const result = await makeRequest('POST', '/mqtt-sensor/esp32/configuracion-automatica', config);
  
  if (result.success && result.data.success && result.data.qrCode) {
    const qrCode = result.data.qrCode;
    
    if (qrCode.startsWith('data:image/png;base64,')) {
      logTest('Código QR generado correctamente', true, 'QR en formato base64 generado');
      
      // Guardar QR como imagen
      const base64Data = qrCode.replace('data:image/png;base64,', '');
      await fs.writeFile('test-qr-code.png', base64Data, 'base64');
      logTest('Código QR guardado', true, 'Archivo guardado como test-qr-code.png');
      
      return true;
    } else {
      logTest('Código QR inválido', false, 'Formato de QR incorrecto');
      return false;
    }
  } else {
    logTest('Error generando código QR', false, result.error?.message || 'No se pudo generar QR');
    return false;
  }
}

async function testSecurityFeatures() {
  log('\n🔒 Probando características de seguridad...', 'cyan');
  
  // Probar acceso sin token
  const resultWithoutAuth = await makeRequest('GET', '/mqtt-sensor/esp32/dispositivos', null, {});
  
  if (!resultWithoutAuth.success && resultWithoutAuth.status === 401) {
    logTest('Autenticación requerida', true, 'Endpoint protegido correctamente');
  } else {
    logTest('Fallo en autenticación', false, 'Endpoint no está protegido');
  }
  
  // Probar token inválido
  const resultWithInvalidToken = await makeRequest('GET', '/mqtt-sensor/esp32/dispositivos', null, {
    Authorization: 'Bearer invalid_token_123'
  });
  
  if (!resultWithInvalidToken.success && resultWithInvalidToken.status === 401) {
    logTest('Token inválido rechazado', true, 'Sistema rechaza tokens inválidos');
  } else {
    logTest('Token inválido aceptado', false, 'Sistema acepta tokens inválidos');
  }
  
  return true;
}

async function testRedisIntegration() {
  log('\n💾 Probando integración con Redis...', 'cyan');
  
  // Crear configuración temporal
  const config = {
    deviceName: 'ESP32_Redis_Test',
    wifiSSID: 'TestWiFi',
    wifiPassword: 'testpass',
    ubicacionId: 1,
    sensores: [{ tipo: 'TEMPERATURA', nombre: 'Temp', pin: 4, enabled: true }]
  };
  
  const createResult = await makeRequest('POST', '/mqtt-sensor/esp32/configuracion-automatica', config);
  
  if (createResult.success && createResult.data.success && createResult.data.token) {
    logTest('Configuración guardada en Redis', true, 'Token generado correctamente');
    
    // Intentar obtener la configuración inmediatamente
    const getResult = await makeRequest('GET', `/mqtt-sensor/esp32/config/${createResult.data.token}`);
    
    if (getResult.success && getResult.data.success) {
      logTest('Configuración recuperada de Redis', true, 'Datos persistentes funcionando');
    } else {
      logTest('Error recuperando de Redis', false, 'Datos no persistentes');
    }
    
    return true;
  } else {
    logTest('Error guardando en Redis', false, createResult.error?.message || 'Redis no disponible');
    return false;
  }
}

// Función principal
async function runAllTests() {
  log('🚀 INICIANDO PRUEBAS DE MEJORAS ESP32 AUTO-CONFIGURATION', 'bright');
  log('=' .repeat(60), 'cyan');
  
  try {
    // Test de autenticación
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      log('\n❌ No se pudo autenticar. Abortando pruebas.', 'red');
      return;
    }
    
    // Obtener ubicación para tests
    const ubicacionId = await testFetchLocations();
    if (!ubicacionId) {
      log('\n❌ No se encontró ubicación válida. Abortando pruebas.', 'red');
      return;
    }
    
    // Tests de funcionalidad básica
    await testDownloadBaseCode();
    await testDownloadInstructions();
    await testGenerateCustomCode();
    
    // Tests de configuración automática mejorada
    await testAutoConfiguration(ubicacionId);
    await testQRCodeGeneration();
    
    // Tests de monitoreo y estadísticas
    await testStatistics();
    await testDeviceList();
    await testDeviceStatusUpdate();
    
    // Tests de seguridad
    await testSecurityFeatures();
    
    // Tests de integración
    await testRedisIntegration();
    
  } catch (error) {
    log(`\n💥 Error durante las pruebas: ${error.message}`, 'red');
  }
  
  // Resumen final
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 RESUMEN DE PRUEBAS', 'bright');
  log('='.repeat(60), 'cyan');
  
  log(`✅ Pruebas exitosas: ${testResults.passed}`, 'green');
  log(`❌ Pruebas fallidas: ${testResults.failed}`, 'red');
  log(`📈 Total de pruebas: ${testResults.total}`, 'blue');
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`🎯 Tasa de éxito: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  if (testResults.failed > 0) {
    log('\n❌ PRUEBAS FALLIDAS:', 'red');
    testResults.details
      .filter(test => !test.success)
      .forEach(test => {
        log(`   • ${test.testName}: ${test.details}`, 'red');
      });
  }
  
  log('\n📁 ARCHIVOS GENERADOS:', 'cyan');
  const files = [
    'esp32-base-code-improved.ino',
    'instrucciones-esp32-improved.md',
    'esp32-custom-code-improved.ino',
    'test-qr-code.png'
  ];
  
  for (const file of files) {
    try {
      await fs.access(file);
      log(`   ✅ ${file}`, 'green');
    } catch {
      log(`   ❌ ${file} (no generado)`, 'red');
    }
  }
  
  log('\n🎉 PRUEBAS COMPLETADAS', 'bright');
  
  if (testResults.failed === 0) {
    log('✨ ¡Todas las mejoras están funcionando correctamente!', 'green');
  } else {
    log('⚠️  Algunas pruebas fallaron. Revisa los errores arriba.', 'yellow');
  }
}

// Ejecutar pruebas
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests }; 