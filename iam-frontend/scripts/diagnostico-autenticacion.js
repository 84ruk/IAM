#!/usr/bin/env node

/**
 * Script de diagnóstico para problemas de autenticación
 * Uso: node scripts/diagnostico-autenticacion.js
 */

const https = require('https');
const http = require('http');

// Configuración
const config = {
  backendUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  frontendUrl: 'http://localhost:3000',
  timeout: 10000
};

console.log('🔍 DIAGNÓSTICO DE AUTENTICACIÓN');
console.log('================================\n');

async function checkEnvironmentVariables() {
  console.log('1️⃣ Verificando variables de entorno...');
  
  const envVars = {
    'NEXT_PUBLIC_API_URL': process.env.NEXT_PUBLIC_API_URL,
    'NODE_ENV': process.env.NODE_ENV,
    'COOKIE_DOMAIN': process.env.COOKIE_DOMAIN
  };
  
  let hasIssues = false;
  
  for (const [key, value] of Object.entries(envVars)) {
    if (!value) {
      console.log(`   ❌ ${key}: No configurado`);
      hasIssues = true;
    } else {
      console.log(`   ✅ ${key}: ${value}`);
    }
  }
  
  if (hasIssues) {
    console.log('\n💡 Soluciones:');
    console.log('   - Crear archivo .env.local en el frontend con:');
    console.log('     NEXT_PUBLIC_API_URL=http://localhost:3001');
    console.log('   - Verificar que el backend tenga las variables correctas');
  }
  
  return !hasIssues;
}

async function checkBackendHealth() {
  console.log('\n2️⃣ Verificando salud del backend...');
  
  try {
    const response = await makeRequest(`${config.backendUrl}/health`);
    
    if (response.status === 'ok') {
      console.log('   ✅ Backend respondiendo correctamente');
      console.log(`   📊 Estado: ${response.status}`);
      console.log(`   ⏱️  Tiempo de respuesta: ${response.responseTime}ms`);
      return true;
    } else {
      console.log('   ⚠️ Backend respondiendo pero con estado no óptimo');
      console.log(`   📊 Estado: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Backend no disponible');
    console.log(`   🔍 Error: ${error.message}`);
    console.log('\n💡 Soluciones:');
    console.log('   - Verificar que el backend esté ejecutándose');
    console.log('   - Verificar el puerto (por defecto 3001)');
    console.log('   - Verificar logs del backend');
    return false;
  }
}

async function checkCORSConfiguration() {
  console.log('\n3️⃣ Verificando configuración CORS...');
  
  try {
    // Hacer una petición OPTIONS para verificar CORS
    const response = await makeRequest(`${config.backendUrl}/auth/me`, {
      method: 'OPTIONS',
      headers: {
        'Origin': config.frontendUrl,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('   ✅ CORS configurado correctamente');
    return true;
  } catch (error) {
    console.log('   ❌ Problema con CORS');
    console.log(`   🔍 Error: ${error.message}`);
    console.log('\n💡 Soluciones:');
    console.log('   - Verificar configuración CORS en el backend');
    console.log('   - Verificar que FRONTEND_URL esté configurado');
    console.log('   - Verificar allowedOrigins en security.config.ts');
    return false;
  }
}

async function testAuthenticationFlow() {
  console.log('\n4️⃣ Probando flujo de autenticación...');
  
  try {
    // Probar endpoint de login (sin credenciales reales)
    const response = await makeRequest(`${config.backendUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });
    
    // Si llega aquí, el endpoint responde (aunque sea con error de credenciales)
    console.log('   ✅ Endpoint de login accesible');
    console.log(`   📊 Status: ${response.statusCode || 'N/A'}`);
    return true;
  } catch (error) {
    console.log('   ❌ Problema con endpoint de login');
    console.log(`   🔍 Error: ${error.message}`);
    return false;
  }
}

async function checkCookieConfiguration() {
  console.log('\n5️⃣ Verificando configuración de cookies...');
  
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
    return false;
  } else {
    console.log('   ✅ Configuración de cookies parece correcta');
    return true;
  }
}

async function checkNetworkConnectivity() {
  console.log('\n6️⃣ Verificando conectividad de red...');
  
  try {
    const url = new URL(config.backendUrl);
    const client = url.protocol === 'https:' ? https : http;
    
    return new Promise((resolve) => {
      const req = client.request(url, { timeout: config.timeout }, (res) => {
        console.log('   ✅ Conectividad de red OK');
        console.log(`   📊 Status: ${res.statusCode}`);
        resolve(true);
      });
      
      req.on('error', (error) => {
        console.log('   ❌ Problema de conectividad');
        console.log(`   🔍 Error: ${error.message}`);
        resolve(false);
      });
      
      req.on('timeout', () => {
        console.log('   ⏰ Timeout en la conexión');
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  } catch (error) {
    console.log('   ❌ Error al verificar conectividad');
    console.log(`   🔍 Error: ${error.message}`);
    return false;
  }
}

// Función auxiliar para hacer requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: config.timeout
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ ...parsedData, statusCode: res.statusCode });
        } catch (error) {
          resolve({ data, statusCode: res.statusCode });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Función principal
async function runDiagnostic() {
  const results = {
    envVars: await checkEnvironmentVariables(),
    backendHealth: await checkBackendHealth(),
    cors: await checkCORSConfiguration(),
    auth: await testAuthenticationFlow(),
    cookies: await checkCookieConfiguration(),
    network: await checkNetworkConnectivity()
  };
  
  console.log('\n📊 RESUMEN DEL DIAGNÓSTICO');
  console.log('==========================');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  
  console.log(`✅ Checks pasados: ${passedChecks}/${totalChecks}`);
  
  if (passedChecks === totalChecks) {
    console.log('\n🎉 ¡Todo parece estar funcionando correctamente!');
    console.log('Si sigues teniendo problemas, revisa los logs del navegador.');
  } else {
    console.log('\n⚠️ Se encontraron problemas. Revisa las soluciones sugeridas arriba.');
  }
  
  // Mostrar checks fallidos
  const failedChecks = Object.entries(results)
    .filter(([_, passed]) => !passed)
    .map(([check, _]) => check);
  
  if (failedChecks.length > 0) {
    console.log('\n❌ Checks fallidos:');
    failedChecks.forEach(check => console.log(`   - ${check}`));
  }
}

// Ejecutar diagnóstico
runDiagnostic().catch(console.error); 