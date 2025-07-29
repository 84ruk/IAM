#!/usr/bin/env node

const Redis = require('ioredis');
const path = require('path');

// Configuración de Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
});

async function diagnosticarImportacion(trabajoId) {
  console.log(`🔍 Diagnóstico para trabajo: ${trabajoId}`);
  console.log('=' .repeat(50));

  try {
    // 1. Verificar si el trabajo existe en BullMQ
    console.log('\n1️⃣ Verificando trabajo en BullMQ...');
    const bullKey = `bull:importacion:${trabajoId}`;
    const jobData = await redis.get(bullKey);
    
    if (jobData) {
      console.log('✅ Trabajo encontrado en BullMQ');
      const job = JSON.parse(jobData);
      console.log(`   Estado: ${job.state || 'desconocido'}`);
      console.log(`   Progreso: ${job.progress || 0}%`);
      console.log(`   Fecha de creación: ${new Date(job.timestamp).toLocaleString()}`);
    } else {
      console.log('❌ Trabajo no encontrado en BullMQ');
    }

    // 2. Verificar cache de trabajos
    console.log('\n2️⃣ Verificando cache de trabajos...');
    const cacheKey = `import:trabajos:${trabajoId}`;
    const trabajoCache = await redis.get(cacheKey);
    
    if (trabajoCache) {
      console.log('✅ Trabajo encontrado en cache');
      const trabajo = JSON.parse(trabajoCache);
      console.log(`   Estado: ${trabajo.estado}`);
      console.log(`   Progreso: ${trabajo.progreso}%`);
      console.log(`   Registros procesados: ${trabajo.registrosProcesados}/${trabajo.totalRegistros}`);
      console.log(`   Registros exitosos: ${trabajo.registrosExitosos}`);
      console.log(`   Registros con error: ${trabajo.registrosConError}`);
      console.log(`   Última actualización: ${new Date(trabajo.fechaActualizacion || trabajo.fechaCreacion).toLocaleString()}`);
    } else {
      console.log('❌ Trabajo no encontrado en cache');
    }

    // 3. Verificar logs del sistema
    console.log('\n3️⃣ Verificando logs del sistema...');
    const logKey = `import:logs:${trabajoId}`;
    const logs = await redis.lrange(logKey, 0, -1);
    
    if (logs.length > 0) {
      console.log(`✅ ${logs.length} logs encontrados`);
      console.log('   Últimos 5 logs:');
      logs.slice(-5).forEach((log, index) => {
        const logData = JSON.parse(log);
        console.log(`   ${index + 1}. [${logData.timestamp}] ${logData.level}: ${logData.message}`);
      });
    } else {
      console.log('❌ No hay logs disponibles');
    }

    // 4. Verificar estadísticas de progreso
    console.log('\n4️⃣ Verificando estadísticas de progreso...');
    const statsKey = `import:stats:${trabajoId}`;
    const stats = await redis.get(statsKey);
    
    if (stats) {
      console.log('✅ Estadísticas encontradas');
      const estadisticas = JSON.parse(stats);
      console.log(`   Progreso general: ${estadisticas.progresoGeneral}%`);
      console.log(`   Etapa actual: ${estadisticas.etapaActual}`);
      console.log(`   Tiempo transcurrido: ${estadisticas.tiempoTranscurrido}ms`);
      console.log(`   Velocidad: ${estadisticas.velocidadProcesamiento} registros/seg`);
    } else {
      console.log('❌ No hay estadísticas disponibles');
    }

    // 5. Verificar errores específicos
    console.log('\n5️⃣ Verificando errores específicos...');
    const errorKey = `import:errors:${trabajoId}`;
    const errores = await redis.lrange(errorKey, 0, -1);
    
    if (errores.length > 0) {
      console.log(`⚠️ ${errores.length} errores encontrados`);
      console.log('   Últimos 3 errores:');
      errores.slice(-3).forEach((error, index) => {
        const errorData = JSON.parse(error);
        console.log(`   ${index + 1}. [${errorData.timestamp}] ${errorData.tipo}: ${errorData.mensaje}`);
      });
    } else {
      console.log('✅ No hay errores registrados');
    }

    // 6. Verificar archivos temporales
    console.log('\n6️⃣ Verificando archivos temporales...');
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'import');
    const fs = require('fs');
    
    if (fs.existsSync(uploadsDir)) {
      const archivos = fs.readdirSync(uploadsDir);
      const archivosTrabajo = archivos.filter(archivo => archivo.includes(trabajoId));
      
      if (archivosTrabajo.length > 0) {
        console.log(`✅ ${archivosTrabajo.length} archivos temporales encontrados`);
        archivosTrabajo.forEach(archivo => {
          const stats = fs.statSync(path.join(uploadsDir, archivo));
          console.log(`   - ${archivo} (${(stats.size / 1024).toFixed(2)} KB)`);
        });
      } else {
        console.log('❌ No hay archivos temporales para este trabajo');
      }
    } else {
      console.log('❌ Directorio de uploads no existe');
    }

    // 7. Recomendaciones
    console.log('\n7️⃣ Recomendaciones:');
    console.log('   Si el trabajo está en cache pero no se actualiza:');
    console.log('   - Verificar que el procesador esté actualizando el cache');
    console.log('   - Revisar logs del backend para errores');
    console.log('   ');
    console.log('   Si el trabajo no está en cache:');
    console.log('   - El trabajo puede haber expirado del cache');
    console.log('   - Verificar si el trabajo se completó correctamente');
    console.log('   ');
    console.log('   Si hay errores:');
    console.log('   - Revisar los errores específicos mostrados arriba');
    console.log('   - Verificar la configuración de la base de datos');
    console.log('   - Revisar permisos de archivos');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
  } finally {
    await redis.disconnect();
  }
}

// Ejecutar diagnóstico si se proporciona un trabajoId
const trabajoId = process.argv[2];
if (!trabajoId) {
  console.log('Uso: node diagnostico-importacion.js <trabajoId>');
  console.log('Ejemplo: node diagnostico-importacion.js import-1753659050663-bc2f6axkw');
  process.exit(1);
}

diagnosticarImportacion(trabajoId); 