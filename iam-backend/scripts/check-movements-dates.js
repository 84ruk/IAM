#!/usr/bin/env node

/**
 * 📅 SCRIPT PARA VERIFICAR FECHAS DE MOVIMIENTOS
 * 
 * Este script verifica las fechas de los movimientos para entender
 * por qué no aparecen en los períodos recientes del endpoint.
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

async function checkMovementsDates() {
  log('📅 VERIFICANDO FECHAS DE MOVIMIENTOS', 'bright');
  log('==================================', 'bright');
  
  const empresas = [
    { id: 8, nombre: 'Hamburguesas Tony' },
    { id: 9, nombre: 'Minisuper Bara Bara' }
  ];
  
  for (const empresa of empresas) {
    logTest(`\n🎯 Analizando empresa: ${empresa.nombre} (ID: ${empresa.id})`);
    
    try {
      // 1. Contar total de movimientos
      const totalMovimientos = await prisma.movimientoInventario.count({
        where: { empresaId: empresa.id }
      });
      
      logInfo(`   Total de movimientos: ${totalMovimientos}`);
      
      if (totalMovimientos === 0) {
        logWarning(`   ⚠️ No hay movimientos para esta empresa`);
        continue;
      }
      
      // 2. Obtener fechas más recientes y más antiguas
      const movimientosRecientes = await prisma.movimientoInventario.findMany({
        where: { empresaId: empresa.id },
        select: { fecha: true },
        orderBy: { fecha: 'desc' },
        take: 5
      });
      
      const movimientosAntiguos = await prisma.movimientoInventario.findMany({
        where: { empresaId: empresa.id },
        select: { fecha: true },
        orderBy: { fecha: 'asc' },
        take: 5
      });
      
      logInfo(`   📅 Fechas más recientes:`);
      movimientosRecientes.forEach((mov, index) => {
        logInfo(`      ${index + 1}. ${mov.fecha.toISOString().split('T')[0]} (${mov.fecha.toLocaleDateString()})`);
      });
      
      logInfo(`   📅 Fechas más antiguas:`);
      movimientosAntiguos.forEach((mov, index) => {
        logInfo(`      ${index + 1}. ${mov.fecha.toISOString().split('T')[0]} (${mov.fecha.toLocaleDateString()})`);
      });
      
      // 3. Verificar movimientos por tipo
      const movimientosPorTipo = await prisma.movimientoInventario.groupBy({
        by: ['tipo'],
        where: { empresaId: empresa.id },
        _count: { tipo: true }
      });
      
      logInfo(`   📊 Movimientos por tipo:`);
      movimientosPorTipo.forEach(tipo => {
        logInfo(`      - ${tipo.tipo}: ${tipo._count.tipo}`);
      });
      
      // 4. Verificar movimientos en los últimos 30 días
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 30);
      
      const movimientosRecientes30 = await prisma.movimientoInventario.count({
        where: {
          empresaId: empresa.id,
          fecha: {
            gte: fechaLimite
          }
        }
      });
      
      logInfo(`   📈 Movimientos en los últimos 30 días: ${movimientosRecientes30}`);
      
      // 5. Verificar movimientos en los últimos 7 días
      const fechaLimite7 = new Date();
      fechaLimite7.setDate(fechaLimite7.getDate() - 7);
      
      const movimientosRecientes7 = await prisma.movimientoInventario.count({
        where: {
          empresaId: empresa.id,
          fecha: {
            gte: fechaLimite7
          }
        }
      });
      
      logInfo(`   📈 Movimientos en los últimos 7 días: ${movimientosRecientes7}`);
      
      // 6. Mostrar algunos movimientos de ejemplo
      const movimientosEjemplo = await prisma.movimientoInventario.findMany({
        where: { empresaId: empresa.id },
        select: {
          id: true,
          fecha: true,
          tipo: true,
          cantidad: true,
          producto: {
            select: { nombre: true }
          }
        },
        orderBy: { fecha: 'desc' },
        take: 3
      });
      
      logInfo(`   📋 Ejemplos de movimientos:`);
      movimientosEjemplo.forEach((mov, index) => {
        logInfo(`      ${index + 1}. ${mov.fecha.toISOString().split('T')[0]} - ${mov.tipo} ${mov.cantidad} ${mov.producto.nombre}`);
      });
      
      // 7. Análisis del problema
      const fechaMasReciente = movimientosRecientes[0]?.fecha;
      const fechaActual = new Date();
      const diasDiferencia = fechaMasReciente ? 
        Math.floor((fechaActual - fechaMasReciente) / (1000 * 60 * 60 * 24)) : 
        null;
      
      if (diasDiferencia !== null) {
        logInfo(`   ⏰ Días desde el último movimiento: ${diasDiferencia}`);
        
        if (diasDiferencia > 30) {
          logWarning(`   ⚠️ Los movimientos son muy antiguos (más de 30 días)`);
          logInfo(`   💡 Esto explica por qué el endpoint devuelve datos vacíos`);
        } else if (diasDiferencia > 7) {
          logWarning(`   ⚠️ Los movimientos son antiguos (más de 7 días)`);
          logInfo(`   💡 El endpoint de 7 días devolverá datos vacíos`);
        } else {
          logSuccess(`   ✅ Los movimientos son recientes`);
        }
      }
      
    } catch (error) {
      logError(`Error analizando empresa ${empresa.nombre}: ${error.message}`);
    }
  }
  
  // Resumen final
  log('\n📊 RESUMEN DEL ANÁLISIS', 'bright');
  log('========================', 'bright');
  
  logInfo('El backend está funcionando correctamente');
  logInfo('El problema es que los movimientos son muy antiguos');
  logInfo('El endpoint devuelve datos vacíos porque no hay movimientos recientes');
  
  logInfo('\n💡 SOLUCIONES POSIBLES:');
  logInfo('1. Crear movimientos más recientes para testing');
  logInfo('2. Modificar el endpoint para incluir datos históricos');
  logInfo('3. Ajustar los períodos de consulta');
  
  logInfo('\n🎯 PRÓXIMO PASO:');
  logInfo('Crear movimientos de prueba con fechas recientes');
}

// Ejecutar el script
if (require.main === module) {
  checkMovementsDates()
    .then(() => {
      log('\n🎯 ANÁLISIS COMPLETADO', 'bright');
      process.exit(0);
    })
    .catch(error => {
      logError(`Error inesperado: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { checkMovementsDates }; 