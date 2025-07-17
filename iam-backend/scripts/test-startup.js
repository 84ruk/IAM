#!/usr/bin/env node

/**
 * Script para probar el inicio de la aplicación
 * Ejecutar: node scripts/test-startup.js
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🧪 Probando inicio de la aplicación...\n');

// Verificar si existe el archivo compilado
if (!fs.existsSync('dist/main.js')) {
  console.log('❌ Error: dist/main.js no existe. Ejecuta "npm run build" primero.');
  process.exit(1);
}

console.log('✅ Archivo compilado encontrado');

// Función para probar el inicio
function testStartup() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Iniciando aplicación...');
    
    const app = spawn('node', ['dist/main.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: '8081' // Puerto diferente para no conflictuar
      }
    });

    let output = '';
    let errorOutput = '';
    let startupTimeout;

    // Capturar salida
    app.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`📤 STDOUT: ${data.toString().trim()}`);
      
      // Verificar si la aplicación inició correctamente
      if (data.toString().includes('🚀 Aplicación iniciada') || 
          data.toString().includes('Application started')) {
        clearTimeout(startupTimeout);
        console.log('✅ Aplicación iniciada correctamente');
        app.kill('SIGTERM');
        resolve(true);
      }
    });

    app.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log(`📤 STDERR: ${data.toString().trim()}`);
    });

    // Timeout de 30 segundos
    startupTimeout = setTimeout(() => {
      console.log('⏰ Timeout: La aplicación no inició en 30 segundos');
      app.kill('SIGTERM');
      reject(new Error('Timeout'));
    }, 30000);

    // Manejar cierre
    app.on('close', (code) => {
      clearTimeout(startupTimeout);
      if (code === 0) {
        console.log('✅ Aplicación cerrada correctamente');
        resolve(true);
      } else {
        console.log(`❌ Aplicación cerrada con código: ${code}`);
        reject(new Error(`Exit code: ${code}`));
      }
    });

    app.on('error', (error) => {
      clearTimeout(startupTimeout);
      console.log(`❌ Error al iniciar: ${error.message}`);
      reject(error);
    });
  });
}

// Ejecutar prueba
async function runTest() {
  try {
    await testStartup();
    console.log('\n🎉 ¡Prueba de inicio exitosa!');
    console.log('💡 La aplicación debería funcionar correctamente en producción.');
  } catch (error) {
    console.log('\n❌ Prueba de inicio fallida');
    console.log(`🔍 Error: ${error.message}`);
    console.log('\n💡 Verifica:');
    console.log('  - Variables de entorno configuradas');
    console.log('  - Base de datos accesible');
    console.log('  - Dependencias instaladas');
    console.log('  - Código compilado correctamente');
    process.exit(1);
  }
}

runTest(); 