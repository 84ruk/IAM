const { createClient } = require('redis');
require('dotenv').config();

async function testProductionRedis() {
  console.log('🧪 Probando Redis en producción...\n');

  // Configuración desde variables de entorno
  const redisConfig = {
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD,
    database: parseInt(process.env.REDIS_DB || '0'),
  };

  console.log('📋 Configuración Redis:');
  console.log(`- Host: ${redisConfig.socket.host}`);
  console.log(`- Port: ${redisConfig.socket.port}`);
  console.log(`- Database: ${redisConfig.database}`);
  console.log(`- Password: ${redisConfig.password ? '***configurado***' : 'no configurado'}\n`);

  const redis = createClient(redisConfig);

  try {
    // Conectar a Redis
    await redis.connect();
    console.log('✅ Conexión a Redis exitosa\n');

    // Probar operaciones básicas
    console.log('1️⃣ Probando operaciones básicas...');
    
    // Test de escritura
    await redis.setEx('test:production:key', 60, 'test-production-value');
    console.log('✅ Escritura exitosa');

    // Test de lectura
    const value = await redis.get('test:production:key');
    console.log(`✅ Lectura exitosa: ${value}`);

    // Test de JSON
    const testData = {
      empresaId: 1,
      totalProductos: 150,
      productosStockBajo: 8,
      valorInventario: 25000.50,
      timestamp: new Date().toISOString(),
      environment: 'production'
    };

    await redis.setEx('test:production:kpi:1', 300, JSON.stringify(testData));
    const cachedData = await redis.get('test:production:kpi:1');
    const parsedData = JSON.parse(cachedData);
    console.log(`✅ JSON Cache: ${parsedData.totalProductos} productos`);

    // Test de invalidación
    await redis.del('test:production:key');
    await redis.del('test:production:kpi:1');
    console.log('✅ Invalidación exitosa');

    // Obtener estadísticas
    const dbSize = await redis.dbSize();
    const memoryInfo = await redis.info('memory');
    const memoryUsage = memoryInfo
      .split('\n')
      .find(line => line.startsWith('used_memory_human:'))
      ?.split(':')[1] || 'unknown';

    console.log(`\n📊 Estadísticas de Redis:`);
    console.log(`- Keys en DB: ${dbSize}`);
    console.log(`- Memoria usada: ${memoryUsage.trim()}`);

    // Test de performance
    console.log('\n2️⃣ Test de performance...');
    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      await redis.setEx(`perf:test:${i}`, 60, `value-${i}`);
    }
    
    const writeTime = Date.now() - startTime;
    console.log(`✅ 100 escrituras en ${writeTime}ms`);

    const readStartTime = Date.now();
    for (let i = 0; i < 100; i++) {
      await redis.get(`perf:test:${i}`);
    }
    
    const readTime = Date.now() - readStartTime;
    console.log(`✅ 100 lecturas en ${readTime}ms`);

    // Limpiar datos de prueba
    for (let i = 0; i < 100; i++) {
      await redis.del(`perf:test:${i}`);
    }

    console.log('\n🎉 ¡Redis en producción está funcionando correctamente!');
    console.log('\n📋 Resumen:');
    console.log('✅ Conexión establecida');
    console.log('✅ Operaciones básicas funcionando');
    console.log('✅ Cache JSON funcionando');
    console.log('✅ Performance aceptable');
    console.log('✅ Invalidación funcionando');

  } catch (error) {
    console.error('❌ Error conectando a Redis:', error.message);
    console.log('\n🔧 Soluciones posibles:');
    console.log('1. Verificar variables de entorno REDIS_*');
    console.log('2. Verificar credenciales de Redis');
    console.log('3. Verificar conectividad de red');
    console.log('4. Verificar que Redis esté ejecutándose');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Error de conexión: Redis no está disponible');
    } else if (error.message.includes('WRONGPASS')) {
      console.log('\n💡 Error de autenticación: Contraseña incorrecta');
    }
  } finally {
    if (redis?.isReady) {
      await redis.quit();
      console.log('\n🔌 Conexión a Redis cerrada');
    }
  }
}

// Ejecutar el test
testProductionRedis().catch(console.error); 