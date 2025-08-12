const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserStatus() {
  try {
    console.log('👤 Verificando estado del usuario...\n');

    // Buscar usuario por email
    const user = await prisma.usuario.findUnique({
      where: { email: 'baruk066@gmail.com' },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
            TipoIndustria: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('📋 Información del usuario:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.rol}`);
    console.log(`   Empresa ID: ${user.empresaId || 'No asignada'}`);
    console.log(`   Setup Completado: ${user.setupCompletado || false}`);
    console.log(`   Fecha Creación: ${user.createdAt}`);
    console.log('');

    if (user.empresa) {
      console.log('🏢 Empresa asignada:');
      console.log(`   ID: ${user.empresa.id}`);
      console.log(`   Nombre: ${user.empresa.nombre}`);
      console.log(`   Tipo Industria: ${user.empresa.TipoIndustria}`);
    } else {
      console.log('⚠️ Usuario no tiene empresa asignada');
    }

    // Verificar si el usuario necesita setup
    const needsSetup = !user.empresaId || !user.setupCompletado;
    console.log(`\n🔧 Necesita setup: ${needsSetup ? 'SÍ' : 'NO'}`);

  } catch (error) {
    console.error('❌ Error verificando usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
checkUserStatus();
