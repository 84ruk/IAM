const { PrismaClient } = require('@prisma/client');
const Redis = require('redis');

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

async function testPrismaConnection() {
  await log('\n🗄️ Testing Prisma Database Connection...', 'blue');
  
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    await prisma.$connect();
    await log('✅ Prisma connection successful', 'green');
    
    // Test basic queries
    const empresaCount = await prisma.empresa.count();
    await log(`✅ Empresas count: ${empresaCount}`, 'green');
    
    const usuarioCount = await prisma.usuario.count();
    await log(`✅ Usuarios count: ${usuarioCount}`, 'green');
    
    const productoCount = await prisma.producto.count();
    await log(`✅ Productos count: ${productoCount}`, 'green');
    
    const movimientoCount = await prisma.movimientoInventario.count();
    await log(`✅ Movimientos count: ${movimientoCount}`, 'green');
    
    // Test complex query
    const productosConStock = await prisma.producto.findMany({
      where: { stock: { gt: 0 } },
      select: { id: true, nombre: true, stock: true },
      take: 5
    });
    await log(`✅ Productos con stock: ${productosConStock.length}`, 'green');
    
    // Test transaction
    await prisma.$transaction(async (tx) => {
      const testEmpresa = await tx.empresa.create({
        data: {
          nombre: 'Empresa Test DB',
          TipoIndustria: 'GENERICA',
          emailContacto: 'test@db.com'
        }
      });
      await log(`✅ Transaction test successful - Created empresa: ${testEmpresa.id}`, 'green');
      
      // Clean up
      await tx.empresa.delete({ where: { id: testEmpresa.id } });
      await log('✅ Cleanup successful', 'green');
    });
    
    return true;
  } catch (error) {
    await log(`❌ Prisma connection failed: ${error.message}`, 'red');
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function testRedisConnection() {
  await log('\n🔴 Testing Redis Connection...', 'blue');
  
  const redis = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  
  try {
    await redis.connect();
    await log('✅ Redis connection successful', 'green');
    
    // Test basic operations
    await redis.set('test:key', 'test:value');
    const value = await redis.get('test:key');
    
    if (value === 'test:value') {
      await log('✅ Redis read/write test successful', 'green');
    } else {
      await log('❌ Redis read/write test failed', 'red');
    }
    
    // Test cache operations
    await redis.setex('test:cache', 60, JSON.stringify({ data: 'test' }));
    const cached = await redis.get('test:cache');
    
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.data === 'test') {
        await log('✅ Redis cache test successful', 'green');
      } else {
        await log('❌ Redis cache test failed', 'red');
      }
    }
    
    // Cleanup
    await redis.del('test:key', 'test:cache');
    await log('✅ Redis cleanup successful', 'green');
    
    return true;
  } catch (error) {
    await log(`❌ Redis connection failed: ${error.message}`, 'red');
    return false;
  } finally {
    await redis.disconnect();
  }
}

async function testDatabasePerformance() {
  await log('\n⚡ Testing Database Performance...', 'blue');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // Test query performance
    const startTime = Date.now();
    const productos = await prisma.producto.findMany({
      include: {
        movimientos: {
          take: 10,
          orderBy: { fecha: 'desc' }
        }
      },
      take: 100
    });
    const endTime = Date.now();
    
    const queryTime = endTime - startTime;
    await log(`✅ Query performance: ${queryTime}ms for ${productos.length} productos`, 'green');
    
    if (queryTime < 1000) {
      await log('✅ Performance is acceptable (< 1s)', 'green');
    } else {
      await log('⚠️ Performance is slow (> 1s)', 'yellow');
    }
    
    // Test concurrent queries
    const concurrentStart = Date.now();
    const promises = Array(10).fill().map(() => 
      prisma.producto.count()
    );
    
    await Promise.all(promises);
    const concurrentEnd = Date.now();
    
    const concurrentTime = concurrentEnd - concurrentStart;
    await log(`✅ Concurrent queries: ${concurrentTime}ms for 10 queries`, 'green');
    
    return true;
  } catch (error) {
    await log(`❌ Performance test failed: ${error.message}`, 'red');
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function testDatabaseIntegrity() {
  await log('\n🔍 Testing Database Integrity...', 'blue');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // Check foreign key constraints
    const empresasConUsuarios = await prisma.empresa.findMany({
      include: { usuarios: true }
    });
    
    let integrityIssues = 0;
    
    for (const empresa of empresasConUsuarios) {
      for (const usuario of empresa.usuarios) {
        if (usuario.empresaId !== empresa.id) {
          integrityIssues++;
          await log(`❌ Integrity issue: Usuario ${usuario.id} has wrong empresaId`, 'red');
        }
      }
    }
    
    if (integrityIssues === 0) {
      await log('✅ Foreign key integrity check passed', 'green');
    } else {
      await log(`❌ Found ${integrityIssues} integrity issues`, 'red');
    }
    
    // Check data consistency
    const productosSinStock = await prisma.producto.findMany({
      where: { stock: { lt: 0 } }
    });
    
    if (productosSinStock.length === 0) {
      await log('✅ No products with negative stock', 'green');
    } else {
      await log(`⚠️ Found ${productosSinStock.length} products with negative stock`, 'yellow');
    }
    
    return integrityIssues === 0;
  } catch (error) {
    await log(`❌ Integrity test failed: ${error.message}`, 'red');
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function runAllDatabaseTests() {
  await log('🚀 Starting Database Connection Tests...', 'bold');
  
  const results = {
    prisma: false,
    redis: false,
    performance: false,
    integrity: false
  };
  
  try {
    results.prisma = await testPrismaConnection();
    results.redis = await testRedisConnection();
    results.performance = await testDatabasePerformance();
    results.integrity = await testDatabaseIntegrity();
    
    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
      await log('\n🎉 All database tests passed!', 'green');
    } else {
      await log('\n⚠️ Some database tests failed', 'yellow');
      Object.entries(results).forEach(([test, passed]) => {
        const status = passed ? '✅' : '❌';
        const color = passed ? 'green' : 'red';
        log(`${status} ${test}: ${passed ? 'PASSED' : 'FAILED'}`, color);
      });
    }
    
    return allPassed;
  } catch (error) {
    await log(`\n💥 Database test suite failed: ${error.message}`, 'red');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllDatabaseTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runAllDatabaseTests }; 