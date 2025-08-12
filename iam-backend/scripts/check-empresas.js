const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmpresas() {
  try {
    console.log('🔍 Verificando empresas en la base de datos...\n');

    // Obtener todas las empresas
    const empresas = await prisma.empresa.findMany({
      include: {
        usuarios: {
          select: {
            id: true,
            email: true,
            rol: true,
            empresaId: true
          }
        },
        ubicaciones: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    console.log(`📊 Total de empresas: ${empresas.length}\n`);

    empresas.forEach((empresa, index) => {
      console.log(`🏢 Empresa ${index + 1}:`);
      console.log(`   ID: ${empresa.id}`);
      console.log(`   Nombre: ${empresa.nombre}`);
      console.log(`   Tipo Industria: ${empresa.TipoIndustria}`);
      console.log(`   RFC: ${empresa.rfc || 'No especificado'}`);
      console.log(`   Usuarios: ${empresa.usuarios.length}`);
      console.log(`   Ubicaciones: ${empresa.ubicaciones.length}`);
      console.log('');
    });

    // Verificar secuencia de IDs
    const maxId = empresas.length > 0 ? Math.max(...empresas.map(e => e.id)) : 0;
    console.log(`🔢 ID máximo encontrado: ${maxId}`);
    console.log(`📈 Próximo ID disponible: ${maxId + 1}`);

  } catch (error) {
    console.error('❌ Error verificando empresas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
checkEmpresas(); 