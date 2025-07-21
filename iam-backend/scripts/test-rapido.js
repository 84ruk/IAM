#!/usr/bin/env node

// Script de testing rápido para el sistema de importación
// Uso: node test-rapido.js

const { ejecutarTests } = require('./test-importacion.js');

console.log('🚀 Iniciando testing rápido...');

// Configurar variables de entorno para testing
process.env.API_URL = process.env.API_URL || 'http://localhost:8080';
process.env.TIMEOUT = process.env.TIMEOUT || '30000';

// Ejecutar tests
ejecutarTests()
  .then(() => {
    console.log('✅ Testing rápido completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en testing rápido:', error);
    process.exit(1);
  });
