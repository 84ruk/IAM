const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔍 Verificando usuarios existentes...');
    
    // Verificar si ya existe un usuario
    const existingUser = await prisma.usuario.findFirst();
    
    if (existingUser) {
      console.log('✅ Ya existe un usuario en la base de datos:', existingUser.email);
      return;
    }

    console.log('📝 Creando usuario de prueba...');

    // Crear empresa de prueba
    const empresa = await prisma.empresa.create({
      data: {
        nombre: 'Empresa de Prueba',
        rfc: 'TEST123456789',
        emailContacto: 'admin@test.com',
        direccion: 'Dirección de prueba',
        TipoIndustria: 'GENERICA',
      },
    });

    console.log('✅ Empresa creada:', empresa.nombre);

    // Crear usuario de prueba
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const usuario = await prisma.usuario.create({
      data: {
        nombre: 'Administrador',
        email: 'admin@test.com',
        password: hashedPassword,
        rol: 'ADMIN',
        empresaId: empresa.id,
        setupCompletado: true,
        activo: true,
        authProvider: 'local',
      },
    });

    console.log('✅ Usuario creado:', usuario.email);
    console.log('🔑 Credenciales de prueba:');
    console.log('   Email: admin@test.com');
    console.log('   Password: admin123');
    console.log('   Empresa: ' + empresa.nombre);

    // Crear ubicación de prueba
    const ubicacion = await prisma.ubicacion.create({
      data: {
        nombre: 'Ubicación Principal',
        descripcion: 'Ubicación principal de la empresa',
        empresaId: empresa.id,
        activa: true,
      },
    });

    console.log('✅ Ubicación creada:', ubicacion.nombre);

  } catch (error) {
    console.error('❌ Error creando usuario de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
