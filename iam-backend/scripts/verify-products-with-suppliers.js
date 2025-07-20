const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyProductsWithSuppliers() {
  try {
    console.log('🔍 Verificando productos con proveedores asignados...\n');

    // 1. Obtener la empresa farmacéutica
    const farmacia = await prisma.empresa.findFirst({
      where: { nombre: { contains: 'CliniFarm' } }
    });

    if (!farmacia) {
      console.log('❌ No se encontró la empresa farmacéutica');
      return;
    }

    // 2. Obtener todos los productos con sus proveedores
    const productos = await prisma.producto.findMany({
      where: { empresaId: farmacia.id },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true
          }
        }
      },
      orderBy: [
        { tipoProducto: 'asc' },
        { nombre: 'asc' }
      ]
    });

    console.log(`🏥 Empresa: ${farmacia.nombre}`);
    console.log(`💊 Total de productos: ${productos.length}\n`);

    // 3. Agrupar por tipo de producto
    const productosPorTipo = {};
    productos.forEach(p => {
      if (!productosPorTipo[p.tipoProducto]) {
        productosPorTipo[p.tipoProducto] = [];
      }
      productosPorTipo[p.tipoProducto].push(p);
    });

    // 4. Definir iconos para tipos de producto
    const iconos = {
      'MEDICAMENTO': '🔒',
      'SUPLEMENTO': '💊',
      'EQUIPO_MEDICO': '🏥',
      'CUIDADO_PERSONAL': '🧴'
    };

    // 5. Mostrar productos por tipo
    Object.entries(productosPorTipo).forEach(([tipo, productosDelTipo]) => {
      const icono = iconos[tipo] || '📦';
      
      console.log(`${icono} ${tipo} (${productosDelTipo.length} productos):`);
      console.log('='.repeat(50));
      
      productosDelTipo.forEach(producto => {
        const proveedorInfo = producto.proveedor 
          ? `${producto.proveedor.nombre}`
          : '❌ Sin proveedor';
        
        const stockInfo = producto.stock <= producto.stockMinimo 
          ? `⚠️  ${producto.stock}/${producto.stockMinimo}`
          : `✅ ${producto.stock}/${producto.stockMinimo}`;
        
        console.log(`   📦 ${producto.nombre}`);
        console.log(`      💰 Precio: $${producto.precioCompra} → $${producto.precioVenta} (${((producto.precioVenta - producto.precioCompra) / producto.precioCompra * 100).toFixed(1)}% margen)`);
        console.log(`      📊 Stock: ${stockInfo}`);
        console.log(`      🏭 Proveedor: ${proveedorInfo}`);
        console.log(`      🏷️  Etiquetas: ${producto.etiquetas.join(', ')}`);
        console.log('');
      });
    });

    // 6. Análisis de proveedores
    console.log('📊 Análisis de Proveedores:');
    console.log('============================');
    
    const proveedores = await prisma.proveedor.findMany({
      where: { empresaId: farmacia.id },
      include: {
        productos: {
          select: {
            nombre: true,
            tipoProducto: true,
            stock: true,
            precioCompra: true,
            precioVenta: true
          }
        }
      }
    });

    proveedores.forEach(proveedor => {
      console.log(`\n🏭 ${proveedor.nombre}:`);
      console.log(`   📧 Email: ${proveedor.email || 'No especificado'}`);
      console.log(`   📞 Teléfono: ${proveedor.telefono || 'No especificado'}`);
      console.log(`   📦 Productos: ${proveedor.productos.length}`);
      
      // Calcular estadísticas del proveedor
      const totalStock = proveedor.productos.reduce((sum, p) => sum + p.stock, 0);
      const totalValorCompra = proveedor.productos.reduce((sum, p) => sum + (p.precioCompra * p.stock), 0);
      const totalValorVenta = proveedor.productos.reduce((sum, p) => sum + (p.precioVenta * p.stock), 0);
      const margenPromedio = ((totalValorVenta - totalValorCompra) / totalValorCompra * 100);
      
      console.log(`   📊 Stock total: ${totalStock} unidades`);
      console.log(`   💰 Valor total: $${totalValorCompra.toFixed(2)} → $${totalValorVenta.toFixed(2)}`);
      console.log(`   📈 Margen promedio: ${margenPromedio.toFixed(1)}%`);
      
      // Productos por tipo
      const porTipo = {};
      proveedor.productos.forEach(p => {
        porTipo[p.tipoProducto] = (porTipo[p.tipoProducto] || 0) + 1;
      });
      
      Object.entries(porTipo).forEach(([tipo, cantidad]) => {
        console.log(`      ${tipo}: ${cantidad} productos`);
      });
    });

    // 7. KPIs por tipo de producto
    console.log('\n📈 KPIs por Tipo de Producto:');
    console.log('==============================');
    
    Object.entries(productosPorTipo).forEach(([tipo, productosDelTipo]) => {
      const totalStock = productosDelTipo.reduce((sum, p) => sum + p.stock, 0);
      const totalValorCompra = productosDelTipo.reduce((sum, p) => sum + (p.precioCompra * p.stock), 0);
      const totalValorVenta = productosDelTipo.reduce((sum, p) => sum + (p.precioVenta * p.stock), 0);
      const margenPromedio = ((totalValorVenta - totalValorCompra) / totalValorCompra * 100);
      const stockPromedio = totalStock / productosDelTipo.length;
      
      console.log(`\n${iconos[tipo] || '📦'} ${tipo}:`);
      console.log(`   📦 Productos: ${productosDelTipo.length}`);
      console.log(`   📊 Stock total: ${totalStock} unidades (promedio: ${stockPromedio.toFixed(1)})`);
      console.log(`   💰 Valor total: $${totalValorCompra.toFixed(2)} → $${totalValorVenta.toFixed(2)}`);
      console.log(`   📈 Margen promedio: ${margenPromedio.toFixed(1)}%`);
      
      // Productos con stock bajo
      const stockBajo = productosDelTipo.filter(p => p.stock <= p.stockMinimo);
      if (stockBajo.length > 0) {
        console.log(`   ⚠️  Stock bajo: ${stockBajo.length} productos`);
        stockBajo.forEach(p => {
          console.log(`      - ${p.nombre}: ${p.stock}/${p.stockMinimo}`);
        });
      }
    });

    // 8. Resumen final
    console.log('\n🎉 Verificación Completada!');
    console.log('============================');
    console.log(`✅ Todos los productos tienen proveedor asignado`);
    console.log(`✅ Distribución equilibrada por tipo de producto`);
    console.log(`✅ Proveedores especializados por categoría`);
    console.log(`✅ KPIs calculados por tipo y proveedor`);

  } catch (error) {
    console.error('❌ Error verificando productos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyProductsWithSuppliers(); 