#!/usr/bin/env node

/**
 * 🧪 Script de prueba para la detección automática de IP local
 * 
 * Uso:
 * node scripts/test-network-detection.js
 */

const { networkInterfaces } = require('os');

console.log('🌐 PRUEBA DE DETECCIÓN AUTOMÁTICA DE IP LOCAL\n');

// Función para detectar IP local (simulando el servicio)
function detectLocalIP() {
  const interfaces = networkInterfaces();
  
  console.log('📡 Interfaces de red detectadas:');
  
  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue;
    
    console.log(`\n🔍 Interfaz: ${name}`);
    
    for (const net of nets) {
      if (net.family === 'IPv4') {
        const status = net.internal ? 'INTERNA' : 'EXTERNA';
        const local = isLocalNetworkIP(net.address) ? '🌐 LOCAL' : '🌍 EXTERNA';
        
        console.log(`  📍 ${net.address} (${status}) - Máscara: ${net.netmask} ${local}`);
      }
    }
  }
  
  // Buscar la mejor IP local
  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue;
    
    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) {
        const ip = net.address;
        
        if (isLocalNetworkIP(ip)) {
          console.log(`\n✅ IP LOCAL RECOMENDADA: ${ip} (${name})`);
          console.log(`🔗 URL Backend: http://${ip}:3001`);
          console.log(`🔗 URL Frontend: http://${ip}:3000`);
          return ip;
        }
      }
    }
  }
  
  console.log('\n❌ No se encontró IP local válida');
  return null;
}

function isLocalNetworkIP(ip) {
  const parts = ip.split('.').map(Number);
  
  const localNetworks = [
    [192, 168, 0, 0, 16],    // 192.168.0.0/16
    [10, 0, 0, 0, 8],        // 10.0.0.0/8
    [172, 16, 0, 0, 12],     // 172.16.0.0/12
    [169, 254, 0, 0, 16],    // 169.254.0.0/16 (link-local)
  ];
  
  return localNetworks.some(([a, b, c, d, mask]) => {
    if (parts[0] === a && parts[1] === b) {
      if (mask === 8) return true;
      if (mask === 16) return parts[2] === c;
      if (mask === 12) return parts[1] >= 16 && parts[1] <= 31;
    }
    return false;
  });
}

// Ejecutar detección
console.log('🚀 Iniciando detección...\n');
const localIP = detectLocalIP();

if (localIP) {
  console.log('\n🎯 RESUMEN:');
  console.log(`📍 IP Local: ${localIP}`);
  console.log(`🔗 Backend: http://${localIP}:3001`);
  console.log(`🔗 Frontend: http://${localIP}:3000`);
  console.log('\n✅ Esta IP será usada automáticamente para generar código Arduino');
} else {
  console.log('\n⚠️  RECOMENDACIONES:');
  console.log('1. Verifica que tu red esté configurada correctamente');
  console.log('2. Asegúrate de estar conectado a una red local');
  console.log('3. Puedes configurar LOCAL_IP en tu archivo .env');
}

console.log('\n📚 Para más información, revisa ENV_NETWORK_CONFIG.example');







