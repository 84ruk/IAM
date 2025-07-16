const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('👥 VERIFICANDO USUARIOS EXISTENTES');
  console.log('==================================\n');

  try {
    // Obtener todos los usuarios
    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        empresaId: true,
        setupCompletado: true,
        authProvider: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Se encontraron ${users.length} usuario(s):\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   - Nombre: ${user.nombre}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Rol: ${user.rol}`);
      console.log(`   - Empresa ID: ${user.empresaId || 'N/A'}`);
      console.log(`   - Setup completado: ${user.setupCompletado}`);
      console.log(`   - Auth Provider: ${user.authProvider}`);
      console.log(`   - Creado: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // Buscar usuario específico de pruebas
    const testUser = users.find(u => u.email === 'test-security-new@example.com');
    if (testUser) {
      console.log('🔍 USUARIO DE PRUEBAS ENCONTRADO:');
      console.log(`   - ID: ${testUser.id}`);
      console.log(`   - Email: ${testUser.email}`);
      console.log(`   - Setup completado: ${testUser.setupCompletado}`);
      console.log(`   - Empresa ID: ${testUser.empresaId || 'N/A'}`);
    } else {
      console.log('❌ Usuario de pruebas NO encontrado');
    }

  } catch (error) {
    console.error('❌ Error verificando usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 