#!/usr/bin/env node

/**
 * Script de demostración para mostrar la diferencia entre logs verbosos y limpios
 * 
 * Uso:
 *   node scripts/demo-logs.js clean     # Logs limpios (recomendado para producción)
 *   node scripts/demo-logs.js verbose   # Logs verbosos (solo para debugging)
 */

const { execSync } = require('child_process');

const mode = process.argv[2] || 'clean';

console.log('🚀 Demo de configuración de logs del Dashboard CQRS');
console.log('==================================================\n');

if (mode === 'verbose') {
    console.log('📊 Modo VERBOSO - Mostrando todos los logs de Prisma');
    console.log('   Incluye: queries SQL, info, warnings, errors');
    console.log('   Uso: Para debugging detallado\n');
    
    // Configurar variables para logs verbosos
    process.env.DEBUG_PRISMA = 'true';
    process.env.DEBUG_POOL = 'true';
    process.env.LOG_LEVEL = 'debug';
    
} else {
    console.log('🧹 Modo LIMPIO - Solo logs esenciales');
    console.log('   Incluye: warnings, errors');
    console.log('   Uso: Para producción y desarrollo normal\n');
    
    // Configurar variables para logs limpios
    process.env.DEBUG_PRISMA = 'false';
    process.env.DEBUG_POOL = 'false';
    process.env.LOG_LEVEL = 'warn';
}

console.log('⚙️  Configuración actual:');
console.log(`   DEBUG_PRISMA: ${process.env.DEBUG_PRISMA}`);
console.log(`   DEBUG_POOL: ${process.env.DEBUG_POOL}`);
console.log(`   LOG_LEVEL: ${process.env.LOG_LEVEL}\n`);

console.log('🧪 Ejecutando tests del dashboard...\n');

try {
    // Ejecutar tests con la configuración actual
    const result = execSync('npm run test:dashboard-unit', {
        stdio: 'inherit',
        env: { ...process.env }
    });
    
    console.log('\n✅ Tests completados exitosamente!');
    
    if (mode === 'verbose') {
        console.log('\n💡 Como puedes ver, en modo VERBOSO se muestran:');
        console.log('   - Todas las queries SQL de Prisma');
        console.log('   - Información detallada del pool de conexiones');
        console.log('   - Logs de debug adicionales');
        console.log('\n🔧 Para usar logs limpios en producción:');
        console.log('   export DEBUG_PRISMA=false');
        console.log('   export DEBUG_POOL=false');
        console.log('   npm start');
        
    } else {
        console.log('\n💡 Como puedes ver, en modo LIMPIO solo se muestran:');
        console.log('   - Warnings y errores importantes');
        console.log('   - Resultados de los tests');
        console.log('   - Sin ruido de queries SQL');
        console.log('\n🔧 Para debugging detallado:');
        console.log('   export DEBUG_PRISMA=true');
        console.log('   export DEBUG_POOL=true');
        console.log('   npm run test:dashboard-unit');
    }
    
} catch (error) {
    console.error('\n❌ Error ejecutando tests:', error.message);
    process.exit(1);
} 