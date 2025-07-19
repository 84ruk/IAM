#!/usr/bin/env node

/**
 * 🚀 Performance Test Script para Dashboard CQRS
 * Este script ejecuta tests de performance para todos los endpoints del dashboard
 */

const axios = require('axios');

// Configuración
const config = {
  baseURL: process.env.API_URL || 'http://localhost:3000',
  token: process.env.TEST_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbCI6IkFETUlOIiwiaWQiOjEsImVtcHJlc2FJZCI6MSwiaWF0IjoxNjM0NTY3ODkwLCJleHAiOjE2MzQ2NTQyOTB9.mock-signature',
  requestsPerEndpoint: parseInt(process.env.REQUESTS_PER_ENDPOINT) || 20,
  timeout: parseInt(process.env.TIMEOUT) || 5000,
  concurrentRequests: parseInt(process.env.CONCURRENT_REQUESTS) || 5
};

// Endpoints a testear
const endpoints = [
  {
    path: '/dashboard-cqrs/kpis',
    name: 'KPIs Básicos',
    expectedTime: 200
  },
  {
    path: '/dashboard-cqrs/financial-kpis',
    name: 'KPIs Financieros',
    expectedTime: 300
  },
  {
    path: '/dashboard-cqrs/industry-kpis?industry=ALIMENTOS',
    name: 'KPIs por Industria (Alimentos)',
    expectedTime: 400
  },
  {
    path: '/dashboard-cqrs/predictive-kpis',
    name: 'KPIs Predictivos',
    expectedTime: 500
  },
  {
    path: '/dashboard-cqrs/data',
    name: 'Datos Completos',
    expectedTime: 800
  },
  {
    path: '/dashboard-cqrs/cache/stats',
    name: 'Estadísticas de Cache',
    expectedTime: 100
  }
];

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSection(message) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`  ${message}`, 'blue');
  log(`${'-'.repeat(40)}`, 'blue');
}

