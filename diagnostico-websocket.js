#!/usr/bin/env node

/**
 * Script de diagnóstico para WebSocket y autenticación
 * Verifica el estado del backend, frontend y cookies
 */

const http = require('http');
const https = require('https');
const { io } = require('socket.io-client');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log('🔍 DIAGNÓSTICO WEBSOCKET Y AUTENTICACIÓN');
console.log('==========================================\n');

async function checkBackendHealth() {
  console.log('1️⃣ Verificando salud del backend...');
  
  return new Promise((resolve) => {
    const url = `${BACKEND_URL}/health`;
    const client = BACKEND_URL.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      console.log(`   ✅ Backend responde: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ Backend no responde: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('   ⏰ Timeout al conectar con backend');
      req.destroy();
      resolve(false);
    });
  });
}

async function checkAuthEndpoint() {
  console.log('\n2️⃣ Verificando endpoint de autenticación...');
  
  return new Promise((resolve) => {
    const url = `${BACKEND_URL}/auth/needs-setup`;
    const client = BACKEND_URL.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`   ✅ Auth endpoint responde: ${res.statusCode}`);
          console.log(`   📋 Response: ${JSON.stringify(response, null, 2)}`);
          resolve(true);
        } catch (e) {
          console.log(`   ⚠️ Respuesta no es JSON válido: ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ Auth endpoint no responde: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('   ⏰ Timeout en auth endpoint');
      req.destroy();
      resolve(false);
    });
  });
}

async function testWebSocketConnection() {
  console.log('\n3️⃣ Probando conexión WebSocket...');
  
  return new Promise((resolve) => {
    try {
      const socket = io(`${BACKEND_URL}/importacion`, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      let connected = false;
      let error = null;

      socket.on('connect', () => {
        console.log('   ✅ WebSocket conectado exitosamente');
        console.log(`   🔗 Socket ID: ${socket.id}`);
        connected = true;
        socket.disconnect();
        resolve({ success: true, error: null });
      });

      socket.on('connect_error', (err) => {
        console.log(`   ❌ Error de conexión WebSocket: ${err.message}`);
        error = err.message;
        resolve({ success: false, error: err.message });
      });

      socket.on('disconnect', (reason) => {
        if (connected) {
          console.log(`   🔌 WebSocket desconectado: ${reason}`);
        }
      });

      // Timeout después de 10 segundos
      setTimeout(() => {
        if (!connected) {
          console.log('   ⏰ Timeout en conexión WebSocket');
          socket.disconnect();
          resolve({ success: false, error: 'Timeout' });
        }
      }, 10000);

    } catch (err) {
      console.log(`   ❌ Error al crear WebSocket: ${err.message}`);
      resolve({ success: false, error: err.message });
    }
  });
}

async function checkCookieConfiguration() {
  console.log('\n4️⃣ Verificando configuración de cookies...');
  
  const cookieConfig = {
    domain: process.env.COOKIE_DOMAIN || 'localhost',
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true
  };
  
  console.log('   📋 Configuración actual:');
  console.log(`      Domain: ${cookieConfig.domain}`);
  console.log(`      Secure: ${cookieConfig.secure}`);
  console.log(`      SameSite: ${cookieConfig.sameSite}`);
  console.log(`      HttpOnly: ${cookieConfig.httpOnly}`);
  
  // Verificar si hay problemas de configuración
  const issues = [];
  
  if (process.env.NODE_ENV === 'development' && cookieConfig.secure) {
    issues.push('⚠️ Secure=true en desarrollo puede causar problemas');
  }
  
  if (cookieConfig.sameSite === 'none' && !cookieConfig.secure) {
    issues.push('⚠️ SameSite=none requiere Secure=true');
  }
  
  if (issues.length > 0) {
    console.log('   ⚠️ Problemas detectados:');
    issues.forEach(issue => console.log(`      ${issue}`));
  } else {
    console.log('   ✅ Configuración de cookies parece correcta');
  }
  
  return issues.length === 0;
}

async function checkEnvironmentVariables() {
  console.log('\n5️⃣ Verificando variables de entorno...');
  
  const requiredVars = [
    'NEXT_PUBLIC_API_URL',
    'JWT_SECRET',
    'FRONTEND_URL'
  ];
  
  const optionalVars = [
    'COOKIE_DOMAIN',
    'NODE_ENV'
  ];
  
  console.log('   📋 Variables requeridas:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`      ✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`      ❌ ${varName}: No definida`);
    }
  });
  
  console.log('   📋 Variables opcionales:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`      ✅ ${varName}: ${value}`);
    } else {
      console.log(`      ⚠️ ${varName}: No definida (usando valor por defecto)`);
    }
  });
}

async function runDiagnostic() {
  console.log('🚀 Iniciando diagnóstico completo...\n');
  
  const results = {
    backendHealth: await checkBackendHealth(),
    authEndpoint: await checkAuthEndpoint(),
    websocket: await testWebSocketConnection(),
    cookies: await checkCookieConfiguration()
  };
  
  await checkEnvironmentVariables();
  
  console.log('\n📊 RESUMEN DEL DIAGNÓSTICO');
  console.log('==========================');
  console.log(`Backend Health: ${results.backendHealth ? '✅' : '❌'}`);
  console.log(`Auth Endpoint: ${results.authEndpoint ? '✅' : '❌'}`);
  console.log(`WebSocket: ${results.websocket.success ? '✅' : '❌'}`);
  console.log(`Cookies Config: ${results.cookies ? '✅' : '❌'}`);
  
  if (results.websocket.error) {
    console.log(`WebSocket Error: ${results.websocket.error}`);
  }
  
  console.log('\n🎯 RECOMENDACIONES:');
  
  if (!results.backendHealth) {
    console.log('   🔧 Asegúrate de que el backend esté ejecutándose en el puerto correcto');
  }
  
  if (!results.websocket.success) {
    console.log('   🔧 Verifica la configuración CORS del WebSocket');
    console.log('   🔧 Asegúrate de que las cookies se estén enviando correctamente');
  }
  
  if (!results.cookies) {
    console.log('   🔧 Revisa la configuración de cookies en el backend');
  }
  
  console.log('\n✨ Diagnóstico completado');
}

// Ejecutar diagnóstico
runDiagnostic().catch(console.error); 