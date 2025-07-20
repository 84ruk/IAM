#!/usr/bin/env node

/**
 * 🔐 SCRIPT PARA ACTUALIZAR CONTRASEÑA DE USUARIO
 * 
 * Este script actualiza la contraseña del usuario prueba@iam.com
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
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

async function updateUserPassword() {
  log('🔐 ACTUALIZANDO CONTRASEÑA DE USUARIO', 'bright');
  log('====================================', 'bright');
  
  try {
    // 1. Verificar conexión a la base de datos
    logTest('1. Verificando conexión a la base de datos...');
    await prisma.$connect();
    logSuccess('Conexión a la base de datos establecida');
    
    // 2. Buscar usuario prueba@iam.com
    logTest('2. Buscando usuario prueba@iam.com...');
    const usuario = await prisma.usuario.findUnique({
      where: {
        email: 'prueba@iam.com'
      }
    });
    
    if (!usuario) {
      logError('❌ Usuario prueba@iam.com no encontrado');
      return;
    }
    
    logSuccess('Usuario encontrado:');
    logInfo(`   ID: ${usuario.id}`);
    logInfo(`   Email: ${usuario.email}`);
    logInfo(`   Nombre: ${usuario.nombre}`);
    logInfo(`   Rol: ${usuario.rol}`);
    logInfo(`   Empresa ID: ${usuario.empresaId}`);
    
    // 3. Generar nueva contraseña
    const newPassword = 'PruebaIAM123!';
    const saltRounds = 10;
    
    logTest('3. Generando hash de la nueva contraseña...');
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // 4. Actualizar contraseña
    logTest('4. Actualizando contraseña en la base de datos...');
    const updatedUser = await prisma.usuario.update({
      where: {
        id: usuario.id
      },
      data: {
        password: hashedPassword
      }
    });
    
    logSuccess('✅ Contraseña actualizada exitosamente');
    logInfo(`Nueva contraseña: ${newPassword}`);
    logInfo(`Usuario actualizado: ${updatedUser.email}`);
    
    // 5. Verificar que se actualizó correctamente
    logTest('5. Verificando que la contraseña se actualizó...');
    const verifyUser = await prisma.usuario.findUnique({
      where: {
        email: 'prueba@iam.com'
      }
    });
    
    if (verifyUser && verifyUser.password) {
      const isPasswordValid = await bcrypt.compare(newPassword, verifyUser.password);
      if (isPasswordValid) {
        logSuccess('✅ Verificación exitosa - La contraseña se actualizó correctamente');
      } else {
        logError('❌ Error en la verificación de la contraseña');
      }
    } else {
      logError('❌ No se pudo verificar la contraseña');
    }
    
    // 6. Información para el usuario
    log('\n💡 INFORMACIÓN PARA EL USUARIO', 'green');
    log('==============================', 'green');
    logSuccess('Contraseña actualizada correctamente');
    logInfo(`Email: prueba@iam.com`);
    logInfo(`Contraseña: ${newPassword}`);
    logInfo('Ahora puedes hacer login en el frontend');
    logInfo('El sistema de daily-movements debería funcionar correctamente');
    
  } catch (error) {
    logError(`Error actualizando contraseña: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  updateUserPassword()
    .then(() => {
      log('\n🎯 ACTUALIZACIÓN COMPLETADA', 'bright');
      process.exit(0);
    })
    .catch(error => {
      logError(`Error en la actualización: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { updateUserPassword }; 