#!/usr/bin/env node

/**
 * 🔧 SCRIPT PARA CORREGIR USUARIO PRUEBA2@IAM.COM
 * 
 * Este script corrige los problemas del usuario prueba2@iam.com:
 * - Completa el setup del usuario
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Colores para console.log
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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logTest(message) {
  log(`🧪 ${message}`, 'cyan');
}

async function fixPrueba2User() {
  log('🔧 CORRIGIENDO USUARIO PRUEBA2@IAM.COM', 'bright');
  log('=====================================', 'bright');
  
  try {
    // 1. Verificar conexión a la base de datos
    logTest('1. Verificando conexión a la base de datos...');
    await prisma.$connect();
    logSuccess('Conexión a la base de datos establecida');
    
    // 2. Buscar usuario prueba2@iam.com
    logTest('\n2. Buscando usuario prueba2@iam.com...');
    const usuario = await prisma.usuario.findUnique({
      where: {
        email: 'prueba2@iam.com'
      },
      include: {
        empresa: true
      }
    });
    
    if (!usuario) {
      logError('❌ Usuario prueba2@iam.com no encontrado');
      return;
    }
    
    logSuccess('✅ Usuario prueba2@iam.com encontrado');
    logInfo(`   ID: ${usuario.id}`);
    logInfo(`   Email: ${usuario.email}`);
    logInfo(`   Empresa ID: ${usuario.empresaId}`);
    logInfo(`   Setup completado: ${usuario.setupCompletado ? '✅ Sí' : '❌ No'}`);
    
    // 3. Completar setup del usuario
    logTest('\n3. Completando setup del usuario...');
    const usuarioActualizado = await prisma.usuario.update({
      where: {
        id: usuario.id
      },
      data: {
        setupCompletado: true
      }
    });
    
    logSuccess(`✅ Setup completado para ${usuarioActualizado.email}`);
    logInfo(`   Setup completado: ${usuarioActualizado.setupCompletado ? '✅ Sí' : '❌ No'}`);
    
    // 4. Verificar que todo esté correcto
    logTest('\n4. Verificando correcciones...');
    const usuarioVerificado = await prisma.usuario.findUnique({
      where: {
        email: 'prueba2@iam.com'
      },
      include: {
        empresa: true
      }
    });
    
    if (usuarioVerificado) {
      logSuccess('✅ Verificación completada');
      logInfo(`   Usuario: ${usuarioVerificado.email}`);
      logInfo(`   Empresa: ${usuarioVerificado.empresa?.nombre}`);
      logInfo(`   Setup completado: ${usuarioVerificado.setupCompletado ? '✅ Sí' : '❌ No'}`);
      logInfo(`   Usuario activo: ${usuarioVerificado.activo ? '✅ Sí' : '❌ No'}`);
      logInfo(`   Contraseña: ${usuarioVerificado.password ? '✅ Configurada' : '❌ No configurada'}`);
    }
    
    // 5. Verificar movimientos
    logTest('\n5. Verificando movimientos...');
    const totalMovimientos = await prisma.movimientoInventario.count({
      where: {
        empresaId: usuario.empresaId
      }
    });
    
    logInfo(`   Total de movimientos: ${totalMovimientos}`);
    
    if (totalMovimientos > 0) {
      logSuccess(`✅ ${totalMovimientos} movimientos disponibles`);
    } else {
      logWarning('⚠️ No hay movimientos disponibles');
    }
    
    // 6. Resumen final
    log('\n📊 RESUMEN DE CORRECCIONES', 'bright');
    log('==========================', 'bright');
    
    logSuccess('✅ Correcciones aplicadas:');
    logInfo('   1. Setup del usuario completado');
    
    logInfo('\n💡 Ahora puedes hacer login con:');
    logInfo('   Email: prueba2@iam.com');
    logInfo('   Contraseña: PruebaIAM123?');
    
    logInfo('\n🎯 El sistema debería funcionar correctamente');
    
  } catch (error) {
    logError(`Error corrigiendo usuario: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  fixPrueba2User()
    .then(() => {
      log('\n🎯 CORRECCIONES COMPLETADAS', 'bright');
      process.exit(0);
    })
    .catch(error => {
      logError(`Error inesperado: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { fixPrueba2User }; 