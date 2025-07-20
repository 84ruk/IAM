const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateProductTypes() {
  try {
    console.log('🔄 Actualizando tipos de producto...\n');

    // 1. Actualizar medicamentos
    console.log('🔒 Actualizando medicamentos...');
    
    const medicamentos = await prisma.producto.findMany({
      where: {
        etiquetas: {
          hasSome: ['controlado', 'analgésico', 'antiinflamatorio', 'protector gástrico', 'antialérgico', 'ansiolítico', 'opioide']
        }
      }
    });

    for (const producto of medicamentos) {
      await prisma.producto.update({
        where: { id: producto.id },
        data: { tipoProducto: 'MEDICAMENTO' }
      });
      console.log(`   ✅ ${producto.nombre} → MEDICAMENTO`);
    }

    // 2. Actualizar suplementos
    console.log('\n💊 Actualizando suplementos...');
    
    const suplementos = await prisma.producto.findMany({
      where: {
        etiquetas: {
          hasSome: ['vitamina', 'omega 3', 'magnesio']
        }
      }
    });

    for (const producto of suplementos) {
      await prisma.producto.update({
        where: { id: producto.id },
        data: { tipoProducto: 'SUPLEMENTO' }
      });
      console.log(`   ✅ ${producto.nombre} → SUPLEMENTO`);
    }

    // 3. Actualizar equipos médicos
    console.log('\n🏥 Actualizando equipos médicos...');
    
    const equiposMedicos = await prisma.producto.findMany({
      where: {
        etiquetas: {
          hasSome: ['tensiómetro', 'glucómetro', 'termómetro', 'nebulizador', 'presión arterial', 'diabetes', 'glucosa', 'fiebre', 'infrarrojo', 'asma', 'respiratorio']
        }
      }
    });

    for (const producto of equiposMedicos) {
      await prisma.producto.update({
        where: { id: producto.id },
        data: { tipoProducto: 'EQUIPO_MEDICO' }
      });
      console.log(`   ✅ ${producto.nombre} → EQUIPO_MEDICO`);
    }

    // 4. Actualizar productos de cuidado personal
    console.log('\n🧴 Actualizando productos de cuidado personal...');
    
    const cuidadoPersonal = await prisma.producto.findMany({
      where: {
        etiquetas: {
          hasSome: ['antibacterial', 'alcohol', 'desinfectante', 'cubrebocas', 'protección', 'toallas', 'bebés', 'higiene', 'limpieza', 'manos']
        }
      }
    });

    for (const producto of cuidadoPersonal) {
      await prisma.producto.update({
        where: { id: producto.id },
        data: { tipoProducto: 'CUIDADO_PERSONAL' }
      });
      console.log(`   ✅ ${producto.nombre} → CUIDADO_PERSONAL`);
    }

    // 5. Verificar distribución final
    console.log('\n📊 Distribución Final de Productos:');
    console.log('====================================');
    
    const productosFinales = await prisma.producto.findMany({
      select: {
        tipoProducto: true
      }
    });

    const distribucionFinal = {};
    productosFinales.forEach(p => {
      distribucionFinal[p.tipoProducto] = (distribucionFinal[p.tipoProducto] || 0) + 1;
    });

    Object.entries(distribucionFinal).forEach(([tipo, cantidad]) => {
      console.log(`   ${tipo}: ${cantidad} productos`);
    });

    // 6. Análisis específico de farmacia
    console.log('\n💊 Análisis Específico de Farmacia:');
    console.log('=====================================');
    
    const farmacia = await prisma.empresa.findFirst({
      where: { nombre: { contains: 'CliniFarm' } }
    });

    if (farmacia) {
      const productosFarmacia = await prisma.producto.findMany({
        where: { empresaId: farmacia.id },
        select: {
          nombre: true,
          tipoProducto: true,
          etiquetas: true
        }
      });

      const farmaciaPorTipo = {};
      productosFarmacia.forEach(p => {
        farmaciaPorTipo[p.tipoProducto] = (farmaciaPorTipo[p.tipoProducto] || 0) + 1;
      });

      Object.entries(farmaciaPorTipo).forEach(([tipo, cantidad]) => {
        console.log(`   ${tipo}: ${cantidad} productos`);
      });

      // Mostrar algunos ejemplos
      console.log('\n📋 Ejemplos por Tipo:');
      console.log('=====================');
      
      const medicamentosFarmacia = productosFarmacia.filter(p => p.tipoProducto === 'MEDICAMENTO');
      const suplementosFarmacia = productosFarmacia.filter(p => p.tipoProducto === 'SUPLEMENTO');
      const equiposFarmacia = productosFarmacia.filter(p => p.tipoProducto === 'EQUIPO_MEDICO');
      const cuidadoFarmacia = productosFarmacia.filter(p => p.tipoProducto === 'CUIDADO_PERSONAL');

      console.log('   🔒 MEDICAMENTO:');
      medicamentosFarmacia.slice(0, 3).forEach(p => console.log(`      - ${p.nombre}`));
      
      console.log('   💊 SUPLEMENTO:');
      suplementosFarmacia.slice(0, 3).forEach(p => console.log(`      - ${p.nombre}`));
      
      console.log('   🏥 EQUIPO_MEDICO:');
      equiposFarmacia.slice(0, 3).forEach(p => console.log(`      - ${p.nombre}`));
      
      console.log('   🧴 CUIDADO_PERSONAL:');
      cuidadoFarmacia.slice(0, 3).forEach(p => console.log(`      - ${p.nombre}`));
    }

    console.log('\n🎉 Actualización completada exitosamente!');
    console.log('=========================================');
    console.log('✅ Los productos ahora tienen tipos más específicos');
    console.log('✅ Los KPIs pueden ser más precisos por categoría');
    console.log('✅ Mejor control para medicamentos controlados');
    console.log('✅ Análisis más detallado por tipo de producto');

  } catch (error) {
    console.error('❌ Error actualizando tipos de producto:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProductTypes(); 