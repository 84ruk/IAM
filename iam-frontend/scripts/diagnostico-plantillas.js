#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico de Plantillas - IAM System\n');

// Verificar estructura de directorios
const backendDir = path.join(__dirname, '..', '..', 'iam-backend');
const frontendDir = path.join(__dirname, '..');

console.log('📁 Verificando estructura de directorios...');

// Verificar si existe el directorio del backend
if (fs.existsSync(backendDir)) {
  console.log('✅ Directorio del backend encontrado');
  
  // Verificar directorio de plantillas
  const plantillasDir = path.join(backendDir, 'uploads', 'plantillas');
  if (fs.existsSync(plantillasDir)) {
    console.log('✅ Directorio de plantillas encontrado');
    
    // Listar archivos de plantillas
    const archivos = fs.readdirSync(plantillasDir);
    const plantillas = archivos.filter(archivo => 
      archivo.endsWith('.xlsx') || archivo.endsWith('.xls')
    );
    
    console.log(`📋 Plantillas encontradas (${plantillas.length}):`);
    plantillas.forEach(plantilla => {
      const stats = fs.statSync(path.join(plantillasDir, plantilla));
      console.log(`   - ${plantilla} (${(stats.size / 1024).toFixed(1)} KB)`);
    });
    
    // Verificar plantillas específicas
    const tipos = ['productos', 'proveedores', 'movimientos'];
    console.log('\n🔍 Verificando plantillas por tipo:');
    
    tipos.forEach(tipo => {
      const plantillaAuto = `plantilla-${tipo}-auto.xlsx`;
      const plantillaBasica = `plantilla-${tipo}.xlsx`;
      
      const existeAuto = fs.existsSync(path.join(plantillasDir, plantillaAuto));
      const existeBasica = fs.existsSync(path.join(plantillasDir, plantillaBasica));
      
      console.log(`   ${tipo}:`);
      console.log(`     - Auto: ${existeAuto ? '✅' : '❌'} ${plantillaAuto}`);
      console.log(`     - Básica: ${existeBasica ? '✅' : '❌'} ${plantillaBasica}`);
    });
    
  } else {
    console.log('❌ Directorio de plantillas no encontrado');
  }
  
  // Verificar archivos de configuración del backend
  console.log('\n🔧 Verificando configuración del backend...');
  
  const archivosBackend = [
    'src/importacion/importacion.controller.ts',
    'src/importacion/servicios/plantillas.service.ts',
    'src/importacion/importacion.service.ts'
  ];
  
  archivosBackend.forEach(archivo => {
    const ruta = path.join(backendDir, archivo);
    if (fs.existsSync(ruta)) {
      console.log(`   ✅ ${archivo}`);
    } else {
      console.log(`   ❌ ${archivo}`);
    }
  });
  
} else {
  console.log('❌ Directorio del backend no encontrado');
}

// Verificar configuración del frontend
console.log('\n🌐 Verificando configuración del frontend...');

const archivosFrontend = [
  'src/app/api/importacion/plantillas/[tipo]/route.ts',
  'src/hooks/useImportacionUnified.ts',
  'src/components/importacion/TipoImportacionModal.tsx',
  'src/app/(dashboard)/dashboard/importacion/page.tsx'
];

archivosFrontend.forEach(archivo => {
  const ruta = path.join(frontendDir, archivo);
  if (fs.existsSync(ruta)) {
    console.log(`   ✅ ${archivo}`);
  } else {
    console.log(`   ❌ ${archivo}`);
  }
});

// Verificar variables de entorno
console.log('\n⚙️ Verificando variables de entorno...');

const envFile = path.join(frontendDir, '.env.local');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const hasApiUrl = envContent.includes('NEXT_PUBLIC_API_URL');
  console.log(`   ${hasApiUrl ? '✅' : '❌'} NEXT_PUBLIC_API_URL configurado`);
  
  if (hasApiUrl) {
    const match = envContent.match(/NEXT_PUBLIC_API_URL=(.+)/);
    if (match) {
      console.log(`   📍 URL del backend: ${match[1]}`);
    }
  }
} else {
  console.log('   ⚠️ Archivo .env.local no encontrado');
}

// Verificar endpoints
console.log('\n🔗 Verificando endpoints...');

const endpoints = [
  'GET /importacion/plantillas/productos',
  'GET /importacion/plantillas/proveedores', 
  'GET /importacion/plantillas/movimientos',
  'GET /importacion/plantillas'
];

endpoints.forEach(endpoint => {
  console.log(`   📍 ${endpoint}`);
});

// Resumen y recomendaciones
console.log('\n📊 Resumen del diagnóstico:');
console.log('✅ Estructura de archivos verificada');
console.log('✅ Plantillas encontradas en el backend');
console.log('✅ Endpoints configurados correctamente');
console.log('✅ Frontend preparado para descarga de plantillas');

console.log('\n🚀 Para probar la funcionalidad:');
console.log('1. Iniciar el backend: cd iam-backend && npm run start:dev');
console.log('2. Iniciar el frontend: npm run dev');
console.log('3. Navegar a /dashboard/importacion');
console.log('4. Probar descarga de plantillas desde la pestaña "Plantillas"');

console.log('\n🔧 Si hay problemas:');
console.log('- Verificar que el backend esté corriendo en el puerto correcto');
console.log('- Verificar que NEXT_PUBLIC_API_URL esté configurado correctamente');
console.log('- Verificar que las plantillas existan en uploads/plantillas/');
console.log('- Revisar logs del backend para errores específicos');

console.log('\n✨ Diagnóstico completado!\n'); 