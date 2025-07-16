const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateTestUserPassword() {
  console.log('🔧 ACTUALIZANDO CONTRASEÑA DEL USUARIO DE PRUEBAS');
  console.log('==================================================\n');

  const TEST_EMAIL = 'test-security-new@example.com';
  const NEW_PASSWORD = 'Aa12345678!@';

  try {
    // Buscar el usuario
    const user = await prisma.usuario.findUnique({
      where: { email: TEST_EMAIL }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Nombre: ${user.nombre}`);

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    // Actualizar la contraseña
    const updatedUser = await prisma.usuario.update({
      where: { email: TEST_EMAIL },
      data: { password: hashedPassword }
    });

    console.log('✅ Contraseña actualizada exitosamente');
    console.log(`   - Nueva contraseña: ${NEW_PASSWORD}`);
    console.log(`   - Hash generado: ${hashedPassword.substring(0, 20)}...`);

    // Verificar que el hash es correcto
    const isValid = await bcrypt.compare(NEW_PASSWORD, hashedPassword);
    console.log(`   - Verificación de hash: ${isValid ? '✅ Válido' : '❌ Inválido'}`);

    console.log('\n🎉 ¡CONTRASEÑA ACTUALIZADA EXITOSAMENTE!');
    console.log('\n📋 Credenciales actualizadas:');
    console.log(`   - Email: ${TEST_EMAIL}`);
    console.log(`   - Password: ${NEW_PASSWORD}`);

  } catch (error) {
    console.error('❌ Error actualizando contraseña:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTestUserPassword(); 