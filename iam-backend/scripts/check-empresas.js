const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmpresas() {
  try {
    console.log('🏢 Verificando empresas existentes...\n');

    const empresas = await prisma.empresa.findMany({
      select: {
        id: true,
        nombre: true,
        TipoIndustria: true,
        usuarios: {
          select: {
            email: true
          }
        }
      }
    });

    console.log(`📊 Total de empresas: ${empresas.length}\n`);

    empresas.forEach((empresa, index) => {
      console.log(`${index + 1}. ${empresa.nombre}`);
      console.log(`   Industria: ${empresa.TipoIndustria}`);
      console.log(`   Usuarios: ${empresa.usuarios.map(u => u.email).join(', ')}`);
      console.log('');
    });

    // Buscar específicamente empresas de farmacia
    const farmacias = empresas.filter(e => 
      e.nombre.toLowerCase().includes('farmacia') || 
      e.nombre.toLowerCase().includes('clini') ||
      e.TipoIndustria === 'FARMACIA'
    );

    if (farmacias.length > 0) {
      console.log('💊 Empresas farmacéuticas encontradas:');
      farmacias.forEach(farmacia => {
        console.log(`   - ${farmacia.nombre} (${farmacia.TipoIndustria})`);
      });
    } else {
      console.log('⚠️  No se encontraron empresas farmacéuticas');
    }

  } catch (error) {
    console.error('❌ Error verificando empresas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmpresas(); 