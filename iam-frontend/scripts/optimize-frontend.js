#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n${step}. ${description}`, 'cyan');
  log('─'.repeat(50), 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Función para ejecutar un comando
function runCommand(command, description) {
  try {
    logInfo(`Ejecutando: ${description}`);
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    logSuccess(`${description} completado`);
    return true;
  } catch (error) {
    logError(`${description} falló: ${error.message}`);
    return false;
  }
}

// Función para ejecutar un script
function runScript(scriptName, description) {
  const scriptPath = path.join(__dirname, scriptName);
  return runCommand(`node ${scriptPath}`, description);
}

// Función principal
function main() {
  log('🚀 INICIANDO OPTIMIZACIÓN COMPLETA DEL FRONTEND', 'bright');
  log('='.repeat(60), 'blue');
  
  let successCount = 0;
  let totalSteps = 6;
  
  // Paso 1: Verificar archivos duplicados
  logStep(1, 'Verificando archivos duplicados');
  if (runScript('check-duplicates.js', 'Verificación de duplicados')) {
    successCount++;
  }
  
  // Paso 2: Optimizar imports
  logStep(2, 'Optimizando imports');
  if (runScript('optimize-imports.js', 'Optimización de imports')) {
    successCount++;
  }
  
  // Paso 3: Agregar Error Boundaries
  logStep(3, 'Agregando Error Boundaries');
  if (runScript('add-error-boundaries.js', 'Agregado de Error Boundaries')) {
    successCount++;
  }
  
  // Paso 4: Agregar Loading States
  logStep(4, 'Agregando Loading States');
  if (runScript('add-loading-states.js', 'Agregado de Loading States')) {
    successCount++;
  }
  
  // Paso 5: Verificar tipos TypeScript
  logStep(5, 'Verificando tipos TypeScript');
  if (runCommand('npx tsc --noEmit', 'Verificación de tipos TypeScript')) {
    successCount++;
  }
  
  // Paso 6: Linting
  logStep(6, 'Ejecutando linting');
  if (runCommand('npm run lint', 'Linting del código')) {
    successCount++;
  }
  
  // Resumen final
  log('\n📊 RESUMEN FINAL', 'bright');
  log('='.repeat(60), 'blue');
  log(`Pasos completados exitosamente: ${successCount}/${totalSteps}`, successCount === totalSteps ? 'green' : 'yellow');
  
  if (successCount === totalSteps) {
    logSuccess('¡Todas las optimizaciones se completaron exitosamente!');
    logInfo('Tu frontend ahora está optimizado con:');
    logInfo('  • Imports optimizados');
    logInfo('  • Error Boundaries granulares');
    logInfo('  • Loading states mejorados');
    logInfo('  • Código limpio y sin duplicados');
  } else {
    logWarning('Algunas optimizaciones no se completaron. Revisa los errores arriba.');
  }
  
  log('\n💡 PRÓXIMOS PASOS RECOMENDADOS:', 'bright');
  log('1. Revisa los cambios realizados en los archivos modificados');
  log('2. Prueba la aplicación para asegurar que todo funciona correctamente');
  log('3. Ejecuta las pruebas si las tienes configuradas');
  log('4. Considera ejecutar un análisis de rendimiento');
  log('5. Revisa las métricas de rendimiento mencionadas en la imagen');
  
  log('\n🎯 MÉTRICAS DE RENDIMIENTO A MONITOREAR:', 'bright');
  log('• Tiempo de carga inicial (First Contentful Paint)');
  log('• Tiempo de carga completa (Largest Contentful Paint)');
  log('• Tiempo de interacción (Time to Interactive)');
  log('• Tamaño del bundle JavaScript');
  log('• Número de requests HTTP');
  log('• Uso de memoria del navegador');
  
  log('\n✨ ¡Optimización completada!', 'green');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main, runCommand, runScript }; 