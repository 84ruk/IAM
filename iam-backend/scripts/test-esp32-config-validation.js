#!/usr/bin/env node

/**
 * Script para probar la validación de configuración automática ESP32
 * Este script simula las peticiones que hace el frontend para identificar problemas
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuración del servidor
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

console.log('🧪 Script de prueba - Configuración automática ESP32');
console.log('==================================================');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testValidation() {
  try {
    console.log('\n📝 Configurando datos de prueba...\n');

    // Solicitar datos al usuario
    const deviceName = await question('Nombre del dispositivo ESP32: ') || 'ESP32-Test';
    const wifiSSID = await question('SSID WiFi: ') || 'TestWiFi';
    const wifiPassword = await question('Contraseña WiFi: ') || 'password123';
    const ubicacionId = parseInt(await question('ID de ubicación: ') || '1');
    const token = await question('Token de autenticación (Bearer): ');

    if (!token) {
      console.error('❌ Token de autenticación requerido');
      process.exit(1);
    }

    // Casos de prueba
    const testCases = [
      {
        name: 'Configuración válida completa',
        config: {
          deviceName,
          wifiSSID,
          wifiPassword,
          ubicacionId,
          sensores: [
            { tipo: 'TEMPERATURA', nombre: 'Sensor Temp', pin: 4, enabled: true },
            { tipo: 'HUMEDAD', nombre: 'Sensor Hum', pin: 5, enabled: true }
          ]
        }
      },
      {
        name: 'Sin deviceName',
        config: {
          wifiSSID,
          wifiPassword,
          ubicacionId,
          sensores: [
            { tipo: 'TEMPERATURA', nombre: 'Sensor Temp', pin: 4, enabled: true }
          ]
        }
      },
      {
        name: 'Sin sensores habilitados',
        config: {
          deviceName,
          wifiSSID,
          wifiPassword,
          ubicacionId,
          sensores: [
            { tipo: 'TEMPERATURA', nombre: 'Sensor Temp', pin: 4, enabled: false }
          ]
        }
      },
      {
        name: 'Pines duplicados',
        config: {
          deviceName,
          wifiSSID,
          wifiPassword,
          ubicacionId,
          sensores: [
            { tipo: 'TEMPERATURA', nombre: 'Sensor Temp', pin: 4, enabled: true },
            { tipo: 'HUMEDAD', nombre: 'Sensor Hum', pin: 4, enabled: true }
          ]
        }
      },
      {
        name: 'Configuración null',
        config: null
      },
      {
        name: 'Configuración vacía',
        config: {}
      }
    ];

    console.log('\n🚀 Ejecutando casos de prueba...\n');

    for (const testCase of testCases) {
      console.log(`\n📋 Probando: ${testCase.name}`);
      console.log('─'.repeat(50));

      try {
        const response = await fetch(`${BACKEND_URL}/mqtt-sensor/esp32/configuracion-automatica`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(testCase.config)
        });

        const data = await response.json();

        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Success: ${data.success}`);
        console.log(`Message: ${data.message}`);
        
        if (data.success) {
          console.log('✅ Configuración generada exitosamente');
          if (data.credentials) {
            console.log(`   MQTT Username: ${data.credentials.mqttUsername}`);
            console.log(`   MQTT Topic: ${data.credentials.mqttTopic}`);
          }
        } else {
          console.log(`❌ Error: ${data.message}`);
        }

      } catch (error) {
        console.error(`💥 Error de conexión: ${error.message}`);
      }

      // Pausa entre pruebas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✨ Pruebas completadas');

  } catch (error) {
    console.error('💥 Error ejecutando pruebas:', error);
  } finally {
    rl.close();
  }
}

// Verificación de conectividad
async function checkBackend() {
  try {
    console.log(`🔍 Verificando conectividad con ${BACKEND_URL}...`);
    
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      timeout: 5000
    });

    if (response.ok) {
      console.log('✅ Backend conectado correctamente');
      return true;
    } else {
      console.log(`⚠️  Backend responde pero con status: ${response.status}`);
      return true; // Continuar de todos modos
    }
  } catch (error) {
    console.log(`❌ No se puede conectar al backend: ${error.message}`);
    console.log('💡 Asegúrate de que el backend esté corriendo en el puerto 3001');
    
    const continuar = await question('\n¿Continuar de todos modos? (y/N): ');
    return continuar.toLowerCase() === 'y';
  }
}

// Función principal
async function main() {
  try {
    const canContinue = await checkBackend();
    if (canContinue) {
      await testValidation();
    } else {
      console.log('🛑 Pruebas canceladas');
    }
  } catch (error) {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  }
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { testValidation, checkBackend };



