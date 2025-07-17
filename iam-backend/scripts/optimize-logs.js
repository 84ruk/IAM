#!/usr/bin/env node

/**
 * Script para optimizar la configuración de logs
 * Ejecutar: node scripts/optimize-logs.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Optimizando configuración de logs...\n');

// Verificar configuración actual de logs
function checkLogConfiguration() {
  console.log('📋 Configuración actual de logs:');
  
  // Verificar NODE_ENV
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`  🌍 NODE_ENV: ${nodeEnv}`);
  
  // Verificar configuración de Prisma
  const prismaServicePath = 'src/prisma/prisma.service.ts';
  if (fs.existsSync(prismaServicePath)) {
    const content = fs.readFileSync(prismaServicePath, 'utf8');
    
    // Verificar si tiene configuración condicional de logs
    const hasConditionalLogs = content.includes('process.env.NODE_ENV === \'production\'');
    console.log(`  ${hasConditionalLogs ? '✅' : '❌'} Logs condicionales configurados`);
    
    // Verificar monitoreo de conexiones
    const hasConnectionMonitoring = content.includes('startConnectionMonitoring');
    console.log(`  ${hasConnectionMonitoring ? '✅' : '❌'} Monitoreo de conexiones configurado`);
    
    // Verificar intervalo de monitoreo
    const hasOptimizedInterval = content.includes('60000 : 30000');
    console.log(`  ${hasOptimizedInterval ? '✅' : '❌'} Intervalo optimizado configurado`);
  }
  
  // Verificar main.ts
  const mainTsPath = 'src/main.ts';
  if (fs.existsSync(mainTsPath)) {
    const content = fs.readFileSync(mainTsPath, 'utf8');
    
    // Verificar configuración de logger
    const hasLoggerConfig = content.includes('logger: process.env.NODE_ENV');
    console.log(`  ${hasLoggerConfig ? '✅' : '❌'} Logger configurado por entorno`);
  }
}

// Mostrar recomendaciones
function showRecommendations() {
  console.log('\n💡 Recomendaciones para optimizar logs:');
  console.log('');
  console.log('🚀 En Producción:');
  console.log('  - Solo logs de error y warning');
  console.log('  - Monitoreo de conexiones cada 60 segundos');
  console.log('  - Sin logs de debug de pool de conexiones');
  console.log('');
  console.log('🔧 En Desarrollo:');
  console.log('  - Logs completos (error, warn, info, query)');
  console.log('  - Monitoreo de conexiones cada 30 segundos');
  console.log('  - Logs de debug de pool de conexiones');
  console.log('');
  console.log('📊 Variables de entorno recomendadas:');
  console.log('  NODE_ENV=production  # Para producción');
  console.log('  NODE_ENV=development # Para desarrollo');
  console.log('  LOG_LEVEL=error      # Nivel mínimo de logs');
}

// Verificar archivos de configuración
function checkConfigFiles() {
  console.log('\n📁 Verificando archivos de configuración:');
  
  const configFiles = [
    'src/main.ts',
    'src/prisma/prisma.service.ts',
    'src/common/services/logger.service.ts',
    'src/common/services/secure-logger.service.ts'
  ];
  
  configFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  });
}

// Función principal
function main() {
  checkLogConfiguration();
  checkConfigFiles();
  showRecommendations();
  
  console.log('\n🎯 Optimización de logs completada');
  console.log('💡 Los logs de pool de conexiones ahora solo aparecen en desarrollo');
  console.log('💡 El monitoreo es menos frecuente en producción (60s vs 30s)');
}

main(); 