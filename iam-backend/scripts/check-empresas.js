const { PrismaClient } = require('@prisma/client');

async function checkEmpresas() {
  console.log('🔍 Verificando empresas en la base de datos...');
  
  const prisma = new PrismaClient();
  
  try {
    const empresas = await prisma.empresa.findMany({
      select: {
        id: true,
        nombre: true,
        TipoIndustria: true,
        fechaCreacion: true
      }
    });

    console.log('\n📊 Empresas encontradas:');
    empresas.forEach(empresa => {
      console.log(`   - ID: ${empresa.id}, Nombre: ${empresa.nombre}, Tipo: ${empresa.TipoIndustria}, Creada: ${empresa.fechaCreacion}`);
    });

    if (empresas.length === 0) {
      console.log('\n⚠️ No hay empresas en la base de datos. Creando una empresa de prueba...');
      
      const nuevaEmpresa = await prisma.empresa.create({
        data: {
          nombre: 'Empresa de Prueba',
          TipoIndustria: 'GENERICA'
        }
      });
      
      console.log(`✅ Empresa creada: ID ${nuevaEmpresa.id} - ${nuevaEmpresa.nombre}`);
    }

  } catch (error) {
    console.error('❌ Error verificando empresas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmpresas(); 