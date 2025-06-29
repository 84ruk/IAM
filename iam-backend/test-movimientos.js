const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarMovimientos() {
  try {
    console.log('Conectando a la base de datos...');
    await prisma.$connect();
    
    console.log('\n=== MOVIMIENTOS EXISTENTES ===');
    const movimientos = await prisma.movimientoInventario.findMany({
      select: {
        id: true,
        tipo: true,
        cantidad: true,
        fecha: true,
        estado: true,
        producto: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log(`Total de movimientos: ${movimientos.length}`);
    movimientos.forEach(mov => {
      console.log(`ID: ${mov.id} | Tipo: ${mov.tipo} | Cantidad: ${mov.cantidad} | Estado: ${mov.estado} | Producto: ${mov.producto?.nombre || 'N/A'}`);
    });
    
    console.log('\n=== PRODUCTOS EXISTENTES ===');
    const productos = await prisma.producto.findMany({
      select: {
        id: true,
        nombre: true,
        estado: true
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log(`Total de productos: ${productos.length}`);
    productos.forEach(prod => {
      console.log(`ID: ${prod.id} | Nombre: ${prod.nombre} | Estado: ${prod.estado}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarMovimientos(); 