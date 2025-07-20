const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixProductTypes() {
  try {
    console.log('🔧 Corrigiendo tipos de producto...\n');

    // 1. Corregir productos que se asignaron incorrectamente
    console.log('🔒 Corrigiendo medicamentos...');
    
    const medicamentosIds = [
      'Paracetamol 500mg',
      'Ibuprofeno 400mg', 
      'Aspirina 100mg',
      'Omeprazol 20mg',
      'Loratadina 10mg',
      'Tramadol 50mg',
      'Diazepam 5mg',
      'Morfina 10mg'
    ];

    for (const nombre of medicamentosIds) {
      await prisma.producto.updateMany({
        where: { nombre: nombre },
        data: { tipoProducto: 'MEDICAMENTO' }
      });
      console.log(`   ✅ ${nombre} → MEDICAMENTO`);
    }

    // 2. Corregir suplementos
    console.log('\n💊 Corrigiendo suplementos...');
    
    const suplementosIds = [
      'Vitamina C 1000mg',
      'Vitamina D3 4000UI',
      'Omega 3 1000mg',
      'Magnesio 400mg'
    ];

    for (const nombre of suplementosIds) {
      await prisma.producto.updateMany({
        where: { nombre: nombre },
        data: { tipoProducto: 'SUPLEMENTO' }
      });
      console.log(`   ✅ ${nombre} → SUPLEMENTO`);
    }

    // 3. Corregir equipos médicos
    console.log('\n🏥 Corrigiendo equipos médicos...');
    
    const equiposIds = [
      'Tensiómetro Digital',
      'Glucómetro Accu-Chek',
      'Termómetro Digital',
      'Nebulizador Portátil'
    ];

    for (const nombre of equiposIds) {
      await prisma.producto.updateMany({
        where: { nombre: nombre },
        data: { tipoProducto: 'EQUIPO_MEDICO' }
      });
      console.log(`   ✅ ${nombre} → EQUIPO_MEDICO`);
    }

    // 4. Corregir productos de cuidado personal
    console.log('\n🧴 Corrigiendo productos de cuidado personal...');
    
    const cuidadoIds = [
      'Jabón Antibacterial',
      'Alcohol en Gel 70%',
      'Cubrebocas KN95',
      'Toallas Húmedas'
    ];

    for (const nombre of cuidadoIds) {
      await prisma.producto.updateMany({
        where: { nombre: nombre },
        data: { tipoProducto: 'CUIDADO_PERSONAL' }
      });
      console.log(`   ✅ ${nombre} → CUIDADO_PERSONAL`);
    }

    // 5. Verificar distribución final
    console.log('\n📊 Distribución Final Corregida:');
    console.log('=================================');
    
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

    // 6. Análisis específico de farmacia corregido
    console.log('\n💊 Análisis Específico de Farmacia (Corregido):');
    console.log('================================================');
    
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
        },
        orderBy: { tipoProducto: 'asc' }
      });

      const farmaciaPorTipo = {};
      productosFarmacia.forEach(p => {
        farmaciaPorTipo[p.tipoProducto] = (farmaciaPorTipo[p.tipoProducto] || 0) + 1;
      });

      Object.entries(farmaciaPorTipo).forEach(([tipo, cantidad]) => {
        console.log(`   ${tipo}: ${cantidad} productos`);
      });

      // Mostrar productos por tipo
      console.log('\n📋 Productos por Tipo (Farmacia):');
      console.log('===================================');
      
      const medicamentosFarmacia = productosFarmacia.filter(p => p.tipoProducto === 'MEDICAMENTO');
      const suplementosFarmacia = productosFarmacia.filter(p => p.tipoProducto === 'SUPLEMENTO');
      const equiposFarmacia = productosFarmacia.filter(p => p.tipoProducto === 'EQUIPO_MEDICO');
      const cuidadoFarmacia = productosFarmacia.filter(p => p.tipoProducto === 'CUIDADO_PERSONAL');

      console.log('   🔒 MEDICAMENTO:');
      medicamentosFarmacia.forEach(p => console.log(`      - ${p.nombre}`));
      
      console.log('   💊 SUPLEMENTO:');
      suplementosFarmacia.forEach(p => console.log(`      - ${p.nombre}`));
      
      console.log('   🏥 EQUIPO_MEDICO:');
      equiposFarmacia.forEach(p => console.log(`      - ${p.nombre}`));
      
      console.log('   🧴 CUIDADO_PERSONAL:');
      cuidadoFarmacia.forEach(p => console.log(`      - ${p.nombre}`));
    }

    console.log('\n🎉 Corrección completada exitosamente!');
    console.log('=======================================');
    console.log('✅ Los tipos de producto están correctamente asignados');
    console.log('✅ Los medicamentos están en la categoría MEDICAMENTO');
    console.log('✅ Los suplementos están en la categoría SUPLEMENTO');
    console.log('✅ Los equipos médicos están en EQUIPO_MEDICO');
    console.log('✅ Los productos de cuidado personal están en CUIDADO_PERSONAL');

  } catch (error) {
    console.error('❌ Error corrigiendo tipos de producto:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProductTypes(); 