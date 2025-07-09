const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'flujo-test@example.com';
const TEST_PASSWORD = 'Password123!';

async function main() {
  let token = '';
  console.log('--- 1️⃣ Registrando usuario nuevo ---');
  try {
    const res = await axios.post(`${BASE_URL}/auth/register`, {
      nombre: 'Usuario Flujo Test',
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    console.log('Usuario registrado:', res.data.user.email);
    token = res.data.token;
    console.log('Token obtenido:', token ? 'SÍ' : 'NO');
  } catch (err) {
    if (err.response?.data?.message?.includes('Ya existe un usuario')) {
      console.log('El usuario ya existe, intentando login...');
      // Intentar login
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      token = loginRes.data.token;
      console.log('Login exitoso. Token obtenido:', token ? 'SÍ' : 'NO');
    } else {
      console.error('Error al registrar:', err.response?.data || err.message);
      return;
    }
  }

  // 2️⃣ Verificar estado inicial
  console.log('\n--- 2️⃣ Estado inicial del usuario ---');
  const statusRes = await axios.get(`${BASE_URL}/auth/status`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Estado:', statusRes.data);

  // 3️⃣ Setup de empresa si es necesario
  if (statusRes.data.needsSetup) {
    console.log('\n--- 3️⃣ Configurando empresa ---');
    const setupRes = await axios.post(`${BASE_URL}/auth/setup-empresa`, {
      nombreEmpresa: 'Empresa Flujo Test',
      tipoIndustria: 'GENERICA',
      rfc: 'FLUJOTEST123',
      direccion: 'Calle de prueba 123'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Empresa configurada:', setupRes.data.empresa.nombre);
    token = setupRes.data.token;
  } else {
    console.log('El usuario ya tiene empresa configurada.');
  }

  // 4️⃣ Verificar estado final
  console.log('\n--- 4️⃣ Estado final del usuario ---');
  const finalStatus = await axios.get(`${BASE_URL}/auth/status`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Estado:', finalStatus.data);

  // 5️⃣ Probar acceso a /proveedores
  console.log('\n--- 5️⃣ Probando acceso a /proveedores ---');
  try {
    const proveedoresRes = await axios.get(`${BASE_URL}/proveedores`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Acceso a proveedores OK. Resultado:', proveedoresRes.data);
  } catch (err) {
    if (err.response?.status === 403) {
      console.error('❌ Acceso denegado a /proveedores:', err.response.data.message);
    } else {
      console.error('Error al acceder a /proveedores:', err.response?.data || err.message);
    }
  }
}

main(); 