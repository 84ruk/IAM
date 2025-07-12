const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySuperAdmin() {
  try {
    const superAdmin = await prisma.usuario.findFirst({
      where: {
        rol: 'SUPERADMIN'
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true
      }
    });

    if (superAdmin) {
      console.log('✅ Super Admin encontrado:');
      console.log('ID:', superAdmin.id);
      console.log('Nombre:', superAdmin.nombre);
      console.log('Email:', superAdmin.email);
      console.log('Rol:', superAdmin.rol);
      console.log('Activo:', superAdmin.activo);
      console.log('Creado:', superAdmin.createdAt);
    } else {
      console.log('❌ No se encontró ningún Super Admin');
    }

  } catch (error) {
    console.error('Error verificando super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySuperAdmin(); 