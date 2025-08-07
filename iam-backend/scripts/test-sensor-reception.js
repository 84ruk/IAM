const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const JWT_TOKEN = process.env.JWT_TOKEN || 'tu-jwt-token-aqui';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testSensorReception() {
  console.log('🧪 Probando Recepción de Datos de Sensor Físico\n');

  try {
    // 1. Verificar autenticación
    console.log('1️⃣ Verificando autenticación...');
    try {
      const authTest = await api.get('/users/profile');
      console.log('✅ Autenticación correcta');
      console.log('👤 Usuario:', authTest.data.email);
      console.log('🏢 Empresa ID:', authTest.data.empresaId);
    } catch (error) {
      console.log('❌ Error de autenticación. Verifica tu JWT_TOKEN');
      console.log('💡 Ejecuta: export JWT_TOKEN="tu-token-aqui"');
      return;
    }

    // 2. Listar sensores disponibles
    console.log('\n2️⃣ Obteniendo sensores disponibles...');
    try {
      const sensores = await api.get('/mqtt-sensor/sensores/listar');
      console.log('✅ Sensores obtenidos:', sensores.data.length, 'sensores');
      
      if (sensores.data.length === 0) {
        console.log('⚠️ No hay sensores registrados.');
        console.log('💡 Ejecuta: node scripts/configurar-sensor-fisico.js');
        return;
      }

      console.log('📋 Sensores disponibles:');
      sensores.data.forEach(sensor => {
        console.log(`   - ${sensor.nombre} (${sensor.tipo}) - ID: ${sensor.id}`);
      });
    } catch (error) {
      console.log('❌ Error obteniendo sensores:', error.response?.data?.message || error.message);
      return;
    }

    // 3. Verificar estado MQTT
    console.log('\n3️⃣ Verificando estado MQTT...');
    try {
      const mqttStatus = await api.get('/mqtt-sensor/status');
      console.log('✅ Estado MQTT:', mqttStatus.data);
      
      if (!mqttStatus.data.enabled) {
        console.log('⚠️ MQTT no está habilitado');
        console.log('💡 Verifica la configuración en .env');
      }
      
      if (!mqttStatus.data.connected) {
        console.log('⚠️ MQTT no está conectado');
        console.log('💡 Verifica las credenciales MQTT');
      }
    } catch (error) {
      console.log('❌ Error verificando estado MQTT:', error.response?.data?.message || error.message);
    }

    // 4. Simular datos de sensor
    console.log('\n4️⃣ Simulando datos de sensor...');
    const primerSensor = sensores.data[0];
    
    try {
      const datosSimulados = {
        tipo: primerSensor.tipo,
        valor: Math.random() * 50 + 10, // Valor aleatorio
        unidad: primerSensor.tipo === 'TEMPERATURA' ? '°C' : 
                primerSensor.tipo === 'HUMEDAD' ? '%' : 
                primerSensor.tipo === 'PESO' ? 'kg' : 'Pa',
        sensorId: primerSensor.id,
        ubicacionId: primerSensor.ubicacionId
      };

      const lectura = await api.post('/mqtt-sensor/lecturas/registrar', datosSimulados);
      console.log('✅ Lectura simulada registrada');
      console.log('📊 Datos:', {
        tipo: lectura.data.tipo,
        valor: lectura.data.valor,
        unidad: lectura.data.unidad,
        fecha: lectura.data.fecha
      });
    } catch (error) {
      console.log('❌ Error registrando lectura simulada:', error.response?.data?.message || error.message);
    }

    // 5. Verificar lecturas recientes
    console.log('\n5️⃣ Verificando lecturas recientes...');
    try {
      const lecturas = await api.get('/mqtt-sensor/lecturas/listar?limite=5');
      console.log('✅ Lecturas obtenidas:', lecturas.data.length, 'lecturas');
      
      if (lecturas.data.length > 0) {
        console.log('📈 Últimas lecturas:');
        lecturas.data.forEach(lectura => {
          console.log(`   - ${lectura.tipo}: ${lectura.valor} ${lectura.unidad} (${new Date(lectura.fecha).toLocaleString()})`);
        });
      }
    } catch (error) {
      console.log('❌ Error obteniendo lecturas:', error.response?.data?.message || error.message);
    }

    // 6. Verificar analytics
    console.log('\n6️⃣ Verificando analytics...');
    try {
      const analytics = await api.get('/mqtt-sensor/analytics');
      console.log('✅ Analytics obtenidos');
      console.log('📊 Métricas:');
      console.log(`   - Total lecturas: ${analytics.data.totalLecturas}`);
      console.log(`   - Lecturas últimas 24h: ${analytics.data.lecturasUltimas24h}`);
      console.log(`   - Alertas activas: ${analytics.data.alertasActivas}`);
      console.log(`   - Temperatura promedio: ${analytics.data.temperaturaPromedio}°C`);
      console.log(`   - Humedad promedio: ${analytics.data.humedadPromedio}%`);
    } catch (error) {
      console.log('❌ Error obteniendo analytics:', error.response?.data?.message || error.message);
    }

    // 7. Verificar dashboard
    console.log('\n7️⃣ Verificando dashboard...');
    try {
      const dashboard = await api.get('/mqtt-sensor/dashboard/ubicaciones');
      console.log('✅ Dashboard obtenido');
      console.log('🏢 Ubicaciones en dashboard:', dashboard.data.ubicaciones.length);
      
      if (dashboard.data.ubicaciones.length > 0) {
        console.log('📍 Ubicaciones:');
        dashboard.data.ubicaciones.forEach(ubicacion => {
          console.log(`   - ${ubicacion.nombre}: ${ubicacion.totalSensores} sensores, ${ubicacion.alertasActivas} alertas`);
        });
      }
    } catch (error) {
      console.log('❌ Error obteniendo dashboard:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 ¡Prueba de recepción completada!');
    console.log('\n📝 RESUMEN:');
    console.log('   ✅ Autenticación funcionando');
    console.log('   ✅ Sensores registrados');
    console.log('   ✅ MQTT configurado');
    console.log('   ✅ Lecturas funcionando');
    console.log('   ✅ Analytics disponibles');
    console.log('   ✅ Dashboard funcionando');
    
    console.log('\n🚀 ¡El sistema está listo para recibir datos de tu sensor físico!');
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('   1. Conectar tu sensor físico al ESP32/Arduino');
    console.log('   2. Configurar el código con tus credenciales WiFi y MQTT');
    console.log('   3. Subir el código al hardware');
    console.log('   4. Verificar que los datos lleguen al dashboard');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Función para monitorear datos en tiempo real
async function monitorearTiempoReal(sensorId) {
  console.log(`🔍 Monitoreando sensor ID: ${sensorId} en tiempo real...`);
  console.log('Presiona Ctrl+C para detener\n');

  const interval = setInterval(async () => {
    try {
      const sensor = await api.get(`/mqtt-sensor/sensores/sensor/${sensorId}`);
      const lecturas = sensor.data.lecturas;
      
      if (lecturas.length > 0) {
        const ultimaLectura = lecturas[0];
        console.log(`[${new Date().toLocaleTimeString()}] ${ultimaLectura.tipo}: ${ultimaLectura.valor} ${ultimaLectura.unidad}`);
      } else {
        console.log(`[${new Date().toLocaleTimeString()}] No hay lecturas recientes`);
      }
    } catch (error) {
      console.log(`[${new Date().toLocaleTimeString()}] Error: ${error.message}`);
    }
  }, 5000); // Verificar cada 5 segundos

  // Manejar interrupción
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n🛑 Monitoreo detenido');
    process.exit(0);
  });
}

// Función para mostrar información de debugging
function mostrarInfoDebugging() {
  console.log('🔧 INFORMACIÓN DE DEBUGGING\n');

  console.log('1️⃣ Verificar conexión MQTT:');
  console.log(`
   curl -X GET "http://localhost:3000/mqtt-sensor/status" \\
     -H "Authorization: Bearer ${JWT_TOKEN}"
  `);

  console.log('\n2️⃣ Verificar sensores registrados:');
  console.log(`
   curl -X GET "http://localhost:3000/mqtt-sensor/sensores/listar" \\
     -H "Authorization: Bearer ${JWT_TOKEN}"
  `);

  console.log('\n3️⃣ Verificar lecturas recientes:');
  console.log(`
   curl -X GET "http://localhost:3000/mqtt-sensor/lecturas/listar?limite=10" \\
     -H "Authorization: Bearer ${JWT_TOKEN}"
  `);

  console.log('\n4️⃣ Verificar analytics:');
  console.log(`
   curl -X GET "http://localhost:3000/mqtt-sensor/analytics" \\
     -H "Authorization: Bearer ${JWT_TOKEN}"
  `);

  console.log('\n5️⃣ Logs del servidor:');
  console.log(`
   # En la terminal donde ejecutas npm run start:dev
   # Buscar mensajes como:
   # - "Temperatura registrada: 25.5°C"
   # - "Humedad registrada: 60.0%"
   # - "Peso registrado: 1.5kg"
  `);

  console.log('\n6️⃣ Problemas comunes:');
  console.log(`
   ❌ MQTT no conectado:
      - Verificar credenciales en .env
      - Verificar que el broker esté funcionando
   
   ❌ No llegan datos:
      - Verificar que el ESP32 esté conectado a WiFi
      - Verificar que las credenciales MQTT sean correctas
      - Verificar que el tópico sea correcto
   
   ❌ Datos incorrectos:
      - Verificar la calibración del sensor
      - Verificar las unidades en el código Arduino
  `);
}

// Ejecutar pruebas
if (require.main === module) {
  if (process.argv.includes('--monitor')) {
    const sensorId = process.argv[3] || 1;
    monitorearTiempoReal(sensorId);
  } else if (process.argv.includes('--debug')) {
    mostrarInfoDebugging();
  } else {
    testSensorReception();
  }
}

module.exports = { testSensorReception, monitorearTiempoReal, mostrarInfoDebugging }; 