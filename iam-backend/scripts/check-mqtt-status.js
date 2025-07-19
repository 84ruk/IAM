#!/usr/bin/env node

/**
 * Script para verificar el estado del módulo MQTT
 * Uso: node scripts/check-mqtt-status.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración MQTT...\n');

// Verificar archivo .env
const envPath = path.join(__dirname, '..', '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ No se encontró archivo .env');
  console.log('💡 Copia env.example a .env y configura las variables');
  process.exit(1);
}

// Leer variables de entorno
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/"/g, '');
  }
});

console.log('📋 Variables de entorno MQTT:');
console.log('================================');

const mqttVars = [
  'MQTT_ENABLED',
  'MQTT_HOST', 
  'MQTT_PORT',
  'MQTT_USERNAME',
  'MQTT_PASSWORD',
  'MQTT_RECONNECT_PERIOD',
  'MQTT_CONNECT_TIMEOUT',
  'MQTT_MAX_RECONNECT_ATTEMPTS'
];

mqttVars.forEach(varName => {
  const value = envVars[varName];
  if (value !== undefined) {
    console.log(`✅ ${varName}=${value}`);
  } else {
    console.log(`❌ ${varName}=<no configurado>`);
  }
});

console.log('\n🔧 Estado del módulo:');
console.log('=====================');

const enabled = envVars.MQTT_ENABLED === 'true';
const host = envVars.MQTT_HOST;
const port = envVars.MQTT_PORT;

if (!enabled) {
  console.log('🟡 MQTT está DESHABILITADO');
  console.log('   Para habilitarlo, configura MQTT_ENABLED=true');
} else if (!host || !port) {
  console.log('🟡 MQTT está HABILITADO pero INCOMPLETO');
  console.log('   Configura MQTT_HOST y MQTT_PORT');
} else {
  console.log('🟢 MQTT está HABILITADO y CONFIGURADO');
  console.log(`   Broker: ${host}:${port}`);
}

console.log('\n📚 Documentación:');
console.log('==================');
console.log('📖 Ver MQTT_CONFIGURATION.md para más detalles');
console.log('🌐 API endpoints:');
console.log('   GET  /mqtt-sensor/status');
console.log('   POST /mqtt-sensor/toggle');

console.log('\n🚀 Para probar la conexión:');
console.log('==========================');
if (enabled && host && port) {
  console.log(`1. Asegúrate de que el broker MQTT esté ejecutándose en ${host}:${port}`);
  console.log('2. Inicia la aplicación: npm run start:dev');
  console.log('3. Verifica los logs para ver el estado de conexión');
  console.log('4. Usa la API para verificar el estado: GET /mqtt-sensor/status');
} else {
  console.log('1. Configura las variables MQTT_ENABLED=true, MQTT_HOST y MQTT_PORT');
  console.log('2. Inicia un broker MQTT (ej: mosquitto)');
  console.log('3. Reinicia la aplicación');
} 