const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function debugProveedor() {
  console.log('🔍 DEBUGGEANDO PROBLEMA DE PROVEEDOR');
  console.log('=====================================\n');

  try {
    // 1. Login para obtener token
    console.log('1️⃣ Iniciando sesión...');
    const loginData = {
      email: 'superadmin@iam.com',
      password: 'SuperAdmin123!'
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');

    // 2. Probar diferentes formatos de datos
    const testCases = [
      {
        name: 'Caso 1: Datos válidos básicos',
        data: {
          nombre: 'Proveedor Test',
          email: 'test@example.com',
          telefono: '1234567890'
        }
      },
      {
        name: 'Caso 2: Email con espacios',
        data: {
          nombre: 'Proveedor Test 2',
          email: 'test @example.com',
          telefono: '1234567890'
        }
      },
      {
        name: 'Caso 3: Teléfono con caracteres especiales',
        data: {
          nombre: 'Proveedor Test 3',
          email: 'test@example.com',
          telefono: '123-456-7890'
        }
      },
      {
        name: 'Caso 4: Email vacío',
        data: {
          nombre: 'Proveedor Test 4',
          email: '',
          telefono: '1234567890'
        }
      },
      {
        name: 'Caso 5: Teléfono vacío',
        data: {
          nombre: 'Proveedor Test 5',
          email: 'test@example.com',
          telefono: ''
        }
      },
      {
        name: 'Caso 6: Solo nombre (campos opcionales vacíos)',
        data: {
          nombre: 'Proveedor Test 6'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n${testCase.name}`);
      console.log('Datos enviados:', JSON.stringify(testCase.data, null, 2));
      
      try {
        const response = await axios.post(`${BASE_URL}/proveedores`, testCase.data, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ ÉXITO:', response.data);
      } catch (error) {
        console.log('❌ ERROR:', error.response?.data || error.message);
        if (error.response?.data?.message) {
          console.log('Mensaje de error:', error.response.data.message);
        }
      }
    }

  } catch (error) {
    console.error('Error general:', error.message);
  }
}

debugProveedor(); 