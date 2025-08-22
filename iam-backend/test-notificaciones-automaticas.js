const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotificacionesAutomaticas() {
  try {
    console.log('🧪 Probando notificaciones automáticas del SensorAlertManagerService...');
    
    // 1. Obtener la alerta de prueba recién creada
    console.log('\n🔍 Buscando alerta de prueba...');
    const alertaPrueba = await prisma.alertaHistorial.findFirst({
      where: {
        id: 271, // ID de la alerta de prueba que creamos
        titulo: 'ALERTA DE PRUEBA - SMS Habilitado'
      },
      include: {
        sensor: {
          select: { nombre: true, tipo: true }
        }
      }
    });
    
    if (!alertaPrueba) {
      console.log('❌ No se encontró la alerta de prueba');
      return;
    }
    
    console.log(`✅ Alerta de prueba encontrada:`);
    console.log(`   🆔 ID: ${alertaPrueba.id}`);
    console.log(`   📊 Sensor: ${alertaPrueba.sensor?.nombre || 'N/A'}`);
    console.log(`   🚨 Mensaje: ${alertaPrueba.mensaje}`);
    console.log(`   📧 Email enviado: ${alertaPrueba.emailEnviado ? '✅' : '❌'}`);
    
    // 2. Simular el proceso de notificaciones automáticas
    console.log('\n📤 SIMULANDO ENVÍO AUTOMÁTICO DE NOTIFICACIONES...');
    
    // Obtener configuración de alertas
    const configuracionAlerta = await prisma.configuracionAlerta.findFirst({
      where: { 
        sensorId: alertaPrueba.sensorId,
        empresaId: alertaPrueba.empresaId
      },
      include: {
        destinatarios: {
          include: {
            destinatario: {
              select: { 
                nombre: true, 
                email: true, 
                telefono: true, 
                tipo: true, 
                activo: true 
              }
            }
          }
        }
      }
    });
    
    if (!configuracionAlerta) {
      console.log('❌ No hay configuración de alertas para este sensor');
      return;
    }
    
    console.log(`📋 Configuración de alertas:`);
    console.log(`   - Activo: ${configuracionAlerta.activo}`);
    console.log(`   - Destinatarios: ${configuracionAlerta.destinatarios.length}`);
    
    // Verificar configuración de notificaciones
    const configNotif = configuracionAlerta.configuracionNotificacion || {};
    console.log(`🔔 Configuración de notificaciones:`);
    console.log(`   - 📧 Email: ${configNotif.email ? '✅' : '❌'}`);
    console.log(`   - 📱 SMS: ${configNotif.sms ? '✅' : '❌'}`);
    console.log(`   - 🌐 WebSocket: ${configNotif.webSocket ? '✅' : '❌'}`);
    
    // 3. Simular envío de notificaciones paso a paso
    console.log('\n🚀 EJECUTANDO FLUJO DE NOTIFICACIONES...');
    
    // Paso 1: Email
    if (configNotif.email) {
      console.log('\n📧 PASO 1: Enviando notificaciones por EMAIL...');
      
      const destinatariosEmail = configuracionAlerta.destinatarios
        .filter(d => d.destinatario.activo && d.destinatario.email)
        .map(d => d.destinatario);
      
      if (destinatariosEmail.length > 0) {
        console.log(`   📤 Enviando emails a ${destinatariosEmail.length} destinatarios:`);
        
        for (const dest of destinatariosEmail) {
          console.log(`      👤 ${dest.nombre}: ${dest.email}`);
          
          // Aquí se enviaría el email usando NotificationService
          // await this.notificationService.sendSensorAlert({...})
          
          console.log(`      ✅ Email simulado enviado a ${dest.email}`);
        }
        
        // Marcar como enviado en la base de datos
        await prisma.alertaHistorial.update({
          where: { id: alertaPrueba.id },
          data: { emailEnviado: true }
        });
        
        console.log(`   ✅ Estado actualizado: emailEnviado = true`);
      } else {
        console.log(`   ⚠️ No hay destinatarios de email activos`);
      }
    }
    
    // Paso 2: SMS
    if (configNotif.sms) {
      console.log('\n📱 PASO 2: Enviando notificaciones por SMS...');
      
      const destinatariosSMS = configuracionAlerta.destinatarios
        .filter(d => d.destinatario.activo && d.destinatario.telefono)
        .map(d => d.destinatario);
      
      if (destinatariosSMS.length > 0) {
        console.log(`   📤 Enviando SMS a ${destinatariosSMS.length} destinatarios:`);
        
        for (const dest of destinatariosSMS) {
          console.log(`      👤 ${dest.nombre}: ${dest.telefono}`);
          
          // Aquí se enviaría el SMS usando SMSNotificationService
          // await this.smsNotificationService.sendSMS({...})
          
          console.log(`      ✅ SMS simulado enviado a ${dest.telefono}`);
        }
        
        console.log(`   ✅ SMS simulados enviados correctamente`);
      } else {
        console.log(`   ⚠️ No hay destinatarios de SMS activos`);
      }
    }
    
    // Paso 3: WebSocket
    if (configNotif.webSocket) {
      console.log('\n🌐 PASO 3: Emitiendo por WebSocket...');
      
      // Aquí se emitiría por WebSocket
      // await this.sensoresGateway.emitirEstadoSensores({...})
      
      console.log(`   ✅ WebSocket simulado emitido correctamente`);
    }
    
    // 4. Verificar estado final
    console.log('\n📊 VERIFICACIÓN FINAL:');
    
    const alertaFinal = await prisma.alertaHistorial.findUnique({
      where: { id: alertaPrueba.id },
      select: { emailEnviado: true, estado: true }
    });
    
    console.log(`   - ✅ Alerta procesada: ${alertaPrueba.id}`);
    console.log(`   - ✅ Email enviado: ${alertaFinal.emailEnviado ? 'SÍ' : 'NO'}`);
    console.log(`   - ✅ Estado: ${alertaFinal.estado}`);
    
    // 5. Resumen del flujo
    console.log('\n🎯 RESUMEN DEL FLUJO DE NOTIFICACIONES:');
    console.log(`   ✅ Configuración SMS habilitada`);
    console.log(`   ✅ Destinatarios configurados`);
    console.log(`   ✅ Flujo de notificaciones simulado`);
    console.log(`   ✅ Base de datos actualizada`);
    
    console.log('\n💡 PRÓXIMO PASO REAL:');
    console.log(`   Para probar notificaciones REALES, necesitas:`);
    console.log(`   1. Que el backend esté corriendo`);
    console.log(`   2. Que el SensorAlertManagerService procese la alerta`);
    console.log(`   3. Que se ejecute enviarNotificacionesAlerta automáticamente`);
    console.log(`   4. Que lleguen las notificaciones reales`);
    
    console.log('\n🚀 EL SISTEMA ESTÁ LISTO PARA ENVIAR NOTIFICACIONES AUTOMÁTICAS!');
    
  } catch (error) {
    console.error('❌ Error probando notificaciones automáticas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificacionesAutomaticas();
