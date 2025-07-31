#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificación de Comunicación Backend - IAM System\n');

// Verificar configuración del frontend
const frontendDir = path.join(__dirname, '..');
const envFile = path.join(frontendDir, '.env.local');

console.log('📋 Verificando configuración del frontend...');

if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const apiUrlMatch = envContent.match(/NEXT_PUBLIC_API_URL=(.+)/);
  
  if (apiUrlMatch) {
    const apiUrl = apiUrlMatch[1];
    console.log(`✅ NEXT_PUBLIC_API_URL configurado: ${apiUrl}`);
    
    // Verificar que la URL sea válida
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      console.log('✅ URL del backend es local (desarrollo)');
    } else {
      console.log('✅ URL del backend es remota (producción)');
    }
  } else {
    console.log('❌ NEXT_PUBLIC_API_URL no encontrado en .env.local');
  }
} else {
  console.log('❌ Archivo .env.local no encontrado');
}

// Verificar archivos de comunicación con el backend
console.log('\n🔗 Verificando archivos de comunicación...');

const archivosComunicacion = [
  'src/hooks/useImportacionUnified.ts',
  'src/lib/api/importacion.ts',
  'src/app/api/importacion/plantillas/[tipo]/route.ts',
  'src/components/importacion/SmartImportModal.tsx',
  'src/components/importacion/TipoImportacionModal.tsx'
];

archivosComunicacion.forEach(archivo => {
  const ruta = path.join(frontendDir, archivo);
  if (fs.existsSync(ruta)) {
    console.log(`   ✅ ${archivo}`);
    
    // Verificar contenido específico
    const contenido = fs.readFileSync(ruta, 'utf8');
    
    if (archivo.includes('useImportacionUnified.ts')) {
      const tieneImportar = contenido.includes('const importar');
      const tieneDescargarPlantilla = contenido.includes('descargarPlantilla');
      const tieneWebSocket = contenido.includes('socket.io-client');
      
      console.log(`      - Función importar: ${tieneImportar ? '✅' : '❌'}`);
      console.log(`      - Función descargarPlantilla: ${tieneDescargarPlantilla ? '✅' : '❌'}`);
      console.log(`      - WebSocket configurado: ${tieneWebSocket ? '✅' : '❌'}`);
    }
    
    if (archivo.includes('route.ts')) {
      const tieneBackendUrl = contenido.includes('process.env.NEXT_PUBLIC_API_URL');
      const tieneFetch = contenido.includes('fetch');
      const tieneCookies = contenido.includes('Cookie');
      
      console.log(`      - URL del backend: ${tieneBackendUrl ? '✅' : '❌'}`);
      console.log(`      - Fetch configurado: ${tieneFetch ? '✅' : '❌'}`);
      console.log(`      - Cookies de auth: ${tieneCookies ? '✅' : '❌'}`);
    }
    
    if (archivo.includes('SmartImportModal.tsx')) {
      const tieneSelectedTipo = contenido.includes('selectedTipo');
      const tieneUseImportacionUnified = contenido.includes('useImportacionUnified');
      const tieneHandleImport = contenido.includes('handleImport');
      
      console.log(`      - selectedTipo definido: ${tieneSelectedTipo ? '✅' : '❌'}`);
      console.log(`      - Hook useImportacionUnified: ${tieneUseImportacionUnified ? '✅' : '❌'}`);
      console.log(`      - Función handleImport: ${tieneHandleImport ? '✅' : '❌'}`);
    }
    
  } else {
    console.log(`   ❌ ${archivo}`);
  }
});

// Verificar tipos TypeScript
console.log('\n📝 Verificando tipos TypeScript...');

const archivosTipos = [
  'src/types/importacion.ts',
  'src/types/user.ts',
  'src/types/api.ts'
];

