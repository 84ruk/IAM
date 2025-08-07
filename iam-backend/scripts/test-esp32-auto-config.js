#!/usr/bin/env node

/**
 * Script de Prueba - Configuración Automática ESP32
 * 
 * Este script prueba todas las funcionalidades implementadas:
 * 1. Generación de código base ESP32
 * 2. Configuración automática
 * 3. Generación de códigos QR
 * 4. Endpoints públicos
 * 5. Almacenamiento temporal
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const JWT_TOKEN = process.env.JWT_TOKEN;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Colores para consola
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

async function testESP32AutoConfig() {
  log('🚀 Iniciando Pruebas de Configuración Automática ESP32', 'bright');
  log('==================================================', 'bright');
  
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Verificar autenticación
    log('\n1️⃣ Verificando autenticación...', 'cyan');
    try {
      const authResponse = await api.get('/users/profile');
      logSuccess('Autenticación correcta');
      logInfo(`Usuario: ${authResponse.data.email}`);
      logInfo(`Empresa ID: ${authResponse.data.empresaId}`);
      testsPassed++;
    } catch (error) {
      logError('Error de autenticación');
      logWarning('Asegúrate de configurar JWT_TOKEN en las variables de entorno');
      logWarning('Ejecuta: export JWT_TOKEN="tu-token-aqui"');
      testsFailed++;
      return;
    }

    // Test 2: Obtener ubicaciones
    log('\n2️⃣ Obteniendo ubicaciones...', 'cyan');
    try {
      const ubicacionesResponse = await api.get('/ubicaciones');
      const ubicaciones = ubicacionesResponse.data;
      
      if (ubicaciones.length === 0) {
        logWarning('No hay ubicaciones. Creando ubicación de prueba...');
        const nuevaUbicacion = await api.post('/ubicaciones', {
          nombre: 'Ubicación de Prueba ESP32',
          descripcion: 'Ubicación para pruebas de configuración automática',
          direccion: 'Dirección de Prueba',
          ciudad: 'Ciudad de Prueba',
          pais: 'País de Prueba',
          codigoPostal: '00000'
        });
        ubicaciones.push(nuevaUbicacion.data);
        logSuccess('Ubicación de prueba creada');
      }
      
      logSuccess(`Ubicaciones obtenidas: ${ubicaciones.length}`);
      testsPassed++;
    } catch (error) {
      logError(`Error obteniendo ubicaciones: ${error.response?.data?.message || error.message}`);
      testsFailed++;
      return;
    }

    // Test 3: Descargar código base ESP32
    log('\n3️⃣ Descargando código base ESP32...', 'cyan');
    try {
      const codigoResponse = await api.get('/mqtt-sensor/esp32/codigo-base', {
        responseType: 'text'
      });
      
      if (codigoResponse.data && codigoResponse.data.includes('ESP32 Auto-Configuration')) {
        logSuccess('Código base ESP32 descargado correctamente');
        
        // Guardar código en archivo
        const codigoPath = path.join(__dirname, 'esp32-base-code-test.ino');
        fs.writeFileSync(codigoPath, codigoResponse.data);
        logInfo(`Código guardado en: ${codigoPath}`);
        testsPassed++;
      } else {
        logError('Código base no contiene contenido esperado');
        testsFailed++;
      }
    } catch (error) {
      logError(`Error descargando código base: ${error.response?.data?.message || error.message}`);
      testsFailed++;
    }

    // Test 4: Descargar instrucciones de instalación
    log('\n4️⃣ Descargando instrucciones de instalación...', 'cyan');
    try {
      const instruccionesResponse = await api.get('/mqtt-sensor/esp32/instrucciones-instalacion', {
        responseType: 'text'
      });
      
      if (instruccionesResponse.data && instruccionesResponse.data.includes('Instrucciones de Instalación')) {
        logSuccess('Instrucciones de instalación descargadas correctamente');
        
        // Guardar instrucciones en archivo
        const instruccionesPath = path.join(__dirname, 'instrucciones-instalacion-test.md');
        fs.writeFileSync(instruccionesPath, instruccionesResponse.data);
        logInfo(`Instrucciones guardadas en: ${instruccionesPath}`);
        testsPassed++;
      } else {
        logError('Instrucciones no contienen contenido esperado');
        testsFailed++;
      }
    } catch (error) {
      logError(`Error descargando instrucciones: ${error.response?.data?.message || error.message}`);
      testsFailed++;
    }

    // Test 5: Generar código personalizado
    log('\n5️⃣ Generando código personalizado...', 'cyan');
    try {
      const codigoPersonalizadoResponse = await api.post('/mqtt-sensor/esp32/codigo-personalizado', {
        sensores: [
          { tipo: 'TEMPERATURA', nombre: 'Sensor Temperatura Test', pin: 4 },
          { tipo: 'HUMEDAD', nombre: 'Sensor Humedad Test', pin: 4 }
        ]
      });
      
      if (codigoPersonalizadoResponse.data.success) {
        logSuccess('Código personalizado generado correctamente');
        logInfo('Incluye: includes, definitions, setupCode, loopCode');
        testsPassed++;
      } else {
        logError('Error generando código personalizado');
        testsFailed++;
      }
    } catch (error) {
      logError(`Error generando código personalizado: ${error.response?.data?.message || error.message}`);
      testsFailed++;
    }

    // Test 6: Generar configuración automática
    log('\n6️⃣ Generando configuración automática...', 'cyan');
    try {
      const configData = {
        deviceName: 'ESP32_Test_Device',
        wifiSSID: 'TestWiFi',
        wifiPassword: 'testpassword123',
        ubicacionId: 1,
        sensores: [
          { tipo: 'TEMPERATURA', nombre: 'Sensor Temperatura', pin: 4, enabled: true },
          { tipo: 'HUMEDAD', nombre: 'Sensor Humedad', pin: 4, enabled: true },
          { tipo: 'PESO', nombre: 'Sensor Peso', pin: 2, enabled: false },
          { tipo: 'PRESION', nombre: 'Sensor Presión', pin: 21, enabled: false }
        ]
      };

      const configResponse = await api.post('/mqtt-sensor/esp32/configuracion-automatica', configData);
      
      if (configResponse.data.success) {
        logSuccess('Configuración automática generada correctamente');
        
        const resultado = configResponse.data;
        logInfo(`Device ID: ${resultado.credentials?.mqttUsername}`);
        logInfo(`MQTT Topic: ${resultado.credentials?.mqttTopic}`);
        logInfo(`QR Code: ${resultado.qrCode ? 'Generado' : 'No disponible'}`);
        logInfo(`Instrucciones: ${resultado.instrucciones?.length || 0} pasos`);
        
        // Guardar configuración en archivo
        const configPath = path.join(__dirname, 'esp32-config-test.json');
        fs.writeFileSync(configPath, JSON.stringify(resultado, null, 2));
        logInfo(`Configuración guardada en: ${configPath}`);
        
        testsPassed++;
        
        // Test 7: Probar endpoint público (simular ESP32)
        log('\n7️⃣ Probando endpoint público (simulación ESP32)...', 'cyan');
        try {
          const deviceId = resultado.credentials?.mqttUsername;
          if (deviceId) {
            const publicResponse = await axios.get(`${BASE_URL}/mqtt-sensor/esp32/config/${deviceId}`);
            
            if (publicResponse.data.success) {
              logSuccess('Endpoint público funciona correctamente');
              logInfo('ESP32 puede obtener configuración automáticamente');
              testsPassed++;
            } else {
              logError('Endpoint público no retornó configuración válida');
              testsFailed++;
            }
          } else {
            logWarning('No se pudo probar endpoint público - deviceId no disponible');
            testsFailed++;
          }
        } catch (error) {
          logError(`Error probando endpoint público: ${error.response?.data?.message || error.message}`);
          testsFailed++;
        }
        
      } else {
        logError(`Error generando configuración: ${configResponse.data.message}`);
        testsFailed++;
      }
    } catch (error) {
      logError(`Error en configuración automática: ${error.response?.data?.message || error.message}`);
      testsFailed++;
    }

    // Test 8: Verificar estado ESP32 (simulación)
    log('\n8️⃣ Verificando estado ESP32 (simulación)...', 'cyan');
    try {
      const deviceId = 'esp32_test_device_' + Date.now();
      const statusResponse = await api.get(`/mqtt-sensor/esp32/status/${deviceId}`);
      
      if (statusResponse.data) {
        logSuccess('Verificación de estado funciona correctamente');
        logInfo(`Estado: ${JSON.stringify(statusResponse.data)}`);
        testsPassed++;
      } else {
        logError('Verificación de estado no retornó datos');
        testsFailed++;
      }
    } catch (error) {
      logError(`Error verificando estado: ${error.response?.data?.message || error.message}`);
      testsFailed++;
    }

  } catch (error) {
    logError(`Error general en las pruebas: ${error.message}`);
    testsFailed++;
  }

  // Resumen de resultados
  log('\n📊 RESUMEN DE PRUEBAS', 'bright');
  log('====================', 'bright');
  log(`✅ Pruebas exitosas: ${testsPassed}`, 'green');
  log(`❌ Pruebas fallidas: ${testsFailed}`, 'red');
  log(`📈 Tasa de éxito: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`, 'cyan');
  
  if (testsFailed === 0) {
    log('\n🎉 ¡Todas las pruebas pasaron exitosamente!', 'bright');
    log('La funcionalidad de configuración automática ESP32 está funcionando correctamente.', 'green');
  } else {
    log('\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.', 'yellow');
  }

  // Información adicional
  log('\n📋 ARCHIVOS GENERADOS:', 'cyan');
  log('=====================', 'cyan');
  const files = [
    'esp32-base-code-test.ino',
    'instrucciones-instalacion-test.md',
    'esp32-config-test.json'
  ];
  
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      log(`📄 ${file} (${(stats.size / 1024).toFixed(1)} KB)`, 'green');
    } else {
      log(`❌ ${file} (no generado)`, 'red');
    }
  });

  log('\n🔧 PRÓXIMOS PASOS:', 'cyan');
  log('=================', 'cyan');
  log('1. Revisa los archivos generados para verificar el contenido', 'blue');
  log('2. Sube el código base ESP32 a un dispositivo real', 'blue');
  log('3. Prueba la configuración automática con un ESP32 físico', 'blue');
  log('4. Verifica que los datos lleguen al dashboard', 'blue');
}

// Ejecutar pruebas
if (require.main === module) {
  testESP32AutoConfig().catch(error => {
    logError(`Error ejecutando pruebas: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testESP32AutoConfig }; 