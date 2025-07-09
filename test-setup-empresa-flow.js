#!/usr/bin/env node

/**
 * Script de prueba para verificar el flujo completo de setup de empresa
 * 
 * Este script simula:
 * 1. Registro de usuario
 * 2. Login de usuario
 * 3. Verificación de necesidad de setup
 * 4. Setup de empresa
 * 5. Verificación de acceso al dashboard
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:3001';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Test123!';

// Configurar axios para manejar cookies
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Importante: esto permite el envío de cookies
  timeout: 10000,
});

async function testSetupFlow() {
  console.log('🧪 Iniciando prueba del flujo de setup de empresa...\n');
  console.log(`📧 Usando email de prueba: ${TEST_EMAIL}\n`);

  try {
    // 1. Registrar usuario
    console.log('1️⃣ Registrando usuario de prueba...');
    const registerResponse = await api.post('/auth/register', {
      nombre: 'Usuario de Prueba',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    console.log('✅ Usuario registrado exitosamente');
    console.log('📊 Respuesta del registro:', registerResponse.data);

    // 2. Login
    console.log('\n2️⃣ Realizando login...');
    const loginResponse = await api.post('/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    console.log('✅ Login exitoso');
    console.log('📊 Respuesta del login:', loginResponse.data);

    // 3. Verificar necesidad de setup
    console.log('\n3️⃣ Verificando necesidad de setup...');
    const setupCheckResponse = await api.get('/auth/needs-setup');

    console.log('📊 Estado de setup:', setupCheckResponse.data);

    if (!setupCheckResponse.data.needsSetup) {
      console.log('✅ Usuario ya tiene empresa configurada');
      
      // Debug del token actual
      console.log('\n🔍 Debug del token actual...');
      const debugResponse = await api.get('/auth/debug-token');
      console.log('📊 Debug del token:', debugResponse.data);
      
      return;
    }

    // 4. Setup de empresa
    console.log('\n4️⃣ Configurando empresa...');
    const setupData = {
      nombreEmpresa: 'Empresa de Prueba',
      tipoIndustria: 'GENERICA',
      rfc: 'TEST123456789',
      direccion: 'Dirección de prueba',
      telefono: '1234567890'
    };

    const setupResponse = await api.post('/auth/setup-empresa', setupData);

    console.log('✅ Setup exitoso:', setupResponse.data.message);

    // Verificar que se recibió el nuevo token
    if (setupResponse.data.token) {
      console.log('✅ Nuevo token recibido con información de empresa');
    } else {
      console.warn('⚠️ No se recibió token en la respuesta del setup');
    }

    // 5. Debug del token después del setup
    console.log('\n5️⃣ Debug del token después del setup...');
    const debugResponse = await api.get('/auth/debug-token');
    console.log('📊 Debug del token:', debugResponse.data);

    // 6. Verificar acceso al dashboard
    console.log('\n6️⃣ Verificando acceso al dashboard...');
    try {
      const dashboardResponse = await api.get('/dashboard');
      console.log('✅ Acceso al dashboard exitoso');
    } catch (error) {
      console.warn(`⚠️ Acceso al dashboard falló: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // 7. Verificar estado final del usuario
    console.log('\n7️⃣ Verificando estado final del usuario...');
    const statusResponse = await api.get('/auth/status');
    console.log('📊 Estado final del usuario:', {
      needsSetup: statusResponse.data.needsSetup,
      hasEmpresa: !!statusResponse.data.empresa,
      empresaNombre: statusResponse.data.empresa?.nombre,
      userRol: statusResponse.data.user?.rol,
    });

    console.log('\n🎉 Prueba completada exitosamente!');

  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('📊 Respuesta del servidor:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    }
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Ejecutar la prueba
testSetupFlow(); 