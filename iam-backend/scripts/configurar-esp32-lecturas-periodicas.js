#!/usr/bin/env node

/**
 * 🚀 Script de Configuración ESP32 - Sistema de Lecturas Periódicas
 * 
 * Este script configura un ESP32 para enviar lecturas periódicas vía HTTP
 * en lugar de usar MQTT.
 * 
 * Uso:
 * node scripts/configurar-esp32-lecturas-periodicas.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuración
const CONFIG_FILE = 'esp32-config.json';
// 🎯 SIEMPRE usar la URL de producción sin puerto para ESP32
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.iaminventario.com.mx';

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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function question(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function configurarESP32() {
  log('🚀 Configuración ESP32 - Sistema de Lecturas Periódicas', 'cyan');
  log('====================================================', 'cyan');
  
  const rl = createInterface();
  
  try {
    // 1. Información del dispositivo
    log('\n📱 INFORMACIÓN DEL DISPOSITIVO', 'yellow');
    const deviceName = await question(rl, 'Nombre del dispositivo ESP32: ');
    const ubicacionId = parseInt(await question(rl, 'ID de la ubicación: '));
    const empresaId = parseInt(await question(rl, 'ID de la empresa: '));
    
    // 2. Configuración WiFi
    log('\n📶 CONFIGURACIÓN WIFI', 'yellow');
    const wifiSSID = await question(rl, 'SSID de la red WiFi: ');
    const wifiPassword = await question(rl, 'Contraseña WiFi: ');
    
    // 3. Configuración de sensores
    log('\n📊 CONFIGURACIÓN DE SENSORES', 'yellow');
    log('Tipos disponibles: TEMPERATURA, HUMEDAD, PESO, PRESION', 'blue');
    
    const sensores = [];
    let continuar = true;
    let sensorIndex = 1;
    
    while (continuar && sensorIndex <= 10) {
      log(`\n--- Sensor ${sensorIndex} ---`, 'magenta');
      
      const nombre = await question(rl, `Nombre del sensor ${sensorIndex}: `);
      if (!nombre) break;
      
      const tipo = await question(rl, 'Tipo de sensor (TEMPERATURA/HUMEDAD/PESO/PRESION): ').toUpperCase();
      const enabled = (await question(rl, '¿Habilitado? (s/n): ')).toLowerCase() === 's';
      
      let umbralMin, umbralMax, unidad;
      
      switch (tipo) {
        case 'TEMPERATURA':
          umbralMin = parseFloat(await question(rl, 'Umbral mínimo (°C): ') || '15');
          umbralMax = parseFloat(await question(rl, 'Umbral máximo (°C): ') || '35');
          unidad = '°C';
          break;
        case 'HUMEDAD':
          umbralMin = parseFloat(await question(rl, 'Umbral mínimo (%): ') || '30');
          umbralMax = parseFloat(await question(rl, 'Umbral máximo (%): ') || '80');
          unidad = '%';
          break;
        case 'PESO':
          umbralMin = parseFloat(await question(rl, 'Umbral mínimo (kg): ') || '0');
          umbralMax = parseFloat(await question(rl, 'Umbral máximo (kg): ') || '1000');
          unidad = 'kg';
          break;
        case 'PRESION':
          umbralMin = parseFloat(await question(rl, 'Umbral mínimo (hPa): ') || '900');
          umbralMax = parseFloat(await question(rl, 'Umbral máximo (hPa): ') || '1100');
          unidad = 'hPa';
          break;
        default:
          log('❌ Tipo de sensor no válido', 'red');
          continue;
      }
      
      const pin = parseInt(await question(rl, 'Pin del sensor: ') || '4');
      const pin2 = parseInt(await question(rl, 'Pin secundario (0 si no aplica): ') || '0');
      const intervalo = parseInt(await question(rl, 'Intervalo de lectura (segundos): ') || '30');
      
      sensores.push({
        tipo,
        nombre,
        pin,
        pin2,
        enabled,
        umbralMin,
        umbralMax,
        unidad,
        intervalo: intervalo * 1000 // Convertir a milisegundos
      });
      
      sensorIndex++;
      continuar = (await question(rl, '¿Agregar otro sensor? (s/n): ')).toLowerCase() === 's';
    }
    
    // 4. Generar token de API
    const apiToken = generateApiToken();
    
    // 5. Crear configuración
    const configuracion = {
      deviceId: `esp32_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceName,
      ubicacionId,
      empresaId,
      wifi: {
        ssid: wifiSSID,
        password: wifiPassword
      },
      api: {
        baseUrl: API_BASE_URL,
        token: apiToken,
        endpoint: '/sensores/lecturas-multiples'
      },
      sensores,
      intervalo: 30000, // 30 segundos por defecto
      timestamp: new Date().toISOString()
    };
    
    // 6. Guardar configuración
    const configPath = path.join(__dirname, '..', 'uploads', 'config', CONFIG_FILE);
    const configDir = path.dirname(configPath);
    
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(configuracion, null, 2));
    
    // 7. Generar archivo de configuración para ESP32
    const esp32ConfigPath = path.join(__dirname, '..', 'uploads', 'config', 'esp32-config.json');
    fs.writeFileSync(esp32ConfigPath, JSON.stringify(configuracion, null, 2));
    
    // 8. Mostrar resumen
    log('\n✅ CONFIGURACIÓN COMPLETADA', 'green');
    log('================================', 'green');
    log(`📁 Archivo de configuración: ${configPath}`, 'blue');
    log(`📁 Configuración ESP32: ${esp32ConfigPath}`, 'blue');
    log(`🔑 Token API: ${apiToken}`, 'yellow');
    log(`📊 Sensores configurados: ${sensores.length}`, 'blue');
    
    // 9. Mostrar instrucciones
    log('\n📋 INSTRUCCIONES PARA ESP32', 'cyan');
    log('============================', 'cyan');
    log('1. Copia el archivo esp32-config.json a la tarjeta SD del ESP32', 'blue');
    log('2. Sube el código esp32-lecturas-periodicas.ino al ESP32', 'blue');
    log('3. El ESP32 leerá la configuración automáticamente', 'blue');
    log('4. Los datos se enviarán cada 30 segundos vía HTTP', 'blue');
    
    // 10. Mostrar ejemplo de datos
    log('\n📤 EJEMPLO DE DATOS ENVIADOS', 'cyan');
    log('============================', 'cyan');
    const ejemploDatos = {
      deviceId: configuracion.deviceId,
      deviceName: configuracion.deviceName,
      ubicacionId: configuracion.ubicacionId,
      empresaId: configuracion.empresaId,
      timestamp: Date.now(),
      sensors: {
        temperatura: 25.5,
        humedad: 60.0,
        peso: 15.75
      }
    };
    console.log(JSON.stringify(ejemploDatos, null, 2));
    
  } catch (error) {
    log(`❌ Error durante la configuración: ${error.message}`, 'red');
  } finally {
    rl.close();
  }
}

function generateApiToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  configurarESP32().catch(console.error);
}

module.exports = { configurarESP32, generateApiToken };

