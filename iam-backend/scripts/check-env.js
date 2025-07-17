#!/usr/bin/env node

/**
 * Script para verificar variables de entorno requeridas
 * Ejecutar: node scripts/check-env.js
 */

console.log('🔍 Verificando variables de entorno...\n');

// Variables críticas para el funcionamiento
const criticalEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV',
  'PORT'
];

// Variables importantes para funcionalidades específicas
const importantEnvVars = [
  'SENDGRID_API_KEY',
  'SENDGRID_FROM_EMAIL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE'
];

console.log('🚨 Variables críticas:');
criticalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Ocultar valores sensibles
    const displayValue = varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PASSWORD') 
      ? '***' 
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ❌ ${varName}: NO DEFINIDA`);
  }
});

console.log('\n📋 Variables importantes:');
importantEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PASSWORD') 
      ? '***' 
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ⚠️  ${varName}: NO DEFINIDA (opcional)`);
  }
});

console.log('\n🌍 Entorno actual:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`  PORT: ${process.env.PORT || '8080'}`);

console.log('\n💡 Recomendaciones:');
console.log('  - Las variables críticas son necesarias para el funcionamiento básico');
console.log('  - Las variables importantes mejoran la funcionalidad pero no son críticas');
console.log('  - En producción, asegúrate de que todas las variables críticas estén definidas'); 