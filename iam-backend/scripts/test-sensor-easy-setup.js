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

async function testEasySensorSetup() {
  console.log('🧪 Probando Configuración Fácil de Sensores\n');

  try {
    // 1. Obtener configuraciones predefinidas
    console.log('1️⃣ Obteniendo configuraciones predefinidas...');
    const configResponse = await api.get('/mqtt-sensor/configuraciones');
    console.log('✅ Configuraciones disponibles:', Object.keys(configResponse.data.configuraciones));
    console.log('📋 Tipos de sensores:', configResponse.data.tipos_sensores);
    console.log('');

    // 2. Obtener configuración específica para temperatura
    console.log('2️⃣ Obteniendo configuración para sensor de temperatura...');
    const tempConfig = await api.get('/mqtt-sensor/configuracion/temperatura');
    console.log('🌡️ Configuración temperatura:', tempConfig.data.configuracion);
    console.log('');

    // 3. Registrar sensor simple (mínimo esfuerzo)
    console.log('3️⃣ Registrando sensor simple (mínimo esfuerzo)...');
    const sensorSimple = await api.post('/mqtt-sensor/sensores/registrar-simple', {
      nombre: 'Sensor Temperatura Simple',
      tipo: 'TEMPERATURA',
      ubicacionId: 1,
      descripcion: 'Sensor de temperatura para almacén'
    });
    console.log('✅ Sensor simple creado:', sensorSimple.data.sensor.nombre);
    console.log('⚙️ Configuración aplicada automáticamente');
    console.log('');

    // 4. Registrar sensor rápido (solo nombre, tipo y ubicación)
    console.log('4️⃣ Registrando sensor rápido (mínimo datos)...');
    const sensorRapido = await api.post('/mqtt-sensor/sensores/registrar-rapido', {
      nombre: 'Sensor Humedad Rápido',
      tipo: 'HUMEDAD',
      ubicacionId: 1
    });
    console.log('✅ Sensor rápido creado:', sensorRapido.data.sensor.nombre);
    console.log('📝 Próximos pasos sugeridos:', sensorRapido.data.proximos_pasos);
    console.log('');

    // 5. Registrar múltiples sensores de una vez
    console.log('5️⃣ Registrando múltiples sensores de una vez...');
    const sensoresMultiple = await api.post('/mqtt-sensor/sensores/registrar-multiple', {
      ubicacionId: 1, // Se aplica a todos los sensores
      sensores: [
        {
          nombre: 'Sensor Peso 1',
          tipo: 'PESO',
          descripcion: 'Sensor de peso para báscula'
        },
        {
          nombre: 'Sensor Presión 1',
          tipo: 'PRESION',
          descripcion: 'Sensor de presión del sistema'
        },
        {
          nombre: 'Sensor Nivel 1',
          tipo: 'NIVEL',
          descripcion: 'Sensor de nivel de tanque'
        }
      ]
    });
    console.log('✅ Registro múltiple completado');
    console.log('📊 Resumen:', sensoresMultiple.data.resumen);
    console.log('');

    // 6. Listar todos los sensores creados
    console.log('6️⃣ Listando todos los sensores...');
    const sensores = await api.get('/mqtt-sensor/sensores/listar');
    console.log('📋 Sensores registrados:');
    sensores.data.forEach(sensor => {
      console.log(`   - ${sensor.nombre} (${sensor.tipo}) - ${sensor.ubicacion.nombre}`);
    });
    console.log('');

    // 7. Obtener detalles de un sensor específico
    console.log('7️⃣ Obteniendo detalles de un sensor...');
    const sensorDetalle = await api.get(`/mqtt-sensor/sensores/sensor/${sensorSimple.data.sensor.id}`);
    console.log('🔍 Detalles del sensor:', {
      nombre: sensorDetalle.data.nombre,
      tipo: sensorDetalle.data.tipo,
      configuracion: sensorDetalle.data.configuracion,
      ubicacion: sensorDetalle.data.ubicacion.nombre
    });
    console.log('');

    console.log('🎉 ¡Configuración fácil completada exitosamente!');
    console.log('');
    console.log('📈 Beneficios de la nueva implementación:');
    console.log('   ✅ Configuraciones automáticas por tipo de sensor');
    console.log('   ✅ Registro con mínimo esfuerzo');
    console.log('   ✅ Registro múltiple en una sola operación');
    console.log('   ✅ Validaciones automáticas');
    console.log('   ✅ Configuraciones predefinidas optimizadas');
    console.log('   ✅ Mensajes informativos y próximos pasos');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.response?.data || error.message);
  }
}

// Función para mostrar ejemplos de uso
function mostrarEjemplos() {
  console.log('📚 EJEMPLOS DE USO FÁCIL\n');

  console.log('1️⃣ Registro Simple (mínimo esfuerzo):');
  console.log(`
POST /mqtt-sensor/sensores/registrar-simple
{
  "nombre": "Mi Sensor",
  "tipo": "TEMPERATURA",
  "ubicacionId": 1
}
  `);

  console.log('2️⃣ Registro Rápido (solo lo esencial):');
  console.log(`
POST /mqtt-sensor/sensores/registrar-rapido
{
  "nombre": "Sensor IoT",
  "tipo": "HUMEDAD",
  "ubicacionId": 1,
  "descripcion": "Sensor de humedad ambiental"
}
  `);

  console.log('3️⃣ Registro Múltiple (varios sensores a la vez):');
  console.log(`
POST /mqtt-sensor/sensores/registrar-multiple
{
  "ubicacionId": 1,
  "sensores": [
    {
      "nombre": "Sensor 1",
      "tipo": "TEMPERATURA"
    },
    {
      "nombre": "Sensor 2", 
      "tipo": "HUMEDAD"
    },
    {
      "nombre": "Sensor 3",
      "tipo": "PESO"
    }
  ]
}
  `);

  console.log('4️⃣ Obtener Configuraciones Disponibles:');
  console.log(`
GET /mqtt-sensor/configuraciones
  `);

  console.log('5️⃣ Obtener Configuración Específica:');
  console.log(`
GET /mqtt-sensor/configuracion/temperatura
  `);
}

// Ejecutar pruebas
if (require.main === module) {
  if (process.argv.includes('--ejemplos')) {
    mostrarEjemplos();
  } else {
    testEasySensorSetup();
  }
}

module.exports = { testEasySensorSetup, mostrarEjemplos }; 