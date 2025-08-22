const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFlujoAlertas() {
  try {
    console.log('🔍 Debug del flujo completo de alertas...');
    
    // 1. VERIFICAR ESTADO ACTUAL DEL SISTEMA
    console.log('\n📊 ESTADO ACTUAL DEL SISTEMA:');
    
    // Sensores activos
    const sensores = await prisma.sensor.findMany({
      where: { activo: true },
      include: {
        configuracionAlerta: {
          include: {
            destinatarios: {
              include: {
                destinatario: true
              }
            }
          }
        }
      }
    });
    
    console.log(`📡 Sensores activos: ${sensores.length}`);
    sensores.forEach((sensor, index) => {
      console.log(`   ${index + 1}. ${sensor.nombre} (${sensor.tipo})`);
      if (sensor.configuracionAlerta) {
        console.log(`      ✅ Configuración de alertas: ${sensor.configuracionAlerta.destinatarios.length} destinatarios`);
        console.log(`      🔔 Activo: ${sensor.configuracionAlerta.activo}`);
      } else {
        console.log(`      ❌ Sin configuración de alertas`);
      }
    });
    
    // 2. VERIFICAR ÚLTIMAS LECTURAS
    console.log('\n📈 ÚLTIMAS LECTURAS DE SENSORES:');
    const ultimasLecturas = await prisma.sensorLectura.findMany({
      take: 5,
      orderBy: { fecha: 'desc' },
      include: {
        sensor: {
          select: { nombre: true, tipo: true }
        }
      }
    });
    
    console.log(`📊 Lecturas recientes: ${ultimasLecturas.length}`);
    ultimasLecturas.forEach((lectura, index) => {
      console.log(`   ${index + 1}. ${lectura.sensor?.nombre || 'N/A'}`);
      console.log(`      📊 Valor: ${lectura.valor} ${lectura.unidad}`);
      console.log(`      ⏰ Fecha: ${lectura.fecha.toLocaleString('es-MX')}`);
      console.log(`      🆔 Sensor ID: ${lectura.sensorId}`);
    });
    
    // 3. VERIFICAR ALERTAS GENERADAS
    console.log('\n🚨 ALERTAS GENERADAS:');
    const alertas = await prisma.alertaHistorial.findMany({
      where: {
        tipo: 'SENSOR_ALERT',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sensor: {
          select: { nombre: true, tipo: true }
        }
      }
    });
    
    console.log(`🚨 Alertas recientes: ${alertas.length}`);
    alertas.forEach((alerta, index) => {
      console.log(`   ${index + 1}. ${alerta.titulo || alerta.mensaje}`);
      console.log(`      📊 Sensor: ${alerta.sensor?.nombre || 'N/A'}`);
      console.log(`      🚨 Severidad: ${alerta.severidad}`);
      console.log(`      📧 Email enviado: ${alerta.emailEnviado ? '✅' : '❌'}`);
      console.log(`      ⏰ Creada: ${alerta.createdAt.toLocaleString('es-MX')}`);
      console.log(`      🆔 ID: ${alerta.id}`);
    });
    
    // 4. VERIFICAR CONFIGURACIÓN DE NOTIFICACIONES
    console.log('\n🔔 CONFIGURACIÓN DE NOTIFICACIONES:');
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
    
    console.log(`⚙️ Configuraciones activas: ${configuraciones.length}`);
    configuraciones.forEach((config, index) => {
      console.log(`   ${index + 1}. Sensor ID: ${config.sensorId}`);
      console.log(`      🔔 Tipo: ${config.tipoAlerta}`);
      console.log(`      👥 Destinatarios: ${config.destinatarios.length}`);
      
      // Mostrar configuración de notificaciones
      const configNotif = config.configuracionNotificacion || {};
      console.log(`      📧 Email: ${configNotif.email !== false ? '✅' : '❌'}`);
      console.log(`      📱 SMS: ${configNotif.sms !== false ? '✅' : '❌'}`);
      console.log(`      🌐 WebSocket: ${configNotif.webSocket !== false ? '✅' : '❌'}`);
      
      // Mostrar destinatarios
      config.destinatarios.forEach((dest, dIndex) => {
        const d = dest.destinatario;
        console.log(`         ${dIndex + 1}. ${d.nombre} (${d.tipo})`);
        console.log(`            📧 Email: ${d.email || 'No configurado'}`);
        console.log(`            📱 Teléfono: ${d.telefono || 'No configurado'}`);
        console.log(`            ✅ Activo: ${d.activo ? 'SÍ' : 'NO'}`);
      });
    });
    
    // 5. VERIFICAR REGISTROS DE SMS
    console.log('\n📱 REGISTROS DE ENVÍO SMS:');
    const registrosSMS = await prisma.registroEnvioSMS.findMany({
      orderBy: { id: 'desc' },
      take: 5
    });
    
    console.log(`📊 Registros SMS: ${registrosSMS.length}`);
    registrosSMS.forEach((registro, index) => {
      console.log(`   ${index + 1}. ${registro.mensajeId}`);
      console.log(`      📱 Destinatario: ${registro.destinatario}`);
      console.log(`      📊 Estado: ${registro.estado}`);
      console.log(`      ❌ Error: ${registro.codigoError || 'N/A'}`);
    });
    
    // 6. ANÁLISIS DEL PROBLEMA
    console.log('\n🔍 ANÁLISIS DEL PROBLEMA:');
    
    if (alertas.length === 0) {
      console.log('❌ PROBLEMA: No se están generando alertas');
      console.log('💡 CAUSAS POSIBLES:');
      console.log('   1. Las lecturas no superan los umbrales configurados');
      console.log('   2. El SensorAlertManagerService no se está ejecutando');
      console.log('   3. Los umbrales están mal configurados');
      console.log('   4. El servicio de alertas está desactivado');
    } else {
      console.log('✅ Las alertas se están generando correctamente');
      
      // Verificar si las notificaciones se están enviando
      const alertasSinNotificar = alertas.filter(a => !a.emailEnviado);
      if (alertasSinNotificar.length > 0) {
        console.log(`⚠️ PROBLEMA: ${alertasSinNotificar.length} alertas sin notificar`);
        console.log('💡 CAUSAS POSIBLES:');
        console.log('   1. El método enviarNotificacionesAlerta no se ejecuta');
        console.log('   2. Los destinatarios no están configurados correctamente');
        console.log('   3. Los servicios de notificación fallan');
        console.log('   4. La configuración de notificaciones está desactivada');
      } else {
        console.log('✅ Todas las alertas han sido notificadas');
      }
    }
    
    // 7. VERIFICAR UMBRALES CONFIGURADOS
    console.log('\n📏 UMBRALES CONFIGURADOS:');
    configuraciones.forEach((config, index) => {
      console.log(`   ${index + 1}. Sensor ID: ${config.sensorId}`);
      const umbrales = config.umbralCritico || {};
      console.log(`      📊 Umbrales: ${JSON.stringify(umbrales, null, 2)}`);
    });
    
    // 8. RECOMENDACIONES
    console.log('\n💡 RECOMENDACIONES PARA DEBUG:');
    console.log('   1. Verificar logs del backend para errores');
    console.log('   2. Confirmar que SensorAlertManagerService se ejecuta');
    console.log('   3. Verificar que los umbrales sean apropiados');
    console.log('   4. Probar con una lectura que supere claramente los umbrales');
    console.log('   5. Verificar que los servicios de notificación estén activos');
    
    // 9. PRÓXIMOS PASOS
    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('   1. Ejecutar: node simular-lectura-sensor.js');
    console.log('   2. Verificar logs del backend en tiempo real');
    console.log('   3. Confirmar que se ejecute enviarNotificacionesAlerta');
    console.log('   4. Verificar que lleguen las notificaciones');
    
  } catch (error) {
    console.error('❌ Error en debug del flujo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFlujoAlertas();
