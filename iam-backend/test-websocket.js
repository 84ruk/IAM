const io = require('socket.io-client');

const BASE_URL = 'http://localhost:3001';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTQ5MzAzOTcsImp0aSI6ImVkNGZkNDljLTMxYjktNGZhNy04MTllLTRlMzIwNDEzYjdhZCIsInN1YiI6IjIiLCJlbWFpbCI6ImJhcnVrMDY2QGdtYWlsLmNvbSIsInJvbCI6IkFETUlOIiwiZW1wcmVzYUlkIjoyLCJ0aXBvSW5kdXN0cmlhIjoiR0VORVJJQ0EiLCJhdXRoUHJvdmlkZXIiOiJnb29nbGUiLCJleHAiOjE3NTUwMTY3OTcsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSJ9.asAe5308G62JhQs6_aGT1jgML_BLd8gnh-OH21RX6ww';

async function testWebSocket() {
  console.log('🧪 Probando conexión WebSocket...\n');

  try {
    // Crear conexión WebSocket
    const socket = io(`${BASE_URL}/sensores`, {
      transports: ['websocket'],
      timeout: 10000,
      reconnection: false,
      withCredentials: true,
      auth: { token: JWT_TOKEN }
    });

    // Eventos de conexión
    socket.on('connect', () => {
      console.log('✅ WebSocket conectado exitosamente');
      console.log(`   Socket ID: ${socket.id}`);
      console.log(`   Conectado: ${socket.connected}`);
      
      // Suscribirse a ubicación
      socket.emit('suscribirse-ubicacion', { ubicacionId: 2 });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket desconectado:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión:', error.message);
    });

    // Eventos de sensores
    socket.on('suscripcion-exitosa', (data) => {
      console.log('✅ Suscripción exitosa:', data);
    });

    socket.on('nueva_lectura', (data) => {
      console.log('📊 Nueva lectura recibida:', data);
    });

    socket.on('nueva-alerta', (data) => {
      console.log('🚨 Nueva alerta recibida:', data);
    });

    socket.on('error', (error) => {
      console.error('❌ Error del servidor:', error);
    });

    // Mantener conexión activa por 10 segundos
    setTimeout(() => {
      console.log('\n🔄 Desconectando WebSocket...');
      socket.disconnect();
      process.exit(0);
    }, 10000);

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar test
testWebSocket();
