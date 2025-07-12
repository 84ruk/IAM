#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 Generando secrets seguros para JWT...\n');

// Generar JWT Secret (64 caracteres hexadecimales = 32 bytes)
const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

console.log('✅ JWT_SECRET generado:');
console.log(jwtSecret);
console.log('\n✅ JWT_REFRESH_SECRET generado:');
console.log(jwtRefreshSecret);

console.log('\n📋 Copia estas variables a tu archivo .env:');
console.log('==========================================');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
console.log('==========================================');

console.log('\n⚠️  IMPORTANTE:');
console.log('- Guarda estos secrets en un lugar seguro');
console.log('- Nunca los compartas o subas a control de versiones');
console.log('- Usa diferentes secrets para cada entorno (dev, staging, prod)');
console.log('- Rota estos secrets regularmente en producción');

// Verificar que los secrets son diferentes
if (jwtSecret === jwtRefreshSecret) {
  console.log('\n❌ ERROR: Los secrets son idénticos. Regenerando...');
  process.exit(1);
}

console.log('\n✅ Los secrets son únicos y seguros'); 