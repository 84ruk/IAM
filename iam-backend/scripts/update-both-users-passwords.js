#!/usr/bin/env node

/**
 * 🔐 SCRIPT PARA ACTUALIZAR CONTRASEÑAS DE AMBOS USUARIOS
 * 
 * Este script actualiza las contraseñas de prueba@iam.com y prueba2@iam.com
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

async function updateBothUsersPasswords() {
  log('🔐 ACTUALIZANDO CONTRASEÑAS DE AMBOS USUARIOS', 'bright');
  log('============================================', 'bright');
  
  const users = [
    {
      email: 'prueba@iam.com',
      password: 'PruebaIAM123?',
      expectedEmpresaId: 8
    },
    {
      email: 'prueba2@iam.com',
      password: 'PruebaIAM123?',
      expectedEmpresaId: 9
    }
  ];
  
  try {
    // 1. Verificar conexión a la base de datos
    logTest('1. Verificando conexión a la base de datos...');
    await prisma.$connect();
    logSuccess('Conexión a la base de datos establecida');
    
    const results = [];
    
    for (const userConfig of users) {
      logTest(`\n2. Procesando usuario: ${userConfig.email}`);
      
      // Buscar usuario
      const usuario = await prisma.usuario.findUnique({
        where: {
          email: userConfig.email
        }
      });
      
      if (!usuario) {
        logError(`❌ Usuario ${userConfig.email} no encontrado`);
        results.push({ email: userConfig.email, success: false, error: 'Usuario no encontrado' });
        continue;
      }
      
      logSuccess(`Usuario encontrado: ${userConfig.email}`);
      logInfo(`   ID: ${usuario.id}`);
      logInfo(`   Nombre: ${usuario.nombre}`);
      logInfo(`   Rol: ${usuario.rol}`);
      logInfo(`   Empresa ID: ${usuario.empresaId}`);
      logInfo(`   Empresa esperada: ${userConfig.expectedEmpresaId}`);
      
      // Verificar que esté en la empresa correcta
      if (usuario.empresaId !== userConfig.expectedEmpresaId) {
        logWarning(`⚠️ Usuario en empresa ${usuario.empresaId}, esperado ${userConfig.expectedEmpresaId}`);
      }
      
      // Generar hash de la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userConfig.password, saltRounds);
      
      // Actualizar contraseña
      logTest(`3. Actualizando contraseña para ${userConfig.email}...`);
      const updatedUser = await prisma.usuario.update({
        where: {
          id: usuario.id
        },
        data: {
          password: hashedPassword
        }
      });
      
      logSuccess(`✅ Contraseña actualizada para ${userConfig.email}`);
      logInfo(`   Nueva contraseña: ${userConfig.password}`);
      
      // Verificar que se actualizó correctamente
      logTest(`4. Verificando contraseña para ${userConfig.email}...`);
      const verifyUser = await prisma.usuario.findUnique({
        where: {
          email: userConfig.email
        }
      });
      
      if (verifyUser && verifyUser.password) {
        const isPasswordValid = await bcrypt.compare(userConfig.password, verifyUser.password);
        if (isPasswordValid) {
          logSuccess(`✅ Verificación exitosa para ${userConfig.email}`);
          results.push({ 
            email: userConfig.email, 
            success: true, 
            userId: usuario.id,
            empresaId: usuario.empresaId
          });
        } else {
          logError(`❌ Error en la verificación de contraseña para ${userConfig.email}`);
          results.push({ 
            email: userConfig.email, 
            success: false, 
            error: 'Error en verificación de contraseña' 
          });
        }
      } else {
        logError(`❌ No se pudo verificar la contraseña para ${userConfig.email}`);
        results.push({ 
          email: userConfig.email, 
          success: false, 
          error: 'No se pudo verificar contraseña' 
        });
      }
    }
    
    // 5. Resumen de resultados
    log('\n📊 RESUMEN DE ACTUALIZACIONES', 'bright');
    log('============================', 'bright');
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    log(`Total de usuarios procesados: ${totalCount}`);
    log(`✅ Exitosos: ${successCount}`);
    log(`❌ Fallidos: ${totalCount - successCount}`);
    
    results.forEach(result => {
      if (result.success) {
        logSuccess(`${result.email} - Actualizado correctamente (ID: ${result.userId}, Empresa: ${result.empresaId})`);
      } else {
        logError(`${result.email} - Error: ${result.error}`);
      }
    });
    
    // 6. Información para el usuario
    log('\n💡 INFORMACIÓN PARA EL USUARIO', 'green');
    log('==============================', 'green');
    
    const successfulUsers = results.filter(r => r.success);
    if (successfulUsers.length > 0) {
      logSuccess('Usuarios actualizados correctamente:');
      successfulUsers.forEach(user => {
        logInfo(`   Email: ${user.email}`);
        logInfo(`   Contraseña: PruebaIAM123?`);
      });
      
      logInfo('\nAhora puedes hacer login en el frontend con cualquiera de estos usuarios');
      logInfo('El sistema de daily-movements debería funcionar correctamente');
    } else {
      logError('No se pudo actualizar ningún usuario');
    }
    
    // 7. Verificar empresas
    log('\n🏢 INFORMACIÓN DE EMPRESAS', 'cyan');
    log('==========================', 'cyan');
    
    const empresas = await prisma.empresa.findMany({
      where: {
        id: { in: [8, 9] }
      },
      select: {
        id: true,
        nombre: true,
        rfc: true
      }
    });
    
    empresas.forEach(empresa => {
      logInfo(`   Empresa ${empresa.id}: ${empresa.nombre} (${empresa.rfc || 'Sin RFC'})`);
    });
    
  } catch (error) {
    logError(`Error actualizando contraseñas: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  updateBothUsersPasswords()
    .then(() => {
      log('\n🎯 ACTUALIZACIÓN COMPLETADA', 'bright');
      process.exit(0);
    })
    .catch(error => {
      logError(`Error en la actualización: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { updateBothUsersPasswords }; 