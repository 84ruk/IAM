#!/usr/bin/env node

/**
 * Script para probar que los health checks ya no están sujetos al rate limiting
 * 
 * Este script hace múltiples peticiones al endpoint /health para verificar que:
 * 1. Los health checks funcionan correctamente
 * 2. No generan logs de rate limiting
 * 3. El rate limiting sigue funcionando para otros endpoints
 */

const http = require('http');
const https = require('https');

// Configuración
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const HEALTH_ENDPOINT = '/health';
const PROTECTED_ENDPOINT = '/api/test'; // Endpoint protegido para probar rate limiting

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Health-Check-Test/1.0',
        'Accept': 'application/json'
      },
      ...options
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testHealthChecks() {
  log('\n🔍 Iniciando pruebas de health checks...', 'blue');
  
  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    rateLimited: 0,
    responseTimes: []
  };

  log(`\n📊 Haciendo 150 peticiones a ${BACKEND_URL}${HEALTH_ENDPOINT}...`, 'yellow');
  
  for (let i = 1; i <= 150; i++) {
    const startTime = Date.now();
    
    try {
      const response = await makeRequest(`${BACKEND_URL}${HEALTH_ENDPOINT}`);
      const responseTime = Date.now() - startTime;
      
      results.total++;
      results.responseTimes.push(responseTime);
      
      if (response.statusCode === 200) {
        results.successful++;
        if (i % 25 === 0) {
          log(`✅ Petición ${i}/150 exitosa (${responseTime}ms)`, 'green');
        }
      } else if (response.statusCode === 429) {
        results.rateLimited++;
        log(`❌ Petición ${i}/150 rate limited (${responseTime}ms)`, 'red');
      } else {
        results.failed++;
        log(`⚠️  Petición ${i}/150 falló con status ${response.statusCode}`, 'yellow');
      }
    } catch (error) {
      results.total++;
      results.failed++;
      log(`❌ Petición ${i}/150 error: ${error.message}`, 'red');
    }
    
    // Pequeña pausa entre peticiones
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return results;
}

async function testProtectedEndpoint() {
  log(`\n🔒 Probando rate limiting en endpoint protegido...`, 'blue');
  
  const results = {
    total: 0,
    successful: 0,
    rateLimited: 0,
    failed: 0
  };

  log(`\n📊 Haciendo 150 peticiones a ${BACKEND_URL}${PROTECTED_ENDPOINT}...`, 'yellow');
  
  for (let i = 1; i <= 150; i++) {
    try {
      const response = await makeRequest(`${BACKEND_URL}${PROTECTED_ENDPOINT}`);
      
      results.total++;
      
      if (response.statusCode === 200) {
        results.successful++;
        if (i % 25 === 0) {
          log(`✅ Petición ${i}/150 exitosa`, 'green');
        }
      } else if (response.statusCode === 429) {
        results.rateLimited++;
        log(`🚫 Petición ${i}/150 rate limited (esperado)`, 'yellow');
      } else {
        results.failed++;
        log(`⚠️  Petición ${i}/150 falló con status ${response.statusCode}`, 'yellow');
      }
    } catch (error) {
      results.total++;
      results.failed++;
      log(`❌ Petición ${i}/150 error: ${error.message}`, 'red');
    }
    
    // Pequeña pausa entre peticiones
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return results;
}

function printResults(healthResults, protectedResults) {
  log('\n' + '='.repeat(60), 'bold');
  log('📋 RESULTADOS DE LAS PRUEBAS', 'bold');
  log('='.repeat(60), 'bold');
  
  // Resultados de health checks
  log('\n🏥 HEALTH CHECKS:', 'blue');
  log(`   Total de peticiones: ${healthResults.total}`, 'reset');
  log(`   ✅ Exitosas: ${healthResults.successful}`, 'green');
  log(`   ❌ Fallidas: ${healthResults.failed}`, 'red');
  log(`   🚫 Rate Limited: ${healthResults.rateLimited}`, 'yellow');
  
  if (healthResults.responseTimes.length > 0) {
    const avgResponseTime = Math.round(
      healthResults.responseTimes.reduce((a, b) => a + b, 0) / healthResults.responseTimes.length
    );
    log(`   ⏱️  Tiempo promedio de respuesta: ${avgResponseTime}ms`, 'reset');
  }
  
  // Resultados de endpoint protegido
  log('\n🔒 ENDPOINT PROTEGIDO:', 'blue');
  log(`   Total de peticiones: ${protectedResults.total}`, 'reset');
  log(`   ✅ Exitosas: ${protectedResults.successful}`, 'green');
  log(`   ❌ Fallidas: ${protectedResults.failed}`, 'red');
  log(`   🚫 Rate Limited: ${protectedResults.rateLimited}`, 'yellow');
  
  // Análisis
  log('\n📊 ANÁLISIS:', 'blue');
  
  if (healthResults.rateLimited === 0) {
    log('   ✅ Health checks NO están sujetos al rate limiting (CORRECTO)', 'green');
  } else {
    log(`   ❌ Health checks SÍ están sujetos al rate limiting (INCORRECTO)`, 'red');
    log(`      ${healthResults.rateLimited} peticiones fueron rate limited`, 'red');
  }
  
  if (protectedResults.rateLimited > 0) {
    log('   ✅ Rate limiting funciona correctamente en endpoints protegidos', 'green');
  } else {
    log('   ⚠️  Rate limiting no se activó en endpoints protegidos', 'yellow');
  }
  
  // Recomendaciones
  log('\n💡 RECOMENDACIONES:', 'blue');
  
  if (healthResults.rateLimited === 0 && protectedResults.rateLimited > 0) {
    log('   🎉 La solución está funcionando correctamente!', 'green');
    log('   📝 Los health checks ya no generan logs de rate limiting', 'green');
    log('   🛡️  El rate limiting sigue protegiendo endpoints sensibles', 'green');
  } else if (healthResults.rateLimited > 0) {
    log('   🔧 Revisar la configuración del SecurityMiddleware', 'yellow');
    log('   📝 Verificar que /health esté excluido del rate limiting', 'yellow');
  } else {
    log('   🔧 Revisar la configuración general de rate limiting', 'yellow');
  }
  
  log('\n' + '='.repeat(60), 'bold');
}

async function main() {
  try {
    log('🚀 Iniciando pruebas de rate limiting para health checks...', 'bold');
    log(`📍 Backend URL: ${BACKEND_URL}`, 'reset');
    
    // Probar health checks
    const healthResults = await testHealthChecks();
    
    // Probar endpoint protegido
    const protectedResults = await testProtectedEndpoint();
    
    // Mostrar resultados
    printResults(healthResults, protectedResults);
    
  } catch (error) {
    log(`\n❌ Error durante las pruebas: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  testHealthChecks,
  testProtectedEndpoint,
  makeRequest
}; 