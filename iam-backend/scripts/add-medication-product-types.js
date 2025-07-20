const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeProductTypes() {
  try {
    console.log('🔍 Analizando tipos de producto actuales...\n');

    // 1. Verificar tipos de producto actuales
    console.log('📋 Tipos de Producto Actuales:');
    console.log('==============================');
    console.log('   - GENERICO');
    console.log('   - ROPA');
    console.log('   - ALIMENTO');
    console.log('   - ELECTRONICO');
    console.log('');

    // 2. Analizar productos existentes por tipo
    const productos = await prisma.producto.findMany({
      select: {
        id: true,
        nombre: true,
        tipoProducto: true,
        etiquetas: true,
        empresaId: true
      }
    });

    const productosPorTipo = {};
    productos.forEach(p => {
      productosPorTipo[p.tipoProducto] = (productosPorTipo[p.tipoProducto] || 0) + 1;
    });

    console.log('📊 Distribución Actual de Productos:');
    console.log('====================================');
    Object.entries(productosPorTipo).forEach(([tipo, cantidad]) => {
      console.log(`   ${tipo}: ${cantidad} productos`);
    });
    console.log('');

    // 3. Analizar productos de farmacia específicamente
    const farmacia = await prisma.empresa.findFirst({
      where: { nombre: { contains: 'CliniFarm' } }
    });

    if (farmacia) {
      const productosFarmacia = productos.filter(p => p.empresaId === farmacia.id);
      
      console.log('💊 Análisis de Productos de Farmacia:');
      console.log('=====================================');
      
      const productosFarmaciaPorTipo = {};
      productosFarmacia.forEach(p => {
        productosFarmaciaPorTipo[p.tipoProducto] = (productosFarmaciaPorTipo[p.tipoProducto] || 0) + 1;
      });

      Object.entries(productosFarmaciaPorTipo).forEach(([tipo, cantidad]) => {
        console.log(`   ${tipo}: ${cantidad} productos`);
      });
      console.log('');

      // 4. Identificar productos que deberían tener tipos más específicos
      console.log('🎯 Productos que Necesitan Tipos Más Específicos:');
      console.log('================================================');
      
      const medicamentos = productosFarmacia.filter(p => 
        p.etiquetas.some(etiqueta => 
          etiqueta.includes('controlado') || 
          etiqueta.includes('analgésico') || 
          etiqueta.includes('antiinflamatorio') ||
          etiqueta.includes('protector') ||
          etiqueta.includes('antialérgico') ||
          etiqueta.includes('ansiolítico') ||
          etiqueta.includes('opioide')
        )
      );

      const suplementos = productosFarmacia.filter(p => 
        p.etiquetas.some(etiqueta => 
          etiqueta.includes('vitamina') || 
          etiqueta.includes('omega') ||
          etiqueta.includes('magnesio')
        )
      );

      const equiposMedicos = productosFarmacia.filter(p => 
        p.etiquetas.some(etiqueta => 
          etiqueta.includes('tensiómetro') || 
          etiqueta.includes('glucómetro') ||
          etiqueta.includes('termómetro') ||
          etiqueta.includes('nebulizador')
        )
      );

      const cuidadoPersonal = productosFarmacia.filter(p => 
        p.etiquetas.some(etiqueta => 
          etiqueta.includes('antibacterial') || 
          etiqueta.includes('alcohol') ||
          etiqueta.includes('cubrebocas') ||
          etiqueta.includes('toallas') ||
          etiqueta.includes('higiene')
        )
      );

      console.log(`   🔒 Medicamentos: ${medicamentos.length} productos`);
      medicamentos.forEach(p => console.log(`      - ${p.nombre} (actualmente: ${p.tipoProducto})`));
      
      console.log(`   💊 Suplementos: ${suplementos.length} productos`);
      suplementos.forEach(p => console.log(`      - ${p.nombre} (actualmente: ${p.tipoProducto})`));
      
      console.log(`   🏥 Equipos Médicos: ${equiposMedicos.length} productos`);
      equiposMedicos.forEach(p => console.log(`      - ${p.nombre} (actualmente: ${p.tipoProducto})`));
      
      console.log(`   🧴 Cuidado Personal: ${cuidadoPersonal.length} productos`);
      cuidadoPersonal.forEach(p => console.log(`      - ${p.nombre} (actualmente: ${p.tipoProducto})`));
      console.log('');
    }

    // 5. Propuesta de nuevos tipos de producto
    console.log('💡 Propuesta de Nuevos Tipos de Producto:');
    console.log('==========================================');
    console.log('   🔒 MEDICAMENTO - Para medicamentos de venta libre y controlados');
    console.log('   💊 SUPLEMENTO - Para vitaminas, minerales y suplementos');
    console.log('   🏥 EQUIPO_MEDICO - Para equipos médicos especializados');
    console.log('   🧴 CUIDADO_PERSONAL - Para productos de higiene y cuidado');
    console.log('   🧬 BIOLOGICO - Para productos biológicos y vacunas');
    console.log('   📋 MATERIAL_QUIRURGICO - Para material médico-quirúrgico');
    console.log('');

    // 6. Beneficios de la implementación
    console.log('✅ Beneficios de Implementar Nuevos Tipos:');
    console.log('==========================================');
    console.log('   🎯 KPIs más específicos por tipo de producto');
    console.log('   📊 Mejor análisis de rentabilidad por categoría');
    console.log('   🔒 Control específico para medicamentos controlados');
    console.log('   📈 Tracking de tendencias por tipo de producto');
    console.log('   🚨 Alertas más precisas por categoría');
    console.log('   📋 Reportes más detallados');
    console.log('');

    // 7. Plan de implementación
    console.log('🛠️  Plan de Implementación:');
    console.log('============================');
    console.log('   1. Crear migración para agregar nuevos tipos al enum');
    console.log('   2. Actualizar productos existentes con tipos correctos');
    console.log('   3. Modificar scripts de generación de datos');
    console.log('   4. Actualizar KPIs para usar nuevos tipos');
    console.log('   5. Crear validaciones específicas por tipo');
    console.log('   6. Actualizar documentación');
    console.log('');

    // 8. Impacto en KPIs
    console.log('📈 Impacto en KPIs:');
    console.log('===================');
    console.log('   💰 ROI por tipo de producto (medicamentos vs equipos)');
    console.log('   🔄 Rotación específica por categoría');
    console.log('   📊 Margen por tipo de producto');
    console.log('   🚨 Alertas de stock bajo por categoría');
    console.log('   📈 Predicciones más precisas por tipo');
    console.log('   🎯 KPIs específicos de la industria farmacéutica');

  } catch (error) {
    console.error('❌ Error analizando tipos de producto:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeProductTypes(); 