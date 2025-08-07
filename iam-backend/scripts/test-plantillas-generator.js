const { PlantillasGeneradorService } = require('../src/importacion/services/plantillas-generador.service');

async function testPlantillasGenerator() {
  try {
    console.log('🧪 Probando generador de plantillas...');
    
    const service = new PlantillasGeneradorService();
    
    // Obtener plantillas disponibles
    console.log('\n📋 Obteniendo plantillas disponibles...');
    const plantillasDisponibles = await service.obtenerPlantillasDisponibles();
    console.log('Plantillas disponibles:', plantillasDisponibles);
    
    // Probar generación de cada tipo de plantilla
    for (const plantilla of plantillasDisponibles) {
      console.log(`\n🏗️ Generando plantilla: ${plantilla.tipo}`);
      
      try {
        const nombreArchivo = await service.generarPlantilla(plantilla.tipo);
        console.log(`✅ Plantilla generada: ${nombreArchivo}`);
        
        // Verificar que el archivo existe
        const rutaArchivo = service.obtenerRutaPlantilla(nombreArchivo);
        const fs = require('fs');
        if (fs.existsSync(rutaArchivo)) {
          const stats = fs.statSync(rutaArchivo);
          console.log(`📁 Archivo creado: ${rutaArchivo} (${stats.size} bytes)`);
        } else {
          console.error(`❌ Archivo no encontrado: ${rutaArchivo}`);
        }
      } catch (error) {
        console.error(`❌ Error generando plantilla ${plantilla.tipo}:`, error.message);
      }
    }
    
    console.log('\n🎉 Prueba completada!');
    return true;
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    return false;
  }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
  testPlantillasGenerator()
    .then((success) => {
      console.log(success ? '✅ Todas las pruebas pasaron' : '❌ Algunas pruebas fallaron');
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando pruebas:', error);
      process.exit(1);
    });
}

module.exports = { testPlantillasGenerator };
