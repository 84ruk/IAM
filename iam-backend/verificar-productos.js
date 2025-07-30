// Script para verificar productos en la base de datos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarProductos() {
  try {
    console.log('🔍 Verificando productos en la base de datos...\n');

    // Contar productos por estado
    const conteoPorEstado = await prisma.producto.groupBy({
      by: ['estado'],
      _count: {
        estado: true
      }
    });

    console.log('📊 Conteo por estado:');
    conteoPorEstado.forEach(item => {
      console.log(`- ${item.estado}: ${item._count.estado} productos`);
    });

    // Obtener algunos productos de ejemplo
    console.log('\n📋 Ejemplos de productos:');
    const productos = await prisma.producto.findMany({
      take: 5,
      select: {
        id: true,
        nombre: true,
        estado: true,
        empresaId: true
      },
      orderBy: {
        id: 'desc'
      }
    });

    productos.forEach(producto => {
      console.log(`- ID: ${producto.id}, Nombre: "${producto.nombre}", Estado: ${producto.estado}, Empresa: ${producto.empresaId}`);
    });

    // Verificar si hay productos con empresaId específico
    console.log('\n🏢 Productos por empresa:');
    const productosPorEmpresa = await prisma.producto.groupBy({
      by: ['empresaId'],
      _count: {
        empresaId: true
      }
    });

    productosPorEmpresa.forEach(item => {
      console.log(`- Empresa ${item.empresaId}: ${item._count.empresaId} productos`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificarProductos(); 