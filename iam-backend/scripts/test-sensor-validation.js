const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTQ1MjM4NjMsImp0aSI6ImE3ZDZkNzlhLTRmNGMtNDNhZS05ODA3LWM0YWMzOTMzMzU3ZSIsInN1YiI6IjEiLCJlbWFpbCI6ImJhcnVrMDY2QGdtYWlsLmNvbSIsInJvbCI6IkFETUlOIiwiZW1wcmVzYUlkIjoyLCJ0aXBvSW5kdXN0cmlhIjoiR0VORVJJQ0EiLCJhdXRoUHJvdmlkZXIiOiJnb29nbGUiLCJleHAiOjE3NTQ2MTAyNjMsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSJ9.JItMTmjBWig28HcJuFglmHmR7hpSG4F2FPNKMP8yTS4';

async function testSensorValidation() {
  try {
    console.log('🧪 Probando validaciones de sensores duplicados...');
    
    // Paso 1: Obtener ubicaciones disponibles
    console.log('\n📍 Paso 1: Obteniendo ubicaciones...');
    const ubicacionesResponse = await fetch(`${API_BASE}/ubicaciones`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!ubicacionesResponse.ok) {
      throw new Error(`Error obteniendo ubicaciones: ${ubicacionesResponse.statusText}`);
    }
    
    const ubicaciones = await ubicacionesResponse.json();
    console.log(`✅ Encontradas ${ubicaciones.length} ubicaciones`);
    
    if (ubicaciones.length === 0) {
      console.log('❌ No hay ubicaciones disponibles para probar');
      return;
    }
    
    const primeraUbicacion = ubicaciones[0];
    console.log(`📍 Usando ubicación: "${primeraUbicacion.nombre}" (ID: ${primeraUbicacion.id})`);
    
    // Paso 2: Crear el primer sensor (debería funcionar)
    console.log('\n📊 Paso 2: Creando primer sensor...');
    const primerSensor = {
      nombre: `Sensor Test ${Date.now()}`,
      tipo: 'TEMPERATURA',
      ubicacionId: primeraUbicacion.id,
      descripcion: 'Sensor de prueba para validación'
    };
    
    const crearResponse1 = await fetch(`${API_BASE}/sensores/registrar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(primerSensor)
    });
    
    if (crearResponse1.ok) {
      const sensorCreado = await crearResponse1.json();
      console.log(`✅ Primer sensor creado exitosamente: ID ${sensorCreado.id}`);
      
      // Paso 3: Intentar crear sensor duplicado (debería fallar)
      console.log('\n🚫 Paso 3: Intentando crear sensor duplicado...');
      const sensorDuplicado = {
        nombre: primerSensor.nombre, // Mismo nombre
        tipo: 'HUMEDAD', // Diferente tipo, pero mismo nombre y ubicación
        ubicacionId: primeraUbicacion.id, // Misma ubicación
        descripcion: 'Sensor duplicado que debería fallar'
      };
      
      const crearResponse2 = await fetch(`${API_BASE}/sensores/registrar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sensorDuplicado)
      });
      
      if (!crearResponse2.ok) {
        const error = await crearResponse2.json();
        console.log('✅ VALIDACIÓN CORRECTA: El sensor duplicado fue rechazado');
        console.log(`   Mensaje de error: "${error.message}"`);
        console.log(`   Código de estado: ${crearResponse2.status}`);
      } else {
        console.log('❌ ERROR: El sensor duplicado NO fue rechazado');
        const sensorDuplicadoCreado = await crearResponse2.json();
        console.log(`   Se creó incorrectamente con ID: ${sensorDuplicadoCreado.id}`);
      }
      
      // Paso 4: Crear sensor con nombre diferente en misma ubicación (debería funcionar)
      console.log('\n🆕 Paso 4: Creando sensor con nombre diferente...');
      const sensorDiferente = {
        nombre: `Sensor Test Diferente ${Date.now()}`,
        tipo: 'HUMEDAD',
        ubicacionId: primeraUbicacion.id,
        descripcion: 'Sensor con nombre diferente'
      };
      
      const crearResponse3 = await fetch(`${API_BASE}/sensores/registrar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sensorDiferente)
      });
      
      if (crearResponse3.ok) {
        const sensorDiferente = await crearResponse3.json();
        console.log(`✅ Sensor con nombre diferente creado exitosamente: ID ${sensorDiferente.id}`);
      } else {
        const error = await crearResponse3.json();
        console.log(`❌ Error inesperado al crear sensor diferente: ${error.message}`);
      }
      
    } else {
      const error = await crearResponse1.json();
      console.log(`❌ Error creando primer sensor: ${error.message}`);
    }
    
    // Paso 5: Obtener lista de sensores para verificar
    console.log('\n📋 Paso 5: Verificando sensores creados...');
    const sensoresResponse = await fetch(`${API_BASE}/sensores/listar`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (sensoresResponse.ok) {
      const sensores = await sensoresResponse.json();
      console.log(`📊 Total de sensores activos: ${sensores.length}`);
      
      // Filtrar sensores de test de hoy
      const sensoresTest = sensores.filter(s => s.nombre.includes('Sensor Test'));
      console.log(`🧪 Sensores de prueba creados hoy: ${sensoresTest.length}`);
      
      sensoresTest.forEach(sensor => {
        console.log(`   - ${sensor.nombre} (${sensor.tipo}) en ${sensor.ubicacion.nombre}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar después de un delay para asegurar que el servidor esté listo
setTimeout(() => {
  testSensorValidation()
    .then(() => {
      console.log('\n✅ Prueba de validación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando prueba:', error);
      process.exit(1);
    });
}, 5000); // Esperar 5 segundos

console.log('⏳ Esperando 5 segundos para que el backend esté listo...');

module.exports = { testSensorValidation };

