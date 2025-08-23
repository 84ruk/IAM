const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarConfiguracionSensor() {
  try {
    console.log('🔍 Verificando configuración del sensor 1...');
    
    const sensor = await prisma.sensor.findFirst({
      where: { id: 1 },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        configuracion: true
      }
    });
    
    if (!sensor) {
      console.log('❌ No se encontró el sensor 1');
      return;
    }
    
    console.log('✅ Sensor encontrado:');
    console.log('📋 ID:', sensor.id);
    console.log('📝 Nombre:', sensor.nombre);
    console.log('🔧 Tipo:', sensor.tipo);
    console.log('⚙️ Configuración:', JSON.stringify(sensor.configuracion, null, 2));
    
    // También verificar ConfiguracionAlerta
    console.log('\n🔍 Verificando ConfiguracionAlerta...');
    
    const configAlerta = await prisma.configuracionAlerta.findFirst({
      where: { sensorId: 1 }
    });
    
    if (configAlerta) {
      console.log('✅ ConfiguracionAlerta encontrada:');
      console.log('📋 ID:', configAlerta.id);
      console.log('⚙️ Configuración Notificación:', JSON.stringify(configAlerta.configuracionNotificacion, null, 2));
      console.log('🔧 Umbral Crítico:', JSON.stringify(configAlerta.umbralCritico, null, 2));
    } else {
      console.log('❌ No se encontró ConfiguracionAlerta');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificarConfiguracionSensor();