// Función para hacer una petición HTTP
async function makeRequest(endpoint, requestNumber) {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${config.baseURL}${endpoint.path}`, {
      headers: { 
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      timeout: config.timeout
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      success: true,
      responseTime,
      statusCode: response.status,
      dataSize: JSON.stringify(response.data).length,
      requestNumber
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      success: false,
      responseTime,
      error: error.message,
      statusCode: error.response?.status || 0,
      requestNumber
    };
  }
}

// Función para ejecutar tests secuenciales
async function runSequentialTests(endpoint) {
  logSection(`Testing ${endpoint.name} (Secuencial)`);
  
  const results = [];
  
  for (let i = 0; i < config.requestsPerEndpoint; i++) {
    const result = await makeRequest(endpoint, i + 1);
    results.push(result);
    
    // Mostrar progreso
    if ((i + 1) % 5 === 0) {
      log(`  Progreso: ${i + 1}/${config.requestsPerEndpoint}`, 'yellow');
    }
  }
  
  return results;
}

// Función para ejecutar tests concurrentes
async function runConcurrentTests(endpoint) {
  logSection(`Testing ${endpoint.name} (Concurrente)`);
  
  const batches = [];
  const results = [];
  
  // Dividir requests en batches
  for (let i = 0; i < config.requestsPerEndpoint; i += config.concurrentRequests) {
    const batch = [];
    for (let j = 0; j < config.concurrentRequests && i + j < config.requestsPerEndpoint; j++) {
      batch.push(makeRequest(endpoint, i + j + 1));
    }
    batches.push(batch);
  }
  
  // Ejecutar batches
  for (let i = 0; i < batches.length; i++) {
    const batchStart = Date.now();
    const batchResults = await Promise.all(batches[i]);
    const batchEnd = Date.now();
    
    results.push(...batchResults);
    
    log(`  Batch ${i + 1}/${batches.length}: ${batchEnd - batchStart}ms`, 'yellow');
  }
  
  return results;
}

// Función para analizar resultados
function analyzeResults(results, endpoint) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length === 0) {
    return {
      success: false,
      message: 'Todos los requests fallaron'
    };
  }
  
  const responseTimes = successful.map(r => r.responseTime);
  const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minTime = Math.min(...responseTimes);
  const maxTime = Math.max(...responseTimes);
  const medianTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)];
  
  // Calcular percentiles
  const sortedTimes = responseTimes.sort((a, b) => a - b);
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
  
  // Calcular throughput
  const totalTime = maxTime - minTime;
  const throughput = successful.length / (totalTime / 1000); // requests per second
  
  // Evaluar performance
  const performanceScore = avgTime <= endpoint.expectedTime ? 'EXCELENTE' : 
                          avgTime <= endpoint.expectedTime * 1.5 ? 'BUENA' :
                          avgTime <= endpoint.expectedTime * 2 ? 'ACEPTABLE' : 'POOR';
  
  return {
    success: true,
    totalRequests: results.length,
    successfulRequests: successful.length,
    failedRequests: failed.length,
    successRate: (successful.length / results.length * 100).toFixed(2),
    avgTime: avgTime.toFixed(2),
    minTime: minTime.toFixed(2),
    maxTime: maxTime.toFixed(2),
    medianTime: medianTime.toFixed(2),
    p95: p95.toFixed(2),
    p99: p99.toFixed(2),
    throughput: throughput.toFixed(2),
    performanceScore,
    expectedTime: endpoint.expectedTime,
    avgDataSize: successful.length > 0 ? 
      (successful.reduce((sum, r) => sum + r.dataSize, 0) / successful.length).toFixed(0) : 0
  };
}

// Función para mostrar resultados
function displayResults(analysis, endpoint, testType) {
  logSection(`Resultados: ${endpoint.name} (${testType})`);
  
  if (!analysis.success) {
    log(`❌ ${analysis.message}`, 'red');
    return;
  }
  
  // Métricas básicas
  log(`📊 Métricas Básicas:`, 'bright');
  log(`  Total Requests: ${analysis.totalRequests}`, 'cyan');
  log(`  Successful: ${analysis.successfulRequests}`, 'green');
  log(`  Failed: ${analysis.failedRequests}`, 'red');
  log(`  Success Rate: ${analysis.successRate}%`, analysis.successRate >= 95 ? 'green' : 'yellow');
  
  // Tiempos de respuesta
  log(`\n⏱️  Tiempos de Respuesta:`, 'bright');
  log(`  Average: ${analysis.avgTime}ms`, analysis.avgTime <= analysis.expectedTime ? 'green' : 'yellow');
  log(`  Median: ${analysis.medianTime}ms`, 'cyan');
  log(`  Min: ${analysis.minTime}ms`, 'green');
  log(`  Max: ${analysis.maxTime}ms`, 'yellow');
  log(`  95th Percentile: ${analysis.p95}ms`, 'cyan');
  log(`  99th Percentile: ${analysis.p99}ms`, 'cyan');
  log(`  Expected: ${analysis.expectedTime}ms`, 'blue');
  
  // Performance
  log(`\n🚀 Performance:`, 'bright');
  log(`  Score: ${analysis.performanceScore}`, 
      analysis.performanceScore === 'EXCELENTE' ? 'green' : 
      analysis.performanceScore === 'BUENA' ? 'yellow' : 'red');
  log(`  Throughput: ${analysis.throughput} req/s`, 'cyan');
  log(`  Avg Data Size: ${analysis.avgDataSize} bytes`, 'cyan');
  
  // Evaluación
  log(`\n📈 Evaluación:`, 'bright');
  if (analysis.avgTime <= analysis.expectedTime) {
    log(`  ✅ Performance dentro del rango esperado`, 'green');
  } else {
    log(`  ⚠️  Performance por debajo del esperado`, 'yellow');
    log(`     Diferencia: +${(analysis.avgTime - analysis.expectedTime).toFixed(2)}ms`, 'yellow');
  }
  
  if (analysis.successRate >= 99) {
    log(`  ✅ Alta confiabilidad`, 'green');
  } else if (analysis.successRate >= 95) {
    log(`  ⚠️  Confiabilidad aceptable`, 'yellow');
  } else {
    log(`  ❌ Baja confiabilidad`, 'red');
  }
}

// Función principal
async function runPerformanceTests() {
  logHeader('🚀 DASHBOARD CQRS - PERFORMANCE TESTS');
  
  log(`Configuración:`, 'bright');
  log(`  Base URL: ${config.baseURL}`, 'cyan');
  log(`  Requests por endpoint: ${config.requestsPerEndpoint}`, 'cyan');
  log(`  Requests concurrentes: ${config.concurrentRequests}`, 'cyan');
  log(`  Timeout: ${config.timeout}ms`, 'cyan');
  
  const allResults = {
    sequential: {},
    concurrent: {},
    summary: {
      totalEndpoints: endpoints.length,
      totalRequests: endpoints.length * config.requestsPerEndpoint * 2, // sequential + concurrent
      startTime: new Date(),
      endTime: null
    }
  };
  
  try {
    // Test 1: Requests secuenciales
    logHeader('📊 TEST 1: REQUESTS SECUENCIALES');
    
    for (const endpoint of endpoints) {
      const results = await runSequentialTests(endpoint);
      const analysis = analyzeResults(results, endpoint);
      allResults.sequential[endpoint.path] = analysis;
      displayResults(analysis, endpoint, 'Secuencial');
    }
    
    // Test 2: Requests concurrentes
    logHeader('📊 TEST 2: REQUESTS CONCURRENTES');
    
    for (const endpoint of endpoints) {
      const results = await runConcurrentTests(endpoint);
      const analysis = analyzeResults(results, endpoint);
      allResults.concurrent[endpoint.path] = analysis;
      displayResults(analysis, endpoint, 'Concurrente');
    }
    
    // Resumen final
    allResults.summary.endTime = new Date();
    displayFinalSummary(allResults);
    
  } catch (error) {
    log(`❌ Error durante los tests: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Función para mostrar resumen final
function displayFinalSummary(results) {
  logHeader('📋 RESUMEN FINAL');
  
  const duration = results.summary.endTime - results.summary.startTime;
  
  log(`⏱️  Duración Total: ${(duration / 1000).toFixed(2)}s`, 'bright');
  log(`🎯 Total Endpoints: ${results.summary.totalEndpoints}`, 'cyan');
  log(`📊 Total Requests: ${results.summary.totalRequests}`, 'cyan');
  
  // Análisis por endpoint
  log(`\n📈 Análisis por Endpoint:`, 'bright');
  
  const endpointAnalysis = [];
  
  for (const endpoint of endpoints) {
    const sequential = results.sequential[endpoint.path];
    const concurrent = results.concurrent[endpoint.path];
    
    if (sequential && concurrent) {
      endpointAnalysis.push({
        name: endpoint.name,
        path: endpoint.path,
        sequential: sequential,
        concurrent: concurrent,
        improvement: ((sequential.avgTime - concurrent.avgTime) / sequential.avgTime * 100).toFixed(2)
      });
    }
  }
  
  // Mostrar tabla de resultados
  log(`\n${'Endpoint'.padEnd(30)} | ${'Secuencial'.padEnd(12)} | ${'Concurrente'.padEnd(12)} | ${'Mejora'.padEnd(8)} | ${'Score'.padEnd(10)}`);
  log(`${'-'.repeat(30)}-+-${'-'.repeat(12)}-+-${'-'.repeat(12)}-+-${'-'.repeat(8)}-+-${'-'.repeat(10)}`);
  
  endpointAnalysis.forEach(analysis => {
    const score = analysis.concurrent.performanceScore;
    const scoreColor = score === 'EXCELENTE' ? 'green' : score === 'BUENA' ? 'yellow' : 'red';
    
    log(`${analysis.name.substring(0, 29).padEnd(30)} | ${analysis.sequential.avgTime.padEnd(12)} | ${analysis.concurrent.avgTime.padEnd(12)} | ${analysis.improvement.padEnd(8)} | ${score.padEnd(10)}`, scoreColor);
  });
  
  // Recomendaciones
  log(`\n💡 Recomendaciones:`, 'bright');
  
  const slowEndpoints = endpointAnalysis.filter(a => a.concurrent.performanceScore !== 'EXCELENTE');
  if (slowEndpoints.length > 0) {
    log(`  ⚠️  Endpoints que requieren optimización:`, 'yellow');
    slowEndpoints.forEach(endpoint => {
      log(`     - ${endpoint.name}: ${endpoint.concurrent.avgTime}ms (esperado: ${endpoint.concurrent.expectedTime}ms)`, 'yellow');
    });
  } else {
    log(`  ✅ Todos los endpoints tienen performance excelente`, 'green');
  }
  
  const avgImprovement = endpointAnalysis.reduce((sum, a) => sum + parseFloat(a.improvement), 0) / endpointAnalysis.length;
  if (avgImprovement > 0) {
    log(`  🚀 Concurrencia mejora performance en promedio ${avgImprovement.toFixed(2)}%`, 'green');
  }
  
  log(`\n🎉 Performance tests completados exitosamente!`, 'green');
}

// Ejecutar tests si el script se ejecuta directamente
if (require.main === module) {
  runPerformanceTests().catch(error => {
    log(`❌ Error fatal: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runPerformanceTests,
  makeRequest,
  analyzeResults
}; 