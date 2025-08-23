const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugConfiguracionAlertas() {
  try {
    console.log('🔍 Consultando configuración de alertas para sensor 1...');
    
    const configuracion = await prisma.configuracionAlerta.findFirst({
      where: { sensorId: 1 },
      include: {
        destinatarios: {
          include: {
            destinatario: true
          }
        }
      }
    });
    
    if (!configuracion) {
      console.log('❌ No se encontró configuración de alerta para sensor 1');
      return;
    }
    
    console.log('✅ Configuración encontrada:');
    console.log('📋 ID:', configuracion.id);
    console.log('🔗 Sensor ID:', configuracion.sensorId);
    console.log('✅ Activo:', configuracion.activo);
    console.log('⚙️ Configuración Notificación:', JSON.stringify(configuracion.configuracionNotificacion, null, 2));
    console.log('📧 Destinatarios:', configuracion.destinatarios.length);
    
    console.log('\n📋 Detalle de destinatarios:');
    configuracion.destinatarios.forEach((dest, index) => {
      console.log(`${index + 1}. Email: ${dest.destinatario.email}`);
      console.log(`   Teléfono: ${dest.destinatario.telefono}`);
      console.log(`   Activo: ${dest.destinatario.activo}`);
      console.log(`   Tipo notificación: ${dest.tipoNotificacion}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugConfiguracionAlertas();
