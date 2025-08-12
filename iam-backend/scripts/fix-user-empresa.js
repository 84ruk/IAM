const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserEmpresa() {
  try {
    console.log('🔧 Corrigiendo asignación de empresa del usuario...\n');

    // Buscar usuario por email
    const user = await prisma.usuario.findUnique({
      where: { email: 'baruk066@gmail.com' },
      include: {
        empresa: true
      }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('📋 Estado actual del usuario:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.rol}`);
    console.log(`   Empresa ID: ${user.empresaId || 'No asignada'}`);
    console.log(`   Setup Completado: ${user.setupCompletado || false}`);
    console.log('');

    // Verificar si ya tiene empresa asignada
    if (user.empresaId) {
      console.log('✅ Usuario ya tiene empresa asignada');
      return;
    }

    // Buscar empresa existente (usar la empresa 2 que ya existe)
    const empresa = await prisma.empresa.findUnique({
      where: { id: 2 }
    });

    if (!empresa) {
      console.log('❌ Empresa 2 no encontrada');
      return;
    }

    console.log('🏢 Empresa encontrada:');
    console.log(`   ID: ${empresa.id}`);
    console.log(`   Nombre: ${empresa.nombre}`);
    console.log(`   Tipo Industria: ${empresa.TipoIndustria}`);
    console.log('');

    // Actualizar usuario para asignarle la empresa
    const updatedUser = await prisma.usuario.update({
      where: { id: user.id },
      data: {
        empresaId: empresa.id,
        setupCompletado: true
      }
    });

    console.log('✅ Usuario actualizado exitosamente:');
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Empresa ID: ${updatedUser.empresaId}`);
    console.log(`   Setup Completado: ${updatedUser.setupCompletado}`);

    // Verificar que la actualización fue exitosa
    const finalUser = await prisma.usuario.findUnique({
      where: { id: user.id },
      include: {
        empresa: true
      }
    });

    console.log('\n🔍 Verificación final:');
    console.log(`   Usuario: ${finalUser.email}`);
    console.log(`   Empresa: ${finalUser.empresa?.nombre || 'No asignada'}`);
    console.log(`   Setup: ${finalUser.setupCompletado ? 'Completado' : 'Pendiente'}`);

  } catch (error) {
    console.error('❌ Error corrigiendo usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
fixUserEmpresa();
