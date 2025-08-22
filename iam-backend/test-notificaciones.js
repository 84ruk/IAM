const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotificaciones() {
  try {
    console.log('🧪 Probando sistema de notificaciones...');
    
    // 1. Verificar si hay sensores configurados
    const sensores = await prisma.sensor.findMany({
      take: 5,
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
    
    if (sensores.length === 0) {
      console.log('❌ No hay sensores configurados en el sistema');
      return;
    }
    
    console.log(`📡 Encontrados ${sensores.length} sensores:`);
    for (const sensor of sensores) {
      console.log(`  - ${sensor.nombre} (${sensor.tipo}) - ID: ${sensor.id}`);
      if (sensor.configuracionAlerta) {
        console.log(`    ✅ Configuración de alertas: ${sensor.configuracionAlerta.destinatarios.length} destinatarios`);
      } else {
        console.log(`    ❌ Sin configuración de alertas`);
      }
    }
    
    // 2. Verificar la última alerta generada
    const ultimaAlerta = await prisma.alertaHistorial.findFirst({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sensor: {
          select: { nombre: true, tipo: true }
        }
      }
    });
    
    if (!ultimaAlerta) {
      console.log('\n📝 No hay alertas recientes, creando alerta de prueba...');
      
      // Crear una alerta de prueba
      const alertaPrueba = await prisma.alertaHistorial.create({
        data: {
          empresaId: sensores[0].empresaId,
          tipo: 'SENSOR_ALERT',
          severidad: 'MEDIA',
          titulo: 'Alerta de Prueba - Sistema de Notificaciones',
          mensaje: 'Esta es una alerta de prueba para verificar el sistema de notificaciones',
          sensorId: sensores[0].id,
          valor: '25.5',
          estado: 'ENVIADA',
          emailEnviado: false,
          condicionActivacion: {
            tipo: 'TEMPERATURA',
            valor: 25.5,
            umbral: 25.0
          }
        }
      });
      
      console.log(`✅ Alerta de prueba creada: ${alertaPrueba.id}`);
      
      // Usar esta alerta para las pruebas
      ultimaAlerta = alertaPrueba;
    }
    
    console.log(`\n🚨 Última alerta: ${ultimaAlerta.mensaje || ultimaAlerta.titulo}`);
    console.log(`  - Sensor: ${ultimaAlerta.sensor?.nombre || 'N/A'}`);
    console.log(`  - Severidad: ${ultimaAlerta.severidad}`);
    console.log(`  - Creada: ${ultimaAlerta.createdAt?.toISOString() || ultimaAlerta.fechaEnvio?.toISOString()}`);
    
    // 3. Verificar si hay destinatarios configurados
    const configuracionAlerta = await prisma.configuracionAlerta.findFirst({
      where: { sensorId: ultimaAlerta.sensorId },
      include: {
        destinatarios: {
          include: {
            destinatario: {
              select: { nombre: true, email: true, telefono: true, tipo: true, activo: true }
            }
          }
        }
      }
    });
    
    if (!configuracionAlerta) {
      console.log('\n❌ No hay configuración de alertas para este sensor');
      console.log('💡 Creando configuración de prueba...');
      
      // Crear configuración de prueba
      const configPrueba = await prisma.configuracionAlerta.create({
        data: {
          empresaId: ultimaAlerta.empresaId,
          sensorId: ultimaAlerta.sensorId,
          tipoAlerta: 'TEMPERATURA',
          activo: true,
          frecuencia: 'IMMEDIATE',
          ventanaEsperaMinutos: 5,
          umbralCritico: {
            temperaturaMax: 25,
            temperaturaMin: 15
          },
          configuracionNotificacion: {
            email: true,
            sms: true,
            webSocket: true
          }
        }
      });
      
      console.log(`✅ Configuración de alertas creada: ${configPrueba.id}`);
      
      // Crear destinatario de prueba
      const destinatarioPrueba = await prisma.destinatarioAlerta.create({
        data: {
          empresaId: ultimaAlerta.empresaId,
          nombre: 'Admin Sistema',
          email: 'admin@test.com',
          telefono: '+1234567890',
          tipo: 'ADMIN',
          activo: true
        }
      });
      
      console.log(`✅ Destinatario de prueba creado: ${destinatarioPrueba.id}`);
      
      // Vincular destinatario con configuración
      await prisma.configuracionAlertaDestinatario.create({
        data: {
          configuracionAlertaId: configPrueba.id,
          destinatarioId: destinatarioPrueba.id
        }
      });
      
      console.log(`✅ Destinatario vinculado a configuración`);
      
      // Recargar la configuración
      configuracionAlerta = await prisma.configuracionAlerta.findFirst({
        where: { id: configPrueba.id },
        include: {
          destinatarios: {
            include: {
              destinatario: true
            }
          }
        }
      });
    }
    
    console.log(`\n📋 Configuración de alertas:`);
    console.log(`  - Activo: ${configuracionAlerta.activo}`);
    console.log(`  - Tipo: ${configuracionAlerta.tipoAlerta}`);
    console.log(`  - Destinatarios: ${configuracionAlerta.destinatarios.length}`);
    
    // 4. Verificar cada destinatario
    for (const dest of configuracionAlerta.destinatarios) {
      const d = dest.destinatario;
      console.log(`\n👤 Destinatario: ${d.nombre}`);
      console.log(`  - Email: ${d.email}`);
      console.log(`  - Teléfono: ${d.telefono || 'No configurado'}`);
      console.log(`  - Tipo: ${d.tipo}`);
      console.log(`  - Activo: ${d.activo ? '✅' : '❌'}`);
      
      // 5. Verificar si debería recibir notificaciones
      if (configuracionAlerta.configuracionNotificacion) {
        const config = configuracionAlerta.configuracionNotificacion;
        console.log(`  - 📧 Email habilitado: ${config.email ? '✅' : '❌'}`);
        console.log(`  - 📱 SMS habilitado: ${config.sms ? '✅' : '❌'}`);
        console.log(`  - 🌐 WebSocket habilitado: ${config.webSocket ? '✅' : '❌'}`);
        
        // 6. Simular envío de notificaciones
        if (config.email && d.email && d.activo) {
          console.log(`  - 📧 ENVIANDO EMAIL a: ${d.email}`);
          // Aquí se enviaría el email
        }
        
        if (config.sms && d.telefono && d.activo) {
          console.log(`  - 📱 ENVIANDO SMS a: ${d.telefono}`);
          // Aquí se enviaría el SMS
        }
        
        if (config.webSocket) {
          console.log(`  - 🌐 EMITIENDO POR WEBSOCKET`);
          // Aquí se emitiría por WebSocket
        }
      }
    }
    
    // 7. Verificar logs del sistema
    console.log('\n📊 Resumen del sistema:');
    console.log(`  - ✅ Alerta generada: ${ultimaAlerta.id}`);
    console.log(`  - ✅ Sensor configurado: ${ultimaAlerta.sensor?.nombre || 'N/A'}`);
    console.log(`  - ✅ Destinatarios configurados: ${configuracionAlerta.destinatarios.length}`);
    console.log(`  - ✅ Configuración activa: ${configuracionAlerta.activo}`);
    
    // 8. Verificar si hay algún problema en el envío
    console.log('\n🔍 Diagnóstico:');
    if (configuracionAlerta.destinatarios.length === 0) {
      console.log('  - ❌ PROBLEMA: No hay destinatarios configurados');
    } else if (!configuracionAlerta.activo) {
      console.log('  - ❌ PROBLEMA: Configuración de alertas inactiva');
    } else if (!configuracionAlerta.configuracionNotificacion) {
      console.log('  - ❌ PROBLEMA: No hay configuración de notificaciones');
    } else {
      const config = configuracionAlerta.configuracionNotificacion;
      if (!config.email && !config.sms && !config.webSocket) {
        console.log('  - ❌ PROBLEMA: Todas las notificaciones están deshabilitadas');
      } else {
        console.log('  - ✅ CONFIGURACIÓN CORRECTA: Las notificaciones deberían enviarse');
        console.log('  - 🔍 VERIFICAR: Logs del servicio de notificaciones en el backend');
      }
    }
    
  } catch (error) {
    console.error('❌ Error probando notificaciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificaciones();
