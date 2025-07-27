#!/usr/bin/env node

/**
 * Script para probar el servicio de plantillas automáticas
 * Uso: node scripts/test-plantillas-auto.js
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

async function testPlantillasAuto() {
  console.log('🧪 Probando servicio de plantillas automáticas...\n');

  try {
    // Test 1: Obtener todas las plantillas
    console.log('1️⃣ Obteniendo todas las plantillas...');
    const todasLasPlantillas = await axios.get(`${BASE_URL}/plantillas-auto`);
    console.log('✅ Todas las plantillas obtenidas:');
    console.log(`   Total: ${todasLasPlantillas.data.data.total}`);
    console.log(`   Productos: ${todasLasPlantillas.data.data.productos.cantidad}`);
    console.log(`   Proveedores: ${todasLasPlantillas.data.data.proveedores.cantidad}`);
    console.log(`   Movimientos: ${todasLasPlantillas.data.data.movimientos.cantidad}`);
    console.log(`   Otros: ${todasLasPlantillas.data.data.otros.cantidad}`);

    // Test 2: Obtener plantillas por tipo
    console.log('\n2️⃣ Obteniendo plantillas por tipo...');
    const tipos = ['productos', 'proveedores', 'movimientos'];
    
    for (const tipo of tipos) {
      const plantillasTipo = await axios.get(`${BASE_URL}/plantillas-auto/${tipo}`);
      console.log(`   ${tipo.toUpperCase()}: ${plantillasTipo.data.data.cantidad} plantillas`);
      
      if (plantillasTipo.data.data.plantillas.length > 0) {
        plantillasTipo.data.data.plantillas.forEach(p => {
          console.log(`      - ${p.nombre} (${p.descripcion})`);
        });
      }
    }

    // Test 3: Obtener mejor plantilla por tipo
    console.log('\n3️⃣ Obteniendo mejor plantilla por tipo...');
    for (const tipo of tipos) {
      const mejorPlantilla = await axios.get(`${BASE_URL}/plantillas-auto/${tipo}/mejor`);
      if (mejorPlantilla.data.success) {
        console.log(`   ${tipo.toUpperCase()}: ${mejorPlantilla.data.data.nombre}`);
      } else {
        console.log(`   ${tipo.toUpperCase()}: No hay plantillas disponibles`);
      }
    }

    // Test 4: Buscar plantillas
    console.log('\n4️⃣ Buscando plantillas...');
    const busqueda = await axios.get(`${BASE_URL}/plantillas-auto/buscar?nombre=producto`);
    console.log(`   Búsqueda "producto": ${busqueda.data.data.cantidad} resultados`);

    // Test 5: Obtener estadísticas
    console.log('\n5️⃣ Obteniendo estadísticas...');
    const estadisticas = await axios.get(`${BASE_URL}/plantillas-auto/estadisticas`);
    console.log('✅ Estadísticas obtenidas:');
    console.log(`   Total: ${estadisticas.data.data.total}`);
    console.log(`   Por tipo:`, estadisticas.data.data.porTipo);
    console.log(`   Por categoría:`, estadisticas.data.data.porCategoria);
    console.log(`   Tamaño total: ${(estadisticas.data.data.tamañoTotal / 1024).toFixed(2)} KB`);

    // Test 6: Obtener información de una plantilla específica
    console.log('\n6️⃣ Obteniendo información de plantilla específica...');
    if (todasLasPlantillas.data.data.productos.plantillas.length > 0) {
      const nombrePlantilla = todasLasPlantillas.data.data.productos.plantillas[0].nombre;
      const infoPlantilla = await axios.get(`${BASE_URL}/plantillas-auto/info/${nombrePlantilla}`);
      console.log(`   Información de ${nombrePlantilla}:`);
      console.log(`      Descripción: ${infoPlantilla.data.data.descripcion}`);
      console.log(`      Tamaño: ${(infoPlantilla.data.data.tamaño / 1024).toFixed(2)} KB`);
      console.log(`      Fecha: ${infoPlantilla.data.data.fechaModificacion}`);
    }

    // Test 7: Actualizar plantillas
    console.log('\n7️⃣ Actualizando información de plantillas...');
    const actualizacion = await axios.get(`${BASE_URL}/plantillas-auto/actualizar`);
    console.log(`   ✅ ${actualizacion.data.message}`);

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('✅ El servicio de plantillas automáticas está funcionando correctamente');

  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    console.log('\n🔧 Posibles soluciones:');
    console.log('   1. Verificar que el servidor esté ejecutándose');
    console.log('   2. Verificar la URL del API');
    console.log('   3. Verificar que las plantillas existan en uploads/plantillas/');
    
    process.exit(1);
  }
}

// Función para probar descarga de plantillas
async function testDescargaPlantillas() {
  console.log('\n📥 Probando descarga de plantillas...\n');

  try {
    // Obtener todas las plantillas primero
    const todasLasPlantillas = await axios.get(`${BASE_URL}/plantillas-auto`);
    
    // Probar descarga de la primera plantilla de productos
    if (todasLasPlantillas.data.data.productos.plantillas.length > 0) {
      const nombrePlantilla = todasLasPlantillas.data.data.productos.plantillas[0].nombre;
      console.log(`📥 Descargando plantilla: ${nombrePlantilla}`);
      
      const response = await axios.get(`${BASE_URL}/plantillas-auto/productos/descargar/${nombrePlantilla}`, {
        responseType: 'stream'
      });
      
      console.log('✅ Descarga iniciada correctamente');
      console.log(`   Content-Type: ${response.headers['content-type']}`);
      console.log(`   Content-Length: ${response.headers['content-length']} bytes`);
      
      // Simular descarga (no guardar realmente)
      let bytesRecibidos = 0;
      response.data.on('data', (chunk) => {
        bytesRecibidos += chunk.length;
      });
      
      response.data.on('end', () => {
        console.log(`   ✅ Descarga completada: ${bytesRecibidos} bytes recibidos`);
      });
      
      response.data.on('error', (error) => {
        console.error(`   ❌ Error en descarga: ${error.message}`);
      });
      
    } else {
      console.log('⚠️ No hay plantillas de productos para descargar');
    }

  } catch (error) {
    console.error('❌ Error probando descarga:', error.message);
  }
}

// Ejecutar pruebas
async function main() {
  await testPlantillasAuto();
  await testDescargaPlantillas();
}

main().catch(console.error); 