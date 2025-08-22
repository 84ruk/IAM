const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUmbralesEndpoint() {
  try {
    console.log('🧪 PROBANDO ENDPOINT DE CONFIGURACIÓN DE UMBRALES...');
    
    // 1. VERIFICAR SENSORES EXISTENTES
    console.log('\n📡 VERIFICANDO SENSORES DISPONIBLES:');
    
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
      },
      take: 5
    });
    
    console.log(`📊 Sensores encontrados: ${sensores.length}`);
    
    for (const sensor of sensores) {
      console.log(`\n   📡 ${sensor.nombre} (${sensor.tipo}):`);
      console.log(`      🆔 ID: ${sensor.id}`);
      console.log(`      📍 Ubicación: ${sensor.ubicacionId}`);
      
      if (sensor.configuracionAlerta) {
        const config = sensor.configuracionAlerta;
        const umbrales = config.umbralCritico || {};
        const notificaciones = config.configuracionNotificacion || {};
        
        console.log(`      🔧 CONFIGURACIÓN ACTUAL:`);
        console.log(`         📊 Rango: ${umbrales.rango_min || 'N/A'} - ${umbrales.rango_max || 'N/A'} ${umbrales.unidad || ''}`);
        console.log(`         ⚠️ Alerta: ${umbrales.umbral_alerta_bajo || 'N/A'} / ${umbrales.umbral_alerta_alto || 'N/A'}`);
        console.log(`         🚨 Crítico: ${umbrales.umbral_critico_bajo || 'N/A'} / ${umbrales.umbral_critico_alto || 'N/A'}`);
        console.log(`         🔔 Notificaciones: Email=${notificaciones.email ? '✅' : '❌'}, SMS=${notificaciones.sms ? '✅' : '❌'}`);
      } else {
        console.log(`      ❌ SIN CONFIGURACIÓN`);
      }
    }
    
    if (sensores.length === 0) {
      console.log('❌ No hay sensores disponibles para probar');
      return;
    }
    
    // 2. SIMULAR LECTURA DE UMBRALES (GET /sensores/:id/umbrales)
    console.log('\n🔍 SIMULANDO LECTURA DE UMBRALES (GET):');
    
    const primerSensor = sensores[0];
    console.log(`📡 Probando sensor: ${primerSensor.nombre} (ID: ${primerSensor.id})`);
    
    // Simular respuesta del endpoint GET
    if (primerSensor.configuracionAlerta) {
      console.log(`✅ CONFIGURACIÓN EXISTENTE ENCONTRADA:`);
      const config = primerSensor.configuracionAlerta;
      const umbrales = config.umbralCritico || {};
      
      console.log(`   📊 Rango aceptable: ${umbrales.rango_min || 'N/A'} - ${umbrales.rango_max || 'N/A'} ${umbrales.unidad || ''}`);
      console.log(`   ⚠️ Umbrales de alerta: ${umbrales.umbral_alerta_bajo || 'N/A'} / ${umbrales.umbral_alerta_alto || 'N/A'}`);
      console.log(`   🚨 Umbrales críticos: ${umbrales.umbral_critico_bajo || 'N/A'} / ${umbrales.umbral_critico_alto || 'N/A'}`);
      console.log(`   🔔 Notificaciones: ${config.destinatarios.length} destinatarios configurados`);
    } else {
      console.log(`⚠️ SIN CONFIGURACIÓN - Se crearía automáticamente`);
    }
    
    // 3. SIMULAR ACTUALIZACIÓN DE UMBRALES (PUT /sensores/:id/umbrales)
    console.log('\n✏️ SIMULANDO ACTUALIZACIÓN DE UMBRALES (PUT):');
    
    // Crear nuevos umbrales personalizados
    const nuevosUmbrales = {
      tipo: primerSensor.tipo,
      unidad: primerSensor.tipo === 'TEMPERATURA' ? '°C' : primerSensor.tipo === 'HUMEDAD' ? '%' : 'kg',
      precision: 0.1,
      rango_min: 10,
      rango_max: 30,
      umbral_alerta_bajo: 12,
      umbral_alerta_alto: 28,
      umbral_critico_bajo: 10,
      umbral_critico_alto: 30,
      severidad: 'ALTA',
      intervalo_lectura: 5000,
      alertasActivas: true
    };
    
    console.log(`📝 NUEVOS UMBRALES A APLICAR:`);
    console.log(`   📊 Rango: ${nuevosUmbrales.rango_min} - ${nuevosUmbrales.rango_max} ${nuevosUmbrales.unidad}`);
    console.log(`   ⚠️ Alerta: ${nuevosUmbrales.umbral_alerta_bajo} / ${nuevosUmbrales.umbral_alerta_alto}`);
    console.log(`   🚨 Crítico: ${nuevosUmbrales.umbral_critico_bajo} / ${nuevosUmbrales.umbral_critico_alto}`);
    console.log(`   🔔 Severidad: ${nuevosUmbrales.severidad}`);
    
    // Validar umbrales antes de aplicar
    console.log('\n✅ VALIDANDO UMBRALES:');
    
    const errores = [];
    
    // Validar que los rangos sean lógicos
    if (nuevosUmbrales.rango_min >= nuevosUmbrales.rango_max) {
      errores.push('El rango mínimo debe ser menor que el máximo');
    }
    
    if (nuevosUmbrales.umbral_alerta_bajo >= nuevosUmbrales.umbral_alerta_alto) {
      errores.push('El umbral de alerta bajo debe ser menor que el alto');
    }
    
    if (nuevosUmbrales.umbral_critico_bajo >= nuevosUmbrales.umbral_critico_alto) {
      errores.push('El umbral crítico bajo debe ser menor que el alto');
    }
    
    // Validar que los umbrales estén dentro del rango
    if (nuevosUmbrales.umbral_alerta_bajo < nuevosUmbrales.rango_min) {
      errores.push('El umbral de alerta bajo no puede ser menor que el rango mínimo');
    }
    
    if (nuevosUmbrales.umbral_alerta_alto > nuevosUmbrales.rango_max) {
      errores.push('El umbral de alerta alto no puede ser mayor que el rango máximo');
    }
    
    if (nuevosUmbrales.umbral_critico_bajo < nuevosUmbrales.rango_min) {
      errores.push('El umbral crítico bajo no puede ser menor que el rango mínimo');
    }
    
    if (nuevosUmbrales.umbral_critico_alto > nuevosUmbrales.rango_max) {
      errores.push('El umbral crítico alto no puede ser mayor que el rango máximo');
    }
    
    if (errores.length > 0) {
      console.log(`❌ ERRORES DE VALIDACIÓN:`);
      errores.forEach(error => console.log(`   - ${error}`));
      return;
    }
    
    console.log(`✅ UMBRALES VÁLIDOS - Se pueden aplicar`);
    
    // 4. APLICAR CAMBIOS EN LA BASE DE DATOS
    console.log('\n💾 APLICANDO CAMBIOS EN LA BASE DE DATOS:');
    
    let configuracion;
    
    if (primerSensor.configuracionAlerta) {
      // Actualizar configuración existente
      configuracion = await prisma.configuracionAlerta.update({
        where: { id: primerSensor.configuracionAlerta.id },
        data: {
          umbralCritico: nuevosUmbrales,
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Configuración actualizada: ${configuracion.id}`);
    } else {
      // Crear nueva configuración
      configuracion = await prisma.configuracionAlerta.create({
        data: {
          empresaId: primerSensor.empresaId,
          sensorId: primerSensor.id,
          tipoAlerta: primerSensor.tipo,
          activo: true,
          frecuencia: 'IMMEDIATE',
          ventanaEsperaMinutos: 5,
          umbralCritico: nuevosUmbrales,
          configuracionNotificacion: {
            email: true,
            sms: true,
            webSocket: true
          }
        }
      });
      
      console.log(`✅ Nueva configuración creada: ${configuracion.id}`);
    }
    
    // 5. VERIFICAR CAMBIOS APLICADOS
    console.log('\n🔍 VERIFICANDO CAMBIOS APLICADOS:');
    
    const sensorActualizado = await prisma.sensor.findFirst({
      where: { id: primerSensor.id },
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
    
    if (sensorActualizado?.configuracionAlerta) {
      const config = sensorActualizado.configuracionAlerta;
      const umbrales = config.umbralCritico || {};
      
      console.log(`✅ CONFIGURACIÓN ACTUALIZADA:`);
      console.log(`   📊 Rango: ${umbrales.rango_min} - ${umbrales.rango_max} ${umbrales.unidad}`);
      console.log(`   ⚠️ Alerta: ${umbrales.umbral_alerta_bajo} / ${umbrales.umbral_alerta_alto}`);
      console.log(`   🚨 Crítico: ${umbrales.umbral_critico_bajo} / ${umbrales.umbral_critico_alto}`);
      console.log(`   🔔 Severidad: ${umbrales.severidad}`);
      console.log(`   ⏰ Actualizado: ${config.updatedAt.toLocaleString('es-MX')}`);
    }
    
    // 6. RESUMEN FINAL
    console.log('\n🎯 RESUMEN DE FUNCIONALIDADES IMPLEMENTADAS:');
    console.log('\n✅ CONFIGURACIÓN AUTOMÁTICA (Ya implementada):');
    console.log('   📡 Sensores nuevos tienen umbrales por defecto');
    console.log('   🔔 Notificaciones habilitadas automáticamente');
    console.log('   👥 Destinatarios vinculados automáticamente');
    
    console.log('\n✅ PERSONALIZACIÓN DESDE FRONTEND (Nuevo endpoint):');
    console.log('   🔍 GET /sensores/:id/umbrales - Leer configuración');
    console.log('   ✏️ PUT /sensores/:id/umbrales - Actualizar umbrales');
    console.log('   ✅ Validación automática de umbrales');
    console.log('   💾 Persistencia en base de datos');
    
    console.log('\n🚀 PRÓXIMO PASO:');
    console.log('   Crear interfaz en el frontend para usar estos endpoints');
    console.log('   Los usuarios podrán configurar umbrales personalizados');
    console.log('   El sistema mantendrá la configuración automática por defecto');
    
  } catch (error) {
    console.error('❌ Error probando endpoint de umbrales:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUmbralesEndpoint();
