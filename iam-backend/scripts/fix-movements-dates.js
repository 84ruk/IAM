#!/usr/bin/env node

/**
 * 🔧 SCRIPT PARA CORREGIR FECHAS DE MOVIMIENTOS
 * 
 * Este script corrige las fechas de los movimientos para que estén
 * en fechas recientes reales (no en el futuro).
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

async function fixMovementsDates() {
  log('🔧 CORRIGIENDO FECHAS DE MOVIMIENTOS', 'bright');
  log('==================================', 'bright');
  
  const empresas = [
    { id: 8, nombre: 'Hamburguesas Tony' },
    { id: 9, nombre: 'Minisuper Bara Bara' }
  ];
  
  for (const empresa of empresas) {
    logTest(`\n🎯 Corrigiendo empresa: ${empresa.nombre} (ID: ${empresa.id})`);
    
    try {
      // 1. Verificar movimientos actuales
      const movimientosActuales = await prisma.movimientoInventario.findMany({
        where: { empresaId: empresa.id },
        select: { id: true, fecha: true },
        orderBy: { fecha: 'desc' },
        take: 5
      });
      
      if (movimientosActuales.length === 0) {
        logWarning(`   ⚠️ No hay movimientos para esta empresa`);
        continue;
      }
      
      logInfo(`   Movimientos encontrados: ${movimientosActuales.length}`);
      logInfo(`   Fecha más reciente actual: ${movimientosActuales[0].fecha.toISOString().split('T')[0]}`);
      
      // 2. Calcular nuevas fechas (distribuir en los últimos 30 días)
      const fechaActual = new Date();
      const diasAtras = 30; // Distribuir en los últimos 30 días
      
      // Obtener todos los movimientos de la empresa
      const todosLosMovimientos = await prisma.movimientoInventario.findMany({
        where: { empresaId: empresa.id },
        select: { id: true, fecha: true },
        orderBy: { fecha: 'asc' }
      });
      
      logInfo(`   Total de movimientos a corregir: ${todosLosMovimientos.length}`);
      
      // 3. Crear nuevas fechas distribuidas
      const nuevasFechas = [];
      for (let i = 0; i < todosLosMovimientos.length; i++) {
        const diasAleatorios = Math.floor(Math.random() * diasAtras);
        const nuevaFecha = new Date(fechaActual);
        nuevaFecha.setDate(nuevaFecha.getDate() - diasAleatorios);
        
        // Añadir hora aleatoria durante el día
        nuevaFecha.setHours(
          Math.floor(Math.random() * 24),
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60)
        );
        
        nuevasFechas.push(nuevaFecha);
      }
      
      // 4. Actualizar fechas en lotes
      logTest(`   Actualizando fechas...`);
      
      for (let i = 0; i < todosLosMovimientos.length; i++) {
        const movimiento = todosLosMovimientos[i];
        const nuevaFecha = nuevasFechas[i];
        
        await prisma.movimientoInventario.update({
          where: { id: movimiento.id },
          data: { fecha: nuevaFecha }
        });
        
        if ((i + 1) % 50 === 0) {
          logInfo(`   Progreso: ${i + 1}/${todosLosMovimientos.length} movimientos actualizados`);
        }
      }
      
      logSuccess(`   ✅ ${todosLosMovimientos.length} movimientos actualizados`);
      
      // 5. Verificar resultado
      const movimientosActualizados = await prisma.movimientoInventario.findMany({
        where: { empresaId: empresa.id },
        select: { id: true, fecha: true },
        orderBy: { fecha: 'desc' },
        take: 5
      });
      
      logInfo(`   📅 Fechas más recientes después de la corrección:`);
      movimientosActualizados.forEach((mov, index) => {
        logInfo(`      ${index + 1}. ${mov.fecha.toISOString().split('T')[0]} (${mov.fecha.toLocaleDateString()})`);
      });
      
      // 6. Verificar movimientos en los últimos 7 días
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
      
      if (movimientosRecientes7 > 0) {
        logSuccess(`   ✅ Hay movimientos recientes para el endpoint`);
      } else {
        logWarning(`   ⚠️ Aún no hay movimientos en los últimos 7 días`);
      }
      
    } catch (error) {
      logError(`Error corrigiendo empresa ${empresa.nombre}: ${error.message}`);
    }
  }
  
  // Resumen final
  log('\n📊 RESUMEN DE CORRECCIONES', 'bright');
  log('==========================', 'bright');
  
  logSuccess('✅ Fechas de movimientos corregidas');
  logInfo('Los movimientos ahora están en fechas recientes reales');
  logInfo('El endpoint de daily-movements debería devolver datos');
  
  logInfo('\n💡 PRÓXIMO PASO:');
  logInfo('Probar el endpoint de daily-movements nuevamente');
}

// Ejecutar el script
if (require.main === module) {
  fixMovementsDates()
    .then(() => {
      log('\n🎯 CORRECCIONES COMPLETADAS', 'bright');
      process.exit(0);
    })
    .catch(error => {
      logError(`Error inesperado: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { fixMovementsDates }; 