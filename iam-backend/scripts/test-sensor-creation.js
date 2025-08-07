#!/usr/bin/env node

const axios = require('axios');

// Configuración
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.JWT_TOKEN || '';

if (!JWT_TOKEN) {
  console.log('❌ Error: JWT_TOKEN no configurado');
  console.log('Ejecuta: export JWT_TOKEN="tu_token_jwt"');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${JWT_TOKEN}`,
  'Content-Type': 'application/json',
};

// Función para hacer requests
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers,
      ...(data && { data }),
    };

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// Tests específicos para creación de sensores
async function testSensorCreation() {
  console.log('🧪 Probando flujo completo de creación de sensores...\n');

  // 1. Verificar estado MQTT
  console.log('1️⃣ Verificando estado MQTT...');
  const mqttStatus = await makeRequest('GET', '/mqtt-sensor/status');
  if (mqttStatus.success) {
    console.log('✅ Estado MQTT:', mqttStatus.data);
  } else {
    console.log('❌ Error obteniendo estado MQTT:', mqttStatus.error);
  }

  // 2. Obtener ubicaciones disponibles
  console.log('\n2️⃣ Obteniendo ubicaciones disponibles...');
  const ubicaciones = await makeRequest('GET', '/ubicaciones');
  if (ubicaciones.success && ubicaciones.data.length > 0) {
    console.log('✅ Ubicaciones encontradas:', ubicaciones.data.length);
    const ubicacionId = ubicaciones.data[0].id;
    console.log('📍 Usando ubicación ID:', ubicacionId);

    // 3. Crear sensor básico
    console.log('\n3️⃣ Creando sensor básico...');
    const sensorBasico = {
      nombre: 'Sensor de Temperatura Test',
      tipo: 'TEMPERATURA',
      ubicacionId: ubicacionId,
      activo: true,
      configuracion: {
        unidad: '°C',
        rango_min: -40,
        rango_max: 80,
        precision: 0.1,
        intervalo_lectura: 60
      }
    };

    const resultadoBasico = await makeRequest('POST', '/mqtt-sensor/sensores/registrar', sensorBasico);
    if (resultadoBasico.success) {
      console.log('✅ Sensor básico creado:', resultadoBasico.data);
      
      // 4. Crear sensor con dispositivo EMQX
      console.log('\n4️⃣ Creando sensor con dispositivo EMQX...');
      const sensorConDispositivo = {
        sensor: {
          nombre: 'Sensor de Humedad Test',
          tipo: 'HUMEDAD',
          ubicacionId: ubicacionId,
          activo: true,
          configuracion: {
            unidad: '%',
            rango_min: 0,
            rango_max: 100,
            precision: 0.5
          }
        },
        dispositivo: {
          username: 'sensor_humedad_test',
          password: 'password123'
        }
      };

      const resultadoConDispositivo = await makeRequest('POST', '/mqtt-sensor/sensores/registrar-con-dispositivo', sensorConDispositivo);
      if (resultadoConDispositivo.success) {
        console.log('✅ Sensor con dispositivo creado:', resultadoConDispositivo.data);
      } else {
        console.log('❌ Error creando sensor con dispositivo:', resultadoConDispositivo.error);
      }

      // 5. Listar sensores
      console.log('\n5️⃣ Listando sensores...');
      const sensores = await makeRequest('GET', '/mqtt-sensor/sensores/listar');
      if (sensores.success) {
        console.log('✅ Sensores encontrados:', sensores.data.length);
        sensores.data.forEach(sensor => {
          console.log(`   - ${sensor.nombre} (${sensor.tipo}) - ID: ${sensor.id}`);
        });
      } else {
        console.log('❌ Error listando sensores:', sensores.error);
      }

      // 6. Obtener sensor específico
      if (resultadoBasico.success && resultadoBasico.data.id) {
        console.log('\n6️⃣ Obteniendo sensor específico...');
        const sensorEspecifico = await makeRequest('GET', `/mqtt-sensor/sensores/sensor/${resultadoBasico.data.id}`);
        if (sensorEspecifico.success) {
          console.log('✅ Sensor específico:', sensorEspecifico.data);
        } else {
          console.log('❌ Error obteniendo sensor específico:', sensorEspecifico.error);
        }
      }

      // 7. Probar validaciones
      console.log('\n7️⃣ Probando validaciones...');
      
      // Intentar crear sensor con nombre duplicado
      const sensorDuplicado = await makeRequest('POST', '/mqtt-sensor/sensores/registrar', sensorBasico);
      if (!sensorDuplicado.success) {
        console.log('✅ Validación de nombre duplicado funciona:', sensorDuplicado.error.message);
      } else {
        console.log('❌ Error: Debería haber fallado por nombre duplicado');
      }

      // Intentar crear sensor con configuración inválida
      const sensorInvalido = {
        nombre: 'Sensor Inválido',
        tipo: 'HUMEDAD',
        ubicacionId: ubicacionId,
        configuracion: {
          rango_min: 150, // Inválido para humedad
          rango_max: 200
        }
      };

      const resultadoInvalido = await makeRequest('POST', '/mqtt-sensor/sensores/registrar', sensorInvalido);
      if (!resultadoInvalido.success) {
        console.log('✅ Validación de configuración funciona:', resultadoInvalido.error.message);
      } else {
        console.log('❌ Error: Debería haber fallado por configuración inválida');
      }

    } else {
      console.log('❌ Error creando sensor básico:', resultadoBasico.error);
    }
  } else {
    console.log('❌ No se encontraron ubicaciones. Crea una ubicación primero.');
  }

  // 8. Verificar analytics
  console.log('\n8️⃣ Verificando analytics...');
  const analytics = await makeRequest('GET', '/mqtt-sensor/analytics');
  if (analytics.success) {
    console.log('✅ Analytics obtenidos:', analytics.data);
  } else {
    console.log('❌ Error obteniendo analytics:', analytics.error);
  }

  console.log('\n🎉 Pruebas de creación de sensores completadas!');
}

// Ejecutar pruebas
testSensorCreation().catch(console.error); 