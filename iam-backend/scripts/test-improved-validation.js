const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTQ1MjM4NjMsImp0aSI6ImE3ZDZkNzlhLTRmNGMtNDNhZS05ODA3LWM0YWMzOTMzMzU3ZSIsInN1YiI6IjEiLCJlbWFpbCI6ImJhcnVrMDY2QGdtYWlsLmNvbSIsInJvbCI6IkFETUlOIiwiZW1wcmVzYUlkIjoyLCJ0aXBvSW5kdXN0cmlhIjoiR0VORVJJQ0EiLCJhdXRoUHJvdmlkZXIiOiJnb29nbGUiLCJleHAiOjE3NTQ2MTAyNjMsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSJ9.JItMTmjBWig28HcJuFglmHmR7hpSG4F2FPNKMP8yTS4';

async function testImprovedValidation() {
  try {
    console.log('🧪 Probando validaciones mejoradas de sensores...');
    
    // Usar un nombre que sabemos que ya existe
    const nombreExistente = 'Sensor Test 1754608883939'; // Del test anterior
    
    console.log('\n🚫 Intentando crear sensor con nombre que ya existe...');
    const sensorDuplicado = {
      nombre: nombreExistente,
      tipo: 'HUMEDAD',
      ubicacionId: 2, // Refrigerador 1
      descripcion: 'Sensor duplicado para probar mensaje de error'
    };
    
    const response = await fetch(`${API_BASE}/sensores/registrar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sensorDuplicado)
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.log('✅ VALIDACIÓN CORRECTA: Sensor duplicado rechazado');
      console.log(`   📄 Mensaje de error: "${error.message}"`);
      console.log(`   🔢 Código de estado: ${response.status}`);
      console.log(`   🏷️  Tipo de error: ${error.error || 'No especificado'}`);
    } else {
      console.log('❌ ERROR: El sensor duplicado NO fue rechazado');
      const result = await response.json();
      console.log(`   Se creó incorrectamente con ID: ${result.id}`);
    }
    
    // Probar con ubicación inválida
    console.log('\n🚫 Probando con ubicación inválida...');
    const sensorUbicacionInvalida = {
      nombre: `Sensor Test Ubicacion ${Date.now()}`,
      tipo: 'TEMPERATURA',
      ubicacionId: 999999, // ID que no existe
      descripcion: 'Sensor con ubicación inválida'
    };
    
    const response2 = await fetch(`${API_BASE}/sensores/registrar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sensorUbicacionInvalida)
    });
    
    if (!response2.ok) {
      const error = await response2.json();
      console.log('✅ VALIDACIÓN CORRECTA: Ubicación inválida rechazada');
      console.log(`   📄 Mensaje de error: "${error.message}"`);
      console.log(`   🔢 Código de estado: ${response2.status}`);
    } else {
      console.log('❌ ERROR: Ubicación inválida NO fue rechazada');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar
testImprovedValidation()
  .then(() => {
    console.log('\n✅ Prueba de validaciones mejoradas completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando prueba:', error);
    process.exit(1);
  });

module.exports = { testImprovedValidation };

