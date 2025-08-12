#!/usr/bin/env node

/**
 * Script de prueba para verificar la conexión del ESP32 con el backend
 * Ejecutar: node test-esp32-connection.js
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const EMPRESA_ID = process.env.EMPRESA_ID || '1';

// Headers que debe enviar el ESP32
const esp32Headers = {
  'Content-Type': 'application/json',
  'x-empresa-id': EMPRESA_ID,
  'x-device-type': 'esp32',
  'x-esp32-device': 'true',
  'x-esp32-version': '1.0.0',
  'User-Agent': 'ESP32-Sensor/1.0'
};

async function testESP32Connection() {
  console.log('🧪 Probando conexión del ESP32 con el backend...\n');

  try {
    // 0. Probar health check primero
    console.log('0️⃣ Probando health check...');
    try {
      const healthResponse = await axios.get(
        `${API_BASE_URL}/sensores/iot/health`,
        { headers: esp32Headers }
      );
      console.log('✅ Health check exitoso:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health check falló:', error.response?.data || error.message);
    }

    // 1. Probar endpoint de lectura
    console.log('\n1️⃣ Probando endpoint de lectura...');
    const lecturaData = {
      tipo: 'TEMPERATURA',
      valor: 25.5,
      unidad: '°C',
      productoId: null,
      sensorId: null,
      ubicacionId: 2
    };

    const lecturaResponse = await axios.post(
      `${API_BASE_URL}/sensores/iot/lectura`,
      lecturaData,
      { headers: esp32Headers }
    );

    console.log('✅ Lectura enviada exitosamente:', lecturaResponse.data);

    // 2. Probar endpoint de registro de sensor
    console.log('\n2️⃣ Probando endpoint de registro de sensor...');
    const sensorData = {
      nombre: 'Sensor-Test-ESP32',
      tipo: 'TEMPERATURA',
      ubicacionId: 2,
      descripcion: 'Sensor de prueba desde ESP32',
      activo: true, // 🔧 IMPORTANTE: Asegurar que sea activo
      modo: 'AUTOMATICO'
    };

    const sensorResponse = await axios.post(
      `${API_BASE_URL}/sensores/iot/registrar-sensor`,
      sensorData,
      { headers: esp32Headers }
    );

    console.log('✅ Sensor registrado exitosamente:', sensorResponse.data);

    // 3. Verificar que el sensor aparezca en la lista
    console.log('\n3️⃣ Verificando que el sensor aparezca en la lista...');
    try {
      const sensoresResponse = await axios.get(
        `${API_BASE_URL}/sensores`,
        { headers: { ...esp32Headers, 'Authorization': 'Bearer test-token' } }
      );
      console.log('✅ Lista de sensores obtenida:', sensoresResponse.data);
    } catch (error) {
      console.log('⚠️ No se pudo obtener la lista de sensores (requiere autenticación):', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔍 DIAGNÓSTICO: Error de conexión');
      console.log('   • Verificar que el backend esté ejecutándose en:', API_BASE_URL);
      console.log('   • Verificar que el puerto 3001 esté abierto');
      console.log('   • Verificar firewall/red');
    }
    
    if (error.response?.status === 404) {
      console.log('\n🔍 DIAGNÓSTICO: Endpoint no encontrado');
      console.log('   • Verificar que las rutas estén configuradas correctamente');
      console.log('   • Verificar que el módulo de sensores esté cargado');
    }
    
    if (error.response?.status === 403) {
      console.log('\n🔍 DIAGNÓSTICO: Acceso denegado');
      console.log('   • Verificar que el middleware de IP esté configurado correctamente');
      console.log('   • Verificar que la empresa ID sea válida');
    }
  }
}

async function testWithDifferentIPs() {
  console.log('\n🌐 Probando con diferentes IPs...');
  
  const testIPs = [
    '192.168.0.12:3001',
    'localhost:3001',
    '127.0.0.1:3001',
    '0.0.0.0:3001'
  ];
  
  for (const ip of testIPs) {
    console.log(`\n🔍 Probando con IP: ${ip}`);
    try {
      const response = await axios.get(`http://${ip}/sensores/iot/health`, {
        headers: esp32Headers,
        timeout: 5000
      });
      console.log(`✅ Conexión exitosa a ${ip}:`, response.data.status);
    } catch (error) {
      console.log(`❌ Conexión fallida a ${ip}:`, error.code || error.message);
    }
  }
}

// Ejecutar pruebas
async function runTests() {
  try {
    await testESP32Connection();
    await testWithDifferentIPs();
  } catch (error) {
    console.error('❌ Error ejecutando pruebas:', error);
  }
}

// Verificar si axios está instalado
try {
  require('axios');
  runTests();
} catch (error) {
  console.log('❌ Axios no está instalado');
  console.log('💡 O ejecuta: npm install axios && node test-esp32-connection.js');
}