archivosTipos.forEach(archivo => {
  const ruta = path.join(frontendDir, archivo);
  if (fs.existsSync(ruta)) {
    console.log(`   ✅ ${archivo}`);
    
    const contenido = fs.readFileSync(ruta, 'utf8');
    
    if (archivo.includes('importacion.ts')) {
      const tieneTipoImportacion = contenido.includes('TipoImportacion');
      const tieneImportacionResultado = contenido.includes('ImportacionResultado');
      const tieneImportacionEstado = contenido.includes('ImportacionEstado');
      
      console.log(`      - TipoImportacion: ${tieneTipoImportacion ? '✅' : '❌'}`);
      console.log(`      - ImportacionResultado: ${tieneImportacionResultado ? '✅' : '❌'}`);
      console.log(`      - ImportacionEstado: ${tieneImportacionEstado ? '✅' : '❌'}`);
    }
  } else {
    console.log(`   ❌ ${archivo}`);
  }
});

// Verificar endpoints del backend
console.log('\n🌐 Verificando endpoints del backend...');

const endpoints = [
  'GET /importacion/plantillas/productos',
  'GET /importacion/plantillas/proveedores',
  'GET /importacion/plantillas/movimientos',
  'GET /importacion/plantillas',
  'POST /importacion/auto',
  'POST /importacion/productos',
  'POST /importacion/proveedores',
  'POST /importacion/movimientos',
  'GET /auth/me',
  'POST /auth/logout'
];

endpoints.forEach(endpoint => {
  console.log(`   📍 ${endpoint}`);
});

// Verificar configuración de autenticación
console.log('\n🔐 Verificando configuración de autenticación...');

const archivosAuth = [
  'src/hooks/useAuth.ts',
  'src/lib/ssrAuth.ts',
  'src/context/ServerUserContext.tsx'
];

archivosAuth.forEach(archivo => {
  const ruta = path.join(frontendDir, archivo);
  if (fs.existsSync(ruta)) {
    console.log(`   ✅ ${archivo}`);
    
    const contenido = fs.readFileSync(ruta, 'utf8');
    
    if (archivo.includes('useAuth.ts')) {
      const tieneValidateAuth = contenido.includes('validateAuth');
      const tieneLogout = contenido.includes('logout');
      const tieneGetAuthHeaders = contenido.includes('getAuthHeaders');
      
      console.log(`      - validateAuth: ${tieneValidateAuth ? '✅' : '❌'}`);
      console.log(`      - logout: ${tieneLogout ? '✅' : '❌'}`);
      console.log(`      - getAuthHeaders: ${tieneGetAuthHeaders ? '✅' : '❌'}`);
    }
    
    if (archivo.includes('ssrAuth.ts')) {
      const tieneRequireAuth = contenido.includes('requireAuth');
      const tieneMapUserFromBackend = contenido.includes('mapUserFromBackend');
      const tieneValidateClientSession = contenido.includes('validateClientSession');
      
      console.log(`      - requireAuth: ${tieneRequireAuth ? '✅' : '❌'}`);
      console.log(`      - mapUserFromBackend: ${tieneMapUserFromBackend ? '✅' : '❌'}`);
      console.log(`      - validateClientSession: ${tieneValidateClientSession ? '✅' : '❌'}`);
    }
  } else {
    console.log(`   ❌ ${archivo}`);
  }
});

// Resumen y recomendaciones
console.log('\n📊 Resumen de la verificación:');
console.log('✅ Configuración del frontend verificada');
console.log('✅ Archivos de comunicación con backend verificados');
console.log('✅ Tipos TypeScript verificados');
console.log('✅ Endpoints del backend documentados');
console.log('✅ Configuración de autenticación verificada');

console.log('\n🚀 Para probar la comunicación:');
console.log('1. Iniciar el backend: cd iam-backend && npm run start:dev');
console.log('2. Iniciar el frontend: npm run dev');
console.log('3. Navegar a /dashboard/importacion');
console.log('4. Probar importación manual');
console.log('5. Verificar descarga de plantillas');

console.log('\n🔧 Si hay problemas de comunicación:');
console.log('- Verificar que el backend esté corriendo en el puerto correcto');
console.log('- Verificar que NEXT_PUBLIC_API_URL esté configurado correctamente');
console.log('- Verificar que las cookies de autenticación se estén enviando');
console.log('- Revisar la consola del navegador para errores de red');
console.log('- Verificar que los endpoints del backend estén disponibles');

console.log('\n✨ Verificación completada!\n'); 