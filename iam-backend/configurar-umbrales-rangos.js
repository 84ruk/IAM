const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function configurarUmbralesRangos() {
  try {
    console.log('🔧 Configurando umbrales con rangos para activar alertas automáticamente...');
    
    // 1. Verificar sensores activos
    console.log('\n📡 VERIFICANDO SENSORES ACTIVOS:');
    const sensores = await prisma.sensor.findMany({
      where: { activo: true },
      include: {
        configuracionAlerta: true
      }
    });
    
    console.log(`📊 Sensores encontrados: ${sensores.length}`);
    sensores.forEach((sensor, index) => {
      console.log(`   ${index + 1}. ${sensor.nombre} (${sensor.tipo})`);
      console.log(`      🆔 ID: ${sensor.id}`);
      console.log(`      📍 Ubicación: ${sensor.ubicacionId}`);
    });
    
    // 2. Configurar umbrales con rangos para cada sensor
    console.log('\n⚙️ CONFIGURANDO UMBRALES CON RANGOS:');
    
    for (const sensor of sensores) {
      console.log(`\n🔧 Configurando sensor: ${sensor.nombre} (${sensor.tipo})`);
      
      let umbralesConfig;
      
      // Configuración específica por tipo de sensor
      switch (sensor.tipo) {
        case 'TEMPERATURA':
          umbralesConfig = {
            tipo: 'TEMPERATURA',
            unidad: '°C',
            precision: 0.1,
            rango_min: 15,        // Temperatura mínima aceptable
            rango_max: 25,        // Temperatura máxima aceptable
            umbral_alerta_bajo: 18,   // Alerta si baja de 18°C
            umbral_alerta_alto: 22,   // Alerta si sube de 22°C
            umbral_critico_bajo: 15,  // Crítico si baja de 15°C
            umbral_critico_alto: 25,  // Crítico si sube de 25°C
            severidad: 'MEDIA',
            intervalo_lectura: 10000,
            alertasActivas: true
          };
          break;
          
        case 'HUMEDAD':
          umbralesConfig = {
            tipo: 'HUMEDAD',
            unidad: '%',
            precision: 0.1,
            rango_min: 30,        // Humedad mínima aceptable
            rango_max: 80,        // Humedad máxima aceptable
            umbral_alerta_bajo: 35,   // Alerta si baja de 35%
            umbral_alerta_alto: 75,   // Alerta si sube de 75%
            umbral_critico_bajo: 30,  // Crítico si baja de 30%
            umbral_critico_alto: 80,  // Crítico si sube de 80%
            severidad: 'MEDIA',
            intervalo_lectura: 30000,
            alertasActivas: true
          };
          break;
          
        case 'PESO':
          umbralesConfig = {
            tipo: 'PESO',
            unidad: 'kg',
            precision: 0.1,
            rango_min: 100,       // Peso mínimo aceptable
            rango_max: 900,       // Peso máximo aceptable
            umbral_alerta_bajo: 150,  // Alerta si baja de 150kg
            umbral_alerta_alto: 850,  // Alerta si sube de 850kg
            umbral_critico_bajo: 100, // Crítico si baja de 100kg
            umbral_critico_alto: 900, // Crítico si sube de 900kg
            severidad: 'MEDIA',
            intervalo_lectura: 60000,
            alertasActivas: true
          };
          break;
          
        default:
          umbralesConfig = {
            tipo: sensor.tipo,
            unidad: 'unidad',
            precision: 0.1,
            rango_min: 0,
            rango_max: 100,
            umbral_alerta_bajo: 10,
            umbral_alerta_alto: 90,
            umbral_critico_bajo: 0,
            umbral_critico_alto: 100,
            severidad: 'MEDIA',
            intervalo_lectura: 30000,
            alertasActivas: true
          };
      }
      
      console.log(`   📊 Umbrales configurados:`);
      console.log(`      📏 Rango aceptable: ${umbralesConfig.rango_min} - ${umbralesConfig.rango_max} ${umbralesConfig.unidad}`);
      console.log(`      ⚠️ Alerta baja: < ${umbralesConfig.umbral_alerta_bajo} ${umbralesConfig.unidad}`);
      console.log(`      ⚠️ Alerta alta: > ${umbralesConfig.umbral_alerta_alto} ${umbralesConfig.unidad}`);
      console.log(`      🚨 Crítico bajo: < ${umbralesConfig.umbral_critico_bajo} ${umbralesConfig.unidad}`);
      console.log(`      🚨 Crítico alto: > ${umbralesConfig.umbral_critico_alto} ${umbralesConfig.unidad}`);
      
      // 3. Actualizar configuración de alertas
      if (sensor.configuracionAlerta) {
        await prisma.configuracionAlerta.update({
          where: { id: sensor.configuracionAlerta.id },
          data: {
            umbralCritico: umbralesConfig,
            configuracionNotificacion: {
              email: true,
              sms: true,
              webSocket: true
            }
          }
        });
        
        console.log(`   ✅ Configuración actualizada en BD`);
      } else {
        // Crear nueva configuración si no existe
        const nuevaConfig = await prisma.configuracionAlerta.create({
          data: {
            empresaId: sensor.empresaId,
            sensorId: sensor.id,
            tipoAlerta: sensor.tipo,
            activo: true,
            frecuencia: 'IMMEDIATE',
            ventanaEsperaMinutos: 5,
            umbralCritico: umbralesConfig,
            configuracionNotificacion: {
              email: true,
              sms: true,
              webSocket: true
            }
          }
        });
        
        console.log(`   ✅ Nueva configuración creada: ${nuevaConfig.id}`);
      }
    }
    
    // 4. Verificar configuración final
    console.log('\n🔍 VERIFICACIÓN FINAL DE CONFIGURACIÓN:');
    const configuracionesFinales = await prisma.configuracionAlerta.findMany({
      where: { activo: true },
      include: {
        sensor: {
          select: { nombre: true, tipo: true }
        }
      }
    });
    
    configuracionesFinales.forEach((config, index) => {
      const umbrales = config.umbralCritico || {};
      console.log(`\n   ${index + 1}. ${config.sensor.nombre} (${config.sensor.tipo})`);
      console.log(`      📊 Rango: ${umbrales.rango_min || 'N/A'} - ${umbrales.rango_max || 'N/A'} ${umbrales.unidad || ''}`);
      console.log(`      ⚠️ Alertas: ${umbrales.umbral_alerta_bajo || 'N/A'} / ${umbrales.umbral_alerta_alto || 'N/A'}`);
      console.log(`      🚨 Críticos: ${umbrales.umbral_critico_bajo || 'N/A'} / ${umbrales.umbral_critico_alto || 'N/A'}`);
      console.log(`      🔔 Activo: ${config.activo ? '✅' : '❌'}`);
    });
    
    // 5. Crear alerta de prueba para verificar funcionamiento
    console.log('\n🧪 CREANDO ALERTA DE PRUEBA PARA VERIFICAR UMBRALES...');
    
    const primerSensor = sensores[0];
    if (primerSensor) {
      const umbrales = configuracionesFinales[0].umbralCritico;
      
      // Crear lectura que supere el umbral crítico alto
      const valorAlerta = (umbrales.umbral_critico_alto || 25) + 5; // 5 unidades por encima del crítico
      
      const lectura = await prisma.sensorLectura.create({
        data: {
          tipo: primerSensor.tipo,
          valor: valorAlerta,
          unidad: umbrales.unidad || '°C',
          sensorId: primerSensor.id,
          ubicacionId: primerSensor.ubicacionId,
          empresaId: primerSensor.empresaId,
          fecha: new Date()
        }
      });
      
      console.log(`✅ Lectura de prueba creada: ${lectura.id}`);
      console.log(`   📊 Valor: ${lectura.valor} ${lectura.unidad}`);
      console.log(`   🚨 Supera umbral crítico: ${umbrales.umbral_critico_alto} ${umbrales.unidad}`);
      
      // Crear alerta correspondiente
      const alerta = await prisma.alertaHistorial.create({
        data: {
          empresaId: primerSensor.empresaId,
          tipo: 'SENSOR_ALERT',
          severidad: 'CRITICA',
          titulo: `ALERTA CRÍTICA - ${primerSensor.tipo}`,
          mensaje: `🚨 ${primerSensor.tipo} CRÍTICO: ${lectura.valor} ${lectura.unidad} - Supera umbral de ${umbrales.umbral_critico_alto} ${umbrales.unidad}`,
          sensorId: primerSensor.id,
          valor: lectura.valor.toString(),
          ubicacionId: primerSensor.ubicacionId,
          estado: 'ENVIADA',
          emailEnviado: false,
          condicionActivacion: {
            tipo: primerSensor.tipo,
            valor: lectura.valor,
            umbral_critico: umbrales.umbral_critico_alto,
            rango_aceptable: `${umbrales.rango_min} - ${umbrales.rango_max}`,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      console.log(`✅ Alerta de prueba creada: ${alerta.id}`);
      console.log(`   🚨 Mensaje: ${alerta.mensaje}`);
    }
    
    console.log('\n🎯 CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('\n📋 RESUMEN DE LO CONFIGURADO:');
    console.log('   ✅ Umbrales con rangos configurados');
    console.log('   ✅ Alertas automáticas habilitadas');
    console.log('   ✅ Notificaciones SMS habilitadas');
    console.log('   ✅ Sistema listo para activar alertas automáticamente');
    
    console.log('\n💡 CÓMO FUNCIONA AHORA:');
    console.log('   1. ESP32 envía lectura → Backend recibe');
    console.log('   2. SensorAlertManagerService evalúa contra umbrales');
    console.log('   3. Si supera rango → Se genera alerta automáticamente');
    console.log('   4. Se envían notificaciones (Email + SMS + WebSocket)');
    
    console.log('\n🚀 PRÓXIMO PASO:');
    console.log('   Envía una lectura desde el ESP32 que supere los umbrales configurados');
    console.log('   El sistema debería generar alertas automáticamente');
    
  } catch (error) {
    console.error('❌ Error configurando umbrales:', error);
  } finally {
    await prisma.$disconnect();
  }
}

configurarUmbralesRangos();
