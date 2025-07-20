const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignSuppliersToProducts() {
  try {
    console.log('🏭 Asignando proveedores a productos...\n');

    // 1. Obtener la empresa farmacéutica
    const farmacia = await prisma.empresa.findFirst({
      where: { nombre: { contains: 'CliniFarm' } }
    });

    if (!farmacia) {
      console.log('❌ No se encontró la empresa farmacéutica');
      return;
    }

    console.log(`🏥 Empresa encontrada: ${farmacia.nombre}`);

    // 2. Obtener todos los productos de la farmacia
    const productos = await prisma.producto.findMany({
      where: { empresaId: farmacia.id },
      select: {
        id: true,
        nombre: true,
        tipoProducto: true,
        etiquetas: true
      }
    });

    // 3. Obtener todos los proveedores de la farmacia
    const proveedores = await prisma.proveedor.findMany({
      where: { empresaId: farmacia.id },
      select: {
        id: true,
        nombre: true
      }
    });

    console.log(`💊 Productos encontrados: ${productos.length}`);
    console.log(`🏭 Proveedores encontrados: ${proveedores.length}`);

    // 4. Definir asignaciones específicas por tipo de producto
    const asignaciones = {
      // MEDICAMENTOS - Laboratorios farmacéuticos principales
      'Paracetamol 500mg': 'Laboratorios Pfizer México',
      'Ibuprofeno 400mg': 'Bayer de México',
      'Aspirina 100mg': 'Bayer de México',
      'Omeprazol 20mg': 'Roche Farmacéutica',
      'Loratadina 10mg': 'Laboratorios Pfizer México',
      'Tramadol 50mg': 'Roche Farmacéutica',
      'Diazepam 5mg': 'Roche Farmacéutica',
      'Morfina 10mg': 'Laboratorios Pfizer México',

      // SUPLEMENTOS - Distribuidoras especializadas
      'Vitamina C 1000mg': 'Distribuidora Médica del Norte',
      'Vitamina D3 4000UI': 'Distribuidora Médica del Norte',
      'Omega 3 1000mg': 'Suministros Médicos Express',
      'Magnesio 400mg': 'Suministros Médicos Express',

      // EQUIPOS MÉDICOS - Distribuidoras de equipos
      'Tensiómetro Digital': 'Suministros Médicos Express',
      'Glucómetro Accu-Chek': 'Suministros Médicos Express',
      'Termómetro Digital': 'Distribuidora Médica del Norte',
      'Nebulizador Portátil': 'Suministros Médicos Express',

      // CUIDADO PERSONAL - Distribuidoras generales
      'Jabón Antibacterial': 'Distribuidora Médica del Norte',
      'Alcohol en Gel 70%': 'Distribuidora Médica del Norte',
      'Cubrebocas KN95': 'Suministros Médicos Express',
      'Toallas Húmedas': 'Distribuidora Médica del Norte'
    };

    // 5. Crear relaciones producto-proveedor
    console.log('\n🔗 Asignando proveedores específicos...');
    
    for (const producto of productos) {
      const proveedorNombre = asignaciones[producto.nombre];
      
      if (proveedorNombre) {
        const proveedor = proveedores.find(p => p.nombre === proveedorNombre);
        
        if (proveedor) {
          // Verificar si ya tiene proveedor asignado
          const existingProducto = await prisma.producto.findUnique({
            where: { id: producto.id },
            select: { proveedorId: true }
          });

          if (existingProducto.proveedorId !== proveedor.id) {
            // Asignar el proveedor al producto
            await prisma.producto.update({
              where: { id: producto.id },
              data: {
                proveedorId: proveedor.id
              }
            });
            console.log(`✅ ${producto.nombre} → ${proveedor.nombre}`);
          } else {
            console.log(`⏭️  ${producto.nombre} ya tiene proveedor: ${proveedor.nombre}`);
          }
        } else {
          console.log(`❌ Proveedor no encontrado: ${proveedorNombre}`);
        }
      } else {
        console.log(`⚠️  No hay asignación para: ${producto.nombre}`);
      }
    }

    // 6. Verificar asignaciones por proveedor
    console.log('\n📊 Distribución de productos por proveedor:');
    console.log('=============================================');
    
    for (const proveedor of proveedores) {
      const productosDelProveedor = await prisma.producto.findMany({
        where: {
          empresaId: farmacia.id,
          proveedorId: proveedor.id
        },
        select: {
          nombre: true,
          tipoProducto: true
        }
      });

      console.log(`\n🏭 ${proveedor.nombre}:`);
      console.log(`   Total productos: ${productosDelProveedor.length}`);
      
      // Agrupar por tipo
      const porTipo = {};
      productosDelProveedor.forEach(p => {
        porTipo[p.tipoProducto] = (porTipo[p.tipoProducto] || 0) + 1;
      });

      Object.entries(porTipo).forEach(([tipo, cantidad]) => {
        console.log(`   ${tipo}: ${cantidad} productos`);
      });

      // Mostrar algunos ejemplos
      productosDelProveedor.slice(0, 3).forEach(p => {
        console.log(`     - ${p.nombre}`);
      });
    }

    // 7. Verificar productos sin proveedor
    console.log('\n🔍 Verificando productos sin proveedor...');
    
    const productosSinProveedor = await prisma.producto.findMany({
      where: {
        empresaId: farmacia.id,
        proveedorId: null
      },
      select: {
        nombre: true,
        tipoProducto: true
      }
    });

    if (productosSinProveedor.length > 0) {
      console.log(`⚠️  Productos sin proveedor: ${productosSinProveedor.length}`);
      productosSinProveedor.forEach(p => {
        console.log(`   - ${p.nombre} (${p.tipoProducto})`);
      });
    } else {
      console.log('✅ Todos los productos tienen proveedor asignado');
    }

    // 8. Resumen final
    console.log('\n🎉 Asignación de proveedores completada!');
    console.log('=========================================');
    console.log(`🏥 Empresa: ${farmacia.nombre}`);
    console.log(`💊 Productos totales: ${productos.length}`);
    console.log(`🏭 Proveedores utilizados: ${proveedores.length}`);
    console.log(`🔗 Relaciones creadas: ${productos.length - productosSinProveedor.length}`);
    
    console.log('\n📋 Distribución por proveedor:');
    console.log('   🏥 Laboratorios Pfizer México - Medicamentos principales');
    console.log('   🏥 Roche Farmacéutica - Medicamentos especializados');
    console.log('   🏥 Bayer de México - Medicamentos de venta libre');
    console.log('   🏥 Distribuidora Médica del Norte - Suplementos y cuidado personal');
    console.log('   🏥 Suministros Médicos Express - Equipos médicos y suplementos');

  } catch (error) {
    console.error('❌ Error asignando proveedores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignSuppliersToProducts(); 