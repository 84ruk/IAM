#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Configuración de MQTT para EMQX Broker');
console.log('==========================================\n');

// Configuración por defecto para EMQX
const configEMQX = {
  MQTT_ENABLED: 'true',
  MQTT_HOST: 'h02f10fd.ala.us-east-1.emqxsl.com',
  MQTT_PORT: '8883',
  MQTT_USE_TLS: 'true',
  MQTT_USERNAME: '',
  MQTT_PASSWORD: '',
  MQTT_APP_ID: 'v2c96220',
  MQTT_APP_SECRET: '',
  MQTT_API_ENDPOINT: 'https://h02f10fd.ala.us-east-1.emqxsl.com:8443/api/v5',
  MQTT_RECONNECT_PERIOD: '5000',
  MQTT_CONNECT_TIMEOUT: '10000',
  MQTT_MAX_RECONNECT_ATTEMPTS: '5'
};

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function configurarMQTT() {
  console.log('Configuración actual para EMQX:');
  console.log(`Host: ${configEMQX.MQTT_HOST}`);
  console.log(`Puerto: ${configEMQX.MQTT_PORT}`);
  console.log(`TLS/SSL: ${configEMQX.MQTT_USE_TLS}`);
  console.log(`App ID: ${configEMQX.MQTT_APP_ID}`);
  console.log(`API Endpoint: ${configEMQX.MQTT_API_ENDPOINT}\n`);

  // Solicitar credenciales
  const username = await question('Usuario MQTT (dejar vacío si no se requiere): ');
  const password = await question('Contraseña MQTT (dejar vacío si no se requiere): ');
  const appSecret = await question('App Secret de EMQX: ');

  // Actualizar configuración
  if (username) configEMQX.MQTT_USERNAME = username;
  if (password) configEMQX.MQTT_PASSWORD = password;
  if (appSecret) configEMQX.MQTT_APP_SECRET = appSecret;

  // Generar contenido del archivo .env
  const envContent = Object.entries(configEMQX)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Escribir archivo .env
  const envPath = path.join(__dirname, '..', '.env');
  const envContentWithHeader = `# Configuración MQTT para EMQX Broker\n# Generado automáticamente el ${new Date().toISOString()}\n\n${envContent}\n`;

  try {
    // Leer archivo .env existente si existe
    let existingContent = '';
    if (fs.existsSync(envPath)) {
      existingContent = fs.readFileSync(envPath, 'utf8');
    }

    // Filtrar líneas MQTT existentes
    const lines = existingContent.split('\n');
    const filteredLines = lines.filter(line => 
      !line.startsWith('MQTT_') && line.trim() !== ''
    );

    // Combinar contenido existente con nueva configuración MQTT
    const finalContent = filteredLines.join('\n') + '\n\n' + envContentWithHeader;

    fs.writeFileSync(envPath, finalContent);
    console.log('\n✅ Configuración MQTT guardada en .env');
    console.log('\n📋 Resumen de la configuración:');
    console.log('================================');
    Object.entries(configEMQX).forEach(([key, value]) => {
      const displayValue = key.includes('PASSWORD') || key.includes('SECRET') 
        ? '*'.repeat(Math.min(value.length, 8)) 
        : value;
      console.log(`${key}: ${displayValue}`);
    });

    console.log('\n🚀 Para probar la conexión:');
    console.log('1. Reinicia el servidor: npm run start:dev');
    console.log('2. Verifica el estado: GET /mqtt-sensor/status');
    console.log('3. Lista dispositivos: GET /mqtt-sensor/devices');

  } catch (error) {
    console.error('❌ Error guardando configuración:', error.message);
  }

  rl.close();
}

configurarMQTT().catch(console.error); 