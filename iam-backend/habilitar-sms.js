const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function habilitarSMS() {
  try {
    console.log('🔧 Habilitando notificaciones SMS en el sistema...');
    
    // 1. Verificar configuración actual
    console.log('\n📋 CONFIGURACIÓN ACTUAL:');
    const configuraciones = await prisma.configuracionAlerta.findMany({
      where: { activo: true },
      include: {
        destinatarios: {
          include: {
            destinatario: true
          }
        }
      }
    });
    
    console.log(`⚙️ Configuraciones encontradas: ${configuraciones.length}`);
    
    // 2. Habilitar SMS en cada configuración
    for (const config of configuraciones) {
      console.log(`\n🔧 Configurando sensor ID: ${config.sensorId}`);
      
      // Obtener configuración actual
      const configActual = config.configuracionNotificacion || {};
      console.log(`   📊 Configuración actual:`);
      console.log(`      📧 Email: ${configActual.email !== false ? '✅' : '❌'}`);
      console.log(`      📱 SMS: ${configActual.sms !== false ? '✅' : '❌'}`);
      console.log(`      🌐 WebSocket: ${configActual.webSocket !== false ? '✅' : '❌'}`);
      
      // Crear nueva configuración con SMS habilitado
      const nuevaConfig = {
        ...configActual,
        email: true,
        sms: true,        // 🔧 HABILITAR SMS
        webSocket: true
      };
      
      console.log(`   🔧 Nueva configuración:`);
      console.log(`      📧 Email: ${nuevaConfig.email ? '✅' : '❌'}`);
      console.log(`      📱 SMS: ${nuevaConfig.sms ? '✅' : '❌'}`);
      console.log(`      🌐 WebSocket: ${nuevaConfig.webSocket ? '✅' : '❌'}`);
      
      // Actualizar en la base de datos
      await prisma.configuracionAlerta.update({
        where: { id: config.id },
        data: {
          configuracionNotificacion: nuevaConfig
        }
      });
      
      console.log(`   ✅ Configuración actualizada`);
      
      // Mostrar destinatarios que recibirán SMS
      const destinatariosSMS = config.destinatarios
        .filter(d => d.destinatario.telefono && d.destinatario.activo)
        .map(d => d.destinatario);
      
      if (destinatariosSMS.length > 0) {
        console.log(`   📱 Destinatarios SMS (${destinatariosSMS.length}):`);
        destinatariosSMS.forEach((dest, index) => {
          console.log(`      ${index + 1}. ${dest.nombre}: ${dest.telefono}`);
        });
      } else {
        console.log(`   ⚠️ No hay destinatarios con teléfono configurado`);
      }
    }
    
    // 3. Verificar configuración final
    console.log('\n🔍 VERIFICACIÓN FINAL:');
    const configuracionesFinales = await prisma.configuracionAlerta.findMany({
      where: { activo: true }
    });
    
    configuracionesFinales.forEach((config, index) => {
      const configNotif = config.configuracionNotificacion || {};
      console.log(`   ${index + 1}. Sensor ID: ${config.sensorId}`);
      console.log(`      📧 Email: ${configNotif.email ? '✅' : '❌'}`);
      console.log(`      📱 SMS: ${configNotif.sms ? '✅' : '❌'}`);
      console.log(`      🌐 WebSocket: ${configNotif.webSocket ? '✅' : '❌'}`);
    });
    
    // 4. Crear alerta de prueba para verificar SMS
    console.log('\n🧪 CREANDO ALERTA DE PRUEBA PARA VERIFICAR SMS...');
    
    // Obtener el primer sensor
    const primerSensor = await prisma.sensor.findFirst({
      where: { activo: true }
    });
    
    if (primerSensor) {
      // Crear una lectura que supere el umbral crítico
      const lectura = await prisma.sensorLectura.create({
        data: {
          tipo: primerSensor.tipo,
          valor: 30.0, // Valor que supera el umbral crítico de 22.5°C
          unidad: '°C',
          sensorId: primerSensor.id,
          ubicacionId: primerSensor.ubicacionId,
          empresaId: primerSensor.empresaId,
          fecha: new Date()
        }
      });
      
      console.log(`✅ Lectura de prueba creada: ${lectura.id}`);
      console.log(`   📊 Valor: ${lectura.valor}°C (supera umbral crítico)`);
      
      // Crear alerta correspondiente
      const alerta = await prisma.alertaHistorial.create({
        data: {
          empresaId: primerSensor.empresaId,
          tipo: 'SENSOR_ALERT',
          severidad: 'CRITICA',
          titulo: 'ALERTA DE PRUEBA - SMS Habilitado',
          mensaje: `🚨 PRUEBA: Temperatura crítica ${lectura.valor}°C - Sistema SMS habilitado`,
          sensorId: primerSensor.id,
          valor: lectura.valor.toString(),
          ubicacionId: primerSensor.ubicacionId,
          estado: 'ENVIADA',
          emailEnviado: false,
          condicionActivacion: {
            tipo: primerSensor.tipo,
            valor: lectura.valor,
            umbral: 22.5,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      console.log(`✅ Alerta de prueba creada: ${alerta.id}`);
      console.log(`   🚨 Mensaje: ${alerta.mensaje}`);
      
      console.log('\n🎯 ALERTA DE PRUEBA CREADA EXITOSAMENTE!');
      console.log('   Ahora deberías recibir:');
      console.log('   📧 Email a los destinatarios configurados');
      console.log('   📱 SMS al número 4441882114');
      console.log('   🌐 Notificación por WebSocket');
      
    } else {
      console.log('❌ No se pudo crear alerta de prueba - No hay sensores activos');
    }
    
    console.log('\n✅ CONFIGURACIÓN SMS COMPLETADA!');
    console.log('   El sistema ahora enviará SMS automáticamente cuando se generen alertas.');
    
  } catch (error) {
    console.error('❌ Error habilitando SMS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

habilitarSMS();
