#!/usr/bin/env node

/**
 * Script para generar plantillas automáticamente durante el build de Docker
 * Este script se ejecuta durante el build para asegurar que las plantillas estén disponibles
 */

const { generarPlantilla } = require('./generate-plantillas-auto');
const path = require('path');
const fs = require('fs');

async function generatePlantillasForDocker() {
  console.log('🚀 Generando plantillas para Docker build...');

  try {
    // Asegurar que el directorio existe
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const plantillasDir = path.join(uploadsDir, 'plantillas');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Directorio uploads creado');
    }
    
    if (!fs.existsSync(plantillasDir)) {
      fs.mkdirSync(plantillasDir, { recursive: true });
      console.log('📁 Directorio plantillas creado');
    }

    // Generar todas las plantillas
    const tipos = ['productos', 'proveedores', 'movimientos'];
    const plantillasGeneradas = [];

    for (const tipo of tipos) {
      try {
        const nombreArchivo = await generarPlantilla(tipo);
        plantillasGeneradas.push(nombreArchivo);
        console.log(`✅ Plantilla ${nombreArchivo} generada`);
      } catch (error) {
        console.error(`❌ Error generando plantilla ${tipo}:`, error.message);
      }
    }

    // Verificar que las plantillas se generaron correctamente
    const archivosExistentes = fs.readdirSync(plantillasDir)
      .filter(archivo => archivo.endsWith('.xlsx'))
      .sort();

    console.log('\n📋 Plantillas disponibles en el directorio:');
    archivosExistentes.forEach(archivo => {
      const stats = fs.statSync(path.join(plantillasDir, archivo));
      console.log(`   ✅ ${archivo} (${(stats.size / 1024).toFixed(1)} KB)`);
    });

    console.log(`\n🎉 Total de plantillas: ${archivosExistentes.length}`);
    
    if (archivosExistentes.length === 0) {
      console.error('❌ No se generaron plantillas. Verificar errores arriba.');
      process.exit(1);
    }

    console.log('✅ Plantillas generadas exitosamente para Docker build');

  } catch (error) {
    console.error('❌ Error generando plantillas para Docker:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generatePlantillasForDocker().catch(console.error);
}

module.exports = { generatePlantillasForDocker }; 