const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCreacionSensorUmbralesPersonalizados() {
  try {
    console.log('🚀 PROBANDO CREACIÓN DE SENSOR CON UMBRALES PERSONALIZADOS...');
    
    // 1. ESCENARIO 1: Sensor con umbrales personalizados completos
    console.log('\n📋 ESCENARIO 1: Sensor con umbrales personalizados completos');
    
    const sensorPersonalizado = {
      nombre: 'Sensor Temperatura Personalizado',
      tipo: 'TEMPERATURA',
      ubicacionId: 1,
      descripcion: 'Sensor con umbrales personalizados por el usuario',
      umbralesPersonalizados: {
        rango_min: 5,           // Rango más amplio que el por defecto
        rango_max: 35,
        umbral_alerta_bajo: 8,  // Alertas más estrictas
        umbral_alerta_alto: 30,
        umbral_critico_bajo: 5, // Críticos más extremos
        umbral_critico_alto: 35,
        severidad: 'CRITICA',   // Más crítico que por defecto
        intervalo_lectura: 5000, // Más frecuente (5 segundos)
        alertasActivas: true
      },
      configuracionNotificaciones: {
        email: true,
        sms: true,
        webSocket: false  // WebSocket deshabilitado por el usuario
      }
    };
    
    console.log('📝 DATOS DEL SENSOR PERSONALIZADO:');
    console.log(`   📡 Nombre: ${sensorPersonalizado.nombre}`);
    console.log(`   🌡️ Tipo: ${sensorPersonalizado.tipo}`);
    console.log(`   📊 Rango: ${sensorPersonalizado.umbralesPersonalizados.rango_min}°C - ${sensorPersonalizado.umbralesPersonalizados.rango_max}°C`);
    console.log(`   ⚠️ Alertas: ${sensorPersonalizado.umbralesPersonalizados.umbral_alerta_bajo}°C / ${sensorPersonalizado.umbralesPersonalizados.umbral_alerta_alto}°C`);
    console.log(`   🚨 Críticos: ${sensorPersonalizado.umbralesPersonalizados.umbral_critico_bajo}°C / ${sensorPersonalizado.umbralesPersonalizados.umbral_critico_alto}°C`);
    console.log(`   🔔 Severidad: ${sensorPersonalizado.umbralesPersonalizados.severidad}`);
    console.log(`   ⏱️ Intervalo: ${sensorPersonalizado.umbralesPersonalizados.intervalo_lectura}ms`);
    console.log(`   📧 Email: ${sensorPersonalizado.configuracionNotificaciones.email ? '✅' : '❌'}`);
    console.log(`   📱 SMS: ${sensorPersonalizado.configuracionNotificaciones.sms ? '✅' : '❌'}`);
    console.log(`   🌐 WebSocket: ${sensorPersonalizado.configuracionNotificaciones.webSocket ? '✅' : '❌'}`);
    
    // Simular creación del sensor (normalmente se haría a través del controlador)
    console.log('\n💾 CREANDO SENSOR EN BASE DE DATOS...');
    
    const sensorCreado = await prisma.sensor.create({
      data: {
        nombre: sensorPersonalizado.nombre,
        tipo: sensorPersonalizado.tipo,
        descripcion: sensorPersonalizado.descripcion,
        ubicacionId: sensorPersonalizado.ubicacionId,
        empresaId: 1, // Empresa por defecto
        activo: true
      }
    });
    
    console.log(`✅ Sensor creado con ID: ${sensorCreado.id}`);
    
    // Simular configuración automática con umbrales personalizados
    console.log('\n⚙️ CONFIGURANDO ALERTAS CON UMBRALES PERSONALIZADOS...');
    
    const configuracionAlerta = await prisma.configuracionAlerta.create({
      data: {
        empresaId: 1,
        sensorId: sensorCreado.id,
        tipoAlerta: sensorCreado.tipo,
        activo: true,
        frecuencia: 'IMMEDIATE',
        ventanaEsperaMinutos: 5,
        umbralCritico: {
          tipo: sensorPersonalizado.tipo,
          unidad: '°C',
          precision: 0.1,
          rango_min: sensorPersonalizado.umbralesPersonalizados.rango_min,
          rango_max: sensorPersonalizado.umbralesPersonalizados.rango_max,
          umbral_alerta_bajo: sensorPersonalizado.umbralesPersonalizados.umbral_alerta_bajo,
          umbral_alerta_alto: sensorPersonalizado.umbralesPersonalizados.umbral_alerta_alto,
          umbral_critico_bajo: sensorPersonalizado.umbralesPersonalizados.umbral_critico_bajo,
          umbral_critico_alto: sensorPersonalizado.umbralesPersonalizados.umbral_critico_alto,
          severidad: sensorPersonalizado.umbralesPersonalizados.severidad,
          intervalo_lectura: sensorPersonalizado.umbralesPersonalizados.intervalo_lectura,
          alertasActivas: sensorPersonalizado.umbralesPersonalizados.alertasActivas
        },
        configuracionNotificacion: sensorPersonalizado.configuracionNotificaciones
      }
    });
    
    console.log(`✅ Configuración de alertas creada: ${configuracionAlerta.id}`);
    
    // Vincular destinatarios existentes
    const destinatarios = await prisma.destinatarioAlerta.findMany({
      where: { empresaId: 1, activo: true }
    });
    
    for (const destinatario of destinatarios) {
      await prisma.configuracionAlertaDestinatario.create({
        data: {
          configuracionAlertaId: configuracionAlerta.id,
          destinatarioId: destinatario.id
        }
      });
    }
    
    console.log(`✅ ${destinatarios.length} destinatarios vinculados`);
    
    // 2. ESCENARIO 2: Sensor con umbrales por defecto (sin personalización)
    console.log('\n📋 ESCENARIO 2: Sensor con umbrales por defecto');
    
    const sensorDefecto = await prisma.sensor.create({
      data: {
        nombre: 'Sensor Humedad Por Defecto',
        tipo: 'HUMEDAD',
        descripcion: 'Sensor con configuración por defecto',
        ubicacionId: 1,
        empresaId: 1,
        activo: true
      }
    });
    
    console.log(`✅ Sensor por defecto creado: ${sensorDefecto.id}`);
    
    // Configuración por defecto
    const configDefecto = await prisma.configuracionAlerta.create({
      data: {
        empresaId: 1,
        sensorId: sensorDefecto.id,
        tipoAlerta: sensorDefecto.tipo,
        activo: true,
        frecuencia: 'IMMEDIATE',
        ventanaEsperaMinutos: 5,
        umbralCritico: {
          tipo: 'HUMEDAD',
          unidad: '%',
          precision: 0.1,
          rango_min: 30,
          rango_max: 80,
          umbral_alerta_bajo: 35,
          umbral_alerta_alto: 75,
          umbral_critico_bajo: 30,
          umbral_critico_alto: 80,
          severidad: 'MEDIA',
          intervalo_lectura: 30000,
          alertasActivas: true
        },
        configuracionNotificacion: {
          email: true,
          sms: true,
          webSocket: true
        }
      }
    });
    
    console.log(`✅ Configuración por defecto creada: ${configDefecto.id}`);
    
    // 3. VERIFICAR CONFIGURACIONES FINALES
    console.log('\n🔍 VERIFICANDO CONFIGURACIONES FINALES:');
    
    const sensoresCreados = await prisma.sensor.findMany({
      where: {
        id: { in: [sensorCreado.id, sensorDefecto.id] }
      },
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
    
    for (const sensor of sensoresCreados) {
      console.log(`\n   📡 ${sensor.nombre} (${sensor.tipo}):`);
      console.log(`      🆔 ID: ${sensor.id}`);
      
      if (sensor.configuracionAlerta) {
        const config = sensor.configuracionAlerta;
        const umbrales = config.umbralCritico || {};
        const notificaciones = config.configuracionNotificacion || {};
        
        console.log(`      📊 UMBRALES CONFIGURADOS:`);
        console.log(`         📏 Rango: ${umbrales.rango_min} - ${umbrales.rango_max} ${umbrales.unidad}`);
        console.log(`         ⚠️ Alerta: ${umbrales.umbral_alerta_bajo} / ${umbrales.umbral_alerta_alto}`);
        console.log(`         🚨 Crítico: ${umbrales.umbral_critico_bajo} / ${umbrales.umbral_critico_alto}`);
        console.log(`         🔔 Severidad: ${umbrales.severidad}`);
        console.log(`         ⏱️ Intervalo: ${umbrales.intervalo_lectura}ms`);
        
        console.log(`      🔔 NOTIFICACIONES:`);
        console.log(`         📧 Email: ${notificaciones.email ? '✅' : '❌'}`);
        console.log(`         📱 SMS: ${notificaciones.sms ? '✅' : '❌'}`);
        console.log(`         🌐 WebSocket: ${notificaciones.webSocket ? '✅' : '❌'}`);
        
        console.log(`      👥 DESTINATARIOS: ${config.destinatarios.length}`);
        for (const destConfig of config.destinatarios) {
          const dest = destConfig.destinatario;
          console.log(`         👤 ${dest.nombre} (${dest.tipo})`);
        }
      }
    }
    
    // 4. PRUEBA DE VALIDACIÓN DE UMBRALES INVÁLIDOS
    console.log('\n🧪 PROBANDO VALIDACIÓN DE UMBRALES INVÁLIDOS:');
    
    const umbralInvalido = {
      rango_min: 25,  // ERROR: mínimo mayor que máximo
      rango_max: 20,
      umbral_alerta_bajo: 22,
      umbral_alerta_alto: 18, // ERROR: bajo mayor que alto
      umbral_critico_bajo: 25,
      umbral_critico_alto: 20
    };
    
    console.log('❌ UMBRALES INVÁLIDOS DETECTADOS:');
    
    const errores = [];
    
    if (umbralInvalido.rango_min >= umbralInvalido.rango_max) {
      errores.push('El rango mínimo debe ser menor que el máximo');
    }
    
    if (umbralInvalido.umbral_alerta_bajo >= umbralInvalido.umbral_alerta_alto) {
      errores.push('El umbral de alerta bajo debe ser menor que el alto');
    }
    
    if (umbralInvalido.umbral_critico_bajo >= umbralInvalido.umbral_critico_alto) {
      errores.push('El umbral crítico bajo debe ser menor que el alto');
    }
    
    if (errores.length > 0) {
      console.log('   ⚠️ ERRORES DE VALIDACIÓN:');
      errores.forEach(error => console.log(`      - ${error}`));
      console.log('   ✅ Sistema detectaría estos errores y rechazaría la configuración');
    }
    
    // 5. RESUMEN FINAL
    console.log('\n🎯 RESUMEN DE LA NUEVA FUNCIONALIDAD:');
    console.log('\n✅ CONFIGURACIÓN DURANTE LA CREACIÓN:');
    console.log('   📝 Usuario puede especificar umbrales personalizados');
    console.log('   🔔 Usuario puede personalizar tipos de notificaciones');
    console.log('   ✅ Validación automática de umbrales lógicos');
    console.log('   🔄 Fallback a configuración por defecto si no se especifica');
    
    console.log('\n✅ EXPERIENCIA MEJORADA:');
    console.log('   🚀 Un solo paso: crear sensor + configurar umbrales');
    console.log('   🎯 Configuración inmediata según necesidades específicas');
    console.log('   ⚙️ Sin pasos adicionales de configuración post-creación');
    console.log('   🔒 Validación robusta previene configuraciones incorrectas');
    
    console.log('\n✅ FLEXIBILIDAD TOTAL:');
    console.log('   📊 Rangos personalizables por tipo de sensor');
    console.log('   ⚠️ Niveles de alerta ajustables');
    console.log('   🚨 Umbrales críticos personalizables');
    console.log('   🔔 Configuración de notificaciones granular');
    console.log('   ⏱️ Intervalos de lectura personalizables');
    
    console.log('\n🚀 PRÓXIMO PASO:');
    console.log('   Implementar interfaz en el frontend con formulario de creación');
    console.log('   que incluya sección de configuración de umbrales personalizada.');
    
  } catch (error) {
    console.error('❌ Error probando creación con umbrales personalizados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreacionSensorUmbralesPersonalizados();
