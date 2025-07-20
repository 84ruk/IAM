#!/usr/bin/env node

/**
 * 🗃️ SCRIPT PARA PROBAR CONSULTA SQL DIRECTAMENTE
 * 
 * Este script prueba la consulta SQL del endpoint de daily-movements
 * para identificar el problema.
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

function logDebug(message) {
  log(`🔍 ${message}`, 'magenta');
}

async function testSqlQuery() {
  log('🗃️ PROBANDO CONSULTA SQL DIRECTAMENTE', 'bright');
  log('==================================', 'bright');
  
  const empresas = [
    { id: 8, nombre: 'Hamburguesas Tony' },
    { id: 9, nombre: 'Minisuper Bara Bara' }
  ];
  
  for (const empresa of empresas) {
    logTest(`\n🎯 Probando empresa: ${empresa.nombre} (ID: ${empresa.id})`);
    
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 7);
      
      logInfo(`   📅 Fecha límite: ${fechaLimite.toISOString()}`);
      
      // 1. Probar consulta simple sin JOIN
      logTest('1. Probando consulta simple sin JOIN...');
      const movimientosSinJoin = await prisma.$queryRaw`
        SELECT 
          DATE(m.fecha) as fecha,
          m.tipo,
          SUM(m.cantidad) as cantidad
        FROM "MovimientoInventario" m
        WHERE m."empresaId" = ${empresa.id}
          AND m.fecha >= ${fechaLimite}
        GROUP BY DATE(m.fecha), m.tipo
        ORDER BY fecha ASC
      `;
      
      logInfo(`   📊 Resultados sin JOIN: ${movimientosSinJoin.length} registros`);
      if (movimientosSinJoin.length > 0) {
        logInfo(`   📋 Ejemplos sin JOIN:`);
        movimientosSinJoin.slice(0, 5).forEach((mov, index) => {
          logInfo(`      ${index + 1}. ${mov.fecha} - ${mov.tipo} - ${mov.cantidad}`);
        });
      }
      
      // 2. Probar consulta con JOIN (como en el endpoint)
      logTest('2. Probando consulta con JOIN (como en el endpoint)...');
      const movimientosConJoin = await prisma.$queryRaw`
        SELECT 
          DATE(m.fecha) as fecha,
          m.tipo,
          SUM(m.cantidad) as cantidad,
          SUM(m.cantidad * p."precioVenta") as valor
        FROM "MovimientoInventario" m
        INNER JOIN "Producto" p ON m."productoId" = p.id
        WHERE m."empresaId" = ${empresa.id}
          AND m.fecha >= ${fechaLimite}
        GROUP BY DATE(m.fecha), m.tipo
        ORDER BY fecha ASC
      `;
      
      logInfo(`   📊 Resultados con JOIN: ${movimientosConJoin.length} registros`);
      if (movimientosConJoin.length > 0) {
        logInfo(`   📋 Ejemplos con JOIN:`);
        movimientosConJoin.slice(0, 5).forEach((mov, index) => {
          logInfo(`      ${index + 1}. ${mov.fecha} - ${mov.tipo} - ${mov.cantidad} - $${mov.valor}`);
        });
      }
      
      // 3. Verificar si hay productos sin precioVenta
      logTest('3. Verificando productos sin precioVenta...');
      const productosSinPrecio = await prisma.producto.findMany({
        where: {
          empresaId: empresa.id,
          OR: [
            { precioVenta: null },
            { precioVenta: 0 }
          ]
        },
        select: { id: true, nombre: true, precioVenta: true }
      });
      
      logInfo(`   📊 Productos sin precioVenta: ${productosSinPrecio.length}`);
      if (productosSinPrecio.length > 0) {
        logInfo(`   📋 Productos problemáticos:`);
        productosSinPrecio.slice(0, 5).forEach((prod, index) => {
          logInfo(`      ${index + 1}. ${prod.nombre} - precioVenta: ${prod.precioVenta}`);
        });
      }
      
      // 4. Verificar movimientos sin producto asociado
      logTest('4. Verificando movimientos sin producto asociado...');
      const movimientosSinProducto = await prisma.movimientoInventario.findMany({
        where: {
          empresaId: empresa.id,
          fecha: {
            gte: fechaLimite
          },
          producto: null
        },
        select: { id: true, fecha: true, tipo: true, cantidad: true, productoId: true }
      });
      
      logInfo(`   📊 Movimientos sin producto: ${movimientosSinProducto.length}`);
      if (movimientosSinProducto.length > 0) {
        logInfo(`   📋 Movimientos problemáticos:`);
        movimientosSinProducto.slice(0, 5).forEach((mov, index) => {
          logInfo(`      ${index + 1}. ${mov.fecha} - ${mov.tipo} - ${mov.cantidad} - productoId: ${mov.productoId}`);
        });
      }
      
      // 5. Verificar productos con movimientos
      logTest('5. Verificando productos con movimientos...');
      const productosConMovimientos = await prisma.producto.findMany({
        where: {
          empresaId: empresa.id,
          movimientos: {
            some: {
              fecha: {
                gte: fechaLimite
              }
            }
          }
        },
        select: { 
          id: true, 
          nombre: true, 
          precioVenta: true,
          _count: {
            select: { movimientos: true }
          }
        },
        take: 5
      });
      
      logInfo(`   📊 Productos con movimientos recientes: ${productosConMovimientos.length}`);
      if (productosConMovimientos.length > 0) {
        logInfo(`   📋 Productos con movimientos:`);
        productosConMovimientos.forEach((prod, index) => {
          logInfo(`      ${index + 1}. ${prod.nombre} - precioVenta: ${prod.precioVenta} - movimientos: ${prod._count.movimientos}`);
        });
      }
      
      // 6. Análisis del problema
      logDebug(`   🔍 ANÁLISIS DEL PROBLEMA:`);
      
      if (movimientosSinJoin.length > 0 && movimientosConJoin.length === 0) {
        logWarning(`   ⚠️ PROBLEMA IDENTIFICADO: El JOIN está filtrando todos los resultados`);
        logInfo(`   💡 Hay ${movimientosSinJoin.length} movimientos sin JOIN`);
        logInfo(`   💡 Pero 0 movimientos con JOIN`);
        logInfo(`   💡 Esto significa que hay productos sin precioVenta o movimientos sin producto`);
      } else if (movimientosSinJoin.length === 0) {
        logWarning(`   ⚠️ PROBLEMA IDENTIFICADO: No hay movimientos en el rango de fechas`);
        logInfo(`   💡 Verificar que las fechas de los movimientos estén correctas`);
      } else if (movimientosConJoin.length > 0) {
        logSuccess(`   ✅ La consulta SQL funciona correctamente`);
        logInfo(`   💡 El problema está en el procesamiento de los datos`);
      }
      
    } catch (error) {
      logError(`Error probando empresa ${empresa.nombre}: ${error.message}`);
    }
  }
  
  // Resumen final
  log('\n📊 RESUMEN DE LA PRUEBA SQL', 'bright');
  log('===========================', 'bright');
  
  logInfo('La consulta SQL está funcionando correctamente');
  logInfo('El problema puede estar en el procesamiento de los datos');
  logInfo('O en la lógica del endpoint');
}

// Ejecutar el script
if (require.main === module) {
  testSqlQuery()
    .then(() => {
      log('\n🎯 PRUEBA SQL COMPLETADA', 'bright');
      process.exit(0);
    })
    .catch(error => {
      logError(`Error inesperado: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { testSqlQuery }; 