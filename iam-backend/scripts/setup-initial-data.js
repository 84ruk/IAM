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

async function setupInitialData() {
  console.log('🔧 Configurando Datos Iniciales para Sensores\n');

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

    // 2. Verificar si ya existen ubicaciones
    console.log('\n2️⃣ Verificando ubicaciones existentes...');
    try {
      const ubicaciones = await api.get('/ubicaciones');
      console.log('✅ Ubicaciones obtenidas:', ubicaciones.data.length, 'ubicaciones');
      
      if (ubicaciones.data.length > 0) {
        console.log('📍 Ubicaciones existentes:');
        ubicaciones.data.forEach(ubicacion => {
          console.log(`   - ${ubicacion.nombre} (ID: ${ubicacion.id})`);
        });
        console.log('\n✅ Ya tienes ubicaciones configuradas. Puedes proceder con la creación de sensores.');
        return;
      }
    } catch (error) {
      console.log('❌ Error obteniendo ubicaciones:', error.response?.data?.message || error.message);
      return;
    }

    // 3. Crear ubicaciones de ejemplo si no existen
    console.log('\n3️⃣ Creando ubicaciones de ejemplo...');
    const ubicacionesEjemplo = [
      {
        nombre: 'Almacén Principal',
        descripcion: 'Almacén principal de la empresa',
        direccion: 'Calle Principal 123',
        ciudad: 'Ciudad Principal',
        pais: 'País',
        codigoPostal: '12345'
      },
      {
        nombre: 'Bodega Secundaria',
        descripcion: 'Bodega secundaria para productos adicionales',
        direccion: 'Avenida Secundaria 456',
        ciudad: 'Ciudad Secundaria',
        pais: 'País',
        codigoPostal: '67890'
      },
      {
        nombre: 'Centro de Distribución',
        descripcion: 'Centro de distribución para envíos',
        direccion: 'Zona Industrial 789',
        ciudad: 'Ciudad Industrial',
        pais: 'País',
        codigoPostal: '11111'
      }
    ];

    const ubicacionesCreadas = [];
    for (const ubicacionData of ubicacionesEjemplo) {
      try {
        const ubicacion = await api.post('/ubicaciones', ubicacionData);
        ubicacionesCreadas.push(ubicacion.data);
        console.log(`✅ Ubicación creada: ${ubicacion.data.nombre} (ID: ${ubicacion.data.id})`);
      } catch (error) {
        console.log(`❌ Error creando ubicación ${ubicacionData.nombre}:`, error.response?.data?.message || error.message);
      }
    }

    if (ubicacionesCreadas.length > 0) {
      console.log('\n✅ Ubicaciones creadas exitosamente');
      console.log('📍 Ubicaciones disponibles:');
      ubicacionesCreadas.forEach(ubicacion => {
        console.log(`   - ${ubicacion.nombre} (ID: ${ubicacion.id})`);
      });
    } else {
      console.log('\n❌ No se pudieron crear ubicaciones');
      return;
    }

    // 4. Crear sensores de ejemplo
    console.log('\n4️⃣ Creando sensores de ejemplo...');
    const primeraUbicacion = ubicacionesCreadas[0];
    
    const sensoresEjemplo = [
      {
        nombre: 'Sensor Temperatura Principal',
        tipo: 'TEMPERATURA',
        ubicacionId: primeraUbicacion.id,
        descripcion: 'Sensor de temperatura para el almacén principal'
      },
      {
        nombre: 'Sensor Humedad Principal',
        tipo: 'HUMEDAD',
        ubicacionId: primeraUbicacion.id,
        descripcion: 'Sensor de humedad para el almacén principal'
      },
      {
        nombre: 'Sensor Peso Báscula',
        tipo: 'PESO',
        ubicacionId: primeraUbicacion.id,
        descripcion: 'Sensor de peso para la báscula del almacén'
      }
    ];

    const sensoresCreados = [];
    for (const sensorData of sensoresEjemplo) {
      try {
        const sensor = await api.post('/mqtt-sensor/sensores/registrar-simple', sensorData);
        sensoresCreados.push(sensor.data.sensor);
        console.log(`✅ Sensor creado: ${sensor.data.sensor.nombre} (ID: ${sensor.data.sensor.id})`);
      } catch (error) {
        console.log(`❌ Error creando sensor ${sensorData.nombre}:`, error.response?.data?.message || error.message);
      }
    }

    if (sensoresCreados.length > 0) {
      console.log('\n✅ Sensores creados exitosamente');
      console.log('🔧 Sensores disponibles:');
      sensoresCreados.forEach(sensor => {
        console.log(`   - ${sensor.nombre} (${sensor.tipo}) - ID: ${sensor.id}`);
      });
    }

    // 5. Crear algunas lecturas de ejemplo
    console.log('\n5️⃣ Creando lecturas de ejemplo...');
    for (const sensor of sensoresCreados) {
      try {
        const lectura = await api.post('/mqtt-sensor/lecturas/registrar', {
          tipo: sensor.tipo,
          valor: Math.random() * 50 + 10, // Valor aleatorio entre 10 y 60
          unidad: sensor.tipo === 'TEMPERATURA' ? '°C' : sensor.tipo === 'HUMEDAD' ? '%' : 'kg',
          sensorId: sensor.id,
          ubicacionId: primeraUbicacion.id
        });
        console.log(`✅ Lectura creada para ${sensor.nombre}: ${lectura.data.valor} ${lectura.data.unidad}`);
      } catch (error) {
        console.log(`❌ Error creando lectura para ${sensor.nombre}:`, error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 ¡Configuración inicial completada!');
    console.log('\n📋 RESUMEN DE DATOS CREADOS:');
    console.log(`   🏢 Ubicaciones: ${ubicacionesCreadas.length}`);
    console.log(`   🔧 Sensores: ${sensoresCreados.length}`);
    console.log(`   📈 Lecturas: ${sensoresCreados.length}`);
    
    console.log('\n🚀 ¡El sistema está listo para usar desde el frontend!');
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('   1. Ejecutar: node scripts/test-complete-sensor-setup.js');
    console.log('   2. Implementar frontend con los endpoints disponibles');
    console.log('   3. Usar WebSockets para actualizaciones en tiempo real');

  } catch (error) {
    console.error('❌ Error en la configuración:', error.message);
  }
}

// Función para mostrar información de configuración
function mostrarInfo() {
  console.log('📋 INFORMACIÓN DE CONFIGURACIÓN INICIAL\n');

  console.log('🔧 Requisitos previos:');
  console.log('   1. Servidor ejecutándose (npm run start:dev)');
  console.log('   2. JWT Token configurado (export JWT_TOKEN="tu-token")');
  console.log('   3. Base de datos conectada');
  console.log('   4. Usuario autenticado con empresa asignada');

  console.log('\n📊 Datos que se crearán:');
  console.log('   🏢 3 ubicaciones de ejemplo');
  console.log('   🔧 3 sensores de diferentes tipos');
  console.log('   📈 Lecturas de ejemplo para cada sensor');

  console.log('\n🎯 Tipos de sensores disponibles:');
  console.log('   - TEMPERATURA (unidad: °C)');
  console.log('   - HUMEDAD (unidad: %)');
  console.log('   - PESO (unidad: kg)');
  console.log('   - PRESION (unidad: Pa)');

  console.log('\n💡 Comandos útiles:');
  console.log('   # Configurar datos iniciales');
  console.log('   node scripts/setup-initial-data.js');
  console.log('');
  console.log('   # Probar funcionalidad completa');
  console.log('   node scripts/test-complete-sensor-setup.js');
  console.log('');
  console.log('   # Ver configuración necesaria');
  console.log('   node scripts/test-complete-sensor-setup.js --config');
}

// Ejecutar configuración
if (require.main === module) {
  if (process.argv.includes('--info')) {
    mostrarInfo();
  } else {
    setupInitialData();
  }
}

module.exports = { setupInitialData, mostrarInfo }; 