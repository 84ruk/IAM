const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSensorConfig() {
  try {
    console.log('🔍 Debuggeando configuración del sensor...');
    
    // Obtener el sensor con su configuración
    const sensor = await prisma.sensor.findFirst({
      where: { nombre: 'Temperatura (DHT22)' },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        configuracion: true
      }
    });
    
    if (sensor) {
      console.log('📱 Sensor encontrado:');
      console.log(`  - ID: ${sensor.id}`);
      console.log(`  - Nombre: ${sensor.nombre}`);
      console.log(`  - Tipo: ${sensor.tipo}`);
      console.log(`  - Configuración (raw): ${JSON.stringify(sensor.configuracion, null, 2)}`);
      
      if (sensor.configuracion) {
        const config = sensor.configuracion;
        console.log('\n🔧 Campos de configuración disponibles:');
        Object.keys(config).forEach(key => {
          console.log(`  - ${key}: ${config[key]} (tipo: ${typeof config[key]})`);
        });
        
        console.log('\n🎯 Umbrales específicos:');
        console.log(`  - umbral_alerta: ${config.umbral_alerta}`);
        console.log(`  - umbral_critico: ${config.umbral_critico}`);
        console.log(`  - umbralCritico_alerta: ${config.umbralCritico_alerta}`);
        console.log(`  - umbralCritico_critico: ${config.umbralCritico_critico}`);
        
        // Simular la lógica del método analizarLecturaConConfiguracionReal
        console.log('\n🧮 Simulando evaluación de umbrales:');
        const valor = 28.0;
        const umbralAlerta = config.umbral_alerta || config.umbralCritico_alerta || config.umbralCritico_alerta;
        const umbralCritico = config.umbral_critico || config.umbralCritico_critico || config.umbralCritico_critico;
        
        console.log(`  - Valor a evaluar: ${valor}°C`);
        console.log(`  - Umbral alerta usado: ${umbralAlerta}°C`);
        console.log(`  - Umbral crítico usado: ${umbralCritico}°C`);
        
        if (umbralCritico && valor >= umbralCritico) {
          console.log(`  - 🚨 RESULTADO: CRÍTICO (${valor} >= ${umbralCritico})`);
        } else if (umbralAlerta && valor >= umbralAlerta) {
          console.log(`  - ⚠️ RESULTADO: ALERTA (${valor} >= ${umbralAlerta})`);
        } else {
          console.log(`  - ✅ RESULTADO: NORMAL (${valor} < ${umbralAlerta || 'sin_umbral'})`);
        }
      }
    } else {
      console.log('❌ Sensor no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error debuggeando sensor:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSensorConfig();
