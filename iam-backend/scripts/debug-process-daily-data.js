#!/usr/bin/env node

/**
 * 🐛 SCRIPT PARA DEBUGGEAR PROCESAMIENTO DE DATOS DIARIOS
 * 
 * Este script simula exactamente lo que hace el handler para
 * identificar dónde está el problema en el procesamiento.
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

async function debugProcessDailyData() {
  log('🐛 DEBUGGEANDO PROCESAMIENTO DE DATOS DIARIOS', 'bright');
  log('============================================', 'bright');
  
  const empresas = [
    { id: 8, nombre: 'Hamburguesas Tony' },
    { id: 9, nombre: 'Minisuper Bara Bara' }
  ];
  
  for (const empresa of empresas) {
    logTest(`\n🎯 Debuggeando empresa: ${empresa.nombre} (ID: ${empresa.id})`);
    
    try {
      const days = 7;
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - days);
      
      logInfo(`   📅 Fecha límite: ${fechaLimite.toISOString()}`);
      
      // 1. Obtener movimientos (como en el handler)
      logTest('1. Obteniendo movimientos de la base de datos...');
      const movimientos = await prisma.$queryRaw`
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
      
      logInfo(`   📊 Movimientos obtenidos: ${movimientos.length} registros`);
      if (movimientos.length > 0) {
        logInfo(`   📋 Ejemplos de movimientos:`);
        movimientos.slice(0, 5).forEach((mov, index) => {
          logInfo(`      ${index + 1}. ${mov.fecha} - ${mov.tipo} - ${mov.cantidad} - $${mov.valor}`);
        });
      }
      
      // 2. Simular processDailyData (como en el handler)
      logTest('2. Simulando processDailyData...');
      
      const dailyMap = new Map();
      
      // Inicializar todos los días con valores en cero (como en el handler)
      logDebug(`   🔧 Inicializando días...`);
      for (let i = 0; i < days; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        logDebug(`      Día ${i}: ${fechaStr}`);
        
        dailyMap.set(fechaStr, {
          fecha: fechaStr,
          entradas: 0,
          salidas: 0,
          neto: 0,
          valorEntradas: 0,
          valorSalidas: 0,
          valorNeto: 0
        });
      }
      
      logInfo(`   📊 Días inicializados: ${dailyMap.size}`);
      logInfo(`   📋 Días disponibles en el mapa:`);
      Array.from(dailyMap.keys()).forEach(fecha => {
        logInfo(`      - ${fecha}`);
      });
      
      // 3. Procesar movimientos reales (como en el handler)
      logTest('3. Procesando movimientos reales...');
      
      let movimientosProcesados = 0;
      let movimientosNoEncontrados = 0;
      
      movimientos.forEach(mov => {
        logDebug(`   🔍 Buscando movimiento: ${mov.fecha} (tipo: ${typeof mov.fecha})`);
        
        const dayData = dailyMap.get(mov.fecha);
        if (dayData) {
          logDebug(`   ✅ Encontrado día: ${mov.fecha}`);
          movimientosProcesados++;
          
          if (mov.tipo === 'ENTRADA') {
            dayData.entradas += Number(mov.cantidad);
            dayData.valorEntradas += Number(mov.valor);
          } else {
            dayData.salidas += Number(mov.cantidad);
            dayData.valorSalidas += Number(mov.valor);
          }
          
          dayData.neto = dayData.entradas - dayData.salidas;
          dayData.valorNeto = dayData.valorEntradas - dayData.valorSalidas;
        } else {
          logWarning(`   ❌ Día no encontrado: ${mov.fecha}`);
          movimientosNoEncontrados++;
          
          // Verificar si hay algún día similar
          const diasSimilares = Array.from(dailyMap.keys()).filter(dia => 
            dia.includes(mov.fecha.substring(0, 7)) // Mes y año
          );
          if (diasSimilares.length > 0) {
            logDebug(`   💡 Días similares encontrados: ${diasSimilares.join(', ')}`);
          }
        }
      });
      
      logInfo(`   📊 Movimientos procesados: ${movimientosProcesados}`);
      logInfo(`   📊 Movimientos no encontrados: ${movimientosNoEncontrados}`);
      
      // 4. Convertir a array y ordenar (como en el handler)
      logTest('4. Convirtiendo a array final...');
      
      const dailyData = Array.from(dailyMap.values())
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      
      logInfo(`   📊 Días finales: ${dailyData.length}`);
      
      // 5. Mostrar resultado final
      logTest('5. Resultado final:');
      
      const diasConDatos = dailyData.filter(day => day.entradas > 0 || day.salidas > 0);
      logInfo(`   📊 Días con datos: ${diasConDatos.length}`);
      
      if (diasConDatos.length > 0) {
        logSuccess(`   ✅ ¡HAY DATOS EN EL RESULTADO FINAL!`);
        diasConDatos.forEach((day, index) => {
          logInfo(`      ${index + 1}. ${day.fecha}: Entradas=${day.entradas}, Salidas=${day.salidas}, Neto=${day.neto}`);
        });
      } else {
        logWarning(`   ⚠️ No hay datos en el resultado final`);
        
        // Mostrar todos los días para debug
        logDebug(`   📋 Todos los días (sin datos):`);
        dailyData.forEach((day, index) => {
          logDebug(`      ${index + 1}. ${day.fecha}: Entradas=${day.entradas}, Salidas=${day.salidas}, Neto=${day.neto}`);
        });
      }
      
      // 6. Análisis del problema
      logDebug(`   🔍 ANÁLISIS DEL PROBLEMA:`);
      
      if (movimientos.length > 0 && movimientosNoEncontrados === movimientos.length) {
        logWarning(`   ⚠️ PROBLEMA IDENTIFICADO: Ningún movimiento coincide con los días del mapa`);
        logInfo(`   💡 El formato de fecha de los movimientos no coincide con el formato del mapa`);
        logInfo(`   💡 Movimientos: ${movimientos[0]?.fecha} (tipo: ${typeof movimientos[0]?.fecha})`);
        logInfo(`   💡 Mapa: ${Array.from(dailyMap.keys())[0]} (tipo: string)`);
      } else if (movimientosProcesados > 0) {
        logSuccess(`   ✅ El procesamiento funciona correctamente`);
        logInfo(`   💡 El problema puede estar en otro lugar`);
      } else {
        logWarning(`   ⚠️ No hay movimientos para procesar`);
      }
      
    } catch (error) {
      logError(`Error debuggeando empresa ${empresa.nombre}: ${error.message}`);
    }
  }
  
  // Resumen final
  log('\n📊 RESUMEN DEL DEBUG', 'bright');
  log('===================', 'bright');
  
  logInfo('El problema está en el formato de fechas');
  logInfo('Los movimientos tienen un formato de fecha diferente al esperado');
  logInfo('El handler no puede mapear los movimientos a los días correctos');
}

// Ejecutar el script
if (require.main === module) {
  debugProcessDailyData()
    .then(() => {
      log('\n🎯 DEBUG COMPLETADO', 'bright');
      process.exit(0);
    })
    .catch(error => {
      logError(`Error inesperado: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { debugProcessDailyData }; 