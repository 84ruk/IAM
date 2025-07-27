#!/usr/bin/env node

/**
 * Ejemplo de uso de Redis con variables de entorno
 * Este script muestra cómo usar Redis de manera segura
 * sin hardcodear credenciales
 */

require('dotenv').config();
const { createClient } = require('redis');

async function ejemploUsoRedis() {
  console.log('🚀 Ejemplo de uso de Redis con variables de entorno\n');

  // ✅ FORMA CORRECTA: Usar variables de entorno
  const client = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    },
    password: process.env.REDIS_PASSWORD,
    database: parseInt(process.env.REDIS_DB || '0'),
  });

  // Eventos de conexión
  client.on('error', (err) => {
    console.error('❌ Error de Redis:', err.message);
  });

  client.on('connect', () => {
    console.log('🔗 Conectado a Redis');
  });

  client.on('ready', () => {
    console.log('✅ Redis listo');
  });

  try {
    // Conectar
    await client.connect();

    // Ejemplos de operaciones
    console.log('\n📝 Ejemplos de operaciones:\n');

    // 1. Cache simple
    console.log('1️⃣ Cache simple:');
    await client.set('user:123', JSON.stringify({
      id: 123,
      name: 'Juan Pérez',
      email: 'juan@example.com',
      lastLogin: new Date().toISOString()
    }));
    const userData = await client.get('user:123');
    console.log('   Usuario cacheado:', JSON.parse(userData).name);

    // 2. Cache con TTL
    console.log('\n2️⃣ Cache con TTL (5 segundos):');
    await client.set('temp:data', 'datos temporales', { EX: 5 });
    const tempData = await client.get('temp:data');
    console.log('   Datos temporales:', tempData);

    // 3. Cache de KPIs
    console.log('\n3️⃣ Cache de KPIs:');
    const kpis = {
      totalProductos: 1250,
      totalMovimientos: 567,
      productosBajoStock: 23,
      ultimaActualizacion: new Date().toISOString()
    };
    await client.set('kpis:dashboard', JSON.stringify(kpis), { EX: 300 }); // 5 minutos
    const cachedKpis = await client.get('kpis:dashboard');
    console.log('   KPIs cacheados:', JSON.parse(cachedKpis).totalProductos, 'productos');

    // 4. Cache de importación
    console.log('\n4️⃣ Cache de importación:');
    const importacionStatus = {
      id: 'import-123',
      status: 'processing',
      progress: 75,
      totalRows: 1000,
      processedRows: 750,
      errors: 5
    };
    await client.set('import:123', JSON.stringify(importacionStatus), { EX: 1800 }); // 30 minutos
    const cachedImport = await client.get('import:123');
    console.log('   Progreso importación:', JSON.parse(cachedImport).progress + '%');

    // 5. Cache de plantillas
    console.log('\n5️⃣ Cache de plantillas:');
    const plantilla = {
      id: 'template-001',
      name: 'Plantilla Productos',
      columns: ['nombre', 'precio', 'stock', 'categoria'],
      lastModified: new Date().toISOString()
    };
    await client.set('template:001', JSON.stringify(plantilla), { EX: 3600 }); // 1 hora
    const cachedTemplate = await client.get('template:001');
    console.log('   Plantilla cacheada:', JSON.parse(cachedTemplate).name);

    // 6. Cache de trabajos
    console.log('\n6️⃣ Cache de trabajos:');
    const trabajo = {
      id: 'job-456',
      type: 'importacion_productos',
      status: 'completed',
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date().toISOString(),
      result: { success: true, processed: 500, errors: 2 }
    };
    await client.set('job:456', JSON.stringify(trabajo), { EX: 7200 }); // 2 horas
    const cachedJob = await client.get('job:456');
    console.log('   Trabajo cacheado:', JSON.parse(cachedJob).type);

    // 7. Operaciones de lista
    console.log('\n7️⃣ Operaciones de lista:');
    await client.lPush('recent:activities', 'Usuario Juan inició sesión');
    await client.lPush('recent:activities', 'Importación de productos completada');
    await client.lPush('recent:activities', 'Nuevo producto agregado');
    await client.lTrim('recent:activities', 0, 9); // Mantener solo los últimos 10
    const activities = await client.lRange('recent:activities', 0, -1);
    console.log('   Actividades recientes:', activities.length, 'elementos');

    // 8. Operaciones de hash
    console.log('\n8️⃣ Operaciones de hash:');
    await client.hSet('empresa:config', {
      'nombre': 'IAM Inventario',
      'timezone': 'America/Mexico_City',
      'moneda': 'MXN',
      'idioma': 'es'
    });
    const empresaConfig = await client.hGetAll('empresa:config');
    console.log('   Configuración empresa:', empresaConfig.nombre);

    // 9. Verificar TTL
    console.log('\n9️⃣ Verificar TTL:');
    const ttlKpis = await client.ttl('kpis:dashboard');
    const ttlTemp = await client.ttl('temp:data');
    console.log('   TTL KPIs:', ttlKpis, 'segundos');
    console.log('   TTL Temp:', ttlTemp, 'segundos');

    // 10. Estadísticas
    console.log('\n🔟 Estadísticas:');
    const keys = await client.keys('*');
    console.log('   Total de keys:', keys.length);
    
    const memory = await client.info('memory');
    const usedMemory = memory.split('\n').find(line => line.startsWith('used_memory_human'));
    console.log('   Memoria usada:', usedMemory);

    console.log('\n🎉 ¡Ejemplo completado exitosamente!');
    console.log('✅ Redis está funcionando correctamente con variables de entorno');

  } catch (error) {
    console.error('\n❌ Error durante el ejemplo:', error.message);
  } finally {
    // Limpiar datos de ejemplo
    await client.flushDb();
    await client.quit();
    console.log('\n🧹 Datos de ejemplo limpiados');
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar ejemplo
ejemploUsoRedis().catch(console.error); 