const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const Redis = require('redis');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

async function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkApiHealth() {
  await log('\n🏥 Checking API Health...', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    
    if (response.status === 200) {
      await log('✅ API is running and healthy', 'green');
      return { status: 'healthy', data: response.data };
    } else {
      await log(`❌ API returned status ${response.status}`, 'red');
      return { status: 'unhealthy', error: `Status ${response.status}` };
    }
  } catch (error) {
    await log(`❌ API health check failed: ${error.message}`, 'red');
    return { status: 'unhealthy', error: error.message };
  }
}

async function checkDatabaseHealth() {
  await log('\n🗄️ Checking Database Health...', 'blue');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // Test basic connectivity
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    await log(`✅ Database connection: ${responseTime}ms`, 'green');
    
    // Check table counts
    const counts = await Promise.all([
      prisma.empresa.count(),
      prisma.usuario.count(),
      prisma.producto.count(),
      prisma.movimientoInventario.count(),
      prisma.sensorLectura.count()
    ]);
    
    await log(`✅ Database tables accessible:`, 'green');
    await log(`   - Empresas: ${counts[0]}`, 'green');
    await log(`   - Usuarios: ${counts[1]}`, 'green');
    await log(`   - Productos: ${counts[2]}`, 'green');
    await log(`   - Movimientos: ${counts[3]}`, 'green');
    await log(`   - Sensor Lecturas: ${counts[4]}`, 'green');
    
    return { status: 'healthy', responseTime, counts };
  } catch (error) {
    await log(`❌ Database health check failed: ${error.message}`, 'red');
    return { status: 'unhealthy', error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

async function checkRedisHealth() {
  await log('\n🔴 Checking Redis Health...', 'blue');
  
  const redis = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  
  try {
    await redis.connect();
    
    const startTime = Date.now();
    await redis.ping();
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    await log(`✅ Redis connection: ${responseTime}ms`, 'green');
    
    // Test cache operations
    await redis.setex('health:test', 10, 'ok');
    const value = await redis.get('health:test');
    
    if (value === 'ok') {
      await log('✅ Redis cache operations working', 'green');
    } else {
      await log('❌ Redis cache operations failed', 'red');
    }
    
    await redis.del('health:test');
    
    return { status: 'healthy', responseTime };
  } catch (error) {
    await log(`❌ Redis health check failed: ${error.message}`, 'red');
    return { status: 'unhealthy', error: error.message };
  } finally {
    await redis.disconnect();
  }
}

async function checkEndpointsHealth() {
  await log('\n🔗 Checking Endpoints Health...', 'blue');
  
  const endpoints = [
    { path: '/health', method: 'GET', expectedStatus: 200 },
    { path: '/health/detailed', method: 'GET', expectedStatus: 200 },
    { path: '/health/database', method: 'GET', expectedStatus: 200 },
    { path: '/health/redis', method: 'GET', expectedStatus: 200 },
    { path: '/auth/login', method: 'POST', expectedStatus: 400, data: {} }, // Should fail with invalid data
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const config = {
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.path}`,
        ...(endpoint.data && { data: endpoint.data })
      };
      
      const response = await axios(config);
      
      if (response.status === endpoint.expectedStatus) {
        await log(`✅ ${endpoint.method} ${endpoint.path} - ${response.status}`, 'green');
        results.push({ endpoint: endpoint.path, status: 'healthy' });
      } else {
        await log(`❌ ${endpoint.method} ${endpoint.path} - Expected ${endpoint.expectedStatus}, got ${response.status}`, 'red');
        results.push({ endpoint: endpoint.path, status: 'unhealthy' });
      }
    } catch (error) {
      if (error.response && error.response.status === endpoint.expectedStatus) {
        await log(`✅ ${endpoint.method} ${endpoint.path} - ${error.response.status} (Expected)`, 'green');
        results.push({ endpoint: endpoint.path, status: 'healthy' });
      } else {
        await log(`❌ ${endpoint.method} ${endpoint.path} - ${error.response?.status || 'Network Error'}`, 'red');
        results.push({ endpoint: endpoint.path, status: 'unhealthy' });
      }
    }
  }
  
  return results;
}

async function checkSystemResources() {
  await log('\n💻 Checking System Resources...', 'blue');
  
  const os = require('os');
  
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  
  const loadAverage = os.loadavg();
  const cpuCount = os.cpus().length;
  
  await log(`✅ Memory Usage: ${Math.round(memoryUsage)}% (${Math.round(usedMemory / 1024 / 1024)}MB / ${Math.round(totalMemory / 1024 / 1024)}MB)`, 'green');
  await log(`✅ CPU Load: ${loadAverage[0].toFixed(2)} (${cpuCount} cores)`, 'green');
  
  if (memoryUsage > 90) {
    await log('⚠️ High memory usage detected', 'yellow');
  }
  
  if (loadAverage[0] > cpuCount) {
    await log('⚠️ High CPU load detected', 'yellow');
  }
  
  return {
    memoryUsage,
    cpuLoad: loadAverage[0],
    cpuCount,
    status: memoryUsage < 90 && loadAverage[0] < cpuCount ? 'healthy' : 'warning'
  };
}

async function generateHealthReport() {
  await log('🚀 Starting Comprehensive Health Check...', 'bold');
  await log(`Target: ${BASE_URL}`, 'yellow');
  
  const report = {
    timestamp: new Date().toISOString(),
    api: null,
    database: null,
    redis: null,
    endpoints: null,
    system: null,
    overall: 'unknown'
  };
  
  try {
    // Run all health checks
    const [apiHealth, dbHealth, redisHealth, endpointsHealth, systemHealth] = await Promise.all([
      checkApiHealth(),
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkEndpointsHealth(),
      checkSystemResources()
    ]);
    
    report.api = apiHealth;
    report.database = dbHealth;
    report.redis = redisHealth;
    report.endpoints = endpointsHealth;
    report.system = systemHealth;
    
    // Determine overall health
    const allHealthy = [
      apiHealth.status === 'healthy',
      dbHealth.status === 'healthy',
      redisHealth.status === 'healthy',
      systemHealth.status === 'healthy'
    ].every(Boolean);
    
    const endpointsHealthy = endpointsHealth.filter(e => e.status === 'healthy').length / endpointsHealth.length > 0.8;
    
    if (allHealthy && endpointsHealthy) {
      report.overall = 'healthy';
      await log('\n🎉 Overall Health Status: HEALTHY', 'green');
    } else {
      report.overall = 'unhealthy';
      await log('\n⚠️ Overall Health Status: UNHEALTHY', 'red');
    }
    
    // Print summary
    await log('\n📊 Health Check Summary:', 'bold');
    await log(`API: ${apiHealth.status === 'healthy' ? '✅' : '❌'} ${apiHealth.status}`, apiHealth.status === 'healthy' ? 'green' : 'red');
    await log(`Database: ${dbHealth.status === 'healthy' ? '✅' : '❌'} ${dbHealth.status}`, dbHealth.status === 'healthy' ? 'green' : 'red');
    await log(`Redis: ${redisHealth.status === 'healthy' ? '✅' : '❌'} ${redisHealth.status}`, redisHealth.status === 'healthy' ? 'green' : 'red');
    await log(`System: ${systemHealth.status === 'healthy' ? '✅' : '❌'} ${systemHealth.status}`, systemHealth.status === 'healthy' ? 'green' : 'red');
    
    const healthyEndpoints = endpointsHealth.filter(e => e.status === 'healthy').length;
    await log(`Endpoints: ${healthyEndpoints}/${endpointsHealth.length} healthy`, healthyEndpoints === endpointsHealth.length ? 'green' : 'yellow');
    
    return report;
  } catch (error) {
    await log(`\n💥 Health check failed: ${error.message}`, 'red');
    report.overall = 'error';
    return report;
  }
}

// Run health check if this file is executed directly
if (require.main === module) {
  generateHealthReport().then(report => {
    process.exit(report.overall === 'healthy' ? 0 : 1);
  });
}

module.exports = { generateHealthReport }; 