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

async function testCompleteSensorSetup() {
  console.log('🧪 Prueba Completa de Configuración de Sensores\n');

  try {
    // 1. Verificar que el servidor esté funcionando
    console.log('1️⃣ Verificando que el servidor esté funcionando...');
    try {
      const healthCheck = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Servidor funcionando correctamente');
    } catch (error) {
      console.log('❌ Servidor no está funcionando. Ejecuta: npm run start:dev');
      return;
    }

    // 2. Verificar autenticación
    console.log('\n2️⃣ Verificando autenticación...');
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

    // 3. Obtener ubicaciones disponibles
    console.log('\n3️⃣ Obteniendo ubicaciones disponibles...');
    try {
      const ubicaciones = await api.get('/ubicaciones');
      console.log('✅ Ubicaciones obtenidas:', ubicaciones.data.length, 'ubicaciones');
      if (ubicaciones.data.length === 0) {
        console.log('⚠️ No hay ubicaciones. Necesitas crear al menos una ubicación primero.');
        console.log('💡 Usa el endpoint: POST /ubicaciones');
        console.log('💡 O ejecuta: node scripts/setup-initial-data.js');
        return;
      }
      const primeraUbicacion = ubicaciones.data[0];
      console.log('📍 Primera ubicación:', primeraUbicacion.nombre, '(ID:', primeraUbicacion.id, ')');
    } catch (error) {
      console.log('❌ Error obteniendo ubicaciones:', error.response?.data?.message || error.message);
      return;
    }

    // 4. Obtener configuraciones disponibles
    console.log('\n4️⃣ Obteniendo configuraciones de sensores...');
    try {
      const configs = await api.get('/mqtt-sensor/configuraciones');
      console.log('✅ Configuraciones obtenidas');
      console.log('📋 Tipos disponibles:', configs.data.tipos_sensores);
    } catch (error) {
      console.log('❌ Error obteniendo configuraciones:', error.response?.data?.message || error.message);
      return;
    }

    // 5. Probar registro de sensor simple
    console.log('\n5️⃣ Probando registro de sensor simple...');
    try {
      const ubicaciones = await api.get('/ubicaciones');
      const primeraUbicacion = ubicaciones.data[0];

      const sensorSimple = await api.post('/mqtt-sensor/sensores/registrar-simple', {
        nombre: 'Sensor de Prueba',
        tipo: 'TEMPERATURA',
        ubicacionId: primeraUbicacion.id,
        descripcion: 'Sensor de prueba para verificar funcionalidad'
      });

      console.log('✅ Sensor simple creado exitosamente');
      console.log('🔧 Sensor ID:', sensorSimple.data.sensor.id);
      console.log('📝 Nombre:', sensorSimple.data.sensor.nombre);
      console.log('⚙️ Configuración aplicada:', sensorSimple.data.configuracion_aplicada.unidad);

      const sensorId = sensorSimple.data.sensor.id;

      // 6. Verificar que el sensor se creó correctamente
      console.log('\n6️⃣ Verificando sensor creado...');
      const sensorVerificado = await api.get(`/mqtt-sensor/sensores/sensor/${sensorId}`);
      console.log('✅ Sensor verificado correctamente');
      console.log('📊 Estado:', sensorVerificado.data.activo ? 'Activo' : 'Inactivo');

      // 7. Listar todos los sensores
      console.log('\n7️⃣ Listando todos los sensores...');
      const sensores = await api.get('/mqtt-sensor/sensores/listar');
      console.log('✅ Sensores listados:', sensores.data.length, 'sensores');
      sensores.data.forEach(sensor => {
        console.log(`   - ${sensor.nombre} (${sensor.tipo}) - ${sensor.ubicacion.nombre}`);
      });

      // 8. Probar registro de lectura
      console.log('\n8️⃣ Probando registro de lectura...');
      const lectura = await api.post('/mqtt-sensor/lecturas/registrar', {
        tipo: 'TEMPERATURA',
        valor: 25.5,
        unidad: '°C',
        sensorId: sensorId,
        ubicacionId: primeraUbicacion.id
      });
      console.log('✅ Lectura registrada exitosamente');
      console.log('📈 Valor:', lectura.data.valor, lectura.data.unidad);

      // 9. Probar registro múltiple
      console.log('\n9️⃣ Probando registro múltiple...');
      const sensoresMultiple = await api.post('/mqtt-sensor/sensores/registrar-multiple', {
        ubicacionId: primeraUbicacion.id,
        sensores: [
          {
            nombre: 'Sensor Humedad 1',
            tipo: 'HUMEDAD',
            descripcion: 'Sensor de humedad ambiental'
          },
          {
            nombre: 'Sensor Peso 1',
            tipo: 'PESO',
            descripcion: 'Sensor de peso para báscula'
          }
        ]
      });
      console.log('✅ Registro múltiple completado');
      console.log('📊 Resumen:', sensoresMultiple.data.resumen);

      // 10. Probar analytics
      console.log('\n🔟 Probando analytics...');
      const analytics = await api.get('/mqtt-sensor/analytics');
      console.log('✅ Analytics obtenidos');
      console.log('📊 Total lecturas:', analytics.data.totalLecturas);
      console.log('📈 Lecturas últimas 24h:', analytics.data.lecturasUltimas24h);

      // 11. Probar dashboard
      console.log('\n1️⃣1️⃣ Probando dashboard...');
      const dashboard = await api.get('/mqtt-sensor/dashboard/ubicaciones');
      console.log('✅ Dashboard obtenido');
      console.log('🏢 Ubicaciones en dashboard:', dashboard.data.ubicaciones.length);

      console.log('\n🎉 ¡TODAS LAS PRUEBAS EXITOSAS!');
      console.log('\n📋 RESUMEN DE FUNCIONALIDADES VERIFICADAS:');
      console.log('   ✅ Servidor funcionando');
      console.log('   ✅ Autenticación correcta');
      console.log('   ✅ Ubicaciones disponibles');
      console.log('   ✅ Configuraciones de sensores');
      console.log('   ✅ Registro de sensor simple');
      console.log('   ✅ Verificación de sensor');
      console.log('   ✅ Listado de sensores');
      console.log('   ✅ Registro de lecturas');
      console.log('   ✅ Registro múltiple');
      console.log('   ✅ Analytics');
      console.log('   ✅ Dashboard');
      
      console.log('\n🚀 ¡El sistema está listo para usar desde el frontend!');
      console.log('\n📝 PRÓXIMOS PASOS PARA EL FRONTEND:');
      console.log('   1. Implementar formulario de registro simple');
      console.log('   2. Implementar listado de sensores');
      console.log('   3. Implementar dashboard en tiempo real');
      console.log('   4. Implementar WebSockets para actualizaciones');

    } catch (error) {
      console.log('❌ Error en las pruebas:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Función para mostrar configuración necesaria
function mostrarConfiguracion() {
  console.log('🔧 CONFIGURACIÓN NECESARIA\n');

  console.log('1️⃣ Variables de entorno (.env):');
  console.log(`
# Configuración MQTT para EMQX Broker
MQTT_ENABLED=true
MQTT_HOST=h02f10fd.ala.us-east-1.emqxsl.com
MQTT_PORT=8883
MQTT_USE_TLS=true
MQTT_USERNAME=tu_usuario
MQTT_PASSWORD=tu_contraseña
MQTT_APP_ID=v2c96220
MQTT_APP_SECRET=tu_app_secret
MQTT_API_ENDPOINT=https://h02f10fd.ala.us-east-1.emqxsl.com:8443/api/v5
  `);

  console.log('2️⃣ JWT Token para pruebas:');
  console.log(`
export JWT_TOKEN="tu-jwt-token-aqui"
  `);

  console.log('3️⃣ Comandos para ejecutar:');
  console.log(`
# Iniciar servidor
npm run start:dev

# Ejecutar pruebas
node scripts/test-complete-sensor-setup.js
  `);

  console.log('4️⃣ Endpoints principales para frontend:');
  console.log(`
# Configuración
GET /mqtt-sensor/configuraciones

# Registro de sensores
POST /mqtt-sensor/sensores/registrar-simple
POST /mqtt-sensor/sensores/registrar-rapido
POST /mqtt-sensor/sensores/registrar-multiple

# Gestión de sensores
GET /mqtt-sensor/sensores/listar
GET /mqtt-sensor/sensores/sensor/:id
PATCH /mqtt-sensor/sensores/sensor/:id
DELETE /mqtt-sensor/sensores/sensor/:id

# Lecturas
POST /mqtt-sensor/lecturas/registrar
GET /mqtt-sensor/lecturas/listar

# Dashboard y Analytics
GET /mqtt-sensor/analytics
GET /mqtt-sensor/dashboard/ubicaciones
  `);
}

// Ejecutar pruebas
if (require.main === module) {
  if (process.argv.includes('--config')) {
    mostrarConfiguracion();
  } else {
    testCompleteSensorSetup();
  }
}

module.exports = { testCompleteSensorSetup, mostrarConfiguracion }; 