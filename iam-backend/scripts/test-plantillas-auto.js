#!/usr/bin/env node

/**
 * Script para probar el servicio de plantillas automáticas
 * Uso: node scripts/test-plantillas-auto.js
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testPlantillasAuto() {
  try {
    console.log('🧪 Probando plantillas automáticas...\n');

    // 1. Obtener todas las plantillas
    console.log('1. Obteniendo todas las plantillas...');
    const todasLasPlantillas = await axios.get(`${BASE_URL}/plantillas-auto`);
    console.log('✅ Todas las plantillas:', JSON.stringify(todasLasPlantillas.data, null, 2));

    // 2. Obtener plantillas por tipo
    console.log('\n2. Obteniendo plantillas por tipo...');
    const tipos = ['productos', 'proveedores', 'movimientos'];
    
    for (const tipo of tipos) {
      console.log(`\n--- Plantillas de ${tipo} ---`);
      const plantillasTipo = await axios.get(`${BASE_URL}/plantillas-auto/${tipo}`);
      console.log(JSON.stringify(plantillasTipo.data, null, 2));
    }

    // 3. Obtener mejor plantilla por tipo
    console.log('\n3. Obteniendo mejor plantilla por tipo...');
    
    for (const tipo of tipos) {
      console.log(`\n--- Mejor plantilla de ${tipo} ---`);
      const mejorPlantilla = await axios.get(`${BASE_URL}/plantillas-auto/${tipo}/mejor`);
      console.log(JSON.stringify(mejorPlantilla.data, null, 2));
    }

    // 4. Obtener estadísticas
    console.log('\n4. Obteniendo estadísticas...');
    const estadisticas = await axios.get(`${BASE_URL}/plantillas-auto/estadisticas`);
    console.log(JSON.stringify(estadisticas.data, null, 2));

    // 5. Buscar plantillas automáticas específicamente
    console.log('\n5. Buscando plantillas automáticas...');
    const plantillasAuto = await axios.get(`${BASE_URL}/plantillas-auto/buscar?incluirAvanzadas=true&incluirMejoradas=true`);
    console.log(JSON.stringify(plantillasAuto.data, null, 2));

    console.log('\n✅ Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Ejecutar las pruebas
testPlantillasAuto(); 