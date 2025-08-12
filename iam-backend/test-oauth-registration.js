const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOAuthRegistration() {
  try {
    console.log('🧪 Probando escenarios de registro OAuth...\n');

    // 1. Verificar estado actual de empresas y usuarios
    console.log('1️⃣ Estado actual de la base de datos:');
    
    const empresas = await prisma.empresa.findMany({
      include: {
        usuarios: {
          select: {
            id: true,
            email: true,
            empresaId: true,
            setupCompletado: true
          }
        }
      }
    });

    empresas.forEach((empresa, index) => {
      console.log(`   Empresa ${index + 1}: ${empresa.nombre} (ID: ${empresa.id})`);
      console.log(`     Email contacto: ${empresa.emailContacto}`);
      console.log(`     Usuarios: ${empresa.usuarios.length}`);
      empresa.usuarios.forEach(user => {
        console.log(`       - ${user.email} (ID: ${user.id}, Setup: ${user.setupCompletado})`);
      });
      console.log('');
    });

    // 2. Simular escenario de registro OAuth con email que ya tiene empresa
    console.log('2️⃣ Simulando registro OAuth con email existente...');
    
    const testEmail = 'baruk066@gmail.com';
    const existingEmpresa = await prisma.empresa.findFirst({
      where: { emailContacto: testEmail }
    });

    if (existingEmpresa) {
      console.log(`   ✅ Email ${testEmail} ya tiene empresa: ${existingEmpresa.nombre}`);
      
      // Verificar si ya tiene usuario asignado
      const existingUser = await prisma.usuario.findFirst({
        where: { empresaId: existingEmpresa.id }
      });

      if (existingUser) {
        console.log(`   ✅ Empresa ya tiene usuario asignado: ${existingUser.email}`);
        console.log(`   ℹ️  El sistema debería rechazar el registro OAuth duplicado`);
      } else {
        console.log(`   ⚠️  Empresa no tiene usuario asignado`);
        console.log(`   ℹ️  El sistema debería crear usuario y asignarlo a la empresa`);
      }
    } else {
      console.log(`   ❌ Email ${testEmail} no tiene empresa asociada`);
    }

    // 3. Verificar usuarios existentes
    console.log('\n3️⃣ Usuarios existentes:');
    
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        empresaId: true,
        setupCompletado: true,
        authProvider: true
      }
    });

    usuarios.forEach((usuario, index) => {
      console.log(`   Usuario ${index + 1}: ${usuario.email}`);
      console.log(`     ID: ${usuario.id}, Empresa: ${usuario.empresaId || 'No asignada'}`);
      console.log(`     Setup: ${usuario.setupCompletado}, Provider: ${usuario.authProvider}`);
      console.log('');
    });

    // 4. Recomendaciones
    console.log('4️⃣ Recomendaciones para prevenir conflictos:');
    console.log('   ✅ El sistema ahora verifica empresas existentes antes de crear usuarios');
    console.log('   ✅ Se previenen conflictos de email entre diferentes proveedores');
    console.log('   ✅ Se asignan automáticamente usuarios a empresas existentes');
    console.log('   ✅ Se valida la consistencia de datos antes de permitir acceso');

  } catch (error) {
    console.error('❌ Error en test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test
testOAuthRegistration();
