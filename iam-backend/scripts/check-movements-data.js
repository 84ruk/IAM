#!/usr/bin/env node

/**
 * 🔍 SCRIPT PARA VERIFICAR DATOS DE MOVIMIENTOS
 * 
 * Este script verifica si hay datos de movimientos en la base de datos
 * y los muestra para diagnóstico.
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

async function checkMovementsData() {
  log('🔍 VERIFICANDO DATOS DE MOVIMIENTOS EN LA BASE DE DATOS', 'bright');
  log('====================================================', 'bright');
  
  try {
    // 1. Verificar conexión a la base de datos
    logTest('1. Verificando conexión a la base de datos...');
    await prisma.$connect();
    logSuccess('Conexión a la base de datos establecida');
    
    // 2. Contar total de movimientos
    logTest('2. Contando total de movimientos...');
    const totalMovements = await prisma.movimientoInventario.count();
    logInfo(`Total de movimientos en la base de datos: ${totalMovements}`);
    
    if (totalMovements === 0) {
      logWarning('❌ NO HAY MOVIMIENTOS EN LA BASE DE DATOS');
      logWarning('Esto explica por qué el frontend muestra valores en 0');
      return;
    }
    
    // 3. Verificar movimientos por empresa
    logTest('3. Verificando movimientos por empresa...');
    const movementsByEmpresa = await prisma.movimientoInventario.groupBy({
      by: ['empresaId'],
      _count: {
        id: true
      }
    });
    
    logInfo('Movimientos por empresa:');
    movementsByEmpresa.forEach(empresa => {
      logInfo(`  - Empresa ID ${empresa.empresaId}: ${empresa._count.id} movimientos`);
    });
    
    // 4. Verificar movimientos recientes (últimos 30 días)
    logTest('4. Verificando movimientos recientes (últimos 30 días)...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentMovements = await prisma.movimientoInventario.findMany({
      where: {
        fecha: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        fecha: 'desc'
      },
      take: 10
    });
    
    logInfo(`Movimientos recientes (últimos 30 días): ${recentMovements.length}`);
    
    if (recentMovements.length > 0) {
      logInfo('Últimos 10 movimientos:');
      recentMovements.forEach((mov, index) => {
        logInfo(`  ${index + 1}. Empresa ${mov.empresaId} - ${mov.fecha.toISOString().split('T')[0]} - ${mov.tipo} - ${mov.cantidad}`);
      });
    } else {
      logWarning('❌ NO HAY MOVIMIENTOS EN LOS ÚLTIMOS 30 DÍAS');
    }
    
    // 5. Verificar productos con movimientos
    logTest('5. Verificando productos con movimientos...');
    const productsWithMovements = await prisma.movimientoInventario.groupBy({
      by: ['productoId'],
      _count: {
        id: true
      }
    });
    
    logInfo(`Productos con movimientos: ${productsWithMovements.length}`);
    
    // 6. Verificar empresas existentes
    logTest('6. Verificando empresas existentes...');
    const empresas = await prisma.empresa.findMany({
      select: {
        id: true,
        nombre: true,
        rfc: true,
        emailContacto: true
      }
    });
    
    logInfo('Empresas en la base de datos:');
    empresas.forEach(empresa => {
      logInfo(`  - ID ${empresa.id}: ${empresa.nombre} (${empresa.rfc || 'Sin RFC'})`);
    });
    
    // 7. Verificar usuarios existentes
    logTest('7. Verificando usuarios existentes...');
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        rol: true,
        empresaId: true
      }
    });
    
    logInfo('Usuarios en la base de datos:');
    usuarios.forEach(usuario => {
      logInfo(`  - ID ${usuario.id}: ${usuario.email} (${usuario.rol}) - Empresa ${usuario.empresaId}`);
    });
    
    // 8. Buscar usuario específico
    logTest('8. Buscando usuario prueba@iam.com...');
    const usuarioPrueba = await prisma.usuario.findFirst({
      where: {
        email: 'prueba@iam.com'
      },
      include: {
        empresa: true
      }
    });
    
    if (usuarioPrueba) {
      logSuccess(`Usuario encontrado: ${usuarioPrueba.email}`);
      logInfo(`  - ID: ${usuarioPrueba.id}`);
      logInfo(`  - Rol: ${usuarioPrueba.rol}`);
      logInfo(`  - Empresa ID: ${usuarioPrueba.empresaId}`);
      if (usuarioPrueba.empresa) {
        logInfo(`  - Empresa: ${usuarioPrueba.empresa.nombre}`);
      }
      
      // 9. Verificar movimientos de la empresa del usuario
      logTest('9. Verificando movimientos de la empresa del usuario...');
      const userEmpresaMovements = await prisma.movimientoInventario.findMany({
        where: {
          empresaId: usuarioPrueba.empresaId
        },
        orderBy: {
          fecha: 'desc'
        },
        take: 5
      });
      
      logInfo(`Movimientos de la empresa ${usuarioPrueba.empresaId}: ${userEmpresaMovements.length}`);
      
      if (userEmpresaMovements.length > 0) {
        logInfo('Últimos 5 movimientos de la empresa:');
        userEmpresaMovements.forEach((mov, index) => {
          logInfo(`  ${index + 1}. ${mov.fecha.toISOString().split('T')[0]} - ${mov.tipo} - ${mov.cantidad}`);
        });
      } else {
        logWarning('❌ NO HAY MOVIMIENTOS PARA LA EMPRESA DEL USUARIO');
      }
    } else {
      logError('❌ Usuario prueba@iam.com no encontrado');
    }
    
    // 10. Verificar productos de la empresa
    logTest('10. Verificando productos de la empresa...');
    if (usuarioPrueba) {
      const productos = await prisma.producto.findMany({
        where: {
          empresaId: usuarioPrueba.empresaId
        },
        select: {
          id: true,
          nombre: true,
          precioVenta: true,
          etiquetas: true
        }
      });
      
      logInfo(`Productos de la empresa ${usuarioPrueba.empresaId}: ${productos.length}`);
      
      if (productos.length > 0) {
        logInfo('Primeros 5 productos:');
        productos.slice(0, 5).forEach((prod, index) => {
          logInfo(`  ${index + 1}. ${prod.nombre} - $${prod.precioVenta} (${prod.etiquetas?.length || 0} etiquetas)`);
        });
      } else {
        logWarning('❌ NO HAY PRODUCTOS EN LA EMPRESA');
      }
    }
    
  } catch (error) {
    logError(`Error verificando datos: ${error.message}`);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  checkMovementsData()
    .then(() => {
      log('\n🎯 VERIFICACIÓN COMPLETADA', 'bright');
      process.exit(0);
    })
    .catch(error => {
      logError(`Error en la verificación: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { checkMovementsData }; 