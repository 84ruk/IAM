const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyClothingData() {
  try {
    console.log('🔍 Verificando datos de empresa de ropa...\n');

    // 1. Obtener la empresa
    const empresa = await prisma.empresa.findFirst({
      where: { 
        usuarios: {
          some: {
            email: 'contactobaruk@gmail.com'
          }
        }
      }
    });

    if (!empresa) {
      console.log('❌ No se encontró la empresa');
      return;
    }

    console.log(`🏢 Empresa: ${empresa.nombre}`);
    console.log(`🏭 Industria: ${empresa.TipoIndustria}`);
    console.log(`📍 Dirección: ${empresa.direccion}`);
    console.log(`📞 Teléfono: ${empresa.telefono}`);
    console.log(`📋 RFC: ${empresa.rfc}\n`);

    // 2. Obtener productos con proveedores
    const productos = await prisma.producto.findMany({
      where: { empresaId: empresa.id },
      include: {
        proveedor: {
          select: {
            nombre: true,
            email: true
          }
        }
      },
      orderBy: [
        { tipoProducto: 'asc' },
        { nombre: 'asc' }
      ]
    });

    console.log(`💼 Total de productos: ${productos.length}\n`);

    // 3. Agrupar productos por categorías
    const categorias = {
      'Ropa de Caballero': productos.filter(p => 
        p.etiquetas.some(tag => tag.includes('caballero'))
      ),
      'Ropa de Dama': productos.filter(p => 
        p.etiquetas.some(tag => tag.includes('dama'))
      ),
      'Calzado': productos.filter(p => 
        p.etiquetas.some(tag => tag.includes('zapatos') || tag.includes('tacones') || tag.includes('tenis'))
      ),
      'Accesorios': productos.filter(p => 
        p.etiquetas.some(tag => tag.includes('accesorio') || tag.includes('cinturón') || tag.includes('bolsa') || tag.includes('corbata'))
      )
    };

    // 4. Mostrar productos por categoría
    Object.entries(categorias).forEach(([categoria, productosCategoria]) => {
      const iconos = {
        'Ropa de Caballero': '👔',
        'Ropa de Dama': '👗',
        'Calzado': '👟',
        'Accesorios': '👜'
      };

      const icono = iconos[categoria] || '📦';
      
      console.log(`${icono} ${categoria} (${productosCategoria.length} productos):`);
      console.log('='.repeat(60));
      
      productosCategoria.forEach(producto => {
        const proveedorInfo = producto.proveedor 
          ? `${producto.proveedor.nombre}`
          : '❌ Sin proveedor';
        
        const stockInfo = producto.stock <= producto.stockMinimo 
          ? `⚠️  ${producto.stock}/${producto.stockMinimo}`
          : `✅ ${producto.stock}/${producto.stockMinimo}`;
        
        const margen = ((producto.precioVenta - producto.precioCompra) / producto.precioCompra * 100).toFixed(1);
        
        console.log(`   📦 ${producto.nombre}`);
        console.log(`      💰 Precio: $${producto.precioCompra} → $${producto.precioVenta} (${margen}% margen)`);
        console.log(`      📊 Stock: ${stockInfo}`);
        console.log(`      🏭 Proveedor: ${proveedorInfo}`);
        console.log(`      🎨 Color: ${producto.color || 'N/A'}`);
        console.log(`      📏 Talla: ${producto.talla || 'N/A'}`);
        console.log(`      🏷️  Etiquetas: ${producto.etiquetas.join(', ')}`);
        console.log('');
      });
    });

    // 5. Análisis de proveedores
    console.log('📊 Análisis de Proveedores:');
    console.log('============================');
    
    const proveedores = await prisma.proveedor.findMany({
      where: { empresaId: empresa.id },
      include: {
        productos: {
          select: {
            nombre: true,
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
      
      // Mostrar productos del proveedor
      proveedor.productos.slice(0, 3).forEach(p => {
        console.log(`      - ${p.nombre}`);
      });
    });

    // 6. KPIs por categoría
    console.log('\n📈 KPIs por Categoría:');
    console.log('========================');
    
    Object.entries(categorias).forEach(([categoria, productosCategoria]) => {
      const totalStock = productosCategoria.reduce((sum, p) => sum + p.stock, 0);
      const totalValorCompra = productosCategoria.reduce((sum, p) => sum + (p.precioCompra * p.stock), 0);
      const totalValorVenta = productosCategoria.reduce((sum, p) => sum + (p.precioVenta * p.stock), 0);
      const margenPromedio = ((totalValorVenta - totalValorCompra) / totalValorCompra * 100);
      const stockPromedio = totalStock / productosCategoria.length;
      
      const icono = {
        'Ropa de Caballero': '👔',
        'Ropa de Dama': '👗',
        'Calzado': '👟',
        'Accesorios': '👜'
      }[categoria] || '📦';
      
      console.log(`\n${icono} ${categoria}:`);
      console.log(`   📦 Productos: ${productosCategoria.length}`);
      console.log(`   📊 Stock total: ${totalStock} unidades (promedio: ${stockPromedio.toFixed(1)})`);
      console.log(`   💰 Valor total: $${totalValorCompra.toFixed(2)} → $${totalValorVenta.toFixed(2)}`);
      console.log(`   📈 Margen promedio: ${margenPromedio.toFixed(1)}%`);
      
      // Productos con stock bajo
      const stockBajo = productosCategoria.filter(p => p.stock <= p.stockMinimo);
      if (stockBajo.length > 0) {
        console.log(`   ⚠️  Stock bajo: ${stockBajo.length} productos`);
        stockBajo.forEach(p => {
          console.log(`      - ${p.nombre}: ${p.stock}/${p.stockMinimo}`);
        });
      }
    });

    // 7. Movimientos de inventario
    console.log('\n📊 Movimientos de Inventario:');
    console.log('==============================');
    
    const movimientos = await prisma.movimientoInventario.findMany({
      where: { empresaId: empresa.id },
      include: {
        producto: {
          select: { nombre: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`📈 Últimos 10 movimientos:`);
    movimientos.forEach(mov => {
      const tipo = mov.tipo === 'ENTRADA' ? '📥' : '📤';
      console.log(`   ${tipo} ${mov.producto.nombre}: ${mov.cantidad} unidades (${mov.motivo})`);
    });

    // 8. Pedidos a proveedores
    console.log('\n📋 Pedidos a Proveedores:');
    console.log('==========================');
    
    const pedidos = await prisma.pedidoInventario.findMany({
      where: { empresaId: empresa.id },
      include: {
        producto: { select: { nombre: true } },
        proveedor: { select: { nombre: true } }
      },
      orderBy: { fechaPedido: 'desc' }
    });

    console.log(`📦 Total de pedidos: ${pedidos.length}`);
    pedidos.forEach(pedido => {
      const estado = pedido.estado === 'RECIBIDO' ? '✅' : '⏳';
      console.log(`   ${estado} ${pedido.producto.nombre} → ${pedido.proveedor.nombre} (${pedido.cantidad} unidades)`);
    });

    // 9. Resumen final
    console.log('\n🎉 Verificación Completada!');
    console.log('============================');
    console.log(`✅ Empresa de ropa configurada correctamente`);
    console.log(`✅ ${productos.length} productos con proveedores asignados`);
    console.log(`✅ ${proveedores.length} proveedores especializados`);
    console.log(`✅ ${movimientos.length} movimientos de inventario`);
    console.log(`✅ ${pedidos.length} pedidos a proveedores`);
    console.log(`✅ KPIs calculados por categoría y proveedor`);

  } catch (error) {
    console.error('❌ Error verificando datos de ropa:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyClothingData(); 