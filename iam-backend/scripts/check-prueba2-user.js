#!/usr/bin/env node

/**
 * 🔍 SCRIPT PARA VERIFICAR USUARIO PRUEBA2@IAM.COM
 * 
 * Este script verifica si el usuario prueba2@iam.com existe y está configurado correctamente.
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

function logDebug(message) {
  log(`🔍 ${message}`, 'magenta');
}

async function checkPrueba2User() {
  log('🔍 VERIFICANDO USUARIO PRUEBA2@IAM.COM', 'bright');
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
      
      // Verificar si existe algún usuario con email similar
      logTest('3. Buscando usuarios similares...');
      const usuariosSimilares = await prisma.usuario.findMany({
        where: {
          email: {
            contains: 'prueba'
          }
        },
        select: {
          id: true,
          email: true,
          nombre: true,
          empresaId: true
        }
      });
      
      if (usuariosSimilares.length > 0) {
        logInfo('Usuarios encontrados con "prueba" en el email:');
        usuariosSimilares.forEach(user => {
          logInfo(`   - ${user.email} (ID: ${user.id}, Empresa: ${user.empresaId})`);
        });
      } else {
        logWarning('No se encontraron usuarios con "prueba" en el email');
      }
      
      return;
    }
    
    logSuccess('✅ Usuario prueba2@iam.com encontrado');
    logInfo(`   ID: ${usuario.id}`);
    logInfo(`   Email: ${usuario.email}`);
    logInfo(`   Nombre: ${usuario.nombre}`);
    logInfo(`   Rol: ${usuario.rol}`);
    logInfo(`   Empresa ID: ${usuario.empresaId}`);
    logInfo(`   Empresa: ${usuario.empresa?.nombre || 'No encontrada'}`);
    logInfo(`   Contraseña: ${usuario.password ? '✅ Configurada' : '❌ No configurada'}`);
    logInfo(`   Activo: ${usuario.activo ? '✅ Sí' : '❌ No'}`);
    logInfo(`   Setup completado: ${usuario.setupCompleted ? '✅ Sí' : '❌ No'}`);
    
    // 3. Verificar empresa
    logTest('\n3. Verificando empresa...');
    if (usuario.empresa) {
      logSuccess(`✅ Empresa encontrada: ${usuario.empresa.nombre}`);
      logInfo(`   ID: ${usuario.empresa.id}`);
      logInfo(`   RFC: ${usuario.empresa.rfc || 'Sin RFC'}`);
      logInfo(`   Activa: ${usuario.empresa.activa ? '✅ Sí' : '❌ No'}`);
    } else {
      logError('❌ Empresa no encontrada');
      
      // Buscar empresa por ID
      const empresa = await prisma.empresa.findUnique({
        where: { id: usuario.empresaId }
      });
      
      if (empresa) {
        logInfo(`   Empresa ${usuario.empresaId} existe: ${empresa.nombre}`);
      } else {
        logError(`   Empresa ${usuario.empresaId} no existe`);
      }
    }
    
    // 4. Verificar contraseña
    logTest('\n4. Verificando contraseña...');
    if (usuario.password) {
      const passwordToTest = 'PruebaIAM123?';
      const isPasswordValid = await bcrypt.compare(passwordToTest, usuario.password);
      
      if (isPasswordValid) {
        logSuccess('✅ Contraseña correcta: PruebaIAM123?');
      } else {
        logError('❌ Contraseña incorrecta');
        logInfo('   La contraseña en la base de datos no coincide con "PruebaIAM123?"');
        
        // Intentar con otras contraseñas comunes
        const commonPasswords = [
          'PruebaIAM123',
          'prueba123',
          'password',
          '123456',
          'admin'
        ];
        
        logTest('   Probando contraseñas comunes...');
        for (const pwd of commonPasswords) {
          const isValid = await bcrypt.compare(pwd, usuario.password);
          if (isValid) {
            logSuccess(`   ✅ Contraseña encontrada: ${pwd}`);
            break;
          }
        }
      }
    } else {
      logError('❌ Usuario no tiene contraseña configurada');
    }
    
    // 5. Verificar movimientos de la empresa
    logTest('\n5. Verificando movimientos de la empresa...');
    const movimientos = await prisma.movimientoInventario.findMany({
      where: {
        empresaId: usuario.empresaId
      },
      select: {
        id: true,
        fecha: true,
        tipo: true,
        cantidad: true,
        productoId: true
      },
      take: 5,
      orderBy: {
        fecha: 'desc'
      }
    });
    
    if (movimientos.length > 0) {
      logSuccess(`✅ Encontrados ${movimientos.length} movimientos recientes`);
      movimientos.forEach((mov, index) => {
        logInfo(`   ${index + 1}. ${mov.fecha}: ${mov.tipo} - ${mov.cantidad} unidades`);
      });
    } else {
      logWarning('⚠️ No se encontraron movimientos para esta empresa');
    }
    
    // 6. Contar total de movimientos
    const totalMovimientos = await prisma.movimientoInventario.count({
      where: {
        empresaId: usuario.empresaId
      }
    });
    
    logInfo(`   Total de movimientos: ${totalMovimientos}`);
    
    // 7. Verificar productos
    logTest('\n6. Verificando productos de la empresa...');
    const productos = await prisma.producto.findMany({
      where: {
        empresaId: usuario.empresaId
      },
      select: {
        id: true,
        nombre: true,
        precio: true,
        stock: true
      },
      take: 5
    });
    
    if (productos.length > 0) {
      logSuccess(`✅ Encontrados ${productos.length} productos`);
      productos.forEach((prod, index) => {
        logInfo(`   ${index + 1}. ${prod.nombre} - $${prod.precio} - Stock: ${prod.stock}`);
      });
    } else {
      logWarning('⚠️ No se encontraron productos para esta empresa');
    }
    
    // 8. Resumen final
    log('\n📊 RESUMEN DEL USUARIO', 'bright');
    log('=====================', 'bright');
    
    const issues = [];
    
    if (!usuario.password) issues.push('Sin contraseña');
    if (!usuario.activo) issues.push('Usuario inactivo');
    if (!usuario.setupCompleted) issues.push('Setup no completado');
    if (!usuario.empresa) issues.push('Sin empresa asignada');
    if (totalMovimientos === 0) issues.push('Sin movimientos');
    if (productos.length === 0) issues.push('Sin productos');
    
    if (issues.length === 0) {
      logSuccess('✅ Usuario completamente funcional');
    } else {
      logWarning(`⚠️ Usuario con problemas: ${issues.join(', ')}`);
    }
    
    logInfo(`   Email: ${usuario.email}`);
    logInfo(`   Empresa: ${usuario.empresa?.nombre || 'No asignada'}`);
    logInfo(`   Movimientos: ${totalMovimientos}`);
    logInfo(`   Productos: ${productos.length}`);
    
  } catch (error) {
    logError(`Error verificando usuario: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  checkPrueba2User()
    .then(() => {
      log('\n🎯 VERIFICACIÓN COMPLETADA', 'bright');
      process.exit(0);
    })
    .catch(error => {
      logError(`Error inesperado: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { checkPrueba2User }; 