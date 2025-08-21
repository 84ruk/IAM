const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAlerts() {
  try {
    console.log('🔍 Consultando alertas recientes...');
    
    // Verificar alertas del historial
    const alertasHistorial = await prisma.alertaHistorial.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        sensor: {
          select: { nombre: true, tipo: true }
        }
      }
    });
    
    console.log(`📊 Alertas en historial: ${alertasHistorial.length}`);
    alertasHistorial.forEach(alerta => {
      console.log(`  - ${alerta.createdAt.toISOString()}: ${alerta.sensor.nombre} (${alerta.sensor.tipo}) - ${alerta.mensaje} - Severidad: ${alerta.severidad}`);
    });
    
    // Verificar lecturas recientes (usar campo 'fecha' en lugar de 'createdAt')
    const lecturasRecientes = await prisma.sensorLectura.findMany({
      where: {
        fecha: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
        }
      },
      orderBy: { fecha: 'desc' },
      take: 10,
      include: {
        sensor: {
          select: { nombre: true, tipo: true }
        }
      }
    });
    
    console.log(`\n📈 Lecturas recientes: ${lecturasRecientes.length}`);
    lecturasRecientes.forEach(lectura => {
      console.log(`  - ${lectura.fecha.toISOString()}: ${lectura.sensor.nombre} (${lectura.sensor.tipo}) - ${lectura.valor}${lectura.unidad}`);
    });
    
    // Verificar configuración de alertas del sensor
    if (lecturasRecientes.length > 0) {
      const sensorId = lecturasRecientes[0].sensorId;
      console.log(`\n🔧 Verificando configuración de alertas para sensor ID: ${sensorId}`);
      
      const configuracionAlerta = await prisma.configuracionAlerta.findFirst({
        where: { sensorId },
        select: {
          id: true,
          activo: true,
          tipoAlerta: true,
          umbralCritico: true,
          configuracionNotificacion: true
        }
      });
      
      if (configuracionAlerta) {
        console.log('📋 Configuración de alertas encontrada:');
        console.log(`  - ID: ${configuracionAlerta.id}`);
        console.log(`  - Activo: ${configuracionAlerta.activo}`);
        console.log(`  - Tipo: ${configuracionAlerta.tipoAlerta}`);
        console.log(`  - Umbral crítico: ${JSON.stringify(configuracionAlerta.umbralCritico)}`);
        console.log(`  - Configuración notificación: ${JSON.stringify(configuracionAlerta.configuracionNotificacion)}`);
      } else {
        console.log('❌ No hay configuración de alertas para este sensor');
      }
    }
    
  } catch (error) {
    console.error('❌ Error consultando alertas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAlerts();
