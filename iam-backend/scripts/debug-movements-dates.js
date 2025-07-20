#!/usr/bin/env node

/**
 * 🐛 SCRIPT PARA DEBUGGEAR FECHAS DE MOVIMIENTOS
 * 
 * Este script debuggea las fechas de los movimientos para entender
 * por qué el endpoint no está devolviendo datos.
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

async function debugMovementsDates() {
  log('🐛 DEBUGGEANDO FECHAS DE MOVIMIENTOS', 'bright');
  log('==================================', 'bright');
  
  const empresas = [
    { id: 8, nombre: 'Hamburguesas Tony' },
    { id: 9, nombre: 'Minisuper Bara Bara' }
  ];
  
  for (const empresa of empresas) {
    logTest(`\n🎯 Debuggeando empresa: ${empresa.nombre} (ID: ${empresa.id})`);
    
    try {
      // 1. Fecha actual
      const fechaActual = new Date();
      logInfo(`   📅 Fecha actual: ${fechaActual.toISOString()}`);
      logInfo(`   📅 Fecha actual (formato): ${fechaActual.toISOString().split('T')[0]}`);
      
      // 2. Calcular fechas que busca el endpoint (7 días atrás)
      const fechaLimite7 = new Date();
      fechaLimite7.setDate(fechaLimite7.getDate() - 7);
      logInfo(`   📅 Fecha límite (7 días atrás): ${fechaLimite7.toISOString().split('T')[0]}`);
      
      // 3. Calcular fechas que busca el endpoint (15 días atrás)
      const fechaLimite15 = new Date();
      fechaLimite15.setDate(fechaLimite15.getDate() - 15);
      logInfo(`   📅 Fecha límite (15 días atrás): ${fechaLimite15.toISOString().split('T')[0]}`);
      
      // 4. Calcular fechas que busca el endpoint (30 días atrás)
      const fechaLimite30 = new Date();
      fechaLimite30.setDate(fechaLimite30.getDate() - 30);
      logInfo(`   📅 Fecha límite (30 días atrás): ${fechaLimite30.toISOString().split('T')[0]}`);
      
      // 5. Verificar movimientos en el rango que busca el endpoint
      const movimientosEnRango7 = await prisma.movimientoInventario.findMany({
        where: {
          empresaId: empresa.id,
          fecha: {
            gte: fechaLimite7
          }
        },
        select: { id: true, fecha: true, tipo: true, cantidad: true },
        orderBy: { fecha: 'desc' },
        take: 10
      });
      
      logInfo(`   📊 Movimientos en rango de 7 días: ${movimientosEnRango7.length}`);
      if (movimientosEnRango7.length > 0) {
        logInfo(`   📋 Ejemplos de movimientos en rango:`);
        movimientosEnRango7.slice(0, 5).forEach((mov, index) => {
          logInfo(`      ${index + 1}. ${mov.fecha.toISOString().split('T')[0]} - ${mov.tipo} ${mov.cantidad}`);
        });
      }
      
      // 6. Verificar movimientos fuera del rango (futuros)
      const movimientosFuturos = await prisma.movimientoInventario.findMany({
        where: {
          empresaId: empresa.id,
          fecha: {
            gt: fechaActual
          }
        },
        select: { id: true, fecha: true, tipo: true, cantidad: true },
        orderBy: { fecha: 'desc' },
        take: 10
      });
      
      logInfo(`   📊 Movimientos futuros: ${movimientosFuturos.length}`);
      if (movimientosFuturos.length > 0) {
        logInfo(`   📋 Ejemplos de movimientos futuros:`);
        movimientosFuturos.slice(0, 5).forEach((mov, index) => {
          logInfo(`      ${index + 1}. ${mov.fecha.toISOString().split('T')[0]} - ${mov.tipo} ${mov.cantidad}`);
        });
      }
      
      // 7. Verificar movimientos pasados (más de 30 días)
      const movimientosPasados = await prisma.movimientoInventario.findMany({
        where: {
          empresaId: empresa.id,
          fecha: {
            lt: fechaLimite30
          }
        },
        select: { id: true, fecha: true, tipo: true, cantidad: true },
        orderBy: { fecha: 'desc' },
        take: 10
      });
      
      logInfo(`   📊 Movimientos pasados (más de 30 días): ${movimientosPasados.length}`);
      if (movimientosPasados.length > 0) {
        logInfo(`   📋 Ejemplos de movimientos pasados:`);
        movimientosPasados.slice(0, 5).forEach((mov, index) => {
          logInfo(`      ${index + 1}. ${mov.fecha.toISOString().split('T')[0]} - ${mov.tipo} ${mov.cantidad}`);
        });
      }
      
      // 8. Análisis del problema
      logDebug(`   🔍 ANÁLISIS DEL PROBLEMA:`);
      
      if (movimientosEnRango7.length === 0 && movimientosFuturos.length > 0) {
        logWarning(`   ⚠️ PROBLEMA IDENTIFICADO: Los movimientos están en fechas futuras`);
        logInfo(`   💡 El endpoint busca movimientos desde ${fechaLimite7.toISOString().split('T')[0]} hasta hoy`);
        logInfo(`   💡 Pero los movimientos están en fechas futuras (después de ${fechaActual.toISOString().split('T')[0]})`);
        logInfo(`   💡 SOLUCIÓN: Corregir las fechas de los movimientos a fechas pasadas`);
      } else if (movimientosEnRango7.length > 0) {
        logSuccess(`   ✅ Los movimientos están en el rango correcto`);
        logInfo(`   💡 El problema puede estar en la consulta SQL o en el procesamiento`);
      } else {
        logWarning(`   ⚠️ No hay movimientos en ningún rango`);
        logInfo(`   💡 Verificar que existan movimientos para esta empresa`);
      }
      
    } catch (error) {
      logError(`Error debuggeando empresa ${empresa.nombre}: ${error.message}`);
    }
  }
  
  // Resumen final
  log('\n📊 RESUMEN DEL DEBUG', 'bright');
  log('===================', 'bright');
  
  logInfo('El problema está en que los movimientos están en fechas futuras');
  logInfo('El endpoint busca movimientos desde hace X días hasta hoy');
  logInfo('Pero los movimientos están después de hoy');
  
  logInfo('\n💡 SOLUCIÓN:');
  logInfo('Corregir las fechas de los movimientos para que estén en el pasado');
  logInfo('Por ejemplo, ponerlos en los últimos 30 días');
}

// Ejecutar el script
if (require.main === module) {
  debugMovementsDates()
    .then(() => {
      log('\n🎯 DEBUG COMPLETADO', 'bright');
      process.exit(0);
    })
    .catch(error => {
      logError(`Error inesperado: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { debugMovementsDates }; 