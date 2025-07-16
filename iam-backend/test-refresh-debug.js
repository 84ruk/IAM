const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const USER = {
  email: 'test-security-new@example.com',
  password: 'TestPassword123!'
};

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

async function main() {
  try {
    // 1. Login
    console.log('🔑 Login...');
    const loginRes = await api.post('/auth/login', USER);
    const refreshToken = loginRes.data.refreshToken;
    const loginCookies = loginRes.headers['set-cookie'];
    console.log('Login refreshToken:', refreshToken);
    console.log('Login cookies:', loginCookies);

    // 2. Acceso a /auth/me con cookie de login
    console.log('\n🔍 Acceso a /auth/me con cookie de login...');
    const meRes1 = await api.get('/auth/me', {
      headers: { Cookie: loginCookies }
    });
    console.log('Me (login):', meRes1.data);

    // 3. Usar refresh token
    console.log('\n🔄 Usando refresh token...');
    const refreshRes = await api.post('/auth/refresh', { refreshToken }, {
      headers: { Cookie: loginCookies }
    });
    const refreshCookies = refreshRes.headers['set-cookie'];
    console.log('Refresh response:', refreshRes.data);
    console.log('Refresh cookies:', refreshCookies);

    // 4. Acceso a /auth/me con cookie de refresh
    console.log('\n🔍 Acceso a /auth/me con cookie de refresh...');
    const meRes2 = await api.get('/auth/me', {
      headers: { Cookie: refreshCookies }
    });
    console.log('Me (refresh):', meRes2.data);

  } catch (error) {
    console.log('❌ Error:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
  }
}

main(); 