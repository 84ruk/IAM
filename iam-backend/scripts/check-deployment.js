#!/usr/bin/env node

/**
 * Script para verificar la configuración de deployment
 * Ejecutar: node scripts/check-deployment.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de deployment...\n');

// 1. Verificar archivos críticos
const criticalFiles = [
  'Dockerfile',
  'fly.toml',
  'package.json',
  'prisma/schema.prisma',
  'src/main.ts',
  'src/app.module.ts'
];

console.log('📁 Verificando archivos críticos:');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// 2. Verificar package.json
console.log('\n📦 Verificando package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`  ✅ name: ${packageJson.name}`);
  console.log(`  ✅ version: ${packageJson.version}`);
  console.log(`  ✅ main: ${packageJson.main || 'dist/main'}`);
  console.log(`  ✅ scripts.build: ${packageJson.scripts?.build || 'No encontrado'}`);
  console.log(`  ✅ scripts.start: ${packageJson.scripts?.start || 'No encontrado'}`);
} catch (error) {
  console.log(`  ❌ Error leyendo package.json: ${error.message}`);
}

// 3. Verificar Dockerfile
console.log('\n🐳 Verificando Dockerfile:');
try {
  const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
  const hasExpose = dockerfile.includes('EXPOSE 8080');
  const hasCmd = dockerfile.includes('CMD ["node", "dist/main"]');
  const hasDumbInit = dockerfile.includes('dumb-init');
  
  console.log(`  ${hasExpose ? '✅' : '❌'} EXPOSE 8080`);
  console.log(`  ${hasCmd ? '✅' : '❌'} CMD ["node", "dist/main"]`);
  console.log(`  ${hasDumbInit ? '✅' : '❌'} dumb-init configurado`);
} catch (error) {
  console.log(`  ❌ Error leyendo Dockerfile: ${error.message}`);
}

// 4. Verificar fly.toml
console.log('\n🚀 Verificando fly.toml:');
try {
  const flyToml = fs.readFileSync('fly.toml', 'utf8');
  const hasPort = flyToml.includes('PORT = "8080"');
  const hasInternalPort = flyToml.includes('internal_port = 8080');
  const hasHealthCheck = flyToml.includes('/health');
  
  console.log(`  ${hasPort ? '✅' : '❌'} PORT = "8080"`);
  console.log(`  ${hasInternalPort ? '✅' : '❌'} internal_port = 8080`);
  console.log(`  ${hasHealthCheck ? '✅' : '❌'} health check configurado`);
} catch (error) {
  console.log(`  ❌ Error leyendo fly.toml: ${error.message}`);
}

// 5. Verificar main.ts
console.log('\n🔧 Verificando main.ts:');
try {
  const mainTs = fs.readFileSync('src/main.ts', 'utf8');
  const hasPort = mainTs.includes('process.env.PORT || 8080');
  const hasListen = mainTs.includes('0.0.0.0');
  const hasCors = mainTs.includes('enableCors');
  
  console.log(`  ${hasPort ? '✅' : '❌'} Puerto configurado correctamente`);
  console.log(`  ${hasListen ? '✅' : '❌'} Escuchando en 0.0.0.0`);
  console.log(`  ${hasCors ? '✅' : '❌'} CORS configurado`);
} catch (error) {
  console.log(`  ❌ Error leyendo main.ts: ${error.message}`);
}

// 6. Verificar módulos
console.log('\n📋 Verificando módulos principales:');
const modules = [
  'src/app.module.ts',
  'src/auth/auth.module.ts',
  'src/notifications/notification.module.ts',
  'src/users/users.module.ts'
];

modules.forEach(module => {
  const exists = fs.existsSync(module);
  console.log(`  ${exists ? '✅' : '❌'} ${module}`);
});

console.log('\n🎯 Resumen de verificación completado.');
console.log('💡 Si hay errores, revisa los archivos marcados con ❌'); 