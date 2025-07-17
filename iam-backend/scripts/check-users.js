const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 Verificando usuarios en la base de datos...\n');
    
    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        empresaId: true,
        empresa: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }

    console.log(`✅ Se encontraron ${users.length} usuarios:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nombre} (${user.email})`);
      console.log(`   Rol: ${user.rol}`);
      console.log(`   Activo: ${user.activo ? '✅' : '❌'}`);
      console.log(`   Empresa: ${user.empresa?.nombre || 'Sin empresa'}`);
      console.log('');
    });

    // Mostrar usuarios con contraseña (no OAuth)
    const usersWithPassword = users.filter(user => user.activo);
    console.log(`\n🔑 Usuarios disponibles para pruebas (activos):`);
    usersWithPassword.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.nombre}`);
    });

  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 