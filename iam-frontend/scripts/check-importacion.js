#!/usr/bin/env node

/**
 * Script para verificar el estado del módulo de importación
 * Uso: node scripts/check-importacion.js
 */

const https = require('https');
const http = require('http');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

console.log('🔍 Verificando módulo de importación...\n');

// Función para hacer request HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

// Verificar endpoints de importación
async function checkImportacionEndpoints() {
  const endpoints = [
    '/importacion/tipos-soportados',
    '/importacion/trabajos',
    '/health'
  ];
  
  console.log('📡 Verificando endpoints del backend...\n');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`  🔗 ${endpoint}...`);
      const response = await makeRequest(`${API_URL}${endpoint}`);
      
      if (response.status === 200) {
        console.log(`    ✅ OK (${response.status})`);
      } else {
        console.log(`    ⚠️  Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
    }
  }
}

// Verificar variables de entorno
function checkEnvironment() {
  console.log('🌍 Verificando variables de entorno...\n');
  
  const requiredVars = [
    'NEXT_PUBLIC_API_URL'
  ];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: ${value}`);
    } else {
      console.log(`  ❌ ${varName}: No definida`);
    }
  }
}

// Verificar archivos del frontend
function checkFrontendFiles() {
  console.log('\n📁 Verificando archivos del frontend...\n');
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'src/context/ImportacionGlobalContext.tsx',
    'src/hooks/useImportacionOptimized.ts',
    'src/hooks/useImportacionSafe.ts',
    'src/components/importacion/SafeImportacionStats.tsx',
    'src/components/importacion/ImportacionErrorBoundary.tsx'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - No encontrado`);
    }
  }
}

// Función principal
async function main() {
  try {
    await checkEnvironment();
    await checkImportacionEndpoints();
    checkFrontendFiles();
    
    console.log('\n🎉 Verificación completada!');
    console.log('\n📋 Resumen:');
    console.log('  - Si todos los endpoints responden OK, el backend está funcionando');
    console.log('  - Si todos los archivos están presentes, el frontend está configurado');
    console.log('  - Si hay errores, revisa la configuración y el estado del servidor');
    
  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { checkImportacionEndpoints, checkEnvironment, checkFrontendFiles }; 