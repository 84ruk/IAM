const axios = require('axios');

// Configuración
const API_BASE_URL = 'http://localhost:3001';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTQ1MTgxMjEsImp0aSI6ImFmZTFkYzZmLTQ4ZWQtNDM5Yy1hZWVhLWYwOTM1MjU5YzgzNSIsInN1YiI6IjEiLCJlbWFpbCI6ImJhcnVrMDY2QGdtYWlsLmNvbSIsInJvbCI6IkFETUlOIiwiZW1wcmVzYUlkIjoyLCJ0aXBvSW5kdXN0cmlhIjoiR0VORVJJQ0EiLCJhdXRoUHJvdmlkZXIiOiJnb29nbGUiLCJleHAiOjE3NTQ2MDQ1MjEsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSJ9.aWsrVr77BeWyujJH-xXQoG0bsuYQRqWzIJjOImUTMhc';

// Decodificar el JWT para ver el contenido
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decodificando JWT:', error);
    return null;
  }
}

async function testKPIsWithJWT() {
  console.log('🧪 PROBANDO KPIs CON JWT');
  console.log('========================\n');

  // Decodificar y mostrar información del JWT
  const jwtPayload = decodeJWT(JWT_TOKEN);
  if (jwtPayload) {
    console.log('📋 Información del JWT:');
    console.log('   Usuario ID:', jwtPayload.sub);
    console.log('   Email:', jwtPayload.email);
    console.log('   Rol:', jwtPayload.rol);
    console.log('   Empresa ID:', jwtPayload.empresaId);
    console.log('   Tipo Industria:', jwtPayload.tipoIndustria);
    console.log('   Expira:', new Date(jwtPayload.exp * 1000).toLocaleString());
    console.log('');
  }

  try {
    // Configurar axios para usar cookies
    const axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `jwt=${JWT_TOKEN}`
      }
    });

    // 1. Probar endpoint de KPIs básicos
    console.log('1. Probando endpoint de KPIs básicos...');
    const kpisResponse = await axiosInstance.get('/dashboard-cqrs/kpis');
    
    console.log('✅ KPIs básicos obtenidos exitosamente');
    console.log('Respuesta:', JSON.stringify(kpisResponse.data, null, 2));

    // 2. Probar endpoint de KPIs financieros
    console.log('\n2. Probando endpoint de KPIs financieros...');
    const financialResponse = await axiosInstance.get('/dashboard-cqrs/financial-kpis');
    
    console.log('✅ KPIs financieros obtenidos exitosamente');
    console.log('Respuesta:', JSON.stringify(financialResponse.data, null, 2));

    // 3. Probar endpoint unificado
    console.log('\n3. Probando endpoint unificado de KPIs...');
    const allKPIsResponse = await axiosInstance.get('/dashboard-cqrs/all-kpis');
    
    console.log('✅ Todos los KPIs obtenidos exitosamente');
    console.log('Respuesta:', JSON.stringify(allKPIsResponse.data, null, 2));

    // 4. Probar endpoint de movimientos diarios
    console.log('\n4. Probando endpoint de movimientos diarios...');
    const movementsResponse = await axiosInstance.get('/dashboard-cqrs/daily-movements');
    
    console.log('✅ Movimientos diarios obtenidos exitosamente');
    console.log('Respuesta:', JSON.stringify(movementsResponse.data, null, 2));

    // 5. Probar endpoint de datos del dashboard
    console.log('\n5. Probando endpoint de datos del dashboard...');
    const dashboardResponse = await axiosInstance.get('/dashboard-cqrs/data');
    
    console.log('✅ Datos del dashboard obtenidos exitosamente');
    console.log('Respuesta:', JSON.stringify(dashboardResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    }
  }
}

testKPIsWithJWT(); 