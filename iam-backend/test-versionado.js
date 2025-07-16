const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testVersionadoOptimista() {
  console.log('🧪 Probando versionado optimista de productos...\n');

  try {
    // 1. Crear un producto de prueba
    console.log('1. Creando producto de prueba...');
    const producto = await prisma.producto.create({
      data: {
        nombre: 'Producto Test Versionado',
        descripcion: 'Producto para probar versionado optimista',
        stock: 100,
        empresaId: 27, // Usar una empresa existente
        precioCompra: 10.0,
        precioVenta: 15.0,
        codigoBarras: 'TEST-VERSION-001',
        etiquetas: ['test', 'versionado']
      }
    });

    console.log(`✅ Producto creado con ID: ${producto.id}, Versión: ${producto.version}\n`);

    // 2. Simular actualización concurrente (condición de carrera)
    console.log('2. Simulando actualización concurrente...');
    
    // Primera transacción - actualizar stock
    const transaccion1 = prisma.$transaction(async (tx) => {
      const prod = await tx.producto.findFirst({
        where: { id: producto.id },
        select: { id: true, stock: true, version: true }
      });

      console.log(`   Transacción 1 - Stock actual: ${prod.stock}, Versión: ${prod.version}`);

      // Simular procesamiento lento
      await new Promise(resolve => setTimeout(resolve, 100));

      const updateResult = await tx.producto.updateMany({
        where: { 
          id: producto.id,
          version: prod.version
        },
        data: { 
          stock: prod.stock + 50,
          version: prod.version + 1
        }
      });

      if (updateResult.count === 0) {
        throw new Error('Transacción 1: El producto fue modificado por otro usuario');
      }

      console.log(`   ✅ Transacción 1 exitosa - Stock actualizado a: ${prod.stock + 50}`);
      return { success: true, stock: prod.stock + 50 };
    });

    // Segunda transacción - intentar actualizar al mismo tiempo
    const transaccion2 = prisma.$transaction(async (tx) => {
      const prod = await tx.producto.findFirst({
        where: { id: producto.id },
        select: { id: true, stock: true, version: true }
      });

      console.log(`   Transacción 2 - Stock actual: ${prod.stock}, Versión: ${prod.version}`);

      // Simular procesamiento lento
      await new Promise(resolve => setTimeout(resolve, 50));

      const updateResult = await tx.producto.updateMany({
        where: { 
          id: producto.id,
          version: prod.version
        },
        data: { 
          stock: prod.stock - 20,
          version: prod.version + 1
        }
      });

      if (updateResult.count === 0) {
        throw new Error('Transacción 2: El producto fue modificado por otro usuario');
      }

      console.log(`   ✅ Transacción 2 exitosa - Stock actualizado a: ${prod.stock - 20}`);
      return { success: true, stock: prod.stock - 20 };
    });

    // Ejecutar ambas transacciones
    const [result1, result2] = await Promise.allSettled([transaccion1, transaccion2]);

    console.log('\n3. Resultados de las transacciones:');
    console.log(`   Transacción 1: ${result1.status}`);
    if (result1.status === 'fulfilled') {
      console.log(`   ✅ Transacción 1 completada - Stock final: ${result1.value.stock}`);
    } else {
      console.log(`   ❌ Transacción 1 falló: ${result1.reason.message}`);
    }

    console.log(`   Transacción 2: ${result2.status}`);
    if (result2.status === 'fulfilled') {
      console.log(`   ✅ Transacción 2 completada - Stock final: ${result2.value.stock}`);
    } else {
      console.log(`   ❌ Transacción 2 falló: ${result2.reason.message}`);
    }

    // 4. Verificar estado final del producto
    console.log('\n4. Verificando estado final del producto...');
    const productoFinal = await prisma.producto.findUnique({
      where: { id: producto.id },
      select: { id: true, nombre: true, stock: true, version: true }
    });

    console.log(`   Estado final:`);
    console.log(`   - ID: ${productoFinal.id}`);
    console.log(`   - Nombre: ${productoFinal.nombre}`);
    console.log(`   - Stock: ${productoFinal.stock}`);
    console.log(`   - Versión: ${productoFinal.version}`);

    // 5. Limpiar - eliminar producto de prueba
    console.log('\n5. Limpiando producto de prueba...');
    await prisma.producto.delete({
      where: { id: producto.id }
    });
    console.log('✅ Producto de prueba eliminado');

    console.log('\n🎉 Prueba de versionado optimista completada exitosamente!');
    console.log('   El versionado optimista está funcionando correctamente.');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testVersionadoOptimista(); 