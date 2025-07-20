const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserData() {
  console.log('🔍 Verificando datos del usuario prueba@iam.com...\n');

  try {
    // 1. Buscar el usuario
    const user = await prisma.usuario.findUnique({
      where: { email: 'prueba@iam.com' },
      include: {
        empresa: true
      }
    });

    if (!user) {
      console.log('❌ Usuario prueba@iam.com no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Nombre: ${user.nombre}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Rol: ${user.rol}`);
    console.log(`- Activo: ${user.activo}`);
    console.log(`- Empresa ID: ${user.empresaId}`);
    console.log(`- Empresa: ${user.empresa?.nombre || 'Sin empresa'}`);

    if (!user.empresaId) {
      console.log('\n❌ El usuario no tiene empresa asignada');
      return;
    }

    // 2. Verificar datos de la empresa
    const empresa = await prisma.empresa.findUnique({
      where: { id: user.empresaId },
      include: {
        productos: {
          where: { estado: 'ACTIVO' },
          select: { id: true, nombre: true, stock: true }
        },
        movimientos: {
          where: { estado: 'ACTIVO' },
          select: { id: true, tipo: true, cantidad: true, fecha: true }
        },
        proveedores: {
          where: { estado: 'ACTIVO' },
          select: { id: true, nombre: true }
        },
        usuarios: {
          where: { activo: true },
          select: { id: true, nombre: true, email: true }
        }
      }
    });

    console.log('\n📊 Datos de la empresa:');
    console.log(`- Nombre: ${empresa.nombre}`);
    console.log(`- Tipo: ${empresa.TipoIndustria}`);
    console.log(`- Productos: ${empresa.productos.length}`);
    console.log(`- Movimientos: ${empresa.movimientos.length}`);
    console.log(`- Proveedores: ${empresa.proveedores.length}`);
    console.log(`- Usuarios: ${empresa.usuarios.length}`);

    // 3. Verificar movimientos recientes
    const movimientosRecientes = await prisma.movimientoInventario.findMany({
      where: {
        empresaId: user.empresaId,
        estado: 'ACTIVO',
        fecha: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
        }
      },
      include: {
        producto: {
          select: { nombre: true }
        }
      },
      orderBy: { fecha: 'desc' },
      take: 10
    });

    console.log('\n📈 Movimientos recientes (últimos 7 días):');
    console.log(`- Total: ${movimientosRecientes.length}`);
    
    if (movimientosRecientes.length > 0) {
      movimientosRecientes.forEach((mov, index) => {
        console.log(`  ${index + 1}. ${mov.producto.nombre} - ${mov.tipo} ${mov.cantidad} - ${mov.fecha.toISOString().split('T')[0]}`);
      });
    } else {
      console.log('  ❌ No hay movimientos recientes');
    }

    // 4. Verificar productos con stock
    const productosConStock = await prisma.producto.findMany({
      where: {
        empresaId: user.empresaId,
        estado: 'ACTIVO',
        stock: { gt: 0 }
      },
      select: { id: true, nombre: true, stock: true, stockMinimo: true }
    });

    console.log('\n📦 Productos con stock:');
    console.log(`- Total: ${productosConStock.length}`);
    
    if (productosConStock.length > 0) {
      productosConStock.forEach((prod, index) => {
        console.log(`  ${index + 1}. ${prod.nombre} - Stock: ${prod.stock} (Mín: ${prod.stockMinimo})`);
      });
    } else {
      console.log('  ❌ No hay productos con stock');
    }

    // 5. Verificar si hay datos para el dashboard
    const totalMovimientos = await prisma.movimientoInventario.count({
      where: {
        empresaId: user.empresaId,
        estado: 'ACTIVO'
      }
    });

    const totalProductos = await prisma.producto.count({
      where: {
        empresaId: user.empresaId,
        estado: 'ACTIVO'
      }
    });

    console.log('\n🎯 Resumen para Dashboard:');
    console.log(`- Total movimientos: ${totalMovimientos}`);
    console.log(`- Total productos: ${totalProductos}`);
    
    if (totalMovimientos === 0) {
      console.log('\n⚠️  PROBLEMA: No hay movimientos para mostrar en el dashboard');
      console.log('   Solución: Ejecutar node scripts/generate-test-data.js');
    }
    
    if (totalProductos === 0) {
      console.log('\n⚠️  PROBLEMA: No hay productos para mostrar en el dashboard');
      console.log('   Solución: Ejecutar node scripts/generate-test-data.js');
    }

  } catch (error) {
    console.error('❌ Error verificando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkUserData();
}

module.exports = { checkUserData }; 