const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarNotificaciones() {
  try {
    console.log('🔍 Verificando sistema de notificaciones...');
    
    // 1. Verificar alertas recientes que deberían haber generado notificaciones
    const alertasRecientes = await prisma.alertaHistorial.findMany({
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
    
    console.log(`📊 Alertas recientes: ${alertasRecientes.length}`);
    
    for (const alerta of alertasRecientes) {
      console.log(`\n🚨 Alerta: ${alerta.mensaje}`);
      console.log(`  - Sensor: ${alerta.sensor.nombre} (${alerta.sensor.tipo})`);
      console.log(`  - Severidad: ${alerta.severidad}`);
      console.log(`  - Creada: ${alerta.createdAt.toISOString()}`);
      
      // 2. Verificar si hay destinatarios configurados para este sensor
      const configuracionAlerta = await prisma.configuracionAlerta.findFirst({
        where: { sensorId: alerta.sensorId },
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
      
      if (configuracionAlerta && configuracionAlerta.destinatarios.length > 0) {
        console.log(`  - 📧 Destinatarios configurados: ${configuracionAlerta.destinatarios.length}`);
        configuracionAlerta.destinatarios.forEach(dest => {
          const d = dest.destinatario;
          console.log(`    • ${d.nombre} (${d.email}) - Tipo: ${d.tipo}${d.telefono ? ` - Tel: ${d.telefono}` : ''}`);
        });
        
        // 3. Verificar configuración de notificaciones
        if (configuracionAlerta.configuracionNotificacion) {
          const config = configuracionAlerta.configuracionNotificacion;
          console.log(`  - 📡 Configuración notificaciones:`);
          console.log(`    • Email: ${config.email ? '✅' : '❌'}`);
          console.log(`    • SMS: ${config.sms ? '✅' : '❌'}`);
          console.log(`    • WebSocket: ${config.webSocket ? '✅' : '❌'}`);
        }
      } else {
        console.log(`  - ❌ No hay destinatarios configurados`);
      }
    }
    
    // 4. Verificar logs del sistema de notificaciones
    console.log('\n📋 Verificando sistema de notificaciones...');
    
    // Buscar en la base de datos si hay algún log de notificaciones enviadas
    const notificacionesEnviadas = await prisma.$queryRaw`
      SELECT 
        'alerta_historial' as tabla,
        COUNT(*) as total,
        MAX(created_at) as ultima
      FROM "AlertaHistorial" 
      WHERE created_at >= NOW() - INTERVAL '5 minutes'
      
      UNION ALL
      
      SELECT 
        'configuracion_alerta' as tabla,
        COUNT(*) as total,
        MAX(created_at) as ultima
      FROM "ConfiguracionAlerta" 
      WHERE created_at >= NOW() - INTERVAL '5 minutes'
      
      UNION ALL
      
      SELECT 
        'destinatario_alerta' as tabla,
        COUNT(*) as total,
        MAX(created_at) as ultima
      FROM "DestinatarioAlerta" 
      WHERE created_at >= NOW() - INTERVAL '5 minutes'
    `;
    
    console.log('📊 Resumen de actividad reciente:');
    notificacionesEnviadas.forEach(row => {
      console.log(`  - ${row.tabla}: ${row.total} registros, última: ${row.ultima}`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando notificaciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarNotificaciones();

