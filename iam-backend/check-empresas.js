const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmpresas() {
  try {
    console.log('🔍 Verificando empresas existentes...\n');
    
    const empresas = await prisma.empresa.findMany({
      select: {
        id: true,
        nombre: true,
        rfc: true,
        emailContacto: true,
        fechaCreacion: true
      }
    });

    if (empresas.length === 0) {
      console.log('❌ No hay empresas en la base de datos');
      console.log('💡 Necesitas crear una empresa primero');
    } else {
      console.log(`✅ Se encontraron ${empresas.length} empresa(s):`);
      empresas.forEach(empresa => {
        console.log(`   - ID: ${empresa.id}, Nombre: ${empresa.nombre}, RFC: ${empresa.rfc || 'N/A'}`);
      });
    }

    // También verificar productos existentes
    console.log('\n🔍 Verificando productos existentes...');
    const productos = await prisma.producto.findMany({
      select: {
        id: true,
        nombre: true,
        empresaId: true,
        version: true,
        stock: true
      },
      take: 5
    });

    if (productos.length === 0) {
      console.log('❌ No hay productos en la base de datos');
    } else {
      console.log(`✅ Se encontraron ${productos.length} producto(s) (mostrando primeros 5):`);
      productos.forEach(producto => {
        console.log(`   - ID: ${producto.id}, Nombre: ${producto.nombre}, Empresa: ${producto.empresaId}, Versión: ${producto.version}, Stock: ${producto.stock}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmpresas(); 