const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creando usuario de prueba con empresa...');

    // 1. Crear empresa
    const empresa = await prisma.empresa.create({
      data: {
        nombre: 'Empresa Test Debug',
        TipoIndustria: 'TECNOLOGIA'
      }
    });
    console.log('✅ Empresa creada:', empresa.nombre);

    // 2. Crear usuario
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    const usuario = await prisma.usuario.create({
      data: {
        email: 'test-debug@example.com',
        password: hashedPassword,
        nombre: 'Usuario Test Debug',
        rol: 'ADMIN',
        empresaId: empresa.id,
        setupCompleted: true
      }
    });
    console.log('✅ Usuario creado:', usuario.email);

    console.log('\n📋 Credenciales de prueba:');
    console.log('Email: test-debug@example.com');
    console.log('Password: TestPassword123!');
    console.log('Empresa ID:', empresa.id);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 