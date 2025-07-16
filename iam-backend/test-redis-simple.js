const { createClient } = require('redis');

async function testRedisConnection() {
  console.log('🧪 Probando conexión a Redis...\n');

  const redis = createClient({
    socket: {
      host: 'localhost',
      port: 6379,
    },
  });

  try {
    // Conectar a Redis
    await redis.connect();
    console.log('✅ Conexión a Redis exitosa\n');

    // Probar operaciones básicas
    console.log('1️⃣ Probando operaciones básicas...');
    
    // Set y Get
    await redis.setEx('test:key', 60, 'test-value');
    const value = await redis.get('test:key');
    console.log(`✅ Set/Get: ${value}`);

    // Delete
    await redis.del('test:key');
    const deletedValue = await redis.get('test:key');
    console.log(`✅ Delete: ${deletedValue === null ? 'success' : 'failed'}`);

    // Probar con JSON
    const testData = {
      totalProductos: 100,
      productosStockBajo: 5,
      timestamp: new Date().toISOString()
    };

    await redis.setEx('test:kpi:empresa:1', 300, JSON.stringify(testData));
    const cachedData = await redis.get('test:kpi:empresa:1');
    const parsedData = JSON.parse(cachedData);
    console.log(`✅ JSON Cache: ${parsedData.totalProductos} productos`);

    // Limpiar datos de prueba
    await redis.del('test:kpi:empresa:1');

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

    console.log('\n🎉 ¡Redis está funcionando correctamente!');
    console.log('\n📋 Resumen:');
    console.log('✅ Conexión establecida');
    console.log('✅ Operaciones básicas funcionando');
    console.log('✅ Cache JSON funcionando');
    console.log('✅ Estadísticas disponibles');

  } catch (error) {
    console.error('❌ Error conectando a Redis:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Sugerencia: Asegúrate de que Redis esté ejecutándose:');
      console.log('   brew services start redis');
    }
  } finally {
    await redis.quit();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar prueba
testRedisConnection(); 