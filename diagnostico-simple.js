#!/usr/bin/env node

/**
 * Script de diagnóstico simple para WebSocket y autenticación
 * No requiere dependencias externas
 */

const http = require('http');
const https = require('https');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log('🔍 DIAGNÓSTICO SIMPLE WEBSOCKET Y AUTENTICACIÓN');
console.log('================================================\n');

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

async function checkWebSocketEndpoint() {
  console.log('\n3️⃣ Verificando endpoint WebSocket...');
  
  return new Promise((resolve) => {
    // Intentar conectar al endpoint WebSocket usando HTTP upgrade
    const url = `${BACKEND_URL}/socket.io/`;
    const client = BACKEND_URL.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      console.log(`   ✅ WebSocket endpoint responde: ${res.statusCode}`);
      console.log(`   📋 Headers: ${JSON.stringify(res.headers, null, 2)}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ WebSocket endpoint no responde: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('   ⏰ Timeout en WebSocket endpoint');
      req.destroy();
      resolve(false);
    });
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

async function checkPorts() {
  console.log('\n6️⃣ Verificando puertos...');
  
  const ports = [
    { name: 'Backend', port: 3001, url: BACKEND_URL },
    { name: 'Frontend', port: 3000, url: FRONTEND_URL }
  ];
  
  for (const service of ports) {
    try {
      const url = new URL(service.url);
      console.log(`   📋 ${service.name}: ${url.protocol}//${url.hostname}:${url.port}`);
    } catch (e) {
      console.log(`   ❌ ${service.name}: URL inválida - ${service.url}`);
    }
  }
}

async function runDiagnostic() {
  console.log('🚀 Iniciando diagnóstico completo...\n');
  
  const results = {
    backendHealth: await checkBackendHealth(),
    authEndpoint: await checkAuthEndpoint(),
    websocket: await checkWebSocketEndpoint(),
    cookies: await checkCookieConfiguration()
  };
  
  await checkEnvironmentVariables();
  await checkPorts();
  
  console.log('\n📊 RESUMEN DEL DIAGNÓSTICO');
  console.log('==========================');
  console.log(`Backend Health: ${results.backendHealth ? '✅' : '❌'}`);
  console.log(`Auth Endpoint: ${results.authEndpoint ? '✅' : '❌'}`);
  console.log(`WebSocket Endpoint: ${results.websocket ? '✅' : '❌'}`);
  console.log(`Cookies Config: ${results.cookies ? '✅' : '❌'}`);
  
  console.log('\n🎯 RECOMENDACIONES:');
  
  if (!results.backendHealth) {
    console.log('   🔧 Asegúrate de que el backend esté ejecutándose en el puerto correcto');
    console.log('   🔧 Verifica que no haya errores en los logs del backend');
  }
  
  if (!results.websocket) {
    console.log('   🔧 Verifica la configuración CORS del WebSocket');
    console.log('   🔧 Asegúrate de que el módulo WebSockets esté importado correctamente');
  }
  
  if (!results.cookies) {
    console.log('   🔧 Revisa la configuración de cookies en el backend');
  }
  
  console.log('\n🔍 PRÓXIMOS PASOS:');
  console.log('   1. Revisa los logs del backend para errores específicos');
  console.log('   2. Verifica que el frontend esté enviando cookies correctamente');
  console.log('   3. Prueba la conexión WebSocket desde el navegador');
  
  console.log('\n✨ Diagnóstico completado');
}

// Ejecutar diagnóstico
runDiagnostic().catch(console.error); 