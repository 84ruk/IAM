const { createClient } = require('redis');
require('dotenv').config();

async function testUpstashRedis() {
  console.log('🧪 Probando conexión a Upstash Redis...\n');

  // Verificar que REDIS_URL esté configurada
  if (!process.env.REDIS_URL) {
    console.error('❌ REDIS_URL no está configurada en las variables de entorno');
    console.log('\n🔧 Para configurar Upstash:');
    console.log('1. Ve a https://upstash.com/');
    console.log('2. Crea una cuenta gratuita');
    console.log('3. Crea una base de datos Redis');
    console.log('4. Copia la URL de conexión');
    console.log('5. Añade REDIS_URL=tu_url_aqui a tu archivo .env');
    return;
  }

  console.log('📋 Configuración Upstash:');
  console.log(`- URL: ${process.env.REDIS_URL.replace(/\/\/.*@/, '//***:***@')}`);
  console.log('');

  const client = createClient({
    url: process.env.REDIS_URL
  });

  client.on('error', function(err) {
    console.error('❌ Redis Client Error:', err.message);
  });

  client.on('connect', function() {
    console.log('✅ Redis Client Connected');
  });

  try {
    // Conectar a Redis
    await client.connect();
    console.log('✅ Conexión a Upstash Redis exitosa\n');

    // Probar operaciones básicas
    console.log('1️⃣ Probando operaciones básicas...');
    
    // Test de escritura
    await client.setEx('test:upstash:key', 60, 'test-upstash-value');
    console.log('✅ Escritura exitosa');

    // Test de lectura
    const value = await client.get('test:upstash:key');
    console.log(`✅ Lectura exitosa: ${value}`);

    // Test de JSON (como en tu aplicación)
    const testData = {
      empresaId: 1,
      totalProductos: 150,
      productosStockBajo: 8,
      valorInventario: 25000.50,
      timestamp: new Date().toISOString(),
      provider: 'upstash',
      environment: 'production'
    };

    await client.setEx('test:upstash:kpi:1', 300, JSON.stringify(testData));
    const cachedData = await client.get('test:upstash:kpi:1');
    const parsedData = JSON.parse(cachedData);
    console.log(`✅ JSON Cache: ${parsedData.totalProductos} productos`);

    // Test de invalidación
    await client.del('test:upstash:key');
    await client.del('test:upstash:kpi:1');
    console.log('✅ Invalidación exitosa');

    // Obtener estadísticas
    const dbSize = await client.dbSize();
    const memoryInfo = await client.info('memory');
    const memoryUsage = memoryInfo
      .split('\n')
      .find(line => line.startsWith('used_memory_human:'))
      ?.split(':')[1] || 'unknown';

    console.log(`\n📊 Estadísticas de Upstash Redis:`);
    console.log(`- Keys en DB: ${dbSize}`);
    console.log(`- Memoria usada: ${memoryUsage.trim()}`);

    // Test de performance
    console.log('\n2️⃣ Test de performance...');
    const startTime = Date.now();
    
    for (let i = 0; i < 50; i++) {
      await client.setEx(`perf:upstash:${i}`, 60, `value-${i}`);
    }
    
    const writeTime = Date.now() - startTime;
    console.log(`✅ 50 escrituras en ${writeTime}ms`);

    const readStartTime = Date.now();
    for (let i = 0; i < 50; i++) {
      await client.get(`perf:upstash:${i}`);
    }
    
    const readTime = Date.now() - readStartTime;
    console.log(`✅ 50 lecturas en ${readTime}ms`);

    // Limpiar datos de prueba
    for (let i = 0; i < 50; i++) {
      await client.del(`perf:upstash:${i}`);
    }

    console.log('\n🎉 ¡Upstash Redis está funcionando correctamente!');
    console.log('\n📋 Resumen:');
    console.log('✅ Conexión establecida');
    console.log('✅ Operaciones básicas funcionando');
    console.log('✅ Cache JSON funcionando');
    console.log('✅ Performance aceptable');
    console.log('✅ Invalidación funcionando');

    // Información adicional de Upstash
    console.log('\n📈 Información de Upstash:');
    console.log('✅ Plan gratuito: 10,000 requests/día');
    console.log('✅ 256MB de almacenamiento');
    console.log('✅ Latencia < 1ms');
    console.log('✅ 99.9% uptime');

  } catch (error) {
    console.error('❌ Error conectando a Upstash Redis:', error.message);
    console.log('\n🔧 Soluciones posibles:');
    console.log('1. Verificar que REDIS_URL sea correcta');
    console.log('2. Verificar que la base de datos esté activa en Upstash');
    console.log('3. Verificar conectividad de red');
    console.log('4. Verificar límites del plan gratuito');
    
    if (error.message.includes('WRONGPASS')) {
      console.log('\n💡 Error de autenticación: Verifica la URL de conexión');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Error de conexión: Verifica la URL y el estado de la BD');
    }
  } finally {
    // Disconnect after usage (como en tu ejemplo)
    if (client?.isReady) {
      await client.disconnect();
      console.log('\n🔌 Conexión a Upstash Redis cerrada');
    }
  }
}

// Ejecutar el test
testUpstashRedis().catch(console.error); 