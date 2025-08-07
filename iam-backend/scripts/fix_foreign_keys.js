const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixForeignKeys() {
  console.log('🔧 ARREGLANDO RESTRICCIONES DE CLAVE FORÁNEA');
  console.log('============================================\n');

  try {
    // 1. Verificar las restricciones actuales
    console.log('1. Verificando restricciones actuales...');
    const currentConstraints = await prisma.$queryRaw`
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

    console.log('Restricciones actuales:', currentConstraints);

    // 2. Eliminar restricciones existentes
    console.log('\n2. Eliminando restricciones existentes...');
    
    await prisma.$executeRaw`ALTER TABLE "MovimientoInventario" DROP CONSTRAINT IF EXISTS "MovimientoInventario_productId_fkey"`;
    await prisma.$executeRaw`ALTER TABLE "PedidoInventario" DROP CONSTRAINT IF EXISTS "PedidoInventario_productId_fkey"`;
    
    console.log('✅ Restricciones eliminadas');

    // 3. Agregar nuevas restricciones con CASCADE DELETE
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

    // 4. Verificar que las restricciones se aplicaron correctamente
    console.log('\n4. Verificando nuevas restricciones...');
    const newConstraints = await prisma.$queryRaw`
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

    console.log('Nuevas restricciones:', newConstraints);

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
      
      // Eliminar el producto (esto debería funcionar ahora con CASCADE)
      await prisma.producto.delete({
        where: { id: productoConMovimientos.id }
      });
      
      console.log('✅ Producto eliminado exitosamente con CASCADE DELETE');
    } else {
      console.log('   No se encontraron productos con movimientos para probar');
    }

    console.log('\n🎉 Restricciones de clave foránea arregladas exitosamente');

  } catch (error) {
    console.error('❌ Error arreglando restricciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixForeignKeys(); 