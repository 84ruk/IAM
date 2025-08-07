const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function actualizarPreciosProductos() {
  console.log('💰 ACTUALIZANDO PRECIOS DE PRODUCTOS');
  console.log('===================================\n');

  try {
    // Obtener todos los productos de la empresa 2 (ÁUREA TECH)
    const productos = await prisma.producto.findMany({
      where: {
        empresaId: 2,
        estado: 'ACTIVO'
      },
      select: {
        id: true,
        nombre: true,
        precioCompra: true,
        precioVenta: true,
        stock: true
      }
    });

    console.log(`📦 Encontrados ${productos.length} productos para actualizar`);

    let actualizados = 0;
    let conPrecios = 0;

    for (const producto of productos) {
      // Solo actualizar productos que no tienen precios o tienen precios en 0
      if (producto.precioCompra === 0 || producto.precioVenta === 0) {
        // Generar precios realistas basados en el ID del producto
        const basePrice = Math.floor(Math.random() * 100) + 10; // Entre $10 y $110
        const precioCompra = basePrice;
        const precioVenta = Math.floor(precioCompra * (1 + (Math.random() * 0.5 + 0.2))); // Margen entre 20% y 70%

        await prisma.producto.update({
          where: { id: producto.id },
          data: {
            precioCompra: precioCompra,
            precioVenta: precioVenta
          }
        });

        actualizados++;
        console.log(`   ✅ Producto ${producto.id}: Compra $${precioCompra}, Venta $${precioVenta}`);
      } else {
        conPrecios++;
      }
    }

    console.log(`\n📊 RESUMEN:`);
    console.log(`   Productos actualizados: ${actualizados}`);
    console.log(`   Productos que ya tenían precios: ${conPrecios}`);
    console.log(`   Total productos: ${productos.length}`);

    // Verificar el resultado
    console.log(`\n🔍 VERIFICANDO RESULTADO:`);
    
    const productosActualizados = await prisma.producto.findMany({
      where: {
        empresaId: 2,
        estado: 'ACTIVO'
      },
      select: {
        id: true,
        nombre: true,
        precioCompra: true,
        precioVenta: true,
        stock: true
      },
      take: 5
    });

    console.log(`   Primeros 5 productos:`);
    productosActualizados.forEach(p => {
      const margen = ((p.precioVenta - p.precioCompra) / p.precioCompra * 100).toFixed(1);
      console.log(`   - ${p.nombre}: Compra $${p.precioCompra}, Venta $${p.precioVenta} (Margen: ${margen}%)`);
    });

    // Calcular valor total del inventario
    const valorInventario = await prisma.$queryRaw`
      SELECT COALESCE(SUM(p.stock * p."precioVenta"), 0) as total
      FROM "Producto" p
      WHERE p."empresaId" = 2
        AND p.estado = 'ACTIVO'
    `;

    console.log(`\n💰 VALOR TOTAL DEL INVENTARIO: $${Number(valorInventario[0]?.total || 0).toFixed(2)}`);

    // Calcular margen promedio
    const margenPromedio = await prisma.$queryRaw`
      SELECT COALESCE(AVG(p."precioVenta" - p."precioCompra"), 0) as margen
      FROM "Producto" p
      WHERE p."empresaId" = 2
        AND p.estado = 'ACTIVO'
        AND p."precioCompra" > 0
    `;

    console.log(`📈 MARGEN PROMEDIO: $${Number(margenPromedio[0]?.margen || 0).toFixed(2)}`);

    console.log('\n✅ Actualización completada exitosamente');

  } catch (error) {
    console.error('❌ Error actualizando precios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

actualizarPreciosProductos(); 