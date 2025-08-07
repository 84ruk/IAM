#!/usr/bin/env node

/**
 * Script para verificar y corregir errores de compilación ESP32
 * 
 * Este script:
 * 1. Verifica errores de TypeScript
 * 2. Verifica dependencias faltantes
 * 3. Corrige errores comunes
 * 4. Genera reporte de errores
 * 
 * Uso: node scripts/fix-esp32-errors.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description) {
  try {
    log(`🔄 ${description}...`, 'cyan');
    const result = execSync(command, { 
      stdio: 'pipe', 
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    log(`✅ ${description} completado`, 'green');
    return { success: true, output: result };
  } catch (error) {
    log(`❌ Error en ${description}: ${error.message}`, 'red');
    return { success: false, output: error.stdout || error.stderr || error.message };
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkDependencies() {
  log('\n📦 Verificando dependencias...', 'cyan');
  
  const requiredDeps = [
    '@nestjs/common',
    '@nestjs/axios',
    'ioredis',
    'qrcode',
    '@prisma/client'
  ];
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const missingDeps = [];
  
  for (const dep of requiredDeps) {
    if (!deps[dep]) {
      missingDeps.push(dep);
      log(`❌ Dependencia faltante: ${dep}`, 'red');
    } else {
      log(`✅ Dependencia encontrada: ${dep}`, 'green');
    }
  }
  
  if (missingDeps.length > 0) {
    log(`\n🔧 Instalando dependencias faltantes...`, 'yellow');
    const installResult = executeCommand(
      `npm install ${missingDeps.join(' ')}`,
      'Instalando dependencias'
    );
    
    if (!installResult.success) {
      log('❌ Error instalando dependencias', 'red');
      return false;
    }
  }
  
  return true;
}

function checkTypeScriptErrors() {
  log('\n🔍 Verificando errores de TypeScript...', 'cyan');
  
  const result = executeCommand(
    'npx tsc --noEmit',
    'Verificando TypeScript'
  );
  
  if (!result.success) {
    log('❌ Se encontraron errores de TypeScript:', 'red');
    log(result.output, 'red');
    return false;
  }
  
  log('✅ No se encontraron errores de TypeScript', 'green');
  return true;
}

async function checkPrismaClient() {
  log('\n🗄️ Verificando cliente de Prisma...', 'cyan');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Verificar modelos ESP32
    const models = ['dispositivoIoT', 'kpiEvento'];
    const missingModels = [];
    
    for (const model of models) {
      if (prisma[model]) {
        log(`✅ Modelo ${model} disponible`, 'green');
      } else {
        missingModels.push(model);
        log(`❌ Modelo ${model} no encontrado`, 'red');
      }
    }
    
    await prisma.$disconnect();
    
    if (missingModels.length > 0) {
      log('❌ Faltan modelos en el cliente de Prisma', 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`❌ Error verificando cliente de Prisma: ${error.message}`, 'red');
    return false;
  }
}

function checkFileStructure() {
  log('\n📁 Verificando estructura de archivos...', 'cyan');
  
  const requiredFiles = [
    'src/microservices/mqtt-sensor/esp32-auto-config.service.ts',
    'src/microservices/mqtt-sensor/esp32-base-code.service.ts',
    'src/microservices/mqtt-sensor/mqtt-sensor.controller.ts',
    'src/microservices/mqtt-sensor/mqtt-sensor.module.ts',
    'prisma/schema.prisma',
    'scripts/test-esp32-improvements.js',
    'scripts/migrate-esp32-models.js'
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    if (checkFileExists(file)) {
      log(`✅ Archivo encontrado: ${file}`, 'green');
    } else {
      missingFiles.push(file);
      log(`❌ Archivo faltante: ${file}`, 'red');
    }
  }
  
  if (missingFiles.length > 0) {
    log('❌ Faltan archivos requeridos', 'red');
    return false;
  }
  
  return true;
}

function checkEnvironmentVariables() {
  log('\n🔧 Verificando variables de entorno...', 'cyan');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_URL'
  ];
  
  const missingEnvVars = [];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log(`✅ Variable de entorno: ${envVar}`, 'green');
    } else {
      missingEnvVars.push(envVar);
      log(`❌ Variable de entorno faltante: ${envVar}`, 'red');
    }
  }
  
  if (missingEnvVars.length > 0) {
    log('⚠️ Algunas variables de entorno no están configuradas', 'yellow');
    log('   El sistema funcionará con valores por defecto', 'yellow');
  }
  
  return true;
}

function generateReport(results) {
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 REPORTE DE VERIFICACIÓN', 'bright');
  log('='.repeat(60), 'cyan');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const failedChecks = totalChecks - passedChecks;
  
  log(`✅ Verificaciones exitosas: ${passedChecks}`, 'green');
  log(`❌ Verificaciones fallidas: ${failedChecks}`, 'red');
  log(`📈 Total de verificaciones: ${totalChecks}`, 'blue');
  
  const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
  log(`🎯 Tasa de éxito: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  if (failedChecks > 0) {
    log('\n❌ VERIFICACIONES FALLIDAS:', 'red');
    Object.entries(results).forEach(([check, passed]) => {
      if (!passed) {
        log(`   • ${check}`, 'red');
      }
    });
    
    log('\n🔧 RECOMENDACIONES:', 'yellow');
    log('   1. Ejecuta: node scripts/migrate-esp32-models.js', 'yellow');
    log('   2. Reinicia el servidor de desarrollo', 'yellow');
    log('   3. Verifica las variables de entorno', 'yellow');
  } else {
    log('\n🎉 ¡Todas las verificaciones pasaron!', 'green');
    log('   El sistema ESP32 está listo para usar', 'green');
  }
  
  return failedChecks === 0;
}

async function main() {
  log('🚀 VERIFICANDO SISTEMA ESP32', 'bright');
  log('=' .repeat(60), 'cyan');
  
  const results = {
    'Dependencias': checkDependencies(),
    'Estructura de archivos': checkFileStructure(),
    'Variables de entorno': checkEnvironmentVariables(),
    'Cliente de Prisma': await checkPrismaClient(),
    'TypeScript': checkTypeScriptErrors(),
  };
  
  const allPassed = generateReport(results);
  
  if (allPassed) {
    log('\n✨ ¡El sistema ESP32 está completamente funcional!', 'bright');
    log('   Puedes ejecutar las pruebas: node scripts/test-esp32-improvements.js', 'green');
  } else {
    log('\n⚠️ Se encontraron problemas que requieren atención', 'yellow');
    process.exit(1);
  }
}

// Ejecutar script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 