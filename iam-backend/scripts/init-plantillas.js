#!/usr/bin/env node

/**
 * Script de inicialización para generar plantillas al arrancar la aplicación
 * Este script se ejecuta al inicio para asegurar que las plantillas estén disponibles
 */

const { generatePlantillasForDocker } = require('./generate-plantillas-docker');
const path = require('path');
const fs = require('fs');

async function initPlantillas() {
  console.log('🚀 Inicializando plantillas al arrancar la aplicación...');

  try {
    // Verificar si ya existen plantillas
    const plantillasDir = path.join(process.cwd(), 'uploads', 'plantillas');
    
    if (fs.existsSync(plantillasDir)) {
      const archivosExistentes = fs.readdirSync(plantillasDir)
        .filter(archivo => archivo.endsWith('.xlsx'))
        .filter(archivo => archivo.includes('auto'));

      if (archivosExistentes.length >= 3) {
        console.log('✅ Plantillas automáticas ya existen, saltando generación');
        return;
      }
    }

    // Generar plantillas si no existen
    console.log('📝 Generando plantillas automáticas...');
    await generatePlantillasForDocker();
    
    console.log('✅ Inicialización de plantillas completada');

  } catch (error) {
    console.error('❌ Error en inicialización de plantillas:', error);
    // No fallar la aplicación por este error
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initPlantillas().catch(console.error);
}

module.exports = { initPlantillas }; 