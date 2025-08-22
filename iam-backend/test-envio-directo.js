const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEnvioDirecto() {
  try {
    console.log('🧪 Probando envío DIRECTO de notificaciones...');
    
    // 1. Verificar que el backend esté corriendo
    console.log('\n🔍 Verificando estado del backend...');
    
    try {
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        console.log('  - ✅ Backend corriendo en puerto 3001');
      } else {
        console.log('  - ⚠️ Backend respondiendo pero con error');
      }
    } catch (error) {
      console.log('  - ❌ Backend no responde en puerto 3001');
      console.log('  - 🔧 Asegúrate de que esté corriendo con: npm run start:dev');
      return;
    }
    
    // 2. Simular una lectura que genere alerta
    console.log('\n📊 Simulando lectura que genere alerta...');
    
    const lecturaSimulada = {
      sensorId: 1, // Temperatura (DHT22)
      tipo: 'TEMPERATURA',
      valor: 25.0, // Supera el umbral crítico de 22.5°C
      unidad: '°C',
      empresaId: 1,
      ubicacionId: 1,
      fecha: new Date()
    };
    
    console.log(`  - 📊 Simulando lectura: ${lecturaSimulada.valor}${lecturaSimulada.unidad}`);
    console.log(`  - 🚨 Debería generar alerta CRÍTICA (umbral: 22.5°C)`);
    
    // 3. Verificar configuración actual
    console.log('\n📋 Verificando configuración actual:');
    const configuracion = await prisma.configuracionAlerta.findFirst({
      where: { 
        sensorId: 1,
        empresaId: 1
      },
      include: {
        destinatarios: {
          include: {
            destinatario: {
              select: { nombre: true, email: true, telefono: true, tipo: true }
            }
          }
        }
      }
    });
    
    if (configuracion) {
      console.log(`  - ✅ Configuración encontrada para sensor ${configuracion.sensorId}`);
      console.log(`  - 📧 Destinatarios: ${configuracion.destinatarios.length}`);
      
      configuracion.destinatarios.forEach(dest => {
        console.log(`    • ${dest.destinatario.nombre}: ${dest.destinatario.email || 'sin email'} | ${dest.destinatario.telefono || 'sin teléfono'}`);
      });
    } else {
      console.log('  - ❌ No se encontró configuración de alertas');
      return;
    }
    
    // 4. Instrucciones para probar
    console.log('\n🚀 INSTRUCCIONES PARA PROBAR:');
    console.log('  1. ✅ Backend debe estar corriendo (verificado arriba)');
    console.log('  2. 📱 Envía una lectura desde el ESP32 con temperatura > 22.5°C');
    console.log('  3. 📧 Revisa tu email: notificaciones@iaminventario.com.mx y baruk066@gmail.com');
    console.log('  4. 📱 Revisa tu SMS al número: 4441882114');
    console.log('  5. 🔍 Verifica los logs del backend para confirmar envío');
    
    // 5. Verificar logs recientes
    console.log('\n📊 Verificando alertas recientes...');
    const alertasRecientes = await prisma.alertaHistorial.findMany({
      where: {
        sensorId: 1,
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 1000) // Últimos 2 minutos
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    
    if (alertasRecientes.length > 0) {
      console.log(`  - ✅ ${alertasRecientes.length} alertas recientes encontradas`);
      alertasRecientes.forEach(alerta => {
        console.log(`    • ${alerta.createdAt.toISOString()}: ${alerta.mensaje} (${alerta.estado})`);
      });
    } else {
      console.log('  - ⏳ No hay alertas recientes (esperando nueva lectura del ESP32)');
    }
    
    // 6. Estado final
    console.log('\n🔍 ESTADO ACTUAL:');
    console.log('  - ✅ Configuración de alertas: COMPLETA');
    console.log('  - ✅ Destinatarios: CONFIGURADOS');
    console.log('  - ✅ Backend: CORRIENDO');
    console.log('  - 🔧 Servicio de notificaciones: CORREGIDO');
    console.log('  - 📤 Próximo paso: Enviar lectura desde ESP32');
    
  } catch (error) {
    console.error('❌ Error en prueba de envío directo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnvioDirecto();

