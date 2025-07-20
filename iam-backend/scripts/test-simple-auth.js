const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Lista de credenciales conocidas para probar
const testCredentials = [
  { email: 'prueba@iam.com', password: 'password123' },
  { email: 'prueba2@iam.com', password: 'password123' },
  { email: 'baruk066@gmail.com', password: 'password123' },
  { email: 'admin@elpeso.com', password: 'password123' },
  { email: 'superadmin@iam.com', password: 'password123' },
  { email: 'contactobaruk@gmail.com', password: 'password123' },
  { email: 'dosalyael32@gmail.com', password: 'password123' }
];

async function testAuth() {
  console.log('🔐 Probando autenticación...\n');
  
  for (const cred of testCredentials) {
    try {
      console.log(`📧 Probando: ${cred.email}`);
      
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: cred.email,
        password: cred.password
      });
      
      console.log('✅ Autenticación exitosa!');
      console.log(`Token: ${response.data.access_token.substring(0, 50)}...`);
      console.log(`Usuario: ${response.data.user.nombre}`);
      console.log(`Empresa: ${response.data.user.empresa?.nombre || 'Sin empresa'}`);
      console.log(`Rol: ${response.data.user.rol}\n`);
      
      // Probar el endpoint de movimientos diarios
      console.log('🔍 Probando endpoint de movimientos diarios...');
      
      const movementsResponse = await axios.get(`${BASE_URL}/dashboard-cqrs/daily-movements`, {
        headers: { 
          Authorization: `Bearer ${response.data.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Endpoint funcionando correctamente!');
      console.log('Respuesta:', JSON.stringify(movementsResponse.data, null, 2));
      
      return response.data.access_token;
      
    } catch (error) {
      console.log(`❌ Falló: ${error.response?.data?.message || error.message}\n`);
    }
  }
  
  console.log('💥 No se pudo autenticar con ninguna credencial');
  return null;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testAuth().catch(console.error);
}

module.exports = { testAuth }; 