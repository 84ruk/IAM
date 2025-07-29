// Script de prueba para WebSocket
const io = require('socket.io-client');

// Conectar al WebSocket
const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  auth: {
    token: 'test-token' // Token de prueba
  }
});

console.log('Conectando al WebSocket...');

socket.on('connect', () => {
  console.log('✅ Conectado al WebSocket');
  console.log('Socket ID:', socket.id);
  
  // Suscribirse a un trabajo de prueba
  socket.emit('subscribe:trabajos', { trabajoId: 'test-trabajo' });
  console.log('Suscrito al trabajo de prueba');
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del WebSocket');
});

socket.on('connect_error', (error) => {
  console.log('❌ Error de conexión:', error.message);
});

// Escuchar eventos de importación
socket.on('progreso:actualizado', (data) => {
  console.log('📊 Progreso actualizado:', data);
});

socket.on('trabajo:completado', (data) => {
  console.log('✅ Trabajo completado:', data);
});

socket.on('trabajo:error', (data) => {
  console.log('❌ Trabajo con error:', data);
});

socket.on('trabajo:creado', (data) => {
  console.log('🆕 Trabajo creado:', data);
});

// Mantener la conexión activa
setInterval(() => {
  if (socket.connected) {
    socket.emit('ping');
  }
}, 30000);

console.log('Script de prueba iniciado. Presiona Ctrl+C para salir.'); 