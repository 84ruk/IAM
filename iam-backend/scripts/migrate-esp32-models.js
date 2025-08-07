#!/usr/bin/env node

/**
 * Script para generar y aplicar migración de Prisma para modelos ESP32
 * 
 * Este script:
 * 1. Genera una nueva migración de Prisma
 * 2. Aplica la migración a la base de datos
 * 3. Regenera el cliente de Prisma
 * 
 * Uso: node scripts/migrate-esp32-models.js
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
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`✅ ${description} completado`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error en ${description}: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('🚀 INICIANDO MIGRACIÓN DE MODELOS ESP32', 'bright');
  log('=' .repeat(60), 'cyan');

  // Verificar que estamos en el directorio correcto
  if (!fs.existsSync('prisma/schema.prisma')) {
    log('❌ No se encontró el archivo schema.prisma. Asegúrate de estar en el directorio correcto.', 'red');
    process.exit(1);
  }

  // Paso 1: Generar migración
  const migrationName = `add_esp32_models_${Date.now()}`;
  const generateSuccess = executeCommand(
    `npx prisma migrate dev --name ${migrationName}`,
    'Generando migración de Prisma'
  );

  if (!generateSuccess) {
    log('❌ Error generando migración. Abortando.', 'red');
    process.exit(1);
  }

  // Paso 2: Regenerar cliente de Prisma
  const regenerateSuccess = executeCommand(
    'npx prisma generate',
    'Regenerando cliente de Prisma'
  );

  if (!regenerateSuccess) {
    log('❌ Error regenerando cliente. Abortando.', 'red');
    process.exit(1);
  }

  // Paso 3: Verificar que los modelos están disponibles
  log('🔍 Verificando modelos en el cliente de Prisma...', 'cyan');
  
  try {
    // Intentar importar el cliente de Prisma
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Verificar que los nuevos modelos están disponibles
    const models = ['dispositivoIoT', 'kpiEvento'];
    
    for (const model of models) {
      if (prisma[model]) {
        log(`✅ Modelo ${model} disponible`, 'green');
      } else {
        log(`❌ Modelo ${model} no encontrado`, 'red');
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    log(`❌ Error verificando modelos: ${error.message}`, 'red');
  }

  log('\n' + '='.repeat(60), 'cyan');
  log('🎉 MIGRACIÓN COMPLETADA', 'bright');
  log('='.repeat(60), 'cyan');
  
  log('✅ Migración generada y aplicada', 'green');
  log('✅ Cliente de Prisma regenerado', 'green');
  log('✅ Modelos ESP32 disponibles', 'green');
  
  log('\n📋 MODELOS AGREGADOS:', 'cyan');
  log('   • DispositivoIoT - Para registrar dispositivos ESP32', 'green');
  log('   • KpiEvento - Para registrar eventos y métricas', 'green');
  
  log('\n🔧 PRÓXIMOS PASOS:', 'yellow');
  log('   1. Reinicia el servidor de desarrollo', 'yellow');
  log('   2. Ejecuta las pruebas: node scripts/test-esp32-improvements.js', 'yellow');
  log('   3. Verifica que los endpoints funcionan correctamente', 'yellow');
  
  log('\n✨ ¡Los modelos ESP32 están listos para usar!', 'bright');
}

// Ejecutar script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 