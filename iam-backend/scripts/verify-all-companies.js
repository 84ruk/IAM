const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAllCompanies() {
  try {
    console.log('🔍 Verificando todas las empresas generadas...\n');

    // 1. Obtener todas las empresas con sus usuarios
    const empresas = await prisma.empresa.findMany({
      include: {
        usuarios: {
          select: {
            email: true,
            nombre: true,
            rol: true
          }
        },
        productos: {
          include: {
            proveedor: {
              select: {
                nombre: true
              }
            }
          }
        },
        proveedores: true
      }
    });

    console.log(`📊 Total de empresas encontradas: ${empresas.length}\n`);

    // 2. Mostrar resumen de cada empresa
    empresas.forEach((empresa, index) => {
      console.log(`🏢 ${index + 1}. ${empresa.nombre}`);
      console.log('='.repeat(60));
      console.log(`🏭 Industria: ${empresa.TipoIndustria}`);
      console.log(`📍 Dirección: ${empresa.direccion || 'No especificada'}`);
      console.log(`📞 Teléfono: ${empresa.telefono || 'No especificado'}`);
      console.log(`📋 RFC: ${empresa.rfc || 'No especificado'}`);
      
      // Usuarios
      console.log(`\n👥 Usuarios (${empresa.usuarios.length}):`);
      empresa.usuarios.forEach(user => {
        console.log(`   👤 ${user.nombre} (${user.email}) - ${user.rol}`);
      });

      // Productos por tipo
      const productosPorTipo = {};
      empresa.productos.forEach(producto => {
        if (!productosPorTipo[producto.tipoProducto]) {
          productosPorTipo[producto.tipoProducto] = [];
        }
        productosPorTipo[producto.tipoProducto].push(producto);
      });

      console.log(`\n💼 Productos (${empresa.productos.length}):`);
      Object.entries(productosPorTipo).forEach(([tipo, productos]) => {
        const iconos = {
          'ALIMENTO': '🍽️',
          'ROPA': '👕',
          'GENERICO': '📦',
          'ELECTRONICO': '💻',
          'MEDICAMENTO': '💊',
          'SUPLEMENTO': '💊',
          'EQUIPO_MEDICO': '🏥',
          'CUIDADO_PERSONAL': '🧴',
          'BIOLOGICO': '🧬',
          'MATERIAL_QUIRURGICO': '🔬'
        };
        
        const icono = iconos[tipo] || '📦';
        console.log(`   ${icono} ${tipo}: ${productos.length} productos`);
      });

      // Proveedores
      console.log(`\n🏭 Proveedores (${empresa.proveedores.length}):`);
      empresa.proveedores.forEach(proveedor => {
        const productosDelProveedor = empresa.productos.filter(p => p.proveedorId === proveedor.id);
        console.log(`   🏭 ${proveedor.nombre} (${productosDelProveedor.length} productos)`);
      });

      // KPIs básicos
      const totalStock = empresa.productos.reduce((sum, p) => sum + p.stock, 0);
      const totalValorCompra = empresa.productos.reduce((sum, p) => sum + (p.precioCompra * p.stock), 0);
      const totalValorVenta = empresa.productos.reduce((sum, p) => sum + (p.precioVenta * p.stock), 0);
      const margenPromedio = totalValorCompra > 0 ? ((totalValorVenta - totalValorCompra) / totalValorCompra * 100) : 0;

      console.log(`\n📈 KPIs Básicos:`);
      console.log(`   📊 Stock total: ${totalStock} unidades`);
      console.log(`   💰 Valor total: $${totalValorCompra.toFixed(2)} → $${totalValorVenta.toFixed(2)}`);
      console.log(`   📈 Margen promedio: ${margenPromedio.toFixed(1)}%`);

      // Productos con stock bajo
      const stockBajo = empresa.productos.filter(p => p.stock <= p.stockMinimo);
      if (stockBajo.length > 0) {
        console.log(`\n⚠️  Productos con stock bajo (${stockBajo.length}):`);
        stockBajo.slice(0, 5).forEach(p => {
          console.log(`   - ${p.nombre}: ${p.stock}/${p.stockMinimo}`);
        });
        if (stockBajo.length > 5) {
          console.log(`   ... y ${stockBajo.length - 5} más`);
        }
      }

      console.log('\n' + '='.repeat(60) + '\n');
    });

    // 3. Resumen general
    console.log('📊 RESUMEN GENERAL');
    console.log('==================');
    
    const totalProductos = empresas.reduce((sum, e) => sum + e.productos.length, 0);
    const totalProveedores = empresas.reduce((sum, e) => sum + e.proveedores.length, 0);
    const totalUsuarios = empresas.reduce((sum, e) => sum + e.usuarios.length, 0);
    const totalStock = empresas.reduce((sum, e) => sum + e.productos.reduce((s, p) => s + p.stock, 0), 0);
    const totalValorCompra = empresas.reduce((sum, e) => sum + e.productos.reduce((s, p) => s + (p.precioCompra * p.stock), 0), 0);
    const totalValorVenta = empresas.reduce((sum, e) => sum + e.productos.reduce((s, p) => s + (p.precioVenta * p.stock), 0), 0);

    console.log(`🏢 Empresas: ${empresas.length}`);
    console.log(`👥 Usuarios: ${totalUsuarios}`);
    console.log(`💼 Productos: ${totalProductos}`);
    console.log(`🏭 Proveedores: ${totalProveedores}`);
    console.log(`📊 Stock total: ${totalStock} unidades`);
    console.log(`💰 Valor total: $${totalValorCompra.toFixed(2)} → $${totalValorVenta.toFixed(2)}`);

    // 4. Análisis por industria
    console.log('\n🏭 ANÁLISIS POR INDUSTRIA');
    console.log('=========================');
    
    const porIndustria = {};
    empresas.forEach(empresa => {
      if (!porIndustria[empresa.TipoIndustria]) {
        porIndustria[empresa.TipoIndustria] = {
          empresas: 0,
          productos: 0,
          proveedores: 0,
          stock: 0,
          valorCompra: 0,
          valorVenta: 0
        };
      }
      
      porIndustria[empresa.TipoIndustria].empresas++;
      porIndustria[empresa.TipoIndustria].productos += empresa.productos.length;
      porIndustria[empresa.TipoIndustria].proveedores += empresa.proveedores.length;
      porIndustria[empresa.TipoIndustria].stock += empresa.productos.reduce((sum, p) => sum + p.stock, 0);
      porIndustria[empresa.TipoIndustria].valorCompra += empresa.productos.reduce((sum, p) => sum + (p.precioCompra * p.stock), 0);
      porIndustria[empresa.TipoIndustria].valorVenta += empresa.productos.reduce((sum, p) => sum + (p.precioVenta * p.stock), 0);
    });

    Object.entries(porIndustria).forEach(([industria, datos]) => {
      const margen = datos.valorCompra > 0 ? ((datos.valorVenta - datos.valorCompra) / datos.valorCompra * 100) : 0;
      
      const iconos = {
        'ALIMENTOS': '🍽️',
        'ROPA': '👕',
        'GENERICA': '📦',
        'ELECTRONICA': '💻',
        'FARMACIA': '💊'
      };
      
      const icono = iconos[industria] || '🏭';
      
      console.log(`\n${icono} ${industria}:`);
      console.log(`   🏢 Empresas: ${datos.empresas}`);
      console.log(`   💼 Productos: ${datos.productos}`);
      console.log(`   🏭 Proveedores: ${datos.proveedores}`);
      console.log(`   📊 Stock: ${datos.stock} unidades`);
      console.log(`   💰 Valor: $${datos.valorCompra.toFixed(2)} → $${datos.valorVenta.toFixed(2)}`);
      console.log(`   📈 Margen: ${margen.toFixed(1)}%`);
    });

    // 5. Top productos por margen
    console.log('\n🏆 TOP 10 PRODUCTOS POR MARGEN');
    console.log('==============================');
    
    const todosLosProductos = empresas.flatMap(e => e.productos.map(p => ({
      ...p,
      empresa: e.nombre
    })));

    const productosConMargen = todosLosProductos.map(p => ({
      ...p,
      margen: ((p.precioVenta - p.precioCompra) / p.precioCompra * 100)
    }));

    productosConMargen
      .sort((a, b) => b.margen - a.margen)
      .slice(0, 10)
      .forEach((producto, index) => {
        console.log(`${index + 1}. ${producto.nombre} (${producto.empresa})`);
        console.log(`   💰 $${producto.precioCompra} → $${producto.precioVenta} (${producto.margen.toFixed(1)}% margen)`);
        console.log(`   📊 Stock: ${producto.stock} unidades`);
        console.log(`   🏭 Proveedor: ${producto.proveedor?.nombre || 'Sin proveedor'}`);
        console.log('');
      });

    console.log('🎉 Verificación completada exitosamente!');
    console.log('==========================================');
    console.log('✅ Todas las empresas han sido verificadas');
    console.log('✅ KPIs calculados por empresa e industria');
    console.log('✅ Análisis de productos y proveedores completado');

  } catch (error) {
    console.error('❌ Error verificando empresas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAllCompanies(); 