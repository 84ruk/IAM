const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testPasswordFeatures() {
  console.log('🧪 Probando funcionalidades de contraseña...\n');

  // 1. Probar cambio de contraseña (requiere login)
  console.log('1️⃣ Probando cambio de contraseña...');
  try {
    // Primero hacer login
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: 'superadmin@iam.com',
        password: 'SuperAdmin123!'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Error en login');
    }

    // Ahora probar cambio de contraseña
    const changePasswordResponse = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        currentPassword: 'SuperAdmin123!',
        newPassword: 'NuevaContraseña123!',
        confirmPassword: 'NuevaContraseña123!'
      })
    });

    const changePasswordData = await changePasswordResponse.json();
    
    if (changePasswordResponse.ok) {
      console.log('✅ Cambio de contraseña exitoso');
      console.log('   Respuesta:', changePasswordData.message);
    } else {
      console.log('❌ Error en cambio de contraseña:', changePasswordData.message);
    }
  } catch (error) {
    console.log('❌ Error en cambio de contraseña:', error.message);
  }

  console.log('\n2️⃣ Probando solicitud de recuperación de contraseña...');
  try {
    const forgotPasswordResponse = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@iam.com'
      })
    });

    const forgotPasswordData = await forgotPasswordResponse.json();
    
    if (forgotPasswordResponse.ok) {
      console.log('✅ Solicitud de recuperación exitosa');
      console.log('   Respuesta:', forgotPasswordData.message);
      if (forgotPasswordData.resetUrl) {
        console.log('   Enlace de desarrollo:', forgotPasswordData.resetUrl);
      }
    } else {
      console.log('❌ Error en solicitud de recuperación:', forgotPasswordData.message);
    }
  } catch (error) {
    console.log('❌ Error en solicitud de recuperación:', error.message);
  }

  console.log('\n3️⃣ Probando con email inexistente...');
  try {
    const forgotPasswordResponse = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'usuarioinexistente@test.com'
      })
    });

    const forgotPasswordData = await forgotPasswordResponse.json();
    
    if (forgotPasswordResponse.ok) {
      console.log('✅ Respuesta correcta para email inexistente');
      console.log('   Respuesta:', forgotPasswordData.message);
    } else {
      console.log('❌ Error inesperado:', forgotPasswordData.message);
    }
  } catch (error) {
    console.log('❌ Error con email inexistente:', error.message);
  }

  console.log('\n4️⃣ Probando verificación de token...');
  try {
    // Primero obtener un token válido
    const forgotPasswordResponse = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@iam.com'
      })
    });

    const forgotPasswordData = await forgotPasswordResponse.json();
    
    if (forgotPasswordResponse.ok && forgotPasswordData.resetUrl) {
      // Extraer token del URL
      const token = forgotPasswordData.resetUrl.split('token=')[1];
      
      // Verificar el token
      const verifyResponse = await fetch(`${API_URL}/auth/reset-password/${token}`);
      const verifyData = await verifyResponse.json();
      
      if (verifyResponse.ok) {
        console.log('✅ Verificación de token exitosa');
        console.log('   Email:', verifyData.email);
      } else {
        console.log('❌ Error en verificación de token:', verifyData.message);
      }
    } else {
      console.log('❌ No se pudo obtener token para verificar');
    }
  } catch (error) {
    console.log('❌ Error en verificación de token:', error.message);
  }

  console.log('\n5️⃣ Probando reset de contraseña...');
  try {
    // Primero obtener un token válido
    const forgotPasswordResponse = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@iam.com'
      })
    });

    const forgotPasswordData = await forgotPasswordResponse.json();
    
    if (forgotPasswordResponse.ok && forgotPasswordData.resetUrl) {
      // Extraer token del URL
      const token = forgotPasswordData.resetUrl.split('token=')[1];
      
      // Resetear contraseña
      const resetResponse = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          newPassword: 'ContraseñaReseteada123!',
          confirmPassword: 'ContraseñaReseteada123!'
        })
      });

      const resetData = await resetResponse.json();
      
      if (resetResponse.ok) {
        console.log('✅ Reset de contraseña exitoso');
        console.log('   Respuesta:', resetData.message);
      } else {
        console.log('❌ Error en reset de contraseña:', resetData.message);
      }
    } else {
      console.log('❌ No se pudo obtener token para reset');
    }
  } catch (error) {
    console.log('❌ Error en reset de contraseña:', error.message);
  }

  console.log('\n6️⃣ Probando token inválido...');
  try {
    const verifyResponse = await fetch(`${API_URL}/auth/reset-password/token-invalido`);
    const verifyData = await verifyResponse.json();
    
    if (!verifyResponse.ok) {
      console.log('✅ Respuesta correcta para token inválido');
      console.log('   Error:', verifyData.message);
    } else {
      console.log('❌ Error: token inválido fue aceptado');
    }
  } catch (error) {
    console.log('❌ Error con token inválido:', error.message);
  }

  console.log('\n✅ Pruebas completadas');
}

// Ejecutar las pruebas
testPasswordFeatures().catch(console.error); 