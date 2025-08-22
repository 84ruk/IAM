const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugLecturasRecientes() {
  try {
    console.log('🔍 Debuggeando lecturas recientes del ESP32...');
    
    // Buscar el dispositivo ESP32 específico
    const deviceId = 'esp32_1755793063372_1wvksqltk';
    
    // 1. Verificar si el dispositivo existe
    const dispositivo = await prisma.dispositivoIoT.findFirst({
      where: { deviceId },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        empresaId: true,
        ubicacionId: true,
        activo: true,
        ultimaLectura: true
      }
    });
    
    if (dispositivo) {
      console.log('📱 Dispositivo encontrado:');
      console.log(`  - ID: ${dispositivo.id}`);
      console.log(`  - Device ID: ${dispositivo.deviceId}`);
      console.log(`  - Nombre: ${dispositivo.deviceName}`);
      console.log(`  - Empresa: ${dispositivo.empresaId}`);
      console.log(`  - Ubicación: ${dispositivo.ubicacionId}`);
      console.log(`  - Activo: ${dispositivo.activo}`);
      console.log(`  - Última lectura: ${dispositivo.ultimaLectura}`);
    } else {
      console.log('❌ Dispositivo no encontrado');
      return;
    }
    
    // 2. Verificar lecturas recientes del sensor
    const sensor = await prisma.sensor.findFirst({
      where: { 
        nombre: 'Temperatura (DHT22)',
        empresaId: dispositivo.empresaId
      },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        activo: true,
        configuracion: true
      }
    });
    
    if (sensor) {
      console.log('\n🌡️ Sensor encontrado:');
      console.log(`  - ID: ${sensor.id}`);
      console.log(`  - Nombre: ${sensor.nombre}`);
      console.log(`  - Tipo: ${sensor.tipo}`);
      console.log(`  - Activo: ${sensor.activo}`);
      console.log(`  - Configuración: ${JSON.stringify(sensor.configuracion, null, 2)}`);
      
      // 3. Verificar lecturas recientes de este sensor
      const lecturasRecientes = await prisma.sensorLectura.findMany({
        where: {
          sensorId: sensor.id,
          fecha: {
            gte: new Date(Date.now() - 10 * 60 * 1000) // Últimos 10 minutos
          }
        },
        orderBy: { fecha: 'desc' },
        take: 5,
        select: {
          id: true,
          valor: true,
          unidad: true,
          fecha: true
        }
      });
      
      console.log(`\n📈 Lecturas recientes del sensor: ${lecturasRecientes.length}`);
      lecturasRecientes.forEach(lectura => {
        console.log(`  - ${lectura.fecha.toISOString()}: ${lectura.valor}${lectura.unidad} (Estado: ${lectura.estado || 'N/A'})`);
      });
      
      // 4. Verificar configuración de alertas
      const configuracionAlerta = await prisma.configuracionAlerta.findFirst({
        where: { sensorId: sensor.id },
        select: {
          id: true,
          activo: true,
          tipoAlerta: true,
          umbralCritico: true,
          configuracionNotificacion: true
        }
      });
      
      if (configuracionAlerta) {
        console.log('\n📋 Configuración de alertas:');
        console.log(`  - ID: ${configuracionAlerta.id}`);
        console.log(`  - Activo: ${configuracionAlerta.activo}`);
        console.log(`  - Tipo: ${configuracionAlerta.tipoAlerta}`);
        console.log(`  - Umbral crítico: ${JSON.stringify(configuracionAlerta.umbralCritico, null, 2)}`);
        console.log(`  - Configuración notificación: ${JSON.stringify(configuracionAlerta.configuracionNotificacion, null, 2)}`);
      } else {
        console.log('\n❌ No hay configuración de alertas para este sensor');
      }
      
      // 5. Verificar alertas generadas recientemente
      const alertasRecientes = await prisma.alertaHistorial.findMany({
        where: {
          sensorId: sensor.id,
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000) // Últimos 10 minutos
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          mensaje: true,
          severidad: true,
          createdAt: true
        }
      });
      
      console.log(`\n🚨 Alertas generadas recientemente: ${alertasRecientes.length}`);
      alertasRecientes.forEach(alerta => {
        console.log(`  - ${alerta.createdAt.toISOString()}: ${alerta.mensaje} (Severidad: ${alerta.severidad})`);
      });
      
      // 6. Evaluar si debería generar alerta con la última lectura
      if (lecturasRecientes.length > 0) {
        const ultimaLectura = lecturasRecientes[0];
        console.log(`\n🧮 Evaluando última lectura: ${ultimaLectura.valor}${ultimaLectura.unidad}`);
        
        if (sensor.configuracion) {
          const config = sensor.configuracion;
          const umbralAlerta = config.umbral_alerta;
          const umbralCritico = config.umbral_critico;
          
          console.log(`  - Umbral alerta: ${umbralAlerta}${ultimaLectura.unidad}`);
          console.log(`  - Umbral crítico: ${umbralCritico}${ultimaLectura.unidad}`);
          
          if (umbralCritico && ultimaLectura.valor >= umbralCritico) {
            console.log(`  - 🚨 DEBERÍA GENERAR ALERTA CRÍTICA: ${ultimaLectura.valor} >= ${umbralCritico}`);
          } else if (umbralAlerta && ultimaLectura.valor >= umbralAlerta) {
            console.log(`  - ⚠️ DEBERÍA GENERAR ALERTA: ${ultimaLectura.valor} >= ${umbralAlerta}`);
          } else {
            console.log(`  - ✅ NO DEBERÍA GENERAR ALERTA: ${ultimaLectura.valor} < ${umbralAlerta || 'sin_umbral'}`);
          }
        } else {
          console.log('  - ❌ Sensor no tiene configuración personalizada');
        }
      }
      
    } else {
      console.log('❌ Sensor no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error debuggeando lecturas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLecturasRecientes();
