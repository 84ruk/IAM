#!/usr/bin/env node

/**
 * Script para probar la conexión a Redis usando variables de entorno
 * Uso: node scripts/test-redis-connection.js
 */

require('dotenv').config();
const { createClient } = require('redis');

async function testRedisConnection() {
  console.log('🔍 Probando conexión a Redis...\n');

  // Verificar variables de entorno
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;
  const redisPassword = process.env.REDIS_PASSWORD;
  const redisDb = process.env.REDIS_DB || 0;

  console.log('📋 Configuración Redis:');
  console.log(`   Host: ${redisHost}`);
  console.log(`   Port: ${redisPort}`);
  console.log(`   Password: ${redisPassword ? '***configurado***' : 'no configurado'}`);
  console.log(`   Database: ${redisDb}\n`);

  if (!redisHost || !redisPort) {
    console.error('❌ Error: REDIS_HOST y REDIS_PORT son requeridos');
    console.log('💡 Asegúrate de configurar las variables de entorno:');
    console.log('   REDIS_HOST=redis-16076.c16.us-east-1-3.ec2.redns.redis-cloud.com');
    console.log('   REDIS_PORT=16076');
    console.log('   REDIS_PASSWORD=tu_password');
    process.exit(1);
  }

  // Configurar cliente Redis
  const client = createClient({
    socket: {
      host: redisHost,
      port: parseInt(redisPort),
    },
    password: redisPassword,
    database: parseInt(redisDb),
  });

  // Eventos de conexión
  client.on('error', (err) => {
    console.error('❌ Error de Redis:', err.message);
  });

  client.on('connect', () => {
    console.log('🔗 Conectando a Redis...');
  });

  client.on('ready', () => {
    console.log('✅ Redis listo para operaciones');
  });

  try {
    // Conectar a Redis
    console.log('🔄 Conectando...');
    await client.connect();

    // Probar operaciones básicas
    console.log('\n🧪 Probando operaciones básicas...');

    // Test 1: SET/GET
    console.log('   Test 1: SET/GET');
    await client.set('test:connection', 'success');
    const result = await client.get('test:connection');
    console.log(`   ✅ SET/GET: ${result}`);

    // Test 2: TTL
    console.log('   Test 2: TTL');
    await client.set('test:ttl', 'expires in 10 seconds', { EX: 10 });
    const ttl = await client.ttl('test:ttl');
    console.log(`   ✅ TTL: ${ttl} segundos`);

    // Test 3: EXISTS
    console.log('   Test 3: EXISTS');
    const exists = await client.exists('test:connection');
    console.log(`   ✅ EXISTS: ${exists}`);

    // Test 4: DEL
    console.log('   Test 4: DEL');
    await client.del('test:connection', 'test:ttl');
    console.log('   ✅ DEL: keys eliminadas');

    // Test 5: INFO
    console.log('   Test 5: INFO');
    const info = await client.info('server');
    const version = info.split('\n').find(line => line.startsWith('redis_version'));
    console.log(`   ✅ INFO: ${version}`);

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('✅ La conexión a Redis está funcionando correctamente');

  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error.message);
    console.log('\n🔧 Posibles soluciones:');
    console.log('   1. Verifica que las credenciales sean correctas');
    console.log('   2. Verifica que el host y puerto sean accesibles');
    console.log('   3. Verifica que Redis Cloud esté activo');
    console.log('   4. Verifica la configuración de firewall/red');
    
    process.exit(1);
  } finally {
    // Cerrar conexión
    await client.quit();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar el test
testRedisConnection().catch(console.error); 