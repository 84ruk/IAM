const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanForeignKeys() {
  console.log('🧹 LIMPIANDO RESTRICCIONES DE CLAVE FORÁNEA');
  console.log('===========================================\n');

  try {
    // 1. Listar todas las restricciones existentes
    console.log('1. Listando todas las restricciones existentes...');
    const allConstraints = await prisma.$queryRaw`
      SELECT 
        tc.table_name, 
        tc.constraint_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        LEFT JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('MovimientoInventario', 'PedidoInventario')
        AND ccu.table_name = 'Producto'
    `;

    console.log('Restricciones encontradas:', allConstraints);

    // 2. Eliminar TODAS las restricciones relacionadas con Producto
    console.log('\n2. Eliminando todas las restricciones...');
    
    for (const constraint of allConstraints) {
      console.log(`   Eliminando: ${constraint.constraint_name}`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "${constraint.table_name}" DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}"`);
    }
    
    console.log('✅ Todas las restricciones eliminadas');

    // 3. Agregar las nuevas restricciones con CASCADE DELETE
    console.log('\n3. Agregando nuevas restricciones con CASCADE DELETE...');
    
    await prisma.$executeRaw`
      ALTER TABLE "MovimientoInventario" 
      ADD CONSTRAINT "MovimientoInventario_productId_fkey" 
      FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "PedidoInventario" 
      ADD CONSTRAINT "PedidoInventario_productId_fkey" 
      FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE
    `;
    
    console.log('✅ Nuevas restricciones agregadas');

    // 4. Verificar las restricciones finales
    console.log('\n4. Verificando restricciones finales...');
    const finalConstraints = await prisma.$queryRaw`
      SELECT 
        tc.table_name, 
        tc.constraint_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('MovimientoInventario', 'PedidoInventario')
        AND ccu.table_name = 'Producto'
    `;

    console.log('Restricciones finales:', finalConstraints);

    // 5. Probar eliminación de un producto
    console.log('\n5. Probando eliminación de producto...');
    
    // Buscar un producto que tenga movimientos
    const productoConMovimientos = await prisma.producto.findFirst({
      where: {
        movimientos: {
          some: {}
        }
      },
      include: {
        _count: {
          select: {
            movimientos: true,
            pedidos: true
          }
        }
      }
    });

    if (productoConMovimientos) {
      console.log(`   Producto encontrado: ID ${productoConMovimientos.id}`);
      console.log(`   Movimientos: ${productoConMovimientos._count.movimientos}`);
      console.log(`   Pedidos: ${productoConMovimientos._count.pedidos}`);
      
      // Contar movimientos antes de eliminar
      const movimientosAntes = await prisma.movimientoInventario.count({
        where: { productoId: productoConMovimientos.id }
      });
      console.log(`   Movimientos antes de eliminar: ${movimientosAntes}`);
      
      // Eliminar el producto
      await prisma.producto.delete({
        where: { id: productoConMovimientos.id }
      });
      
      // Verificar que los movimientos se eliminaron
      const movimientosDespues = await prisma.movimientoInventario.count({
        where: { productoId: productoConMovimientos.id }
      });
      console.log(`   Movimientos después de eliminar: ${movimientosDespues}`);
      
      console.log('✅ Producto eliminado exitosamente con CASCADE DELETE');
    } else {
      console.log('   No se encontraron productos con movimientos para probar');
    }

    console.log('\n🎉 Limpieza de restricciones completada exitosamente');

  } catch (error) {
    console.error('❌ Error limpiando restricciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanForeignKeys(); 