const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simularLecturaSensor() {
  try {
    console.log('🧪 Simulando nueva lectura de sensor para probar notificaciones...');
    
    // 1. Obtener un sensor activo con configuración de alertas
    const sensor = await prisma.sensor.findFirst({
      where: { 
        activo: true,
        configuracionAlerta: {
          activo: true
        }
      },
      include: {
        configuracionAlerta: {
          include: {
            destinatarios: {
              include: {
                destinatario: {
                  select: { nombre: true, email: true, telefono: true, activo: true }
                }
              }
            }
          }
        }
      }
    });
    
    if (!sensor) {
      console.log('❌ No hay sensores activos con configuración de alertas');
      return;
    }
    
    console.log(`📡 Sensor seleccionado: ${sensor.nombre} (${sensor.tipo})`);
    console.log(`   - ID: ${sensor.id}`);
    console.log(`   - Ubicación: ${sensor.ubicacionId}`);
    console.log(`   - Empresa: ${sensor.empresaId}`);
    console.log(`   - Destinatarios configurados: ${sensor.configuracionAlerta.destinatarios.length}`);
    
    // 2. Simular una lectura que active una alerta
    let valorAlerta;
    let mensajeAlerta;
    let severidad;
    
    switch (sensor.tipo) {
      case 'TEMPERATURA':
        valorAlerta = 30.5; // Temperatura alta que debería activar alerta
        mensajeAlerta = `¡ALERTA! Temperatura crítica: ${valorAlerta}°C - Supera umbral de seguridad`;
        severidad = 'CRITICA';
        break;
      case 'HUMEDAD':
        valorAlerta = 85.0; // Humedad alta
        mensajeAlerta = `¡ALERTA! Humedad crítica: ${valorAlerta}% - Condiciones desfavorables`;
        severidad = 'ALTA';
        break;
      case 'PESO':
        valorAlerta = 950.0; // Peso alto
        mensajeAlerta = `¡ALERTA! Peso crítico: ${valorAlerta}kg - Límite de capacidad alcanzado`;
        severidad = 'CRITICA';
        break;
      default:
        valorAlerta = 100.0;
        mensajeAlerta = `¡ALERTA! Valor crítico: ${valorAlerta} - Supera umbral configurado`;
        severidad = 'MEDIA';
    }
    
    console.log(`\n📊 Simulando lectura crítica:`);
    console.log(`   - Tipo: ${sensor.tipo}`);
    console.log(`   - Valor: ${valorAlerta}`);
    console.log(`   - Mensaje: ${mensajeAlerta}`);
    console.log(`   - Severidad: ${severidad}`);
    
    // 3. Crear la lectura del sensor
    const lectura = await prisma.sensorLectura.create({
      data: {
        tipo: sensor.tipo,
        valor: valorAlerta,
        unidad: sensor.tipo === 'TEMPERATURA' ? '°C' : sensor.tipo === 'HUMEDAD' ? '%' : 'kg',
        sensorId: sensor.id,
        ubicacionId: sensor.ubicacionId,
        empresaId: sensor.empresaId,
        fecha: new Date()
      }
    });
    
    console.log(`✅ Lectura del sensor creada: ${lectura.id}`);
    
    // 4. Crear la alerta correspondiente
    const alerta = await prisma.alertaHistorial.create({
      data: {
        empresaId: sensor.empresaId,
        tipo: 'SENSOR_ALERT',
        severidad: severidad,
        titulo: `Alerta de ${sensor.tipo}`,
        mensaje: mensajeAlerta,
        sensorId: sensor.id,
        valor: valorAlerta.toString(),
        ubicacionId: sensor.ubicacionId,
        estado: 'ENVIADA',
        emailEnviado: false,
        condicionActivacion: {
          tipo: sensor.tipo,
          valor: valorAlerta,
          umbral: sensor.tipo === 'TEMPERATURA' ? 25 : sensor.tipo === 'HUMEDAD' ? 80 : 900,
          sensorId: sensor.id,
          timestamp: new Date().toISOString()
        }
      }
    });
    
    console.log(`✅ Alerta creada: ${alerta.id}`);
    
    // 5. Verificar destinatarios para notificaciones
    const destinatariosActivos = sensor.configuracionAlerta.destinatarios
      .filter(d => d.destinatario.activo)
      .map(d => d.destinatario);
    
    console.log(`\n👥 Destinatarios para notificaciones (${destinatariosActivos.length}):`);
    for (const dest of destinatariosActivos) {
      console.log(`  - ${dest.nombre}`);
      console.log(`    📧 Email: ${dest.email || 'No configurado'}`);
      console.log(`    📱 Teléfono: ${dest.telefono || 'No configurado'}`);
    }
    
    // 6. Simular envío de notificaciones
    console.log(`\n📤 Simulando envío de notificaciones...`);
    
    const configNotif = sensor.configuracionAlerta.configuracionNotificacion || {};
    
    // Email
    if (configNotif.email !== false) {
      const emails = destinatariosActivos
        .map(d => d.email)
        .filter(email => email && email.trim() !== '');
      
      if (emails.length > 0) {
        console.log(`📧 Enviando emails a: ${emails.join(', ')}`);
        
        // Marcar como enviado
        await prisma.alertaHistorial.update({
          where: { id: alerta.id },
          data: { emailEnviado: true }
        });
        
        console.log(`✅ Emails marcados como enviados`);
      }
    }
    
    // SMS
    if (configNotif.sms !== false) {
      const telefonos = destinatariosActivos
        .filter(d => d.telefono && d.telefono.trim() !== '')
        .map(d => d.telefono)
        .filter(tel => {
          const phoneRegex = /^\+?[1-9]\d{1,14}$/;
          return phoneRegex.test(tel.replace(/\s/g, ''));
        });
      
      if (telefonos.length > 0) {
        console.log(`📱 Enviando SMS a: ${telefonos.join(', ')}`);
        console.log(`✅ SMS marcados como enviados`);
      }
    }
    
    // WebSocket
    if (configNotif.webSocket !== false) {
      console.log(`🌐 Emitiendo por WebSocket`);
      console.log(`✅ WebSocket emitido`);
    }
    
    // 7. Verificar estado final
    const alertaFinal = await prisma.alertaHistorial.findUnique({
      where: { id: alerta.id },
      select: { emailEnviado: true, estado: true }
    });
    
    console.log(`\n📊 Estado final de la alerta:`);
    console.log(`  - ✅ ID: ${alerta.id}`);
    console.log(`  - ✅ Estado: ${alertaFinal.estado}`);
    console.log(`  - ✅ Email enviado: ${alertaFinal.emailEnviado ? 'SÍ' : 'NO'}`);
    
    console.log(`\n🎯 SIMULACIÓN COMPLETADA:`);
    console.log(`   Se ha creado una alerta de prueba que simula el flujo completo del sistema.`);
    console.log(`   En el backend real, el SensorAlertManagerService procesaría esta lectura`);
    console.log(`   y enviaría las notificaciones automáticamente a los destinatarios configurados.`);
    
    console.log(`\n💡 Para probar notificaciones reales:`);
    console.log(`   1. Asegúrate de que el backend esté corriendo`);
    console.log(`   2. Envía una lectura real desde el ESP32`);
    console.log(`   3. Verifica los logs del backend para confirmar envío de notificaciones`);
    console.log(`   4. Revisa tu email y SMS para confirmar recepción`);
    
  } catch (error) {
    console.error('❌ Error simulando lectura de sensor:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simularLecturaSensor();
