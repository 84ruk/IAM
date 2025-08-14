#!/usr/bin/env node

/**
 * Script para detectar automáticamente la IP del servidor
 * Útil para configurar ESP32 y otros dispositivos IoT
 */

const os = require('os');
const { exec } = require('child_process');

function detectServerIP() {
  console.log('🔍 Detectando IP del servidor...\n');
  
  const networkInterfaces = os.networkInterfaces();
  const localIPs = [];
  
  // Buscar todas las IPs locales
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    
    for (const interface of interfaces) {
      if (interface.family === 'IPv4' && !interface.internal) {
        localIPs.push({
          interface: interfaceName,
          address: interface.address,
          netmask: interface.netmask
        });
      }
    }
  }
  
  if (localIPs.length === 0) {
    console.log('❌ No se encontraron IPs locales');
    return;
  }
  
  console.log('📍 IPs locales detectadas:');
  localIPs.forEach((ip, index) => {
    console.log(`  ${index + 1}. ${ip.interface}: ${ip.address}/${ip.netmask}`);
  });
  
  // Priorizar IPs en rangos comunes
  const preferredIPs = localIPs.filter(ip => {
    const firstOctet = parseInt(ip.address.split('.')[0]);
    return firstOctet === 192 || firstOctet === 10 || firstOctet === 172;
  });
  
  if (preferredIPs.length > 0) {
    const primaryIP = preferredIPs[0];
    console.log(`\n✅ IP recomendada: ${primaryIP.address}`);
    console.log(`   Interfaz: ${primaryIP.interface}`);
    console.log(`   URL completa: http://${primaryIP.address}:3001`);
    
    // Generar configuración para ESP32
    console.log('\n📱 Configuración para ESP32:');
    console.log(`   const char* serverName = "${primaryIP.address}";`);
    console.log(`   const int serverPort = 3001;`);
    console.log(`   String serverUrl = "http://${primaryIP.address}:3001";`);
    
    // Verificar conectividad
    console.log('\n🔌 Verificando conectividad...');
    exec(`ping -c 1 ${primaryIP.address}`, (error, stdout, stderr) => {
      if (error) {
        console.log(`   ❌ No se puede hacer ping a ${primaryIP.address}`);
      } else {
        console.log(`   ✅ Ping exitoso a ${primaryIP.address}`);
      }
    });
    
  } else {
    console.log('\n⚠️ No se encontraron IPs en rangos preferidos');
    console.log('   Usando la primera IP disponible:', localIPs[0].address);
  }
  
  // Mostrar información adicional
  console.log('\n📊 Información del sistema:');
  console.log(`   Hostname: ${os.hostname()}`);
  console.log(`   Plataforma: ${os.platform()}`);
  console.log(`   Arquitectura: ${os.arch()}`);
  
  // Mostrar comandos útiles
  console.log('\n🛠️ Comandos útiles:');
  console.log(`   curl http://${localIPs[0].address}:3001/iot/health`);
  console.log(`   curl http://${localIPs[0].address}:3001/iot/server-info`);
}

// Ejecutar detección
detectServerIP();

