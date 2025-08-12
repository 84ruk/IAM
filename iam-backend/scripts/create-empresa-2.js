const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createEmpresa2() {
  console.log('🚀 Creando empresa ID 2 para el token JWT...\n');

  try {
    // Crear empresa ID 2
    console.log('1️⃣ Creando empresa ID 2...');
    const empresa = await prisma.empresa.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        nombre: 'Empresa Baruk Ramos',
        rfc: 'BARU123456789',
        emailContacto: 'baruk066@gmail.com',
        direccion: 'Dirección de la empresa',
        TipoIndustria: 'GENERICA'
      }
    });
    console.log(`✅ Empresa creada: ${empresa.nombre} (ID: ${empresa.id})\n`);

    // Crear ubicación para la empresa 2
    console.log('2️⃣ Creando ubicación para empresa 2...');
    const ubicacion = await prisma.ubicacion.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        nombre: 'Almacén Principal Empresa 2',
        descripcion: 'Ubicación principal para empresa 2',
        empresaId: empresa.id,
        activa: true
      }
    });
    console.log(`✅ Ubicación creada: ${ubicacion.nombre} (ID: ${ubicacion.id})\n`);

    console.log('🎉 Empresa 2 creada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   - Empresa: ${empresa.nombre} (ID: ${empresa.id})`);
    console.log(`   - Ubicación: ${ubicacion.nombre} (ID: ${ubicacion.id})`);

  } catch (error) {
    console.error('❌ Error creando empresa 2:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
createEmpresa2();
