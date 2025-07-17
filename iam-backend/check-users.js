const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...\n');

    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        rol: true,
        empresaId: true,
        activo: true,
        createdAt: true,
        empresa: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      console.log('💡 Crea un usuario primero usando el script create-super-admin.js');
      return;
    }

    console.log(`✅ Se encontraron ${users.length} usuarios:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.rol}`);
      console.log(`   Activo: ${user.activo ? '✅' : '❌'}`);
      console.log(`   Empresa: ${user.empresa ? user.empresa.nombre : 'Sin empresa'}`);
      console.log(`   Creado: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    // Mostrar usuarios admin
    const admins = users.filter(u => u.rol === 'ADMIN' || u.rol === 'SUPERADMIN');
    if (admins.length > 0) {
      console.log('👑 Usuarios con permisos de administrador:');
      admins.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.rol})`);
      });
      console.log('');
    }

    // Mostrar usuarios activos
    const activeUsers = users.filter(u => u.activo);
    if (activeUsers.length > 0) {
      console.log('✅ Usuarios activos:');
      activeUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.rol})`);
      });
      console.log('');
    }

    console.log('💡 Para usar en las pruebas de notificaciones, copia el email de un usuario ADMIN o SUPERADMIN activo');

  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkUsers().catch(console.error);
}

module.exports = { checkUsers }; 