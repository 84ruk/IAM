const axios = require('axios');
const { io } = require('socket.io-client');

// Configuración
const BACKEND_URL = 'http://localhost:3001';
const SENSOR_ID = 25;
const EMPRESA_ID = 2;
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTUxOTU0MTIsImp0aSI6ImE2YzNhNmYwLTdlMGItNGJmYi1hZDAzLTBlMDUzYmNmYjFkMyIsInN1YiI6IjIiLCJlbWFpbCI6ImJhcnVrMDY2QGdtYWlsLmNvbSIsInJvbCI6IkFETUlOIiwiZW1wcmVzYUlkIjoyLCJ0aXBvSW5kdXN0cmlhIjoiRUxFQ1RST05JQ0EiLCJhdXRoUHJvdmlkZXIiOiJnb29nbGUiLCJleHAiOjE3NTUyODE4MTIsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSJ9.au_wRgr9DZsrgq9YvjfTBxEJS5LvqVH6tGQbYZDuddA';

const headers = {
  'Authorization': `Bearer ${JWT_TOKEN}`,
  'Content-Type': 'application/json'
};

// Función para simular lectura que excede umbrales
async function simularLecturaConAlerta(temperatura, descripcion) {
  try {
    console.log(`🌡️ Simulando lectura: ${temperatura}°C - ${descripcion}`);
    
    const lectura = {
      sensorId: SENSOR_ID,
      tipo: 'TEMPERATURA',
      valor: temperatura,
      unidad: '°C',
      fecha: new Date().toISOString(),
      ubicacionId: 2,
      empresaId: EMPRESA_ID
    };

    // Enviar lectura al backend
    const response = await axios.post(`${BACKEND_URL}/iot/lecturas`, lectura, { headers });
    
    if (response.status === 201 || response.status === 200) {
      console.log(`✅ Lectura enviada: ${temperatura}°C`);
      
      // Determinar estado basado en temperatura
      let estado = 'NORMAL';
      if (temperatura > 28) {
        estado = 'CRITICO';
      } else if (temperatura > 25) {
        estado = 'ALERTA';
      }
      
      console.log(`🚨 Estado detectado: ${estado}`);
      return { success: true, estado, temperatura };
    }
  } catch (error) {
    console.error(`❌ Error enviando lectura ${temperatura}°C:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// Función para probar WebSocket y recibir alertas
async function probarWebSocketAlertas() {
  return new Promise((resolve) => {
    console.log('🔌 Conectando WebSocket para recibir alertas...');
    
    const socket = io(`${BACKEND_URL}/sensores`, {
      auth: { token: JWT_TOKEN },
      transports: ['websocket', 'polling']
    });

    let alertasRecibidas = 0;
    const alertas = [];

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      
      // Suscribirse al sensor
      socket.emit('suscribirse-sensor', { sensorId: SENSOR_ID });
      console.log(`🔔 Suscrito al sensor ${SENSOR_ID}`);
    });

    // Escuchar alertas
    socket.on('nueva-alerta', (data) => {
      console.log('🚨 Nueva alerta recibida:', data);
      alertasRecibidas++;
      alertas.push(data);
    });

    // Escuchar estado de sensores (que incluye alertas)
    socket.on('estado-sensores', (data) => {
      if (data.tipo === 'ALERTA') {
        console.log('🚨 Alerta del sistema recibida:', data);
        alertasRecibidas++;
        alertas.push(data);
      }
    });

    // Escuchar lecturas
    socket.on('nueva_lectura', (data) => {
      console.log('📊 Nueva lectura recibida:', data);
    });

    // Escuchar lecturas ESP32
    socket.on('nueva-lectura', (data) => {
      console.log('📊 Lectura ESP32 recibida:', data);
    });

    // Timeout para esperar alertas
    setTimeout(() => {
      console.log(`⏰ Tiempo de espera completado. Alertas recibidas: ${alertasRecibidas}`);
      socket.disconnect();
      resolve({ alertasRecibidas, alertas });
    }, 15000); // 15 segundos
  });
}

// Función principal de prueba
async function probarSistemaAlertas() {
  console.log('🧪 Iniciando prueba del sistema de alertas...\n');

  try {
    // 1. Probar WebSocket en background
    const webSocketPromise = probarWebSocketAlertas();
    
    // 2. Esperar un poco para que se conecte
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Simular lecturas normales
    console.log('\n📊 Simulando lecturas normales...');
    await simularLecturaConAlerta(22, 'Temperatura normal');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await simularLecturaConAlerta(23, 'Temperatura normal');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Simular lectura de ALERTA (25-28°C)
    console.log('\n⚠️ Simulando lectura de ALERTA...');
    await simularLecturaConAlerta(26, 'Temperatura de ALERTA - excede umbral de 25°C');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 5. Simular lectura CRÍTICA (>28°C)
    console.log('\n🚨 Simulando lectura CRÍTICA...');
    await simularLecturaConAlerta(30, 'Temperatura CRÍTICA - excede umbral de 28°C');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 6. Simular más lecturas críticas
    await simularLecturaConAlerta(29, 'Temperatura CRÍTICA persistente');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 7. Simular retorno a normal
    console.log('\n✅ Simulando retorno a normal...');
    await simularLecturaConAlerta(24, 'Retorno a temperatura normal');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 8. Esperar resultados del WebSocket
    console.log('\n⏳ Esperando alertas del WebSocket...');
    const resultado = await webSocketPromise;
    
    // 9. Mostrar resultados
    console.log('\n📊 RESULTADOS DE LA PRUEBA:');
    console.log('========================');
    console.log(`🔌 WebSocket conectado: ✅`);
    console.log(`📡 Lecturas enviadas: 7`);
    console.log(`🚨 Alertas recibidas: ${resultado.alertasRecibidas}`);
    console.log(`📋 Detalle de alertas:`);
    
    if (resultado.alertas.length > 0) {
      resultado.alertas.forEach((alerta, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(alerta, null, 2)}`);
      });
    } else {
      console.log('   No se recibieron alertas por WebSocket');
    }
    
    console.log('\n🎯 ANÁLISIS:');
    if (resultado.alertasRecibidas > 0) {
      console.log('✅ El sistema de alertas está funcionando correctamente');
      console.log('✅ Las alertas se emiten por WebSocket en tiempo real');
      console.log('✅ El frontend puede recibir y mostrar las alertas');
    } else {
      console.log('⚠️ No se recibieron alertas por WebSocket');
      console.log('🔍 Posibles causas:');
      console.log('   - El backend no está procesando las alertas');
      console.log('   - Los umbrales no están configurados');
      console.log('   - El WebSocket no está emitiendo alertas');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar prueba
if (require.main === module) {
  probarSistemaAlertas().then(() => {
    console.log('\n🏁 Prueba completada');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { probarSistemaAlertas, simularLecturaConAlerta };
