#!/usr/bin/env node

/**
 * Script para activar todos los sensores que están como inactivos
 * Útil para corregir sensores que se crearon incorrectamente
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function activarSensoresInactivos() {
  try {
    console.log('🔍 Buscando sensores inactivos...\n');
    
    // Buscar todos los sensores inactivos
    const sensoresInactivos = await prisma.sensor.findMany({
      where: {
        activo: false
      },
      include: {
        ubicacion: {
          select: {
            nombre: true,
            empresa: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });
    
    if (sensoresInactivos.length === 0) {
      console.log('✅ No hay sensores inactivos');
      return;
    }
    
    console.log(`📊 Encontrados ${sensoresInactivos.length} sensores inactivos:\n`);
    
    // Mostrar información de cada sensor
    sensoresInactivos.forEach((sensor, index) => {
      console.log(`${index + 1}. ${sensor.nombre} (${sensor.tipo})`);
      console.log(`   Ubicación: ${sensor.ubicacion.nombre}`);
      console.log(`   Empresa: ${sensor.ubicacion.empresa.nombre}`);
      console.log(`   ID: ${sensor.id}`);
      console.log(`   Creado: ${sensor.createdAt}`);
      console.log('');
    });
    
    // Preguntar si activar todos
    console.log('¿Deseas activar todos estos sensores? (s/n)');
    
    // Simular respuesta automática (sí)
    const respuesta = 's';
    
    if (respuesta.toLowerCase() === 's') {
      console.log('\n🔄 Activando sensores...\n');
      
      // Activar todos los sensores
      const resultado = await prisma.sensor.updateMany({
        where: {
          activo: false
        },
        data: {
          activo: true
        }
      });
      
      console.log(`✅ ${resultado.count} sensores activados exitosamente`);
      
      // Verificar que se activaron
      const sensoresVerificados = await prisma.sensor.findMany({
        where: {
          id: { in: sensoresInactivos.map(s => s.id) }
        },
        select: {
          id: true,
          nombre: true,
          activo: true
        }
      });
      
      console.log('\n📋 Verificación de activación:');
      sensoresVerificados.forEach(sensor => {
        const estado = sensor.activo ? '✅ ACTIVO' : '❌ INACTIVO';
        console.log(`   ${sensor.nombre}: ${estado}`);
      });
      
    } else {
      console.log('❌ Operación cancelada');
    }
    
  } catch (error) {
    console.error('❌ Error activando sensores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
activarSensoresInactivos();

