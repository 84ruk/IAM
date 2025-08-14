const io = require('socket.io-client');

console.log('🔌 Probando conexión WebSocket...');

// Conectar al WebSocket del backend
const socket = io('http://localhost:3001/sensores', {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  withCredentials: true,
});

socket.on('connect', () => {
  console.log('✅ WebSocket conectado exitosamente');
  console.log('🆔 ID del cliente:', socket.id);
  
  // Suscribirse a una ubicación de prueba
  socket.emit('suscribirse-ubicacion', { ubicacionId: 1 });
});

socket.on('disconnect', () => {
  console.log('❌ WebSocket desconectado');
});

socket.on('connect_error', (error) => {
  console.error('❌ Error de conexión:', error);
});

socket.on('suscripcion-exitosa', (data) => {
  console.log('✅ Suscripción exitosa:', data);
});

socket.on('nueva_lectura', (data) => {
  console.log('📊 Nueva lectura recibida:', data);
});

socket.on('nueva-lectura', (data) => {
  console.log('📊 Nueva lectura (con guión) recibida:', data);
});

socket.on('lectura-sensor', (data) => {
  console.log('📊 Lectura de sensor específico:', data);
});

socket.on('lectura-ubicacion', (data) => {
  console.log('📊 Lectura de ubicación:', data);
});

socket.on('estado-sensores', (data) => {
  console.log('📊 Estado de sensores:', data);
});

socket.on('nueva-alerta', (data) => {
  console.log('🚨 Nueva alerta:', data);
});

socket.on('error', (error) => {
  console.error('❌ Error WebSocket:', error);
});

// Mantener la conexión activa
setInterval(() => {
  if (socket.connected) {
    console.log('💓 Ping - Conexión activa');
  }
}, 10000);

// Manejar cierre del proceso
process.on('SIGINT', () => {
  console.log('\n🔌 Cerrando conexión WebSocket...');
  socket.disconnect();
  process.exit(0);
});

console.log('🔄 Script de prueba iniciado. Presiona Ctrl+C para salir.');
